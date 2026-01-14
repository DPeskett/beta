from turtle import  Turtle

class Gameboard(Turtle):

    def __init__(self):
        super().__init__()
        self.hideturtle()
        self.penup()
        self.color('white')
        self.speed('fastest')

        y=-300
        self.pensize(5)
        self.goto(0,y)
        while y < 300:
            y += 20
            self.pendown()
            self.goto(0, y)
            y += 20
            self.penup()
            self.goto(0, y)