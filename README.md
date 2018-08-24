# networkVisualization
run seq-to-seq translation experiments, and visualize network activations

## documentation work-in-progress
general purpose:
  want to provide flexible way to look at data
  give user full control
  rather than come up with specific visualizations, create a more
    general-purpose framework  

design philosophy:
  general-purpose / not a lot of built-in functionality
  extensible / query interface
  color should be quantitative / have specific meaning  

specific use-case: tie in with classifier
commands / ui

select(results)
neurons
tokens
sentences
words
results
topNeurons
topLabelledNeurons["label"]
labelledTokens["label"]
showLabels()
loadSelection()
clearSelection()
results.modify(selection, value)
results.colorBy(selection)
results.colorSort(selection)
results.getColorers()
results.colorAverage(selection)
results.take(n)
results.reversed()
results.map(func)
results.filter(func)

getWord()
getString()
getTokens()

browser recommendations: chrome works better than firefox

developer documentation:
  issues / improvements
    slow for large number of sentences
    no tests
    limited visualizations
    work with decode data / attention
    firefox memory error
  software requirements
    python3
    pip
    anaconda
  installation instructions
  project structure
  design decisions
    functional programming
    react / in-browser
    lazy-loading / generators
    
## installation
(need python3 and anaconda installed)

```
git clone https://github.com/averynortonsmith/networkVisualization.git
cd networkVisualization/
git submodule init
git submodule update

conda env create -f conda-environment.yml -n networkVisEnv
source activate networkVisEnv

pip install https://github.com/pytorch/text/archive/master.zip

mkdir models
wget http://people.csail.mit.edu/averyn/networkVisualization/models/en-es-1.pt -O ./models/en-es-1.pt

python vis-server.py
```
