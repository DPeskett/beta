from turtle import Turtle
import time

DIRECTIONS = {'right':0, 'up':90, 'left':180, 'down' : 270}

class Snake:
    def __init__(self, speed):
         self.x_pos, self.y_pos = -190, 0
         head = Turtle('square')
         head.penup()
         head.color('white')
         head.goto(self.x_pos, self.y_pos)
         self.segments = [head]
         self.head = self.segments[0]
         self.num_of_segments = 10
         self.speed = speed
         self.x_pos -= 20
         self.dir = DIRECTIONS['right']


    def init_game(self):
        for _ in range(self.num_of_segments):
            segment = Turtle(shape='square')
            segment.fillcolor('white')
            segment.penup()
            segment.goto(self.x_pos, self.y_pos)
            self.x_pos -= 20
            self.segments.append(segment)

    def move_snake(self):
        for seg_index in range(len(self.segments) - 1, 0, -1):
            new_x = self.segments[seg_index - 1].xcor()
            new_y = self.segments[seg_index - 1].ycor()
            self.segments[seg_index].goto(new_x, new_y)
        self.segments[0].forward(20)
        time.sleep(self.speed/1000)

    def up(self):
        if self.dir != DIRECTIONS['down']:
            self.head.setheading(DIRECTIONS['up'])
            self.dir = DIRECTIONS['up']

    def down(self):
        if self.dir != DIRECTIONS['up']:
            self.head.setheading(DIRECTIONS['down'])
            self.dir = DIRECTIONS['down']

    def left(self):
        if self.dir != DIRECTIONS['right']:
            self.head.setheading(DIRECTIONS['left'])
            self.dir = DIRECTIONS['left']
    def right(self):
        if self.dir != DIRECTIONS['left']:
            self.head.setheading(DIRECTIONS['right'])
            self.dir = DIRECTIONS['right']

    def is_snake_alive(self):
        x = self.head.xcor()
        y = self.head.ycor()
        if x > 300 or x < -300 or y < -300 or y > 300:
            self.head.setposition((-190, 0))
            return False
        for seg_index in range(1,len(self.segments)-1):
            if self.segments[seg_index].position() == self.head.position():
                return False

        return True