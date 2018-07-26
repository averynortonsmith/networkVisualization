#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import division, unicode_literals
import argparse

from onmt.utils.misc import get_logger
from onmt.translate.translator import build_translator

import onmt.inputters
import onmt.translate
import onmt
import onmt.model_builder
import onmt.modules
import onmt.opts


def main(modelPath, inputText):
    parser = argparse.ArgumentParser(
        description='translate.py',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    onmt.opts.add_md_help_argument(parser)
    onmt.opts.translate_opts(parser)

    opt = parser.parse_args()
    logger = get_logger(opt.log_file)

    opt.model = modelPath
    opt.replace_unk = True
    opt.dump_layers = True
    opt.verbose = True

    translator = build_translator(opt, report_score=True, logger=logger, use_output=False)

    return translator.translate(
        # src_path=opt.src,
        src_data_iter=inputText,
        tgt_path=opt.tgt,
        src_dir=opt.src_dir,
        batch_size=opt.batch_size,
        attn_debug=opt.attn_debug
    )