#TODO: Create a letter using starting_letter.txt 
#for each name in invited_names.txt
#Replace the [name] placeholder with the actual name.
#Save the letters in the folder "ReadyToSend".

#Hint1: This method will help you: https://www.w3schools.com/python/ref_file_readlines.asp
#Hint2: This method will also help you: https://www.w3schools.com/python/ref_string_replace.asp
#Hint3: THis method will help you: https://www.w3schools.com/python/ref_string_strip.asp


names2 = []
s_letter = []
with open("Input/Letters/starting_letter.txt", 'r') as letter:
    text = letter.readlines()
    for line in text:
        s_letter.append(line)
print(s_letter)
with open("Input/Names/invited_names.txt", "r") as names_list:
    names = names_list.readlines()
    print(names)
    for name in names:
        x = name.replace("\n", "")
        names2.append(x)
print(names2)
for name in names2:
    with open(f"Output/ReadyToSend/{name}_invite.txt", 'w') as letter:
        for line in s_letter:
            x = line.replace("[name]", name)
            letter.write(x)








