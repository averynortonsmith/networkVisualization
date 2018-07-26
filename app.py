from flask import Flask, request, jsonify
import sys

sys.path.append("./opennmt-inspection/")
import translate

app = Flask(__name__)

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/<path:filename>")
def static_file(filename):
    return app.send_static_file(filename)

@app.route("/model", methods=["POST"])
def hello_world():
    modelPath = "models/" + request.form["modelPath"]
    inputText = [sentence for sentence in request.form["inputText"].splitlines() if sentence]

    try:
        activations, text, preds = getData(modelPath, inputText)
    except Exception as err:
        return str(err), 500

    return jsonify([activations, text, preds])

# --------------------------------------------------------------------------------

import torch
import json

def listify(x, norm=1):
    if type(x) == torch.Tensor:
        return (x / norm).tolist()
    elif type(x) == list or type(x) == tuple:
        return [listify(y, norm=norm) for y in x]
    else:
        return x

def flatten(x):
    if type(x) == torch.Tensor:
        yield from x.tolist()
    elif type(x) == list or type(x) == tuple:
        for y in x:
            yield from flatten(y)
    else:
        yield x
        

def getData(modelPath, inputText):
    activationData, predData = translate.main(modelPath, inputText)

    norm = max(abs(value) for value in flatten(activationData))
    activations = listify(activationData, norm=norm)

    text = [sentence.strip().split(" ") for sentence in inputText]
    preds = [sentence.split(" ") for sentence in predData]

    return activations, text, preds

# --------------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
