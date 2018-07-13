import torch
import json

def listify(x):
    if type(x) == torch.Tensor:
        return x.tolist()
    elif type(x) == list or type(x) == tuple:
        return [listify(y) for y in x]
    else:
        return x

activations = torch.load("tmp.pt")
with open("activations.json", "w") as file:
    file.write(json.dumps(listify(activations)))

with open("text.txt", "r") as file:
	sentences = [sentence.split(" ") for sentence in file.read().strip().split("\n")]

with open("text.json", "w") as file:
    file.write(json.dumps(listify(sentences)))