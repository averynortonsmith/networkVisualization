#!/usr/bin/env python

from tqdm import tqdm, trange
import torch
import os

from flask import Flask, url_for, jsonify
app = Flask(__name__, static_url_path='')

model_list = ['en-es-1', 'en-es-2', 'en-es-3', 'en-es-1-brnn', 'en-es-2-brnn', 'en-es-3-brnn']
sources = {
    'en-es-1': 'un-data/test/en',
    'en-es-2': 'un-data/test/en',
    'en-es-3': 'un-data/test/en',
    'en-es-1-brnn': 'un-data/test/en',
    'en-es-2-brnn': 'un-data/test/en',
    'en-es-3-brnn': 'un-data/test/en'
}
indices = {
    'en-es-1': 0,
    'en-es-2': 1,
    'en-es-3': 2,
    'en-es-1-brnn': 0,
    'en-es-2-brnn': 1,
    'en-es-3-brnn': 2
}

raw_correlations = torch.load('searchers/en-es-correlations.pt')
raw_correlations_brnn = torch.load('searchers/en-es-correlations-brnn.pt')

def listify(x):
    if type(x) == torch.Tensor:
        return x.tolist()
    elif type(x) == list or type(x) == tuple:
        return [listify(y) for y in x]
    else:
        return x

correlations = {
    'en-es-1': listify(raw_correlations[0]),
    'en-es-2': listify(raw_correlations[1]),
    'en-es-3': listify(raw_correlations[2]),
    'en-es-1-brnn': listify(raw_correlations_brnn[0]),
    'en-es-2-brnn': listify(raw_correlations_brnn[1]),
    'en-es-3-brnn': listify(raw_correlations_brnn[2])
}

loaded_models = {}
loaded_sources = {}

for model_name in tqdm(model_list):
    with open(sources[model_name], 'r') as s:
        loaded_sources[model_name] = [line.split(' ') for line in s]

    dump = torch.load(os.path.join('/data/sls/scratch/abau/layer-dumps', '%s.dump.pt' % model_name))

    print('Dump lengths:', [len(x) for x in dump[:10]])
    print('Source lengths:', [len(x) for x in loaded_sources[model_name][:10]])

    dump = torch.cat([
        torch.stack([
            torch.stack(
                [layer.cpu()
                for layer in tok]) # 2 x 500
            for tok in sent]) # len x 2 x 500
        for sent in dump], dim=0) # many x 2 x 500
    dump = torch.transpose(dump, 0, 1)
    dump = torch.transpose(dump, 1, 2)

    # Transpose into deliverable form
    loaded_models[model_name] = dump

model_descriptions = [
    {
        'name': name,
        'index': indices[name],
        'layers': dump.shape[0],
        'size': dump.shape[1]
    } for name, dump in sorted(loaded_models.items())
]

@app.route("/")
def index():
    return app.send_static_file('visualize.html')

@app.route("/available-models")
def available():
    return jsonify(model_descriptions)

@app.route("/dump/<model>/<layer>/<neuron>")
def neuron(model='demo', layer=1, neuron=0):
    layer, neuron = int(layer), int(neuron)
    return jsonify(loaded_models[model][layer][neuron].tolist())

@app.route("/source/<model>")
def source(model='demo'):
    return jsonify(loaded_sources[model])

@app.route("/correlations/<model>/<layer>")
def get_correlations(model='demo', layer=0):
    return jsonify(correlations[model][int(layer)])
