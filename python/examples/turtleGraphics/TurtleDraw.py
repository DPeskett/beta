from turtle import Turtle, Screen
tim = Turtle()
tim.shape('turtle')
screen = Screen()

def move_forwards():
    tim.forward(10)
def turn_left():
    tim.left(10)
def turn_right():
    tim.right(10)
def move_back():
    tim.back(10)
def clear_screen():
    screen.reset()


screen.listen()
screen.onkey(key='space', fun=move_forwards)
screen.onkey(key='a', fun=turn_left)
screen.onkey(key='d', fun=turn_right)
screen.onkey(key='w', fun=move_forwards)
screen.onkey(key="s", fun=move_back)
screen.onkey(key="c", fun=clear_screen)
screen.exitonclick()