
function getSentences(textData, toggleSelect) {
    let output = [];
    for (let sen = 0; sen < textData.length; sen++) {
        let tokens = [];
        let sentence = textData[sen];
        for (let tok = 0; tok < sentence.length; tok++) {
            let string = sentence[tok];
            let position = [sen, tok];
            let word = new WordValue(string, toggleSelect);
            let token = new TokenValue(word, position, toggleSelect);
            tokens.push(token);
        }
        let position = sen;
        let sentenceElem = new SentenceValue(tokens, position, toggleSelect);
        output.push(sentenceElem);
    }
    return output;
}

function isEmpty(object) {
    return Object.keys(object).length === 0 && object.constructor === Object
}

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.processData = this.processData.bind(this);
        this.toggleSelect = this.toggleSelect.bind(this);
        this.toggleControls = this.toggleControls.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleResponse = this.handleResponse.bind(this);
        this.handleServerError = this.handleServerError.bind(this);
        this.state = {
            results: [], 
            selection: [],
            query: "", 
            errorMessage: "",
            data: {},
            text: [], 
            pred: [],
            showControls: new URL(document.location).searchParams.get("view") == "controls",
            serverError: "",
            controlValues: {modelPath: "models/en-es-1.pt", 
                            inputText: "A paragraph is a group of words put together to form a group that is usually longer than a sentence .\n"
                                     + "Paragraphs are often made up of many sentences . They are usually between four to eight sentences .\n"
                                     + "Paragraphs can begin with an indentation ( about five spaces ) , or by missing a line out , and then starting again "
                                     + "; this makes telling when one paragraph ends and another begins easier . ", classifierPath: "", trainDataValue: ""},
        };
    }

    toggleControls() {
        let showControls = !this.state.showControls;
        this.setState({showControls: showControls});
        let url = new URL(document.location);
        if (showControls) {
            url.searchParams.set("view", "controls");
        }
        else {
            url.searchParams.delete("view");
        }
        window.history.replaceState( {} , "", url.href);
    }

    handleInputChange(inputName, value) {
        this.setState({controlValues: {...this.state.controlValues, [inputName]: value}});
    }

    toggleSelect(original) {
        let value = original.copy();
        if (this.state.selection.map(value => value.key).indexOf(value.key) > -1) {
            this.setState({selection: this.state.selection.filter(other => other.key != value.key)});
        }
        else {
            this.setState({selection: this.state.selection.concat([value])});
        }
    }

    processData(activationsData, textData, predData){

        let toggleSelect = this.toggleSelect;

        let text = getSentences(textData, toggleSelect);
        let pred = getSentences(predData, toggleSelect);

        this.setState({text, pred});
        
        let activations = [];
        for (let sen = 0; sen < activationsData.length; sen++){
            for (let word = 0; word < activationsData[sen].length; word++){
                for (let layer = 0; layer < activationsData[sen][word].length; layer++){
                    for (let ind = 0; ind < activationsData[sen][word][layer].length; ind++){
                        let actVal = activationsData[sen][word][layer][ind];
                        let position = [sen, word, layer, ind];
                        let before = textData[sen].slice(Math.max(word - 2, 0), word).map(string => new WordValue(string, toggleSelect));
                        let after = textData[sen].slice(word + 1, word + 3).map(string => new WordValue(string, toggleSelect));
                        let string = new WordValue(textData[sen][word], toggleSelect, true);
                        let activation = new ActivationValue(actVal, {before, after, string}, position, toggleSelect);
                        activations.push(activation);
                    }
                }
            }
        }

        window.activationsData = activationsData;

        let sentences = getSentences(textData, toggleSelect);

        let neuronsDict = activations.reduce(function(result, activation) {
            let [sen, word, layer, ind] = activation.position;
            let positionString = layer + ":" + ind;
            if (positionString in result == false) {result[positionString] = []}
            result[positionString].push(activation);
            return result;
        }, {});
        let neurons = Object.keys(neuronsDict).map(positionString => new NeuronValue(neuronsDict[positionString], positionString, toggleSelect));

        let layers = [];

        let tokens = sentences.reduce(function(result, sentence) {
            let tokens = sentence.tokens;
            return result.concat(tokens);
        }, []);

        let wordsDict = tokens.reduce(function(result, token) {
            if (token.word.string in result == false) {
                result[token.word.string] = [];
            }
            return result;
        }, {});
        let words = Object.keys(wordsDict).map(string => new WordValue(string, toggleSelect));
        
        this.setState({data: {activations, neurons, tokens, sentences, words}});
    }

    handleQueryChange(query) {
        this.setState({query});

        if (query) {
            let {neurons, tokens, sentences, words} = this.state.data;
            let selection = this.state.selection;

            try {
                let results = eval(query);
                if (results == undefined || results instanceof Function) {
                    let errorMessage = "Invalid Type:\n" + typeof results;
                    this.setState({errorMessage: errorMessage});
                    return;
                }
                this.setState({results: results});
                this.setState({errorMessage: ""});
            }
            catch (err) {
                let errorMessage = err.name + ":\n" + err.message;
                this.setState({errorMessage: errorMessage});
            }
            return;
        }
        this.setState({errorMessage: ""});
    }

    render() {
        return (
            <div id="container">
                {this.state.showControls ? 
                (<Controls toggleControls={this.toggleControls} onChange={this.handleInputChange} handleResponse={this.handleResponse} serverError={this.state.serverError} handleError={this.handleServerError} {...this.state.controlValues} />) :
                (<div id="visInterface">
                    <Header text={this.state.text} pred={this.state.pred} />
                    <Results results={this.state.results} errorMessage={this.state.errorMessage} />
                    <SideBar selection={this.state.selection} toggleControls={this.toggleControls} />
                    <Footer onChange={this.handleQueryChange} errorMessage={this.state.errorMessage} value={this.state.query} />
                </div>)}
            </div>
        );  
    }

    handleResponse(dataString) {
        let [activationsData, textData, predData] = JSON.parse(dataString);
        this.processData(activationsData, textData, predData);
        this.handleQueryChange(this.state.query);
        this.toggleControls();
    }

    handleServerError(err) {
        this.setState({serverError: err});
    }
}

// --------------------------------------------------------------------------------

const tryGetComponents = value => value.getComponents ? value.getComponents() : value;
const mapGetComponents = values => values instanceof Array ? values.map(mapGetComponents) : tryGetComponents(values)

class Results extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let [errName, errMessage] = this.props.errorMessage.split("\n");
        return (
            <div id="resultsContainer" className={this.props.errorMessage ? "error" : ""}>
                <ResultsList results={this.props.results} shouldUpdate={this.props.errorMessage == ""} />
                <div id="errorMessage">
                    <div>{errName}</div>
                    <div>{errMessage}</div>
                </div>
            </div>
        );        
    }
}

class ResultsList extends React.Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.shouldUpdate;
    }

    render() {
        return (
            <div id="results">
                {mapGetComponents(this.props.results)}
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

    onSubmit(e) {
        this.props.handleError("");

        var request = new XMLHttpRequest();
        var formData  = new FormData();

        // Push our data into our FormData object
        formData.append("modelPath", this.props.modelPath);
        formData.append("inputText", this.props.inputText);

        // Define what happens on successful data submission
        request.addEventListener('load', function(event) {
            if (request.status == 500) {
                this.props.handleError(request.response);
            }
            else {
                this.props.handleResponse(request.response);
            }
        }.bind(this));

        // Define what happens in case of error
        request.addEventListener("error", function(event) {
            alert("Oops! Something went wrong.");
        });

        // Set up our request
        request.open("POST", "http://localhost:5000/model");

        // Send our FormData object; HTTP headers are set automatically
        request.send(formData);


        return false;
    }

    render() {
        return (
            <div id="controls" className="disabled">
                <div className="controlOption">
                    <div>model:</div>
                    <input id="model" name="modelPath" value={this.props.modelPath} onChange={this.handleChange} disabled/>
                </div>
                <div className="controlOption">
                    <div>input text:</div>
                    <textarea id="inputText" name="inputText" value={this.props.inputText} onChange={this.handleChange} disabled></textarea>
                </div>
                <div className="controlOption">
                    <div>classifier:</div>
                    <input id="classifier" name="classifierPath" value={this.props.classifierPath} onChange={this.handleChange} disabled/>
                </div>
                <div className="controlOption">
                    <div>classifier training data:</div>
                    <input id="trainData" name="trainDataValue" value={this.props.trainDataValue} onChange={this.handleChange} disabled/>
                </div>
                <div id="runInput" className="controlButton" onClick={this.onSubmit}>run updated model</div>
                <div id="returnVis" className="controlButton" onClick={this.props.toggleControls}>return to visualization</div>
                {this.props.serverError ? <div id="controlError"><div>Server Error:</div>{this.props.serverError}</div> : ""}
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
                    {mapGetComponents(this.props.selection)}
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
                          id="query" 
                       value={this.props.value}
                    onChange={this.handleChange}  
                   className={this.props.errorMessage ? "error" : ""}
                  spellCheck="false"
                 placeholder=">> enter query" >
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