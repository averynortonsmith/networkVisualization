
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
        this.state = {
            results: [], 
            selection: [],
            query: "", 
            errorMessage: "",
            data: {},
            text: [], 
            pred: [],
        };
    }

    toggleSelect(value) {
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
                <Header text={this.state.text} pred={this.state.pred} />
                <Results results={this.state.results} errorMessage={this.state.errorMessage}/>
                <SideBar selection={this.state.selection} />
                <Footer onChange={this.handleQueryChange} errorMessage={this.state.errorMessage} value={this.state.query} />
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

class SideBar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="sidebar">
                <div id="valueSelection"></div>
                <div id="values">
                    {mapGetComponents(this.props.selection)}
                    </div>
                <div id="controls"></div>
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