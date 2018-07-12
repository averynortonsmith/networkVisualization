python opennmt-inspection/translate.py -model "$1" -src text.txt -output pred.txt -replace_unk -verbose -dump_layers tmp.pt
python serializeData.py
rm tmp.pt