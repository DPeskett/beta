from turtle import Turtle
ALIGNMENT = 'center'
FONT = ('Courier', 18, 'normal')
class Scoreboard(Turtle):

    def __init__(self):
        super().__init__()
        self.score = 0
        self.color('cyan')
        self.hideturtle()
        self.speed('fastest')
        self.penup()
        self.goto(-60, 270)
        self.update_scoreboard()

    def increase_score(self):
        self.score += 1
        self.clear()
        self.update_scoreboard()

    def update_scoreboard(self):
        self.write(f"Score: {self.score}", False, ALIGNMENT, FONT)
