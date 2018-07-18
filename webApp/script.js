Object.defineProperty(Array.prototype, 'take', {
    value: function(n) { return this.slice(0, n); }
});

Object.defineProperty(Array.prototype, 'average', {
    value: function(n) {
        let total = this.map(getValue).reduce((a, b) => a + b);
        return <Activation actVal={total / this.length} />;
    }
});

function getValue(activation) {
    return activation.props.actVal;
}

function getActivations(neuron) {
    return neuron.props.activations;
}

function reversedAll(sentences) {
    let result = [];
    for (let sentence of sentences) {
        result.push([].concat(sentence).reverse());
    }
    return result;
}

function reversed(sentence) {
    return [].concat(sentence).reverse();
}

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.state = {
            results: [], 
            query: "neurons.take(10)", 
            errorMessage: "",
            activations: [], 
            data: {},
            text: [], 
            pred: ""
        };
    }

    processData(activations, text, pred){

        this.setState({activations, text, pred});

        let sentences = [];
        let neurons = [];
        let layers = [];
        let words = {};

        let neuronsDict = {}

        for (let sen = 0; sen < activations.length; sen++){
            let sentence = [];
            for (let word = 0; word < activations[sen].length; word++){
                let key = [sen, word];
                let tokenActivations = [];
                for (let layer = 0; layer < activations[sen][word].length; layer++){
                    for (let ind = 0; ind < activations[sen][word][layer].length; ind++){
                        let actVal = activations[sen][word][layer][ind];
                        let actKey = [sen, word, layer, ind];
                        let activation = <Activation actVal={actVal} key={actKey}/>;
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
            let neuron = <Neuron position={position} activations={activations} key={position} />;
            neurons.push(neuron);
        }
        
        this.setState({data: {neurons, layers, sentences, words}});
    }

    handleQueryChange(query) {

        this.setState({query});

        if (query) {
            let {neurons, layers, sentences, words} = this.state.data;

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
            return (
                <div id="container">
                    <Header sentences={this.state.text} pred={this.state.pred} />
                    <Results results={this.state.results} errorMessage={this.state.errorMessage} />
                    <SideBar />
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
        fetches.push(fetch("../pred.txt").then(response => response.text()));
        Promise.all(fetches).then(function([activations, text, pred]) {
            this.processData(activations, text, pred);
            this.handleQueryChange(this.state.query);
        }.bind(this)
        ).catch(function(e) {
            console.log(e);
        });
    }
}

class Results extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let [errName, errMessage] = this.props.errorMessage.split("\n");
        return (
            <div id="resultsContainer" className={this.props.errorMessage ? "error" : ""}>
                <div id="results">
                    {this.props.results}
                </div>
                <div id="errorMessage">
                    <div>{errName}</div>
                    <div>{errMessage}</div>
                </div>
            </div>
        );        
    }
}

class SideBar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="sidebar">
                <div id="valueSelection"></div>
                <div id="values"></div>
                <div id="controls"></div>
            </div>
        );        
    }
}

class Header extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let sourceLines = [];
        for (let sentence of this.props.sentences) {
            sourceLines.push(sentence.join(" "));
        }
        let text = sourceLines.join("\n");

        return (
            <div id="header">
                <textarea id="source" defaultValue={text}></textarea>
                <textarea id="prediction" value={this.props.pred}></textarea>
            </div>
        );        
    }
}

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

class Token extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    render() {
        return (<div className="token">
                    <div className="type">{this.props.word}</div>
                    {this.props.activations}
                </div>);
    }
}


class Activation extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    render() {
        let color = this.props.actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
        let style = {backgroundColor: color + Math.abs(this.props.actVal) ** .7 + ")"}
        let valString = this.props.actVal.toFixed(3);
        return <div className="activation" style={style}>{valString}</div>;
    }
}

class Neuron extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    render() {
        let activations = this.props.activations;
        return <div className="neuron">
                   <span>{this.props.position}</span>
                   {activations}
                </div>;
    }
}

ReactDOM.render(
    <Container />,
    document.getElementById('root')
);

function process(actValues, tokens){
    
    return activations;
}

// -----
// input
// -----
// translation
// -----
// neurons   : top words / phrases?
// layers    : none 
// sentences : 
// tokens    :
// words     :
// value     : 

// can display:
//   list of sentences
//   list of words
//   list of words for neurons
//   list of tokens
//   list of tokens for neurons
//   cannot display tokens without sentences