import re
from datetime import datetime

from flask import Flask, render_template

app = Flask(__name__)


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
