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

activations = torch.load("tmp.pt")
with open("activations.json", "w") as file:
    norm = max(abs(value) for value in flatten(activations))
    normalized = listify(activations, norm=norm)
    file.write(json.dumps(normalized))

with open("text.txt", "r") as file:
	sentences = [sentence.split(" ") for sentence in file.read().strip().split("\n")]

with open("text.json", "w") as file:
    file.write(json.dumps(listify(sentences)))