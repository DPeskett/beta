from turtle import Screen
from snake import Snake
from food import Food

speeds = {
    'fast' : 50,
    'fastest' : 25,
    'medium' : 100,
    'slow' : 200,
    'slowest' : 300
}

play_again = 'yes'
screen = Screen()

while play_again[:1].lower() == 'y':
    not_dead = True

    screen.clear()
    screen.setup(width=600, height=600)
    screen.bgcolor('black')
    screen.title('Snake')
    screen.tracer(0)

    snake = Snake(None)
    snake.init_game()
    screen.update()
    speed = ""
    while speed not in speeds.keys():
        speed = screen.textinput("Difficulty setting speed", "How fast? (fast,medium,slow)")
    snake.speed = speeds[speed]

    screen.listen()
    screen.onkey(snake.up, 'Up')
    screen.onkey(snake.down, 'Down')
    screen.onkey(snake.left, 'Left')
    screen.onkey(snake.right, 'Right')


    while not_dead:
        snake.move_snake()
        screen.update()
        not_dead = snake.is_snake_alive()
    play_again = screen.textinput('Game Over', 'Game Over! play again (y/n)')


screen.bye()