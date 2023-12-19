import json
import random
import re
from datetime import datetime
import time
import math
import mysql.connector

from flask import Flask, redirect, url_for, request, render_template, session
import secrets
app = Flask(__name__)
app.secret_key = secrets.token_bytes(32)

database_Host="clypeum.mysql.pythonanywhere-services.com"
database_User="Clypeum"
database_Passwd="Degurechaff"
database_Name="Clypeum$default"


DEFAULT_MOVE_COUNT = 10
PATH = "/home/Clypeum/word_crush/static/"

letter_posibilities = {
    "a": {"probability": 11, "points": 1},
    "ā": {"probability": 4, "points": 2},
    "b": {"probability": 1, "points": 5},
    "c": {"probability": 1, "points": 5},
    "č": {"probability": 1, "points": 10},
    "d": {"probability": 3, "points": 3},
    "e": {"probability": 7, "points": 1},
    "ē": {"probability": 2, "points": 4},
    "f": {"probability": 1, "points": 10},
    "g": {"probability": 1, "points": 5},
    "ģ": {"probability": 1, "points": 10},
    "h": {"probability": 1, "points": 10},
    "i": {"probability": 9, "points": 1},
    "ī": {"probability": 2, "points": 4},
    "j": {"probability": 2, "points": 4},
    "k": {"probability": 4, "points": 2},
    "ķ": {"probability": 1, "points": 10},
    "l": {"probability": 3, "points": 2},
    "ļ": {"probability": 1, "points": 8},
    "m": {"probability": 4, "points": 2},
    "n": {"probability": 4, "points": 2},
    "ņ": {"probability": 1, "points": 6},
    "o": {"probability": 3, "points": 3},
    "p": {"probability": 3, "points": 2},
    "r": {"probability": 5, "points": 1},
    "s": {"probability": 8, "points": 1},
    "š": {"probability": 1, "points": 6},
    "t": {"probability": 6, "points": 1},
    "u": {"probability": 5, "points": 1},
    "ū": {"probability": 1, "points": 6},
    "v": {"probability": 3, "points": 3},
    "z": {"probability": 2, "points": 3},
    "ž": {"probability": 1, "points": 8}
}
letterPool = []
for letter, data in letter_posibilities.items():
    for i in range(data["probability"]):
        letterPool.append([letter, data["points"]])

f = open('/home/Clypeum/word_crush/static/words.json', encoding="utf8")
words = json.load(f)
f.close()

def swapCharacters(s, B, C):
    N = len(s)
    # If c is greater than n
    C = C % N

    # Converting string to list
    s = list(s)

    # loop to swap ith element with (i + C) % n th element
    for i in range(B):
        s[i], s[(i + C) % N] = s[(i + C) % N], s[i]
    s = ''.join(s)
    return s

def newLetter(game):
    if not game["word"]:
        word =""
        while len(word) < 4:
            word = random.choice(words)
            pos = random.randint(1, len(word)-1)
            word = swapCharacters(word, pos, pos+random.choice([1, -1]))
        game["word"] = word
    letter = game["word"][0]
    game["word"] = game["word"][1:]
    return letter


def generateBoard(width, height):
    board = []
    game = {}
    game["word"] = ""
    for i in range(width):
        board.append([])
        for j in range(height):
            board[i].append(newLetter(game))

    game["width"] = width
    game["height"] = height
    game["moves"] = DEFAULT_MOVE_COUNT
    game["points"] = 0
    game["time"] = time.time()
    game["lastMoveTime"] = time.time()

    if not hasValidMoves():
        board = generateBoard()
    game["board"] = board
    return game

def swapLetters(game, x1, y1, x2, y2):
    board = game["board"]
    letter = board[x1][y1]
    board[x1][y1] = board[x2][y2]
    board[x2][y2] = letter
    word = hasWordAt(game, x1, y1)
    if word:
        return word
    word = hasWordAt(game, x2, y2)
    return word

def shuffleBoard():
    return

def score(word):
    score = 0
    for letter in word:
        score += letter_posibilities[letter]["points"]
    return score

def hasWord(word):
    valid_words = []
    for search in words:
        try:
            index = word.index(search)
            if len(search) > 2:
                valid_words.append([index, len(search), score(search)])
        except:
            continue
    if len(valid_words) == 0:
        return -1
    else:
        highest = valid_words[0]
        for word in valid_words:
            if word[2] > highest[2]:
                highest = word
        return highest
def hasValidMoves():
    return True

def hasWordAt(game, x, y):
    board = game["board"]
    horizontal = ""
    for i in range(game["width"]):
        horizontal += board[i][y]
    vertical = ""
    for i in range(game["height"]):
        vertical += board[x][i]

    diagonal = ""
    if x>y:
        minValue = y
    else:
        minValue = x
    if game["width"]-x>game["height"]-y:
        maxValue = game["height"]-y
    else:
        maxValue = game["width"]-x
    for i in range(maxValue+minValue):
        diagonal += board[x-minValue+i][y-minValue+i]

    changes = []
    score = 0
    horizontal = hasWord(horizontal)
    if horizontal != -1:
        for i in range(horizontal[1]):
            board[horizontal[0]+i][y] = ""
            changes.append([horizontal[0]+i, y])
        game["points"] += horizontal[2]
        game["board"] = board
        return changes
    vertical = hasWord(vertical)
    if vertical != -1:
        for i in range(vertical[1]):
            board[x][vertical[0]+i] = ""
            changes.append([x, vertical[0]+i])
        game["points"] += vertical[2]
        game["board"] = board
        return changes
    diagonal = hasWord(diagonal)
    if diagonal != -1:
        for i in range(diagonal[1]):
            changes.append([x-minValue+diagonal[0]+i, y-minValue+diagonal[0]+i])
            board[x-minValue+diagonal[0]+i][y-minValue+diagonal[0]+i] = ""
        game["points"] += diagonal[2]
        game["board"] = board
        return changes

def fillBoard(game):
    changes = []
    for i in range(len(game["board"])):
        changes.append(fillCollumn(game, i))
    return changes

def fillCollumn(game, x):
    letters_added = []
    board = game["board"]
    while "" in board[x]:
        if not board[x][0]:
            board[x][0] = newLetter(game)
            letters_added.append(board[x][0])
        for y in range(len(board[x])):
            letter = board[x][y]
            if letter and y< len(board[x])-1 and not board[x][y+1]:
               board[x][y+1] = letter
               board[x][y] = ""
    game["board"] = board
    return letters_added

def saveScore(game):
    timer = time.time()-game["time"]
    minutes = math.floor(timer/60)
    seconds = math.floor(timer)%60
    if len(str(minutes)) == 1:
        minutes = "0"+str(minutes)
    if len(str(seconds)) == 1:
        seconds = "0"+str(seconds)


    mydb = mysql.connector.connect(
    host=database_Host+".mysql.pythonanywhere-services.com",
    user=database_Host,
    passwd=database_Passwd,
    database=database_Host+"$default"
    )

    mycursor = mydb.cursor()

    values = (game["username"], str(minutes)+":"+str(seconds), game["points"])
    sql = "INSERT INTO Score (Vards, Laiks, Punkti) VALUES (%s,%s,%s)"
    mycursor.execute(sql,values)
    mydb.commit()

@app.route('/newGame',methods = ['POST'])
def newGame():
    if request.method == 'POST':
        type = "moveLimit"
        args = request.get_json()
        width = args["width"]
        height = args["height"]
        game = generateBoard(width, height)
        game["username"] = args["username"]

        session['type'] = type
        session['game'] = game

        return game


@app.route('/swap',methods = ['POST'])
def swap():
    if request.method == 'POST':
        args = request.get_json()
        x1 = args["x1"]
        y1 = args["y1"]
        x2 = args["x2"]
        y2 = args["y2"]
        game = session.get('game')
        if not game:
            return {"canSwap": False}
        removed = swapLetters(game, x1, y1, x2, y2)
        if not removed:
            return {"canSwap": False}
        game["moves"] -= 1
        if (time.time()-game["lastMoveTime"]<10):
            game["points"]+=10-(math.floor(time.time()-game["lastMoveTime"]))
        if (game["moves"]==0):
            saveScore(game)
        added = fillBoard(game)
        session['board'] = game
        game["lastMoveTime"]=time.time()

        return {"canSwap": True, "removed": removed, "added": added, "points": game["points"], "moves": game["moves"], "gameEnded":game["moves"]==0, "time": time.time()-game["time"]}

@app.route("/")
def home():
    game = session.get('game')
    if not game:
        return render_template("game.html", points = 0, moves=DEFAULT_MOVE_COUNT)
    return render_template("game.html", points = game['points'], moves = game['moves'], startTime=game["time"])

# @app.route("/game/")
# def game():
#     game = session.get('game')
#     if not game:
#         return render_template("game.html", points = 0, moves=DEFAULT_MOVE_COUNT)
#     return render_template("game.html", points = game['points'], moves = game['moves'], startTime=game["time"])

@app.route("/about/")
def about():
    return render_template("about.html")

@app.route("/results/")
def results():
    mydb = mysql.connector.connect(
    host=database_Host,
    user=database_User,
    passwd=database_Passwd,
    database=database_Name
    )

    mycursor = mydb.cursor()
    mycursor.execute("SELECT * FROM Score ORDER BY Punkti, Laiks")
    score=mycursor.fetchall()
    mydb.close()
    return render_template("results.html", results=score)

@app.route("/rules/")
def rules():
    return render_template("rules.html")