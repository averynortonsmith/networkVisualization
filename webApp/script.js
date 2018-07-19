
class Container extends React.Component {
    constructor(props) {
        super(props);
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.toggleSelection = this.toggleSelection.bind(this);
        this.state = {
            results: [], 
            selection: [],
            selectedDict: {},
            query: "neurons.take(10)", 
            errorMessage: "",
            activations: [], 
            data: {},
            text: [], 
            pred: [],
        };
    }

    toggleSelection(selection) {
        let [componentClass, props] = selection;
        let keyString = JSON.stringify(componentClass.name) + " " + JSON.stringify(props);
        if (keyString in this.state.selectedDict == false) {
            let newEntry = {}
            newEntry[keyString] = true;
            this.setState({selectedDict: {...this.state.selectedDict, ...newEntry}});
            let newElem = <div>{React.createElement(componentClass, {keyString, ...props})}</div>;
            this.setState({selection: this.state.selection.concat([newElem])});
        }
        else {
            let newEntry = {}
            newEntry[keyString] = !this.state.selectedDict[keyString];
            this.setState({selectedDict: {...this.state.selectedDict, ...newEntry}});
        }
        console.log(keyString)
    }

    processData(activations, textData, predData){
        let text = [];

        for (let sen = 0; sen < textData.length; sen++) {
            let tokens = [];
            let sentence = textData[sen];
            for (let tok = 0; tok < sentence.length; tok++) {
                let stringToken = sentence[tok];
                let position = [sen, tok];
                let token = new TokenValue(stringToken, position);
                tokens.push(token);
            }
            let position = sen;
            let sentenceElem = new SentenceValue(tokens, position);
            text.push(sentenceElem);
        }

        let pred = [];

        for (let sen = 0; sen < predData.length; sen++) {
            let tokens = [];
            let sentence = predData[sen];
            for (let tok = 0; tok < sentence.length; tok++) {
                let stringToken = sentence[tok];
                let position = [sen, tok];
                let token = new TokenValue(stringToken, position);
                tokens.push(token);
            }
            let position = sen;
            let sentenceElem = new SentenceValue(tokens, position);
            pred.push(sentenceElem);
        }

        this.setState({activations, text, pred});

        let neuronsDict = {}
        let sentences = [];
        let neurons = [];
        let layers = [];
        let words = {};

        for (let sen = 0; sen < activations.length; sen++){
            let sentence = [];
            for (let word = 0; word < activations[sen].length; word++){
                let key = [sen, word];
                let tokenActivations = [];
                for (let layer = 0; layer < activations[sen][word].length; layer++){
                    for (let ind = 0; ind < activations[sen][word][layer].length; ind++){
                        let actVal = activations[sen][word][layer][ind];
                        let position = [sen, word, layer, ind];
                        let activation = new ActivationValue(actVal, position);
                        tokenActivations.push(activation);

                        if ([layer, ind] in neuronsDict == false) {
                            neuronsDict[[layer, ind]] = []
                        }

                        neuronsDict[[layer, ind]].push(activation)
                    }
                }
                let token = <Token 
                           word={text[sen][word]} 
                    activations={tokenActivations}
                            key={key}
                />;
                sentence.push(token);
            }
            sentences.push(sentence);
        }

        for (let position in neuronsDict) {
            let activations = neuronsDict[position];
            let neuron = new NeuronValue(position, activations);
            neurons.push(neuron);
        }
        
        this.setState({data: {neurons, neuronsDict, layers, sentences, words}});
    }

    handleQueryChange(query) {
        this.setState({query});

        if (query) {
            let {neurons, neuronsDict, layers, sentences, words} = this.state.data;

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
        if (this.state.activations.length) {
            let selection = [];
            for (let item of this.state.selection) {
                console.log(item.props.keyString)
                console.log(this.state.selectedDict)
                if (this.state.selectedDict[item.props.keyString]) {
                    selection.push(item);
                }
            }         
            return (
                <div id="container">
                    <Header text={this.state.text} pred={this.state.pred} />
                    <Results results={this.state.results} errorMessage={this.state.errorMessage} />
                    <SideBar selection={selection} />
                    <Footer onChange={this.handleQueryChange} errorMessage={this.state.errorMessage} value={this.state.query} />
                </div>
            );  
        }
        return null;        
    }

    componentDidMount() {
        let fetches = [];
        fetches.push(fetch("../activations.json").then(response => response.json()));
        fetches.push(fetch("../text.json").then(response => response.json()));
        fetches.push(fetch("../pred.json").then(response => response.json()));
        Promise.all(fetches).then(function([activations, text, pred]) {
            this.processData(activations, text, pred);
            this.handleQueryChange(this.state.query);
        }.bind(this)
        ).catch(function(e) {
            console.log(e);
        });
    }
}

// --------------------------------------------------------------------------------

class Results extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let [errName, errMessage] = this.props.errorMessage.split("\n");
        return (
            <div id="resultsContainer" className={this.props.errorMessage ? "error" : ""}>
                <div id="results">
                    {this.props.results.map(value => value.getComponents())}
                </div>
                <div id="errorMessage">
                    <div>{errName}</div>
                    <div>{errMessage}</div>
                </div>
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
                <div id="values">{this.props.selection}</div>
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
                   className={this.props.errorMessage ? "error" : ""} >
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

function process(actValues, tokens){
    
    return activations;
}