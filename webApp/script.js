
const elem = React.createElement

function processData(activations, text){
    let sentences = [];
    let neurons = [];
    let layers = [];
    let words = [];
    console.log(activations)
    console.log(text)
    for (let sen = 0; sen < activations.length; sen++){
        for (let word = 0; word < activations[sen].length; word++){
            sentences.push(<Token word={text[sen][word]} />);
            for (let layer = 0; layer < activations[sen][word].length; layer++){
                for (let ind = 0; ind < activations[sen][word][layer].length; ind++){
                    // let actVal = activations[sen][word][layer][ind];
                    // activations.push({actVal, token, sen, word, layer, ind});
                }
            }
        }
    }
    
    return {neurons, layers, sentences, words}
}

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = {results: [], query: "sentences", activations: [], text: [], pred: ""};
    }

    render() {
        if (this.state.activations.length) {
            let {neurons, layers, sentences, words} = processData(this.state.activations, this.state.text);
            let results = eval(this.state.query);
            let sourceLines = [];
            for (let sentence of this.state.text) {
                sourceLines.push(sentence.join(" "));
            }
            let source = sourceLines.join("\n");

            if (results) {
                return (
                    <div id="container">
                        <Header text={sourceLines} pred={this.state.pred} />
                        <Results results={results} />
                        <SideBar />
                        <Footer />
                    </div>
                );  
            }
        }
        return null;        
    }

    componentDidMount() {
        let fetches = [];
        fetches.push(fetch("../activations.json").then(response => response.json()));
        fetches.push(fetch("../text.json").then(response => response.json()));
        fetches.push(fetch("../pred.txt").then(response => response.text()));
        Promise.all(fetches).then(([activations, text, pred]) => 
            this.setState({activations, text, pred})
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
        return (
            <div id="resultsContainer">
                <div id="results">{this.props.results}</div>
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
        return (
            <div id="header">
                <textarea id="source" defaultValue={this.props.text}></textarea>
                <textarea id="prediction" value={this.props.pred}></textarea>
            </div>
        );        
    }
}

class Footer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="footer">
                <textarea id="query"></textarea>
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
        return (<div className="token">{this.props.word}</div>);
    }
}


class Activation extends React.Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    render() {
        let style = {backgroundColor: `rgba(255, 0, 0, ${this.props.actVal})`}
        return <div style={style}>{JSON.stringify(this.props)}</div>;
    }
}

ReactDOM.render(
    elem(Container, null),
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