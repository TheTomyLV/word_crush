import re
from datetime import datetime

from flask import Flask, redirect, url_for, request, render_template, session
import secrets
app = Flask(__name__)
app.secret_key = secrets.token_bytes(32)

def generateBoard(width, height):
    board = []
    for i in range(width):
        board.append([])
        for j in range(height):
            board[i].append("A")
    game = {}
    game["width"] = width
    game["height"] = height
    game["movesLeft"] = 30

    if not hasValidMoves():
        board = generateBoard()
    game["board"] = board
    return game

def swapLetters():
    return

def shuffleBoard():
    return

def hasValidMoves():
    return True

@app.route('/newGame',methods = ['POST'])
def newGame():
    if request.method == 'POST':
        type = "moveLimit"
        args = request.get_json()
        width = args["width"]
        height = args["height"]
        game = generateBoard(width, height)

        session['type'] = type
        session['board'] = game

        return game

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

@app.route("/words/")
def words():
    return render_template("words.html")
