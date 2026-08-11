/*********************************************************************
*                    SEGGER Microcontroller GmbH                     *
*                        The Embedded Experts                        *
**********************************************************************

-------------------------- END-OF-HEADER -----------------------------

File    : main.c
Purpose : Generic application start

*/
#include <stdio.h>
#include "stm32g031xx.h"

void gpio_init(void) {
    RCC->IOPENR |= RCC_IOPENR_GPIOAEN;
}

void tim2_init(void) {
    RCC->APBENR1 |= RCC_APBENR1_TIM2EN;

    TIM2->CR1 = 0;
    TIM2->CNT = 0;

    TIM2->PSC = (16000000 / 1000000) - 1; // 1 MHz timer
    TIM2->ARR = 0xFFFF;
}

void uart2_init(void) {
    RCC->IOPENR |= RCC_IOPENR_GPIOAEN;
    RCC->APBENR1 |= RCC_APBENR1_USART2EN;

    // PA2 TX (AF1)
    GPIOA->MODER &= ~(3<<(2*2));
    GPIOA->MODER |=  (2<<(2*2));
    GPIOA->AFR[0] &= ~(0xF << (4*2));
    GPIOA->AFR[0] |=  (0x1 << (4*2));

    // PA3 RX (AF1)
    GPIOA->MODER &= ~(3<<(3*2));
    GPIOA->MODER |=  (2<<(3*2));
    GPIOA->AFR[0] &= ~(0xF << (4*3));
    GPIOA->AFR[0] |=  (0x1 << (4*3));

    USART2->BRR = 16000000 / 115200;
    USART2->CR1 = USART_CR1_TE | USART_CR1_UE;
}

void uart2_write(char c) {
    while (!(USART2->ISR & USART_ISR_TXE_TXFNF));
    USART2->TDR = c;
}

void uart2_print(const char *s) {
    while (*s) uart2_write(*s++);
}

uint32_t measureCap(GPIO_TypeDef* port, uint32_t pin) {
    // Discharge
    port->MODER &= ~(3 << (pin*2));
    port->MODER |=  (1 << (pin*2));
    port->BSRR = (uint32_t)(1 << (pin + 16));

    for (volatile int i=0; i<5000; i++);

    // Input + pull-up
    port->MODER &= ~(3 << (pin*2));
    port->PUPDR &= ~(3 << (pin*2));
    port->PUPDR |=  (1 << (pin*2));

    TIM2->CNT = 0;
    TIM2->CR1 |= TIM_CR1_CEN;

    while (!(port->IDR & (1 << pin))) {
        if (TIM2->CNT > 3000) {
            TIM2->CR1 &= ~TIM_CR1_CEN;
            return 3000;
        }
    }

    uint32_t t = TIM2->CNT;
    TIM2->CR1 &= ~TIM_CR1_CEN;
    return t;
}

int main(void) {
    SystemInit();
    gpio_init();
    tim2_init();
    uart2_init();
    uart2_print("Hello world\r\n");
    uart2_print("Starting capacitive test...\r\n");

    //while (1) {
    //    uint32_t up    = measureCap(GPIOA, 4);
    //    uint32_t down  = measureCap(GPIOA, 5);
    //    uint32_t left  = measureCap(GPIOA, 6);
    //    uint32_t right = measureCap(GPIOA, 7);

    //    char buf[128];
    //    sprintf(buf, "UP:%lu DOWN:%lu LEFT:%lu RIGHT:%lu\r\n",
    //            up, down, left, right);
    //    uart2_print(buf);

    //    for (volatile int i=0; i<50000; i++);
    //}
    while (1) {
    uint32_t up = measureCap(GPIOA, 4);

    char buf[64];
    sprintf(buf, "UP:%lu\r\n", up);
    uart2_print(buf);

    for (volatile int i=0; i<50000; i++);
}
}
/*************************** End of file ****************************/
