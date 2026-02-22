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
        old_score = '0'
        with open("highscore.txt") as hs:
            old_score = hs.read()
            if int(old_score) < self.score:
                old_score = self.score
                with open("highscore.txt", mode="w") as write_hs:
                    write_hs.write(f"{old_score}")
        self.write(f"Score: {self.score} : HS: {old_score}", False, ALIGNMENT, FONT)
