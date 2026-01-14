from turtle import Turtle
import random
class Food(Turtle):

    def __init__(self):
        super().__init__()
        self.shape('turtle')
        self.penup()
        self.shapesize(stretch_len=0.5, stretch_wid=0.5)
        self.color('cyan')
        self.speed('fastest')
        self.refresh()

    def refresh(self):
        self.goto(random.randint(-290, 290), random.randint(-290, 290))