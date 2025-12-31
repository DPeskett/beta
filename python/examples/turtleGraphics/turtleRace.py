from turtle import Turtle, Screen
import random

screen=Screen()
turtles = []
x, y = -240, -150
screen.setup(500, 400)
user_bet = screen.textinput("Bet on the Turtles","Which Color will win?")
tim0 = Turtle(shape='turtle')
tim0.color('green')
tim0.penup()
tim0.setposition(x,y)
y+=25
turtles.append(tim0)

tim1 = Turtle(shape='turtle')
tim1.color('yellow')
tim1.penup()
tim1.setposition(x,y)
y+=25
turtles.append(tim1)

tim2 = Turtle(shape='turtle')
tim2.color('orange')
tim2.penup()
tim2.setposition(x,y)
y+=25
turtles.append(tim2)

tim3 = Turtle(shape='turtle')
tim3.color('cyan')
tim3.penup()
tim3.setposition(x,y)
y+=25
turtles.append(tim3)

tim4 = Turtle(shape='turtle')
tim4.color('purple')
tim4.penup()
tim4.setposition(x,y)
y+=25
turtles.append(tim4)

tim5 = Turtle(shape='turtle')
tim5.color('red')
tim5.penup()
tim5.setposition(x,y)
y+=25
turtles.append(tim5)

tim6 = Turtle(shape='turtle')
tim6.color('blue')
tim6.penup()
tim6.setposition(x,y)
y+=25
turtles.append(tim6)

tim7 = Turtle(shape='turtle')
tim7.color('brown')
tim7.penup()
tim7.setposition(x,y)
y+=25
turtles.append(tim7)

tim8 = Turtle(shape='turtle')
tim8.color('black')
tim8.penup()
tim8.setposition(x,y)
y+=25
turtles.append(tim8)

tim9 = Turtle(shape='turtle')
tim9.color('aquamarine')
tim9.penup()
tim9.setposition(x,y)
y+=25
turtles.append(tim9)

tim10 = Turtle(shape='turtle')
tim10.color('DarkGreen')
tim10.penup()
tim10.setposition(x,y)
y+=25
turtles.append(tim10)

tim11 = Turtle(shape='turtle')
tim11.color('DarkSalmon')
tim11.penup()
tim11.setposition(x,y)
y+=25
turtles.append(tim11)

tim12 = Turtle(shape='turtle')
tim12.color('DarkRed')
tim12.penup()
tim12.setposition(x,y)
y+=25
turtles.append(tim12)

tim13 = Turtle(shape='turtle')
tim13.color('DeepSkyBlue')
tim13.penup()
tim13.setposition(x,y)
y+=25
turtles.append(tim13)

while True:
    for tim in turtles:
        tim.forward(random.randint(1, 10))
        if tim.position()[1] >240:
            print('Winner is', tim)
            break

screen.exitonclick()

