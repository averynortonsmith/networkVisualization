
// use a closure w/ getters / setters instead of global vars
// to make dependencies more explicit
function stateClosure() {
    let state;

    function setState(value) {
        state = value;
    }

    const getState = () => state;

    return [getState, setState];
}

let [getToggleSelect, setToggleSelect]           = stateClosure();
let [getActivations, setActivations]             = stateClosure();
let [getAddMods, setAddMods]                     = stateClosure();
let [getHandleQueryChange, setHandleQueryChange] = stateClosure();

// --------------------------------------------------------------------------------

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.handleQueryChange  = this.handleQueryChange.bind(this);  // update results for new valid query
        this.processData        = this.processData.bind(this);        // call when we get new data from backend
        this.toggleSelect       = this.toggleSelect.bind(this);       // select / deselect data components
        this.toggleControls     = this.toggleControls.bind(this);     // show / hide the controls page
        this.handleInputChange  = this.handleInputChange.bind(this);  // handle field changes on controls page
        this.handleResponse     = this.handleResponse.bind(this);     // process response from backend
        this.setPending         = this.setPending.bind(this);         // are we waiting for response from backend?
        this.setMessage         = this.setMessage.bind(this);         // display error message on controls page
        this.mapGetComponents   = this.mapGetComponents.bind(this);   // get react components for values in a nested list
        this.tryGetComponents   = this.tryGetComponents.bind(this);   // get react components to visualize values / list of values
        this.getSentences       = this.getSentences.bind(this);       // get sentence values from text tokens
        this.clearSelection     = this.clearSelection.bind(this);     // clear the selection variable, available in console
        this.loadSelection      = this.loadSelection.bind(this);      // load selection variable into results variable
        this.increaseNumVisible = this.increaseNumVisible.bind(this); // increase the number of results listed (for lazy-loading)
        this.getCacheData       = this.getCacheData.bind(this);       // load cached data from backend, instead of re-running model
        this.showLabels         = this.showLabels.bind(this);         // get first token for each label

        // results:            values returned by a succesfull query
        // renderedComponents: react components representing the result values
        // numVisible:         how many components are listed (for lazy-loading)
        // selection:          values that have been selected, appear in sidebar
        // selectedComponents: react components representing the selected values
        // query:              query js expression, can access neurons, tokens, sentences, and words
        // errorMessage:       contains string rep of errors in query eval
        // data:               set in this.processData, contains {activations, neurons, tokens, sentences, words}
        // text:               sentences values holding input text
        // pred:               sentence values holding predicted text
        // showControls:       are ew viewing controls view or visualization view

        // controlState:       
        //     pending:        are we waiting on a response from the backend
        //     message:        error string from backend
        
        // controlValues:      
        //     modelPath:      for backend, path to model in ../models directory
        //     modifications:  list of manually set neuron activations  
        //     tokensPath:     for backend, path to tokens file in ../modelInput directory
        //     labelsPath:     for backend, path to labels file in ../modelInput directory

        this.state = {
            results: [], 
            renderedComponents: [], 
            numVisible: 50, 
            selection: [],
            selectedComponents: [],
            query: "words[0].colorSort(selection)", 
            errorMessage: "No model loaded:\nload model to view visualization",
            data: {},
            text: [], 
            pred: [],
            showControls: new URL(document.location).searchParams.get("view") != "visualization",
            controlState: {pending: false, message: ""},
            controlValues: {
                modelPath: "en-es-1.pt",
                modifications: "",
                tokensPath: "train.tok",
                labelsPath: "train.pos",
            },
        };

        // define "global" variables
        // which are accessed by functions in visComponents.js and dataFunctions.js
        setToggleSelect(this.toggleSelect);
        setHandleQueryChange(this.handleQueryChange);
        setAddMods(function(mods) {
            this.setState({controlValues: {...this.state.controlValues, modifications: mods.join("")}});
        }.bind(this));
    }

    // --------------------------------------------------------------------------------

    componentDidMount() {
        // for quick debugging use URL param .../?debug=cache
        // loads most recent model / classifier data from backend
        if (new URL(document.location).searchParams.get("debug") == "cache") {
            this.setState({showControls: true});
            this.getCacheData();
        }
    }

    // --------------------------------------------------------------------------------

    getCacheData() {
        // clear error message from last request, if there was one
        // https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript

        this.setMessage("");   // clear pervious error messages
        this.setPending(true); // waiting on request (for UI)

        var request = new XMLHttpRequest();
        var formData = new FormData();

        // Define what happens on successful data submission
        request.addEventListener('load', function(event) {
            this.setMessage("");
            if (request.status == 500) {
                this.setPending(false);
                this.setMessage(request.response);
            }
            else {
                this.setPending(false);
                this.handleResponse(request.response);
            }
        }.bind(this));

        // Define what happens in case of error
        request.addEventListener("error", function(event) {
            this.setPending(false);
            this.setMessage("server unreachable");
        }.bind(this));

        request.open("POST", "/cache");

        // Send our FormData object; HTTP headers are set automatically
        request.send(formData);
    }

    // --------------------------------------------------------------------------------

    // show / hide the controls page
    toggleControls() {
        // don't allow return to visualizations view if we're waiting for server response
        if (this.state.controlState.pending) {
            return;
        }

        let showControls = !this.state.showControls;
        this.setState({showControls: showControls});

        let url = new URL(document.location);
        if (showControls) {
            url.searchParams.delete("view");
            url.searchParams.delete("debug");
        }
        else {
            url.searchParams.set("view", "visualization");
        }
        // update the url without reloading the page
        window.history.replaceState({} , "", url.href);
    }

    // --------------------------------------------------------------------------------

    // handle field changes on controls page
    handleInputChange(inputName, value) {
        // [inputName] : value -- use string value of inputName as key
        this.setState({controlValues: {...this.state.controlValues, [inputName]: value}});
    }

    // --------------------------------------------------------------------------------

    // select / deselect data components
    // "select()" command sets addOnly=true, since we only want to select, not toggle
    toggleSelect(values, addOnly=false) {
        if (typeof values.clone === "function") {
            values = values.clone();
        }
        let selection = this.processToggle(this.state.selection, values, addOnly=addOnly);
        let components = Array.from(this.mapGetComponents(selection));

        this.setState({selection: selection});
        this.setState({selectedComponents: components});
    }

    processToggle(selection, values, addOnly) {
        values = Array.from(flatten(values));

        let outputDict = selection.reduce(function(result, value) {
            result[value.key] = value;
            return result;
        }, {});

        // check if any element in selections has same key
        // element keys must be unique
        // selection should always contain renderable objects, 
        // so mapGetComponents should never throw an error
        for (let value of values) {
            // copy to remove activation highlighting
            let valueCopy = value.copy();

            if (valueCopy.key in outputDict && !addOnly) {
                delete outputDict[valueCopy.key];
            }
            else {
                outputDict[valueCopy.key] = valueCopy;
            }
        }

        return Object.values(outputDict);
    }

    // --------------------------------------------------------------------------------

    // call when we get new data from backend
    // activationsData: activationsData[sentenceIndex][tokenIndex][layerIndex][neuronIndex] = value
    // textData:        textData[sentenceIndex][wordIndex] = wordString
    // predData:        predData[sentenceIndex][wordIndex] = wordString
    // labels:          labels[sentenceIndex][wordIndex] = labelString
    // topNeurons:      list of top neuron indecies (in flat neurons list)
    // topNeuronsByCategory: dict of top neuron lists by label, indexed by label string
    processData(activationsData, textData, predData, labels, topNeurons, topNeuronsByCategory){

        let text = this.getSentences(textData, labels);
        let pred = this.getSentences(predData, labels);

        // load input text and prediction text into interface
        this.setState({text, pred});

        let activations = [];
        for (let sen = 0; sen < activationsData.length; sen++){
            for (let word = 0; word < activationsData[sen].length; word++){
                for (let layer = 0; layer < activationsData[sen][word].length; layer++){
                    for (let ind = 0; ind < activationsData[sen][word][layer].length; ind++){
                        let actVal     = activationsData[sen][word][layer][ind];
                        let position   = [sen, word, layer, ind];
                        let activation = new ActivationValue(actVal, position);
                        activations.push(activation);
                    }
                }
            }
        }

        setActivations(activationsData);

        // factored out getting these components from the above loop
        // leads to some duplicated work, but makes more modular

        // make a new copy, just in case?
        let sentences = this.getSentences(textData, labels);

        // get all activations for each neuron
        let neuronsDict = activations.reduce(function(result, activation) {
            let [sen, word, layer, ind] = activation.position;
            let positionString = layer + ":" + ind;
            if (positionString in result == false) {result[positionString] = []}
            result[positionString].push(activation);
            return result;
        }, {});

        // make neuron values for each set of activations
        let neurons = Object.keys(neuronsDict).map(positionString => new NeuronValue(neuronsDict[positionString], positionString));

        let topLabelledNeurons = {};
        for (let label in topNeuronsByCategory) {
            topLabelledNeurons[label] = topNeuronsByCategory[label].map(index => neurons[index]);
        }

        topNeurons = topNeurons.map(function(index) {
            return neurons[index];
        });

        let selection = topNeurons;

        let tokens = sentences.reduce(function(result, sentence) {
            let tokens = sentence.tokens;
            return result.concat(tokens);
        }, []);

        let labelledTokens = tokens.reduce(function(result, token) {
            if (token.label in result == false) {
                result[token.label] = [];
            }
            result[token.label].push(token);
            return result;
        }, {});

        let wordsDict = activations.reduce(function(result, activation) {
            let [sen, word, layer, ind] = activation.position;
            let string = textData[sen][word];
            if (string in result == false) {
                result[string] = {};
            }
            let neuronPosString = layer + ":" + ind;
            if (neuronPosString in result[string] == false) {
                result[string][neuronPosString] = [];
            }
            result[string][neuronPosString].push(activation.actVal);
            return result;
        }, {});

        Object.keys(wordsDict).map(function(string) {
            Object.keys(wordsDict[string]).map(function(neuronPosString) {
                wordsDict[string][neuronPosString] = average(wordsDict[string][neuronPosString]);
            });
        });

        let words = Object.keys(wordsDict).map(string => new WordValue(string, wordsDict[string]));
        let components = Array.from(this.mapGetComponents(selection))

        this.setState({data: {activations, neurons, tokens, sentences, words, topNeurons, labelledTokens, topLabelledNeurons}});
        this.setState({selection: selection});
        this.setState({selectedComponents: components});
    }

    // --------------------------------------------------------------------------------

    // get react components for values in a nested list
    * mapGetComponents(values) {
        yield* flatMap(value => this.tryGetComponents(value),  values) 
    }

    tryGetComponents(value) {
        // only render values, nested arrays / generators of values, and numbers for now
        if (value.getComponents) {
            return value.getComponents();
        }
        if (isNaN(value) == false) {
            return value;
        }      
        let errorMessage = typeof value;
        throw {name: "Cannot Render Type", message: errorMessage};
    }

    // --------------------------------------------------------------------------------

    // get sentence values from text
    getSentences(textData, labels) {
        let output = [];
        for (let sen = 0; sen < textData.length; sen++) {
            let tokens = [];
            let sentence = textData[sen];
            for (let tok = 0; tok < sentence.length; tok++) {
                let string   = sentence[tok];
                let label    = labels[sen][tok];
                let position = [sen, tok];
                let word     = new WordValue(string);
                let token    = new TokenValue(word, label, position);
                tokens.push(token);
            }
            let position = sen;
            let sentenceElem = new SentenceValue(tokens, position);
            output.push(sentenceElem);
        }
        return output;
    }

    // --------------------------------------------------------------------------------

    // load selection variable into results variable
    loadSelection() {
        let selection = this.state.selection;
        this.clearSelection();
        return selection;
    }

    // --------------------------------------------------------------------------------

    // clear the selection variable, available in console
    clearSelection() {
        this.setState({selection: []});
        this.setState({selectedComponents: []});
        return null;
    }

    // --------------------------------------------------------------------------------

    // increase the number of results listed (for lazy-loading)
    increaseNumVisible() {
        this.setState({numVisible: this.state.numVisible + 50}, function () {
            try {
                let renderedComponents = Array.from(takeGen(this.state.numVisible, this.mapGetComponents(this.state.results.clone())));
                this.setState({renderedComponents: renderedComponents});
            }
            catch (err) {
                let errorMessage = err.name + ":\n" + err.message;
                this.setState({errorMessage: errorMessage});
                console.log(err);
            }
        });
    }

    // --------------------------------------------------------------------------------

    // update results for new valid query
    handleQueryChange(query) {
        this.setState({query});
        this.setState({numVisible: 50});

        if (query) {
            console.log(query)
            // put values in local namespace for eval to use
            // slice array values to copy, so that user can't mutate by accident
            let neurons            = this.state.data.neurons.slice();
            let topNeurons         = this.state.data.topNeurons.slice();
            let tokens             = this.state.data.tokens.slice();
            let sentences          = this.state.data.sentences.slice();
            let words              = this.state.data.words.slice();
            let labelledTokens     = this.state.data.labelledTokens;
            let topLabelledNeurons = this.state.data.topLabelledNeurons;
            let selection          = this.state.selection.slice();
            let clearSelection     = this.clearSelection;
            let loadSelection      = this.loadSelection;
            let showLabels         = this.showLabels;

            let results = this.state.results;
            if (typeof results.clone === "function") {
                results = results.clone();
            }
            results = clonableIterator(deduplicate(results));

            try {
                let queryResults = eval(query);

                if (queryResults === null) {
                    this.setState({errorMessage: ""});
                    return;
                }

                let rawResults = flatMap(x => x, queryResults);
                let results = clonableIterator(deduplicate(rawResults));

                // me: hey, javascript, if I call Array.from on a non-iterable value, you'll throw an error, right?
                // js: nah, I'll just return an empty array. Wouldn't want to deprive you of all that fun debugging ;)

                // map ahead of time to catch errors in mapping
                let renderedComponents = Array.from(takeGen(this.state.numVisible, this.mapGetComponents(results.clone())));

                // important! have to call Array.from(...) in the above line first, since mapGetComponents
                // is a lazy generator: otherwise, errors from mapGetComponents will not be caught until
                // after results are set to the erronrous value.
                this.setState({results: results.clone()});
                this.setState({renderedComponents: renderedComponents});
                this.setState({errorMessage: ""});
            }
            catch (err) {
                let errorMessage = err.name + ":\n" + err.message;
                this.setState({errorMessage: errorMessage});
                console.log(err);
            }
        }
        else {
            // clear error message on empty query
            this.setState({errorMessage: ""});
        }
    }

    // --------------------------------------------------------------------------------

    showLabels() {
        return Object.values(this.state.data.labelledTokens).map(tokens => tokens[0]);
    }

    // --------------------------------------------------------------------------------

    // process response from backend
    handleResponse(dataString) {
        let [activationsData, textData, predData, labels, topNeurons, topNeuronsByCategory] = JSON.parse(dataString);
        this.processData(activationsData, textData, predData, labels, topNeurons, topNeuronsByCategory);
        // trigger query update when data loads to render default query
        this.handleQueryChange(this.state.query);
        // switch from controls page to visualizations page
        this.toggleControls();
    }

    // --------------------------------------------------------------------------------

    // are we waiting for response from backend
    setPending(pending) {
        this.setState({controlState: {pending, message: this.state.controlState.message}});
    }

    // --------------------------------------------------------------------------------

    // display error message on controls page
    setMessage(message) {
        this.setState({controlState: {message, pending: this.state.controlState.pending}});
    }

    // --------------------------------------------------------------------------------

    render() {
        return (
            <div id="container">
                {this.state.showControls ? 
                (<Controls 
                    toggleControls = {this.toggleControls}
                    onChange       = {this.handleInputChange}
                    handleResponse = {this.handleResponse}
                    controlState   = {this.state.controlState}
                    setPending     = {this.setPending}
                    setMessage     = {this.setMessage}
                    {...this.state.controlValues} />
                ) :
                (<div id="visInterface">
                    <Header 
                        text = {this.state.text}
                        pred = {this.state.pred} />
                    <Results 
                        renderedComponents = {this.state.renderedComponents}
                        errorMessage       = {this.state.errorMessage}
                        increaseNumVisible = {this.increaseNumVisible} />
                    <SideBar
                        selectedComponents = {this.state.selectedComponents}
                        toggleControls     = {this.toggleControls} 
                        onClick            = {this.handleQueryChange} />
                    <Footer
                        onChange     = {this.handleQueryChange}
                        errorMessage = {this.state.errorMessage}
                        value        = {this.state.query} />
                </div>)}
            </div>
        );  
    }
}

// --------------------------------------------------------------------------------

class Results extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let [errName, errText] = this.props.errorMessage.split("\n");
        return (
            <div id="resultsContainer" className={this.props.errorMessage ? "error" : ""}>
                <ResultsList
                    renderedComponents = {this.props.renderedComponents}
                    shouldUpdate       = {this.props.errorMessage == ""} 
                    increaseNumVisible = {this.props.increaseNumVisible} />
                <div id="errorMessage">
                    <div>{errName}</div>
                    <div>{errText}</div>
                </div>
            </div>
        );        
    }
}

class ResultsList extends React.Component {
    constructor(props) {
        super(props);
        this.handleScroll = this.handleScroll.bind(this);
        this.state = {increasedNum: false};
    }

    // don't re-render results list for invalid query
    shouldComponentUpdate(nextProps, nextState) {
        let update = nextProps.shouldUpdate || this.state.increasedNum;
        this.setState({increasedNum: false})
        return update;
    }

    handleScroll(e) {
        let bottomOffset = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
        if (bottomOffset < 0.5 * e.target.clientHeight){
            this.setState({increasedNum: true});
            this.props.increaseNumVisible();
        }
    }

    render() {
        return (
            <div id="results" onScroll={this.handleScroll}>
                {this.props.renderedComponents}
            </div>
        );        
    }
}

// --------------------------------------------------------------------------------

class Controls extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    handleChange(e) {
        this.props.onChange(e.target.name, e.target.value);
    }

    // adapted from:
    // https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript
    onSubmit(e) {
        // ignore new request if old one is still processing
        if (this.props.controlState.pending) {
            return;
        }

        // clear error message from last request, if there was one
        this.props.setMessage("");   // clear pervious error messages
        this.props.setPending(true); // waiting on request (for UI)

        var request = new XMLHttpRequest();
        var formData = new FormData();

        // Push our data into our FormData object
        formData.append("modelPath", this.props.modelPath);
        formData.append("tokensPath", this.props.tokensPath);
        formData.append("labelsPath", this.props.labelsPath);

        // The format for modifications is as follows,
        // with one modification per line:
        // [sentence, token, layer, neuron, value]
        try {
            formData.append("modifications", JSON.stringify(
                this.props.modifications.split("\n")
                .filter(x => x)
                .map(JSON.parse)
            ));
        }
        catch (err) {
            this.props.setPending(false);
            let errorMessage = "Invalid Modification:\n" + err.name + ":\n" + err.message;
            this.props.setMessage(errorMessage);
            return;
        }

        // Define what happens on successful data submission
        request.addEventListener('load', function(event) {
            this.props.setMessage("");
            if (request.status == 500) {
                this.props.setPending(false);
                this.props.setMessage(request.response);
            }
            else {
                this.props.setPending(false);
                this.props.handleResponse(request.response);
            }
        }.bind(this));

        // Define what happens in case of error
        request.addEventListener("error", function(event) {
            this.props.setPending(false);
            this.props.setMessage("server unreachable");
        }.bind(this));

        // Set up our request
        request.open("POST", "/model");

        // Send our FormData object; HTTP headers are set automatically
        request.send(formData);
    }

    render() {
        let {pending, message} = this.props.controlState;
        return (
            <div id="controls" className={pending ? "pending" : ""}>
                <div className="controlOption">
                    <div>model:</div>
                    <input
                        id       = "model"
                        name     = "modelPath"
                        value    = {this.props.modelPath}
                        onChange = {this.handleChange}
                        disabled = {pending} />
                </div>
                <div className="controlOption">
                    <div>training tokens:</div>
                    <input
                        id       = "tokensPath"
                        name     = "tokensPath"
                        value    = {this.props.tokensPath}
                        onChange = {this.handleChange}
                        disabled = {pending} />
                </div>
                <div className="controlOption">
                    <div>training labels:</div>
                    <input
                        id       = "labelsPath"
                        name     = "labelsPath"
                        value    = {this.props.labelsPath}
                        onChange = {this.handleChange}
                        disabled = {pending} />
                </div>
                <div className="controlOption">
                    <div>modifications:</div>
                    <textarea
                        id       = "modifications"
                        name     = "modifications"
                        value    = {this.props.modifications}
                        onChange = {this.handleChange}
                        disabled = {pending}>
                    </textarea>
                </div>

                <div
                    id        = "runInput"
                    className = "controlButton"
                    onClick   = {this.onSubmit}>
                    run updated model
                </div>
                <div
                    id        = "returnVis"
                    className = "controlButton"
                    onClick   = {this.props.toggleControls}>
                    return to visualization
                </div>

                {message ? <pre id="controlMessage"><div>Server Error:</div>{message}</pre> : ""}
            </div>
        );        
    }
}

// --------------------------------------------------------------------------------

class SideBar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="sidebar">
                <div id="changeInput" onClick={this.props.toggleControls}>change model input</div>
                <div id="inlineControls">
                    <div className="builtIn" onClick={() => this.props.onClick("select(results)")}>
                        select(<samp>results</samp>)</div>

                    <div className="builtIn" onClick={() => this.props.onClick("neurons")}>
                        neurons</div>
                    <div className="builtIn" onClick={() => this.props.onClick("tokens")}>
                        tokens</div>
                    <div className="builtIn" onClick={() => this.props.onClick("sentences")}>
                        sentences</div>
                    <div className="builtIn" onClick={() => this.props.onClick("words")}>
                        words</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results")}>
                        results</div>
                    <div className="builtIn" onClick={() => this.props.onClick("topNeurons")}>
                        topNeurons</div>
                    <div className="builtIn" onClick={() => this.props.onClick("topLabelledNeurons[\"label\"]")}>
                        topLabelledNeurons[<i>"label"</i>]</div>
                    <div className="builtIn" onClick={() => this.props.onClick("labelledTokens[\"label\"]")}>
                        labelledTokens[<i>"label"</i>]</div>
                    <div className="builtIn" onClick={() => this.props.onClick("showLabels()")}>
                        showLabels()</div>

                    <div className="builtIn" onClick={() => this.props.onClick("loadSelection()")}>
                        loadSelection()</div>
                    <div className="builtIn" onClick={() => this.props.onClick("clearSelection()")}>
                        clearSelection()</div>

                    <div className="builtIn" onClick={() => this.props.onClick("results.modify(selection, value)")}>
                        <samp>results</samp>.modify(<i>selection</i>, <i>value</i>)</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results.colorBy(selection)")}>
                        <samp>results</samp>.colorBy(<i>selection</i>)</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results.colorSort(selection)")}>
                        <samp>results</samp>.colorSort(<i>selection</i>)</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results.getColorers()")}>
                        <samp>results</samp>.getColorers()</div>

                    { 
                        // <div className="builtIn" onClick={() => this.props.onClick("results.colorAverage(selection)")}>
                            // <samp>results</samp>.colorAverage(<i>selection</i>)</div>
                    }

                    <div className="builtIn" onClick={() => this.props.onClick("results.take(n")}>
                        <samp>results</samp>.take(<i>n</i>)</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results.reversed()")}>
                        <samp>results</samp>.reversed()</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results.map(func)")}>
                        <samp>results</samp>.map(<i>func</i>)</div>
                    <div className="builtIn" onClick={() => this.props.onClick("results.filter(func)")}>
                        <samp>results</samp>.filter(<i>func</i>)</div>
                </div>
                <div id="values">
                    {this.props.selectedComponents}
                </div>
            </div>
        );        
    }
}

// --------------------------------------------------------------------------------

class Header extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="header">
                <div id="source">{this.props.text.map(sentence => sentence.getComponents())}</div>
                <div id="prediction">{this.props.pred.map(sentence => sentence.getComponents())}</div>
            </div>
        );        
    }
}

// --------------------------------------------------------------------------------

class Footer extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.props.onChange(e.target.value);
    }

    render() {
        return (
            <div id="footer">
                <textarea autoFocus
                    id          = "query" 
                    value       = {this.props.value}
                    onChange    = {this.handleChange}  
                    className   = {this.props.errorMessage ? "error" : ""}
                    spellCheck  = "false"
                    placeholder = ">> enter query" >
                </textarea>
            </div>
        );
    }
}

// --------------------------------------------------------------------------------

ReactDOM.render(
    <Container />,
    document.getElementById('root')
);
