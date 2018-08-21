# coding: utf-8

import argparse
import codecs
import dill as pickle
import json
import matplotlib.pyplot as plt
import numpy as np
import os
import re

from itertools import product as p
from torch.utils.serialization import load_lua
from tqdm import tqdm, tqdm_notebook, tnrange

# Import lib
import sys
# sys.path.append(os.path.dirname(os.path.realpath(__file__)))

import aux_classifier.aux_classifier.utils as utils
import aux_classifier.aux_classifier.representations as repr
import aux_classifier.aux_classifier.data_loader as data_loader

# ----------------------------------------------------------------------------

sys.path.append("./opennmt-inspection/")
from online_translator import translate
import torch

train_source = "testData/train.tok"
train_labels = "testData/train.pos"

with open(train_source, "r") as file:
    inputText = file.read()

pred, raw_train_activations = translate(
    model         = "models/en-es-1.pt",
    sentences     = inputText.split("\n"),
    modifications = [[] for _ in inputText.split("\n")]
)

train_activations = [act[0] for act in raw_train_activations]

test_source = "testData/test.tok"
test_labels = "testData/test.pos"

with open(test_source, "r") as file:
    inputText = file.read()

pred, raw_test_activations = translate(
    model         = "models/en-es-1.pt",
    sentences     = inputText.split("\n"),
    modifications = [[] for _ in inputText.split("\n")]
)

test_activations = [act[0] for act in raw_test_activations]

# ----------------------------------------------------------------------------

def getClassifierData(
    train_source,
    train_labels,
    train_activations,
    test_source,
    test_labels,
    test_activations):

    # Constants
    NUM_EPOCHS = 10
    BATCH_SIZE = 512

    max_sent_l = 250
    is_brnn = True
    filter_layers = None
    task_specific_tag = "NN" 

    print("Number of train sentences: %d"%(len(train_activations)))
    print("Number of test sentences: %d"%(len(test_activations)))

    # if exp_type == 'word'
    train_tokens = data_loader.load_data(train_source, train_labels, train_activations, max_sent_l)
    test_tokens = data_loader.load_data(test_source, test_labels, test_activations, max_sent_l)

    NUM_TOKENS = sum([len(t) for t in train_tokens['target']])
    print('Number of total train tokens: %d'%(NUM_TOKENS))

    NUM_SOURCE_TOKENS = sum([len(t) for t in train_tokens['source']])
    print('Number of source words: %d'%(NUM_SOURCE_TOKENS)) 

    NUM_NEURONS = train_activations[0].shape[1]
    print('Number of neurons: %d'%(NUM_NEURONS))

    # Filtering
    if filter_layers:
        train_activations, test_activations = utils.filter_activations_by_layers(train_activations, test_activations, filter_layers, 500, 2)

    print("Creating train tensors...")
    X, y, mappings = utils.create_tensors(train_tokens, train_activations, task_specific_tag)
    print (X.shape)
    print (y.shape)

    print("Creating test tensors...")
    X_test, y_test, mappings = utils.create_tensors(test_tokens, test_activations, task_specific_tag, mappings)

    # class_to_idx = label2idx
    label2idx, idx2label, src2idx, idx2src = mappings

    print("Building model...")
    model = utils.train_logreg_model(X, y, lambda_l1=0.00001, lambda_l2=0.00001, num_epochs=n_epochs, batch_size=batch_size)

    # train_accuracies = utils.evaluate_model(model, X, y, idx2label)
    # test_accuracies, test_predictions = utils.evaluate_model(model, X_test, y_test, idx2label, return_predictions=True, source_tokens=test_tokens['source'])

    # model, label2idx, idx2label, src2idx, idx2src, train_accuracies, test_accuracies, test_predictions, train_tokens, test_tokens

    # utils.get_top_neurons
    # def get_top_neurons(model, percentage, class_to_idx):

    print(get_top_neurons(model, 10, label2idx))

getClassifierData(
    train_source,
    train_labels,
    train_activations,
    test_source,
    test_labels,
    test_activations)
