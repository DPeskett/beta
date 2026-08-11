from Gameboard import Gameboard
from Paddle import Paddle
from turtle import Screen, Turtle
from Ball import Ball
from Scoreboard import Scoreboard
import time

# --- Screen setup ---
screen = Screen()
screen.listen()
screen.bgcolor('black')
game_on = True
screen.setup(1000, 600, 0, 0)

# --- Countdown before game starts ---
counter = Turtle()
counter.hideturtle()
counter.color('white')

for sec in range(3):
    counter.write(str(3-sec), False, "left", ("Arial", 20, 'normal'))
    time.sleep(1)
    counter.clear()

# Disable auto-refresh so objects can be drawn manually
screen.tracer(0)

# --- Create game objects ---
game = Gameboard()          # Draws board layout
score = Scoreboard()        # Handles score display
ball = Ball()               # Ball object with movement logic
paddle_a = Paddle(-480)     # Left paddle
paddle_b = Paddle(480)      # Right paddle

# Re-enable screen updates
screen.tracer(1)

# --- Exit game handler ---
def game_exit():
    global game_on
    game_on = False
    screen.bye()

# --- Game over handler ---
def game_over():
    global game_on
    game_on = False
    screen.clear()
    screen.bgcolor('black')
    score.game_over()

# --- Key bindings ---
screen.onkey(game_exit, 'q')
screen.onkey(paddle_a.move_paddle_down, 'd')
screen.onkey(paddle_a.move_paddle_up, 'e')
screen.onkey(paddle_b.move_paddle_down, 'Down')
screen.onkey(paddle_b.move_paddle_up, 'Up')

# --- Main game loop ---
while game_on:
    ball.move_ball()  # Move ball each frame

    # --- Ball hits right side ---
    if ball.xcor() > 470:
        # Check if paddle B deflects the ball
        if paddle_b.check_deflect(ball.ycor()):
            ball.change_direction()
        else:
            # Missed: point for player A
            score.raise_a()
            ball.hideturtle()
            ball = Ball()  # Reset ball

    # --- Ball hits left side ---
    if ball.xcor() < -470:
        # Check if paddle A deflects the ball
        if paddle_a.check_deflect(ball.ycor()):
            ball.change_direction()
        else:
            # Missed: point for player B
            score.raise_b()
            ball.hideturtle()
            ball = Ball()  # Reset ball

    # --- End game if someone reaches 11 ---
    if score.score_b > 10 or score.score_a > 10:
        game_over()