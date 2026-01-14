from turtle import Screen

from scoreboard import Scoreboard
from snake import Snake
from food import Food

speeds = {
    'fast' : 50,
    'fastest' : 25,
    'med' : 100,
    'slow' : 133,
    'slowest' : 166
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

    scoreboard = Scoreboard()
    food = Food()
    snake = Snake(None)
    snake.init_game()
    screen.update()
    speed = ""
    while speed not in speeds.keys():
        speed = screen.textinput("Difficulty setting speed", "How fast? (fast,med,slow)")
    snake.speed = speeds[speed]

    screen.listen()
    screen.onkey(snake.up, 'Up')
    screen.onkey(snake.down, 'Down')
    screen.onkey(snake.left, 'Left')
    screen.onkey(snake.right, 'Right')


    while not_dead:
        snake.move_snake()
        if snake.head.distance(food) < 15:
            print('nom nom nom')
            food.refresh()
            scoreboard.increase_score()
            snake.add_segment()

        screen.update()
        not_dead = snake.is_snake_alive()
    play_again = screen.textinput('Game Over', f'Game Over you scored {scoreboard.score}! play again (y/n)')


screen.bye()