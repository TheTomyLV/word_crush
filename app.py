import json
import random
import re
from datetime import datetime

from flask import Flask, redirect, url_for, request, render_template, session
import secrets
app = Flask(__name__)
app.secret_key = secrets.token_bytes(32)

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
    
f = open('static/words.json', encoding="utf8")
words = json.load(f)
f.close()

def generateBoard(width, height):
    board = []
    for i in range(width):
        board.append([])
        for j in range(height):
            board[i].append(random.choice(letterPool)[0])
    game = {}
    game["width"] = width
    game["height"] = height
    game["movesLeft"] = 30

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

def hasWord(word):
    for search in words:
        try:
            index = word.index(search)
            return [index, len(search)]
        except:
            continue
    return -1
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
    horizontal = hasWord(horizontal)
    if horizontal != -1:
        for i in range(horizontal[1]):
            board[horizontal[0]+i][y] = ""
            changes.append([horizontal[0]+i, y])
        game["board"] = board
        return changes
    vertical = hasWord(vertical)
    if vertical != -1:
        for i in range(vertical[1]):
            board[x][vertical[0]+i] = ""
            changes.append([x, vertical[0]+i])
        game["board"] = board
        return changes
    diagonal = hasWord(diagonal)
    if diagonal != -1:
        for i in range(diagonal[1]):
            board[diagonal[0]+i][diagonal[0]+i] = ""
            changes.append([diagonal[0]+i, diagonal[0]+i])
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
            board[x][0] = random.choice(letterPool)[0]
            letters_added.append(board[x][0])
        for y in range(len(board[x])):
            letter = board[x][y]
            if letter and y< len(board[x])-1 and not board[x][y+1]:
               board[x][y+1] = letter
               board[x][y] = ""
    game["board"] = board
    return letters_added

@app.route('/newGame',methods = ['POST'])
def newGame():
    if request.method == 'POST':
        type = "moveLimit"
        args = request.get_json()
        width = args["width"]
        height = args["height"]
        game = generateBoard(width, height)

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
        added = fillBoard(game)
        session['board'] = game

        return {"canSwap": True, "removed": removed, "added": added}

@app.route("/")
def home():
    return render_template("game.html")

@app.route("/game/")
def game():
    return render_template("game.html")

@app.route("/about/")
def about():
    return render_template("about.html")

@app.route("/results/")
def results():
    return render_template("results.html")

@app.route("/rules/")
def rules():
    return render_template("rules.html")

