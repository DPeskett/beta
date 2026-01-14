from Gameboard import Gameboard
from Paddle import Paddle
from turtle import Screen
from Ball import Ball
from Scoreboard import Scoreboard

screen = Screen()
screen.listen()
screen.bgcolor('black')
game_on = True
screen.setup(1000, 600, 0, 0)

game = Gameboard()
score = Scoreboard()
ball = Ball()
paddle_a = Paddle('a')
paddle_b = Paddle('b')

def game_exit():
    global game_on
    game_on = False
    screen.bye()

def game_over():
    global game_on
    game_on = False
    screen.clear()
    screen.bgcolor('black')
    score.gameover()


screen.onkey(game_exit, 'q')
screen.onkey(paddle_a.move_paddle_down, 'z')
screen.onkey(lambda: paddle_a.move_paddle_up(), 'a')
screen.onkey(lambda: paddle_b.move_paddle_down(), 'm')
screen.onkey(lambda: paddle_b.move_paddle_up(), 'j')

while game_on:
    ball.move_ball()

    if ball.xcor() > 470:
        if paddle_b.check_deflect(ball.ycor()):
            ball.change_direction()
        else:
            score.raise_a()
            ball.hideturtle()
            ball = Ball()
    if ball.xcor() < -470:
        if paddle_a.check_deflect(ball.ycor()):
            ball.change_direction()
        else:
            score.raise_b()
            ball.hideturtle()
            ball = Ball()

    if score.score_b > 10 or score.score_a > 10:
        game_over()



