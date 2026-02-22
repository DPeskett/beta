import random
import time
from turtle import Screen
from player import Player
from car_manager import Car

SPEED = 0.1
SIZE = 600
NUMBER_OF_PLAYERS = 1 # 1-4
START_X, START_Y = 0+(10*NUMBER_OF_PLAYERS-1), - 280
BUTTONS = ['z','b','/','Up']

players = []
cars = []
car_freq = 8
level = 1

screen = Screen()
screen.setup(width=SIZE, height=SIZE)
screen.tracer(0)
screen.listen()
screen.onkey(screen.bye, 'q')



for num in range(NUMBER_OF_PLAYERS):
    player = Player((START_X, START_Y))
    START_X -= 40
    screen.onkey(player.move_up, BUTTONS[3-num])
    players.append((BUTTONS[3-num], player.player_id, player))

screen.update()


is_game_on = True
while is_game_on:
    if random.randint(0,car_freq) > 5:
        car = Car()
        cars.append(car)
    time.sleep(SPEED)
    for car in cars:
        car.move_car()
    screen.update()

    for player in players:
        if player[2].ycor() > 270:
            level += 1
            player[2].sety(-280)
            Car.SLOWEST += Car.SPEED_INC_AMOUNT
            Car.FASTEST += Car.SPEED_INC_AMOUNT
            if level % 5 == 0:
                car_freq += 1
                Car.SLOWEST = 5
                Car.FASTEST = 10

