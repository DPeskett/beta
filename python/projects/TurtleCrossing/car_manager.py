import random
from turtle import Turtle



class Car(Turtle):
    COLORS = ['red', 'orange', 'brown', 'green', 'blue', 'purple']
    SLOWEST, FASTEST = 5, 10
    # the speed will be incremented by, per level completed
    SPEED_INC_AMOUNT = 5

    def __init__(self):
        super().__init__()
        self.shape('square')
        self.setheading(180)
        self.shapesize(stretch_len=random.randint(1,3))
        self.color(random.choice(Car.COLORS))
        self.speed = random.randint(Car.SLOWEST, Car.FASTEST)
        self.penup()
        self.goto(300,random.randint(-200, 250))

    def move_car(self):
        self.forward(self.speed)
        if self.xcor() < -300:
            self.clear()

    def level_up(self):
        self.speed += Car.SPEED_INC_AMOUNT