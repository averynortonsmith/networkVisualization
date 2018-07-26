#!/usr/bin/env python

# USAGE:
import sys
import torch

corr_file = sys.argv[1]
network = int(sys.argv[2])
layer = int(sys.argv[3])
out = sys.argv[4]

correlations = torch.load(corr_file)
correlations = correlations[network][layer][0]
maxs, _ = torch.max(
    torch.abs(correlations) *
    (1 - torch.eq(
        torch.arange(correlations.shape[0]),
        network
    ).float())[:, None],
    dim=0
)
_, permutation = torch.sort(maxs, descending=True)
rank = torch.eye(correlations.shape[1])
rank = rank.index_select(0, permutation)
torch.save(rank, out)
