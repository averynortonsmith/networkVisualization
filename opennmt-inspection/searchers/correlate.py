#!/usr/bin/env python

import torch

# Find most correlated neurons between a list of dumps
def correlate_dumps(dump_list):
    # Concatenate together the first two dimensions to go from (sent, tok, layer, neuron)
    # to (tok, layer, neuron)
    dump_list = [
        torch.cat(tuple(
        torch.stack(tuple(
        torch.stack(tok) for tok in sent))
        for sent in dump))
        for dump in dump_list
    ]

    # Whiten
    dump_list = [(dump - dump.mean(0)) / dump.std(0) for dump in dump_list]

    # Transpose first two dimensions to put layers first
    dump_list = [dump.transpose(0, 1) for dump in dump_list]

    # Dot product to get correlations
    correlations = [
        [
            # (neurons in a) x (samples) * (samples) x (neurons in b)
            # Result will be (neurons in a) x (neurons in b); neurons in a
            # are first dimension.
            torch.bmm(a.transpose(1, 2), b) / a.shape[1]
            for b in dump_list
        ]
        for a in dump_list
    ]

    # Shape is now:
    # (network1) x (network2) x (layer) x (neurons in 1) x (neurons in 2)

    # Desired shape:
    # (network1) x (layer) x ((neurons in 1) x (network2), (neurons in 1) x (network2))

    # Step 1: take maxima
    # Result: (network1) x (network2) x (layer) x ((neurons in 1),  (neurons in 1))
    maxed = [
        [
            [
                torch.max(block[l], dim=1)
                for l in range(block.shape[0])
            ]
            for block in network1
        ]
        for network1 in correlations
    ]

    # Step 2: transpose the (network2) index into the tuple
    transposed = [
        [
            (
            torch.stack([
                network2[l][0]
                for network2 in network1
            ]),
            torch.stack([
                network2[l][1]
                for network2 in network1
            ])
            )
            for l in range(len(network1[0]))
        ]
        for network1 in maxed
    ]

    return transposed

def correlation_min(dump_list):
    correlations = correlate_dumps(dump_list)

    results = []

    for corr, idx in correlations:
        mins = torch.abs(torch.min(corr, dim=1))
        sort, sort_idx = torch.sort(mins, descending=True)

        corr = torch.select(corr, sort_idx)
        idx = torch.select(idx, sort_idx)

        results.append((mins, corr, idx))

def correlation_max(dump_list):
    correlations = correlate_dumps(dump_list)

    results = []

    for corr, idx in correlations:
        maxs = torch.abs(torch.max(corr, dim=1))
        sort, sort_idx = torch.sort(maxs, descending=True)

        corr = torch.select(corr, sort_idx)
        idx = torch.select(idx, sort_idx)

        results.append((maxs, corr, idx))

# USAGE:
from tqdm import tqdm
import gc

dumps = []
for x in tqdm([
        '/data/sls/scratch/abau/layer-dumps/en-es-1.dump.pt',
        '/data/sls/scratch/abau/layer-dumps/en-es-2.dump.pt',
        '/data/sls/scratch/abau/layer-dumps/en-es-3.dump.pt']):
    dumps.append([[[l.cpu() for l in tok] for tok in sent] for sent in tqdm(torch.load(x))])
    gc.collect()

'''
maxs = correlation_max(dumps)
torch.save(maxs[0], '../ranks/en-es-1.max-corr.pt')
torch.save(maxs[1], '../ranks/en-es-1.max-corr.pt')
torch.save(maxs[2], '../ranks/en-es-1.max-corr.pt')
'''

torch.save(correlate_dumps(dumps), 'en-es-correlations.pt')
