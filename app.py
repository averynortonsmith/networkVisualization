
from flask import Flask, request, jsonify
import json
import sys
import os

sys.path.append("./opennmt-inspection/")
from online_translator import translate

app = Flask(__name__)

# make flask load index.html by default
@app.route("/")
def index():
    return app.send_static_file("index.html")

# for loading css, js
@app.route("/<path:filename>")
def static_file(filename):
    return app.send_static_file(filename)

# frontend sends requests to http://localhost:5000/model
@app.route("/model", methods=["POST"])
def model():
    modelPath = os.path.join('models', request.form["modelPath"])
    modifications = json.loads(request.form["modifications"])
    inputText = [sentence for sentence in request.form["inputText"].splitlines() if sentence]

    try:
        activations, text, preds = getData(modelPath, inputText, modifications)
    except Exception as err:
        # catch python exception, throw http 500 error with error message
        print("SERVER ERROR: ", err)
        return str(err), 500

    return jsonify([activations, text, preds])

# --------------------------------------------------------------------------------

import torch
import json

# adapted from anthony's code
# normalize a nested list of values
# convert and tensors to regular lists
def listify(x, norm=1):
    if type(x) == torch.Tensor:
        return (x / norm).tolist()
    elif type(x) == list or type(x) == tuple:
        return [listify(y, norm=norm) for y in x]
    else:
        return x
 
# convert nested list of lists / tensors
# to a flat element stream
def flatten(x):
    if type(x) == torch.Tensor:
        yield from x.tolist()
    elif type(x) == list or type(x) == tuple:
        for y in x:
            yield from flatten(y)
    else:
        yield x
        
# modelPath: path to model in the ./models directory
# inputText: string of input text to model
# !!! currently, input text must already be tokenized with spaces - need to fix
def getData(modelPath, inputText, modifications):
    print(modifications)

    pred, activations = translate(
            model=modelPath,
            sentences=inputText,
            modifications=modifications)

    # scale activations linearly so that abs(largest_activation) == 1
    norm = max(abs(value) for value in flatten(activations))
    activations = listify(activations, norm=norm)

    text = [sentence.strip().split(" ") for sentence in inputText]
    preds = [sentence.split(" ") for sentence in pred]

    return activations, text, preds

# --------------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
