from turtle import Turtle
import random

directions = [(3,3),(3,-3),(-3,-3),(-3,3)]
SPEED = 3

class Ball(Turtle):
    def __init__(self):
        super().__init__()
        self.shape('circle')
        self.direction = random.choice(directions)
        self.penup()
        self.color('grey')


    def move_ball(self):
        x = self.xcor()+self.direction[0]
        y = self.ycor()+self.direction[1]
        self.setposition(x, y)
        if y > 280:
            self.direction = (self.direction[0], -SPEED)
        if y < -280:
            self.direction = (self.direction[0], SPEED)


    def change_direction(self):
        x = self.xcor()
        if x < -460:
            self.direction = (SPEED, self.direction[1])
        if x > 460:
            self.direction = (-SPEED, self.direction[1])