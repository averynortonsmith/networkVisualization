
from flask import Flask, request, jsonify
import json
import sys
import os
import traceback

sys.path.append("./opennmt-inspection/")
from online_translator import translate
import getClassifierData

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
    tokensPath = os.path.join('modelInputs', request.form["tokensPath"])
    labelsPath = os.path.join('modelInputs', request.form["labelsPath"])

    with open(tokensPath, "r") as file:
        trainTokens = file.read().splitlines()

    with open(labelsPath, "r") as file:
        trainLabels = file.read().splitlines()
        labels = [line.split(" ") for line in trainLabels]

    numLines = len(trainTokens)
    modsList = [[] for _ in range(numLines)]

    for mod in modifications:
        sentenceIndex = mod[0]
        modsList[sentenceIndex].append(mod[1:])

    print(modsList)

    try:
        rawActivations, text, preds = getData(modelPath, trainTokens, modsList)

        # get rid of second dimension
        # to keep format activations[sentence][token][layer][neuron]
        # instead of activations[sentence][0][token][layer][neuron]
        activations = [sentence[0] for sentence in rawActivations]

        # scale activations linearly so that abs(largest_activation) == 1
        norm = max(abs(value) for value in flatten(activations))
        activations = listify(activations, norm=norm)

        trainingActivations = [torch.stack([torch.cat(token) for token in sentence[0]]) for sentence in rawActivations]
        topNeurons, topNeuronsByCategory = getClassifierData.topNeurons(tokensPath, labelsPath, trainingActivations)

    except Exception as err:
        # catch python exception, throw http 500 error with error message
        print(traceback.format_exc())
        return str(err), 500

    with open("cache.json", "w") as file:
        file.write(json.dumps([activations, text, preds, labels, topNeurons, topNeuronsByCategory]))

    return jsonify([activations, text, preds, labels, topNeurons, topNeuronsByCategory])

@app.route("/cache", methods=["POST"])
def cache():
    with open("cache.json", "r") as file:
        data = json.loads(file.read())

    return jsonify(data)

# --------------------------------------------------------------------------------

import torch

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
    pred, rawActivations = translate(
        model         = modelPath,
        sentences     = inputText,
        modifications = modifications
    )

    text = [sentence.strip().split(" ") for sentence in inputText]
    preds = [sentence.split(" ") for sentence in pred]

    return rawActivations, text, preds

# --------------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
