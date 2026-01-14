from turtle import Turtle

class Paddle:
    def __init__(self, position):
        self.paddle = Turtle("square")
        self.paddle.speed("fastest")
        self.paddle.penup()
        self.paddle.color("white")
        self.paddle.shapesize(stretch_wid=5, stretch_len=1)
        x = -480 if position == 'a' else 480
        self.paddle.goto(x, 0)


    def move_paddle_up(self):
        y = self.paddle.ycor() + 20
        self.paddle.sety(y)

    def move_paddle_down(self):
        y = self.paddle.ycor() - 20
        self.paddle.sety(y)

    def check_deflect(self, ball_y):
        if self.paddle.ycor() < ball_y - 20 or self.paddle.ycor() > ball_y + 100:
            return False
        return True