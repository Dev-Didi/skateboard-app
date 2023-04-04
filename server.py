# app.py

from flask import Flask, Response, render_template, jsonify, request

app = Flask(__name__)

# Store the counters in a dictionary
counter = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return game('game.html')

@app.route("/oz")
def oz():
    return render_template("oz.html")

@app.route('/counters')
def get_counters():
    data = {"Counter": f"{counter}"}
    return data

@app.route('/increment')
def increment_counter():
    global counter
    counter += 1
    return jsonify({'success': True})

@app.route('/start')
def start_game():
    counter = 0
    return jsonify({'success':True})

if __name__ == '__main__':
    app.run(ssl_context='adhoc', debug=True)

