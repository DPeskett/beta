import random
from turtle import Turtle

MOVE_DISTANCE = 10
COLORS = ['orange', 'green', 'blue', 'purple']

class Player(Turtle):
    num_of_players = 0
    def __init__(self, position):
        super().__init__()
        Player.num_of_players += 1
        self.player_id = Player.num_of_players
        self.penup()
        self.shape('turtle')
        self.speed('fastest')
        self.goto(position)
        self.setheading(90)
        self.color(COLORS.pop())

    def move_up(self):
        self.forward(MOVE_DISTANCE)