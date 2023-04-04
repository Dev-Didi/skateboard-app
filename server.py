# app.py

from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Store the counters in a dictionary
counters = {'counter1': 0, 'counter2': 0}

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/oz")
def oz():
    return render_template("oz.html")

@app.route('/counters')
def get_counters():
    return jsonify(counters)

@app.route('/increment')
def increment_counter():
    counter_name = request.args.get('counter')
    counters[counter_name] += 1
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)

