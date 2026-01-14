from turtle import Turtle

class Scoreboard(Turtle):
    def __init__(self):
        super().__init__()
        self.color('white')
        self.speed('fastest')
        self.penup()
        self.hideturtle()
        self.score_a = 0
        self.score_b = 0
        self.goto(0, 250)
        self.write(f"{self.score_a}   {self.score_b}",
               False, 'center', ('Courier', 25, 'normal'))

    def raise_a(self):
        self.clear()
        self.score_a += 1
        self.goto(0, 250)
        self.hideturtle()
        self.write(f"{self.score_a}   {self.score_b}",
                   False, 'center', ('Courier', 25, 'normal'))
    def raise_b(self):
        self.clear()
        self.score_b += 1
        self.goto(0, 250)
        self.hideturtle()
        self.write(f"{self.score_a}   {self.score_b}",
                   False, 'center', ('Courier', 25, 'normal'))

    def gameover(self):
        self.goto(0, 0)
        self.write(f"Game Over\nScore A[{self.score_a}] B[{self.score_b}]",
                   False, 'center', ('Courier', 25, 'normal'))