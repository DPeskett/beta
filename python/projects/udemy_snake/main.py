from turtle import Screen

from scoreboard import Scoreboard
from snake import Snake
from food import Food

# different difficulties based on speed of snake head
speeds = {
    'fast' : 50,
    'fastest' : 25,
    'med' : 100,
    'slow' : 133,
    'slowest' : 166
}
# main game tools a screen and a variable to manage if the user is done playing or not
play_again = 'yes'
screen = Screen()
# Main Game loop checks to see if a y is the first letter entered (spelling is irrelevant)
while play_again[:1].lower() == 'y':
    # variable for tracking if snake has hit a wall or its tail
    not_dead = True
    # screen setup
    screen.clear()
    screen.setup(width=600, height=600)
    screen.bgcolor('black')
    screen.title('Snake')
    screen.tracer(0)
    # initializations
    scoreboard = Scoreboard()
    food = Food()
    snake = Snake(None)
    # setup screen with snake method and update
    snake.init_game()
    screen.update()
    # allowing the user to choose a difficulty using dictionary speeds to verify
    speed = ""
    while speed not in speeds.keys():
        speed = screen.textinput("Difficulty setting speed", "How fast? (fast,med,slow)")
    snake.speed = speeds[speed]

    #setup screen listen and buttons for snake directional control connected to each function respectfully
    screen.listen()
    screen.onkey(snake.up, 'Up')
    screen.onkey(snake.down, 'Down')
    screen.onkey(snake.left, 'Left')
    screen.onkey(snake.right, 'Right')

    # the movement of the game loop lives here constantly checking if snake has hit walls or its tail
    while not_dead:
        # method for moving snake
        snake.move_snake()
        # checks if snake head has come in contact with food
        if snake.head.distance(food) < 15:
            print('nom nom nom')
            # place another food on game when food has been eaten
            food.refresh()
            # increase scoreboard signifying food has been eaten
            scoreboard.increase_score()
            # add segment to snake 
            snake.add_segment()

        screen.update()
        not_dead = snake.is_snake_alive()
    play_again = screen.textinput('Game Over', f'Game Over you scored {scoreboard.score}! play again (y/n)')


screen.bye()