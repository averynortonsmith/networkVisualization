# networkVisualization
run seq-to-seq translation experiments, and visualize network activations

![demo gif](imgsForReadme/demo.gif)

### Table of Contents:
[Application Description](#application-description)  
[UI Layout](#UI-Layout)  
[Query Variables and Commands](#query-variables-and-commands)  
[Example Use-Case](#example-use-case)  
[Installation Instructions](#installation-instructions)  

### Application Description:
This application helps you run seq-to-seq translation experiments,
and inspect the neural-network activations that occur in the
translation process. 

The user specifies a trained model, input tokens, and labels for those
tokens. The application then translates the input tokens using the 
trained model, and uses a classifier to identify the most salient 
neurons for each label. This data is sent to the front-end, where it
can be visualized.

#### Interface Design Philosophy:
- General Purpose: want the user to be able to sort / filter / manipulate the
  data arbitratily. Provide the user with a small set of visualizations that work with an arbitrary subset of the data, instead of many visualizations that only work on limited subsets of the data.
- Flexibility: user should be able to sequence / nest commands arbitratily
- Color Scheme: any color used in the interface should be associated with some 
  quantitative or semantic meaning

### UI Layout:
In terms of complexity, the UI is broad, but not deep. The easiest way to understand it is probably to just play around with it for a bit.

#### Controls Page:
Used to select model / input data. Visible by default. Provides the following input options:

```
model:
    Path to model `.pt` file in `./models` directory

training tokens:
    Path to tokens text file in `./modelInputs` directory.
    Tokens must be space separated.

training labels:
    Path to labels text file in `./modelInputs` directory.
    Labels must be space separated. Each sentences must have the same number of labels as tokens.

modifications:
    Newline-separated list of manually set neuron activations.
    Each line has format `[sentence, token, layer, neuron, value]`, where 
    `sentence`, `token`, `layer`, and `neuron` are indecies and value is the new activation value.
```

#### Visualization Page:
Used to visualize the results from the model and classifier. Becomes visible when data is loaded from the backend. Has the following UI components:

```
top-left:     list of input sentences
top-center:   list of translated output sentences
middle left:  results list - shows results from the most recent query
bottom-left:  query input - for entering javscript query expressions
top-right:    page-toggle - move between controls page / visualization page
middle-right: list of predefined commands (click to invoke)
bottom-right: list of selected components
```

### Query Variables and Commands:
```
select(results)
    Select the results of the last query

neurons
    List of neuron components

tokens
    List of token components, which include the token word and label

sentences
    List of sentence components (which are lists of tokens)

words
    List of word components

results
    The resutls of the most recent query

topNeurons
    The top 10% of neurons (ranked), by predictive power of input labels

topLabelledNeurons["label"]
    The ranked neurons for each label

labelledTokens["label"]
    A dictionary: sets of tokens indexed by their label

showLabels()
    The set of training labels, along with the first token in
    the text for each label

loadSelection()
    Get the currently selected components

clearSelection()
    Clear selected components

results.modify(selection, value)
    Modify the activations of a list of neurons (results) for a list of tokens 
    (selection), with a new activation value. Updates modifications list on 
    controls page - must re-submit data to back-end to get new results.

results.colorBy(selection)
    tokens x neurons:    activations of neuron for token
    words x neurons:     average activation of neuron for each word
    sentences x neurons: activations of each token in each sentence
    neurons x neurons:   activity correlation across all tokens

results.colorSort(selection)
    Same as colorSort, but sorts activations

results.getColorers()
    Get the current list of neurons coloring a set of components    

results.take(n)
    Get first n elements from a list

results.reversed()
    Get reversed copy of a list

results.map(func)
    Map function over list

results.filter(func)
    Filter list by function
```

### Example Use-Case:

Lets run the application with the following inputs:

```
model:           en-es-1.pt
training tokens: train.tok
training labels: train.pos
modifications:   (none)
```

### Installation Instructions:

Requires `python3`, `pip` and `anaconda`

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



```

developer documentation:
  issues / improvements
    slow for large number of sentences
    no tests
    limited visualizations
    work with decode data / attention
    firefox memory error
    option to upload text
    more comments
    chrome works better than firefox
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
    sqrt curve for colors

```

