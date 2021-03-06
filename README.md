# networkVisualization
Run seq-to-seq translation experiments, and visualize network activations

![demo gif](imgsForReadme/demo.gif)

### Table of Contents:
[Application Description](#application-description)  
[UI Layout](#ui-layout)  
[Query Variables and Commands](#query-variables-and-commands)  
[Example Use-Case](#example-use-case)  
[Installation Instructions](#installation-instructions)  
[Development Notes](#development-notes)  

### Application Description:
This application helps you run seq-to-seq translation experiments,
and inspect the neural-network activations that occur in the
translation process. 

The user specifies a trained model, input tokens, and labels for those
tokens. The application then translates the input tokens using the 
trained model, and uses a classifier to identify the most salient 
neurons for each label. This data is sent to the front-end, where it
can be visualized.

#### [publicly hosted demo](https://averyn.scripts.mit.edu/networkVisDemo/)
^ takes a minute to load

### UI Layout:
In terms of complexity, the UI is broad, but not deep. The easiest way to understand it is to just play around with it for a bit.

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
Used to visualize the results from the model and classifier. Becomes visible when data is loaded from the backend. Includes the following UI components:

```
top-left:     list of input sentences
top-center:   list of translated output sentences
middle left:  results list - shows results from the most recent query
bottom-left:  query input - for entering javscript query expressions
top-right:    page-toggle - move between controls page / visualization page
middle-right: list of predefined commands (click to invoke)
bottom-right: list of selected components
```

You can navigate through the data-set using the query interface, which accepts a number of variables and commands (described below). The `colorBy` and `colorSort` commands can be used to view activations. You can select / deselect components by clicking on them. 

### Query Variables and Commands:
Example variables `results`, `selection`, `value` etc.
can be replaced with other variables / expressions.

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

First, let's check out which neurons the classifier has identified as being the most influential for tokens with the label `"."` (which is simply all period tokens). Let's select the highest-ranked neuron in this list, the neuron in layer 1, index 97.

![top period neurons](imgsForReadme/example1.png)

Next, let's color our input text with the activations of this neuron. We see that this neuron, as expected, responds strongly to period tokens. Interesingly, this neuron responds to all period characters, not just those at the end of the sentences, and responds negatively (the classifier only takes into account absolute value).

![show period neurons](imgsForReadme/example2.png)

Let's inspect another neuron that responds to period tokens. We select the first period token in the input text, and sort all of the neurons in the network by their activation on this token.

![top token neurons](imgsForReadme/example3.png)

Now, take the most active neuron for this period token, and color the input text with its activations. The results look very different from the previous neuron: this neuron starts off with a negative activation at the beginning of each sentences, and becomes more active as the sentence goes on. It looks like this neuron, rather than responding to a specific set of tokens, is in fact encoding sentence position!

![positional neuron](imgsForReadme/example4.png)

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

### Development Notes:

#### Design Decisions:
- General Purpose: want the user to be able to sort / filter / manipulate the
  data arbitratily. Provide the user with a small set of visualizations that work with an arbitrary subset of the data, instead of many visualizations that only work on limited subsets of the data.
- Flexibility: user should be able to sequence / nest commands arbitratily
- Color Scheme: any color used in the interface should be associated with some 
  quantitative or semantic meaning
- Functional Programming: focus on map / filter / reduce framework for
  processing data. Internally, use of generators to achieve lazy component
  loading.
- Simple Back-End: avoids webpack, react-router, npm, etc. Translates babel
  in-browser.

#### Issues / Areas for Improvement:
- translation / classification is slow for medium-to-large number of input 
  sentences. Should try to host back-end on faster server.
- codebase currently lacking tests
- `.js` code could be refactored / commented more
- currently, performance on chrome is better than firefox
  (chrome is more aggressive about reclaiming unused memory)
- `torch.cuda.is_available()` in `aux_classifier/utiles.py` gives false positives sometimes, leads to CUDA error during 
  classification
- set of visualizations could be expanded
- could try to include attention data in visualizations
- could allow user to upload new models / token files

#### Project Structure:
```
aux_classifier: 
    classifier submodule
    called from getClassifierData.py

imgsForReadme

modelInputs:
    directory where token and label files are stored
           
opennmt-inspection:
    translation submodule
    called from vis-server.py

static:
    index.html
    style.css
    script.js:
        main js file, contains React UI components
        handles all back-end communication
        handles data-processing / logic

    visComponents.js:
        React components for visualization
        (neurons, tokens, sentencs, etc.)

    dataFunctions.js:
        misc data-related functions
        for sorting, flattening generators, etc.

.gitignore  

.gitmodules 

README.md

cache.json:
    results from model / classifier are dumped here
    helpful for front-end dev: can reload data from
    the back-end without re-running the entire model

conda-environment:
    list of python dependencies, handled by anaconda

getClassifierData.py:
    get top-neuron data from model activations
    called by vis-server.py

vis-server:
    main file in the back-end, makes flask server that 
    servers the application.
    runs the model / classifier, sends data back to the 
    front / end.          
```
