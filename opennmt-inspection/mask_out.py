#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import division, unicode_literals
import argparse

import torch

from onmt.utils.misc import get_logger
from onmt.translate.translator import build_translator

import onmt.inputters
import onmt.translate
import onmt
import onmt.model_builder
import onmt.modules
import onmt.opts

import os


def main(opt):
    translator = build_translator(opt, report_score=True, logger=logger, use_output=False)

    # We cannot run without the following arguments:
    assert opt.mask_out_layer != -1
    assert opt.mask_out_basis != ""

    # Load in the basis
    basis = torch.load(opt.mask_out_basis).cuda()
    inverse_basis = basis.t()

    h, h = basis.shape

    def intervene(layer, mask, i):
        # Note that layer is here a padded matrix of size
        # (sentences) x (tokens) x (hidden_size).
        # To zero out everything we'll need to reshape twice.
        if i == opt.mask_out_layer:
            # Project onto the space spanned by basis * mask.
            s, t, h = layer.shape
            layer = torch.reshape(layer, (s * t, h))
            layer = torch.mm(layer, inverse_basis)
            layer = torch.mm(layer, mask)
            layer = torch.mm(layer, basis)
            layer = torch.reshape(layer, (s, t, h))
            return layer
        else:
            return layer

    def run_with(first, last):
        mask = torch.eye(h)
        for j in range(first, last):
            mask[j] = 0
        mask = mask.cuda()

        with open(os.path.join(opt.output, 'without-%d-%d.txt' %
                (first, last)), 'w') as out_file:
            translator.translate(src_path=opt.src,
                                 src_dir=opt.src_dir,
                                 batch_size=opt.batch_size,
                                 attn_debug=opt.attn_debug,
                                 intervention=lambda l, i: intervene(l, mask,i),
                                 out_file=out_file)

    if opt.mask_out_cumulative:
        # Remove top
        for i in range(1, opt.mask_out_intervals):
            run_with(
                0,
                int(h * i / opt.mask_out_intervals))
        # Remove bottom
        for i in range(1, opt.mask_out_intervals):
            run_with(
                int(h * (i - 1) / opt.mask_out_intervals),
                h)
    else:
        for i in range(1, opt.mask_out_intervals):
            run_with(
                int(h * (i - 1) / opt.mask_out_intervals),
                int(h * i / opt.mask_out_intervals))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='mask_out.py',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    onmt.opts.add_md_help_argument(parser)
    onmt.opts.mask_out_opts(parser)

    opt = parser.parse_args()
    logger = get_logger(opt.log_file)
    main(opt)
