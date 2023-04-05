# app.py

from flask import Flask, Response, render_template, jsonify, request, logging

app = Flask(__name__)

# Store the counters in a dictionary
counter = 0
start = False
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    global counter
    global start
    counter = 0
    start = False
    return render_template('game.html')

@app.route("/oz")
def oz():
    return render_template("oz.html")

@app.route('/count')
def get_counters():
    data = {"Counter": f"{counter}"}
    return data

@app.route('/increment')
def increment_counter():
    global counter
    counter += 1
    return jsonify({'success': True})

@app.route('/start')
def get_start():
    global start
    data = {"Start": f"{start}"}
    return data

@app.route('/startGame')
def start_game():
    app.logger.log(msg="start game signal received...",level=1)
    global counter
    global start
    counter = 0
    start = not start
    return jsonify({'Success':True})

if __name__ == '__main__':
    app.run(ssl_context='adhoc', debug=True)

