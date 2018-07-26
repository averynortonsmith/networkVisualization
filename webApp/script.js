
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
        this.state = {
            results: [], 
            selection: [],
            query: "", 
            errorMessage: "",
            data: {},
            text: [], 
            pred: [],
            showControls: new URL(document.location).searchParams.get("view") == "controls",
            controlValues: {modelValue: "", classifierValue: "", trainDataValue: ""},
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
        console.log(this.state.controlValues);
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
                (<Controls toggleControls={this.toggleControls} onChange={this.handleInputChange} {...this.state.controlValues} />) :
                (<div id="visInterface">
                    <Header text={this.state.text} pred={this.state.pred} />
                    <Results results={this.state.results} errorMessage={this.state.errorMessage} />
                    <SideBar selection={this.state.selection} toggleControls={this.toggleControls} />
                    <Footer onChange={this.handleQueryChange} errorMessage={this.state.errorMessage} value={this.state.query} />
                </div>)}
            </div>
        );  
    }

    componentDidMount() {
        let fetches = [];
        fetches.push(fetch("../activations.json").then(response => response.json()));
        fetches.push(fetch("../text.json").then(response => response.json()));
        fetches.push(fetch("../pred.json").then(response => response.json()));
        Promise.all(fetches).then(function([activationsData, textData, predData]) {
            this.processData(activationsData, textData, predData);
            this.handleQueryChange(this.state.query);
        }.bind(this)
        ).catch(function(e) {
            console.log(e);
        });
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
        var XHR = new XMLHttpRequest();
          var FD  = new FormData();

          // Push our data into our FormData object
            FD.append("asdf", "qwerty");

          // Define what happens on successful data submission
          XHR.addEventListener('load', function(event) {
            alert('Yeah! Data sent and response loaded.');
          });

          // Define what happens in case of error
          XHR.addEventListener('error', function(event) {
            alert('Oops! Something went wrong.');
          });

          // Set up our request
          XHR.open('POST', 'http://localhost:5000/');

          // Send our FormData object; HTTP headers are set automatically
          XHR.send(FD);

        return false;
    }

    render() {
        return (
            <div id="controls">
                <form onSubmit={this.onSubmit} method="Post">
                    <div className="controlOption">
                        <div>model:</div>
                        <input id="model" name="modelValue" value={this.props.modelValue} onChange={this.handleChange} />
                    </div>
                    <div className="controlOption">
                        <div>classifier:</div>
                        <input id="classifier" name="classifierValue" value={this.props.classifierValue} onChange={this.handleChange} />
                    </div>
                    <div className="controlOption">
                        <div>classifier training data:</div>
                        <input id="trainData" name="trainDataValue" value={this.props.trainDataValue} onChange={this.handleChange} />
                    </div>
                    <div id="runInput" className="controlButton">run updated model</div>
                    <div id="cancelUpdate" className="controlButton" onClick={this.props.toggleControls}>cancel update</div>

                    <button type="submit">Submit</button>
                </form>
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