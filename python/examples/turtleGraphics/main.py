import turtle
from math import degrees
from turtle import Turtle, Screen
import random
import colorgram

colors = colorgram.extract('image.jpg', 29)
del colors[:4]
used_colors = []
for color in colors:
    used_colors.append((color.rgb.r, color.rgb.g, color.rgb.b))
print(used_colors)
screen = Screen()
screen.setup(1500,1200,0,0)

turtle.colormode(255)

timmy_the_turtle= Turtle()
timmy_the_turtle.shape('turtle')
timmy_the_turtle.color('green')
timmy_the_turtle.speed('fastest')
#timmy_the_turtle.penup()
#timmy_the_turtle.setpos(-50,400)
#timmy_the_turtle.pendown()

colors = ['green', 'green1', 'green2', 'cyan', 'cyan1', 'cyan2']

sides = 3
distance = 100

def draw_shape():
    degree = 360/sides
    timmy_the_turtle.color(random.randint(0,255), random.randint(0,255), random.randint(0,255))
    for i in range(sides):
        timmy_the_turtle.forward(distance)
        timmy_the_turtle.right(degree)

def random_walk():
    distance = random.randint(10,40)
    size = random.randint(1,11)
    timmy_the_turtle.color(random.randint(0,255), random.randint(0,255), random.randint(0,255))
    timmy_the_turtle.pensize(size)
    timmy_the_turtle.forward(distance)
    match random.randint(1,5):
        case 1: timmy_the_turtle.right(90)
        case 2: timmy_the_turtle.right(180)
        case 3: timmy_the_turtle.left(90)
        case _: pass

def draw_spirograph(gap_size):
    for _ in range(( 360//gap_size ) * 10):
        timmy_the_turtle.color(random.choice(used_colors))
        timmy_the_turtle.fillcolor(random.choice(used_colors))
        timmy_the_turtle.circle(100)
        timmy_the_turtle.right(gap_size)
# CODE ABOVE USED HERE #
# draw_spirograph(30)
# while sides < 8:
#     draw_shape()
#     sides += 1
# for _ in range(100):
#     random_walk()

def hirst_dots():
    x, y = -400, -400
    timmy_the_turtle.penup()
    timmy_the_turtle.setposition(x, y)
    for _ in range(14):
        x = -400
        y += 50
        timmy_the_turtle.setposition(x,y)
        for _ in range(14):
            timmy_the_turtle.dot(20, random.choice(used_colors))
            timmy_the_turtle.forward(50)
hirst_dots()


screen.exitonclick()
