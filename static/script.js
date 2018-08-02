
function stateClosure() {
    let state;

    function setState(value) {
        state = value;
    }

    const getState = () => state;

    return [getState, setState];
}

let [getToggleSelect, setToggleSelect] = stateClosure();
let [getActivations, setActivations] = stateClosure();
let [getOnHover, setOnHover] = stateClosure();
let [getOffHover, setOffHover] = stateClosure();

// --------------------------------------------------------------------------------

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.handleQueryChange = this.handleQueryChange.bind(this); // update results for new valid query
        this.processData       = this.processData.bind(this);       // call when we get new data from backend
        this.toggleSelect      = this.toggleSelect.bind(this);      // select / deselect data components
        this.toggleControls    = this.toggleControls.bind(this);    // show / hide the controls page
        this.handleInputChange = this.handleInputChange.bind(this); // handle field changes on controls page
        this.handleResponse    = this.handleResponse.bind(this);    // process response from backend
        this.setPending        = this.setPending.bind(this);        // are we waiting for response from backend
        this.setMessage        = this.setMessage.bind(this);        // display error message on controls page
        this.mapGetComponents  = this.mapGetComponents.bind(this);  // get react components for values in a nested list
        this.tryGetComponents  = this.tryGetComponents.bind(this);  // get react components to visualize values / list of values
        this.getSentences      = this.getSentences.bind(this);      // get sentence values from text tokens
        this.onHover           = this.onHover.bind(this); 
        this.offHover          = this.offHover.bind(this); 

        // results:            values returned by a succesfull query
        // renderedComponents: react components representing the result values
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
        //     inputText:      for backend, text to be translated / processed

        this.state = {
            colorer: undefined, 
            results: [], 
            renderedComponents: [], 
            selection: [],
            selectedComponents: [],
            query: "sentences.colorBy(selection)", 
            errorMessage: "",
            data: {},
            text: [], 
            pred: [],
            showControls: new URL(document.location).searchParams.get("view") != "visualization",
            controlState: {pending: false, message: ""},
            controlValues:      
                {modelPath: "en-es-1.pt", 
                 inputText: "A paragraph is a group of words put together to form a group that is usually longer than a sentence .\n\n"
                          + "Paragraphs are often made up of many sentences . They are usually between four to eight sentences .\n\n"
                          + "Paragraphs can begin with an indentation ( about five spaces ) , or by missing a line out , and then starting again "
                          + "; this makes telling when one paragraph ends and another begins easier .\n\n"
                          + "A sentence is a group of words that are put together to mean something .\n\n"
                          + "A sentence is the basic unit of language which expresses a complete thought .\n\n"
                          + "It does this by following the grammatical rules of syntax .",
                neuronsList: "(0, 0), (0, 5)",
                classifierPath: "",
                trainDataValue: ""},
        };
        setToggleSelect(this.toggleSelect);
        setOnHover(this.onHover);
        setOffHover(this.offHover);
    }

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
        }
        else {
            url.searchParams.set("view", "visualization");
        }
        // update the url without reloading the page
        window.history.replaceState({} , "", url.href);
    }

    // handle field changes on controls page
    handleInputChange(inputName, value) {
        // [inputName] : value -- use string value of inputName as key
        this.setState({controlValues: {...this.state.controlValues, [inputName]: value}});
    }

    // select / deselect data components
    toggleSelect(original) {
        // copy to remove activation highlighting
        let value = original.copy();

        // check if any element in selections has same key
        // element keys must be unique
        // selection should always contain renderable objects, 
        // so mapGetComponents should never throw an error
        if (this.state.selection.map(value => value.key).indexOf(value.key) > -1) {
            let selection = this.state.selection.filter(other => other.key != value.key);
            this.setState({selection: selection});
            this.setState({selectedComponents: this.mapGetComponents(selection)});
        }
        else {
            let selection = this.state.selection.concat([value])
            this.setState({selection: selection});
            this.setState({selectedComponents: this.mapGetComponents(selection)});
        }
        this.handleQueryChange(this.state.query);
    }

    onHover(colorer) {
        this.setState({colorer}, () => this.handleQueryChange(this.state.query));
    }

    offHover() {
        this.setState({colorer: undefined}, () => this.handleQueryChange(this.state.query));
    }

    // call when we get new data from backend
    processData(activationsData, textData, predData){

        let text = this.getSentences(textData);
        let pred = this.getSentences(predData);

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
        let sentences = this.getSentences(textData);

        // get all activations for each neuron
        let neuronsDict = activations.reduce(function(result, activation) {
            let [sen, word, layer, ind] = activation.position;
            let positionString = layer + ":" + ind;
            if (positionString in result == false) {result[positionString] = []}
            result[positionString].push(activation);
            return result;
        }, {});

        let neuronsList = this.state.controlValues.neuronsList
        let neuronsPairs = neuronsList.slice(1, neuronsList.length - 1)
                                      .replace(/ /g,'')
                                      .split("),(")
                                      .map(pair => pair.replace(/[()]/g,'').split(",").map(Number));

        let selection = neuronsPairs.map(function(pair) {
            let [layer, ind] = pair;
            let positionString = layer + ":" + ind;
            let neuronActivations = neuronsDict[positionString];
            return new NeuronValue(neuronActivations, positionString)
        });

        // make neuron values for each set of activations
        let neurons = Object.keys(neuronsDict).map(positionString => new NeuronValue(neuronsDict[positionString], positionString));

        let tokens = sentences.reduce(function(result, sentence) {
            let tokens = sentence.tokens;
            return result.concat(tokens);
        }, []);

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
        
        this.setState({data: {activations, neurons, tokens, sentences, words}});
        this.setState({selection: selection});
        this.setState({selectedComponents: this.mapGetComponents(selection)});
    }


    // get react components for values in a nested list
    mapGetComponents(values) {
        return values instanceof Array ? values.map(this.mapGetComponents) : this.tryGetComponents(values);
    }

    tryGetComponents(value) {
        if (value.getComponents) {
            return value.getComponents();
        }
        // only render values and nested arrays of values (might allow maps in the future as well)
        if (value instanceof Array == false) {
            let errorMessage = typeof value;
            throw {name: "Cannot Render Type", message: errorMessage};
        }
        return value;
    }

    // get sentence values from text
    getSentences(textData) {
        let output = [];
        for (let sen = 0; sen < textData.length; sen++) {
            let tokens = [];
            let sentence = textData[sen];
            for (let tok = 0; tok < sentence.length; tok++) {
                let string   = sentence[tok];
                let position = [sen, tok];
                let word     = new WordValue(string);
                let token    = new TokenValue(word, position);
                tokens.push(token);
            }
            let position = sen;
            let sentenceElem = new SentenceValue(tokens, position);
            output.push(sentenceElem);
        }
        return output;
    }


    // update results for new valid query
    handleQueryChange(query) {
        this.setState({query});

        if (query) {
            // put values in local namespace for eval to use
            let {neurons, tokens, sentences, words} = this.state.data;
            let selection = this.state.selection;

            try {
                console.log(this.state.colorer)
                let results = this.state.colorer ? eval(query).colorBy(this.state.colorer) : eval(query);
                
                // map ahead of time to catch errors in mapping
                let renderedComponents = this.mapGetComponents(results);
                this.setState({results: results});
                this.setState({renderedComponents: renderedComponents});
                this.setState({errorMessage: ""});
            }
            catch (err) {
                let errorMessage = err.name + ":\n" + err.message;
                this.setState({errorMessage: errorMessage});
            }
        }
        else {
            // clear error message on empty query
            this.setState({errorMessage: ""});
        }
    }

    // process response from backend
    handleResponse(dataString) {
        let [activationsData, textData, predData] = JSON.parse(dataString);
        this.processData(activationsData, textData, predData);
        // trigger query update when data loads to render default query
        this.handleQueryChange(this.state.query);
        // switch from controls page to visualizations page
        this.toggleControls();
    }

    // are we waiting for response from backend
    setPending(pending) {
        this.setState({controlState: {pending, message: this.state.controlState.message}});
    }

    // display error message on controls page
    setMessage(message) {
        this.setState({controlState: {message, pending: this.state.controlState.pending}});
    }

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
                        pred = {this.state.pred}
                        colorer = {this.state.colorer} />
                    <Results 
                        renderedComponents = {this.state.renderedComponents}
                        errorMessage       = {this.state.errorMessage} />
                    <SideBar
                        selectedComponents = {this.state.selectedComponents}
                        toggleControls     = {this.toggleControls} />
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
                <ResultsList renderedComponents={this.props.renderedComponents} shouldUpdate={this.props.errorMessage == ""} />
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
    }

    // don't re-render results list for invalid query
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.shouldUpdate;
    }

    render() {
        return (
            <div id="results">
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
        this.props.setMessage("");
        this.props.setPending(true);

        var request = new XMLHttpRequest();
        var formData = new FormData();

        // Push our data into our FormData object
        formData.append("modelPath", this.props.modelPath);
        formData.append("inputText", this.props.inputText);

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
        // hard-coded url to get rid of CORS error, should find better solution
        request.open("POST", "http://nanuk.csail.mit.edu:5000/model");

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
                        disabled = {pending}/>
                </div>
                <div className="controlOption">
                    <div>input text:</div>
                    <textarea
                        id       = "inputText"
                        name     = "inputText"
                        value    = {this.props.inputText}
                        onChange = {this.handleChange}
                        disabled = {pending}>
                    </textarea>
                </div>
                <div className="controlOption">
                    <div>neuron IDs:</div>
                    <input
                        id       = "neuronsList"
                        name     = "neuronsList"
                        value    = {this.props.neuronsList}
                        onChange = {this.handleChange}
                        disabled = {pending}/>
                </div>
                <div className="controlOption">
                    <div>classifier:</div>
                    <input
                        id       = "classifier"
                        name     = "classifierPath"
                        value    = {this.props.classifierPath}
                        onChange = {this.handleChange}
                        disabled = {true}/>
                </div>
                <div className="controlOption">
                    <div>classifier training data:</div>
                    <input
                        id       = "trainData"
                        name     = "trainDataValue"
                        value    = {this.props.trainDataValue}
                        onChange = {this.handleChange}
                        disabled = {true}/>
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
                {message ? <div id="controlMessage"><div>Server Error:</div>{message}</div> : ""}
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
                <div id="source">{this.props.colorer ? this.props.text.map(sentence => sentence.colorBy(this.props.colorer).getComponents()) : this.props.text.map(sentence => sentence.getComponents())}</div>
                <div id="prediction">{this.props.colorer ? this.props.pred.map(sentence => sentence.colorBy(this.props.colorer).getComponents()) : this.props.pred.map(sentence => sentence.getComponents())}</div>
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