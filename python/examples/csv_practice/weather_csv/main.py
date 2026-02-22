# import csv
#
# with open("weather_data.csv", "r") as file:
#     data = csv.reader(file)
#     temperatures = []
#     for row in data:
#         if row[1] != 'temp':
#             temperatures.append(int(row[1]))
#     print(temperatures)

import pandas as pd, math
from numpy.ma.extras import average

data = pd.read_csv("weather_data.csv")
data_dict = data.to_dict()
# print(data_dict)
# temp_list = data['temp'].to_list()
# print(str(average(temp_list)))
print(data['temp'].mean())

print(data['temp'].max())
a=[1,2,3]

