import turtle
from turtle import Turtle, Screen
import random
import antigravity

screen = Screen()
screen.setup(width=500, height=400)
user_bet = screen.textinput(title='Make your Bet', prompt='Which turtle will win the race? enter a color:')
colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
y_pos = -100
x_pos = -230
turtles = []

for turtle_index in range(0, 6):
     tim = Turtle(shape='turtle')
     tim.color(colors[turtle_index])
     tim.penup()
     tim.goto(x_pos, y_pos)
     y_pos+=40
     turtles.append(tim)

game_over = False

while not game_over:
    for turtle in turtles:
        rand_dist = random.randint(0,10)
        turtle.forward(rand_dist)
        if turtle.position()[0] >= 230:
            winner = turtle.color()[0]
            if winner == user_bet:
                print(f"You won, winner color({winner}) your bet({user_bet})")
            else:
                print(f"You Lost, winner color({winner}) your bet({user_bet})")
            game_over = True



screen.exitonclick()