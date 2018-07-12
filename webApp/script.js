// Bug Awards (tm)
// Promises masking errors downstream [1 hour] [https://www.reddit.com/r/javascript/comments/4bj6sm/am_i_wrong_to_be_annoyed_with_promise_error/] 

const elem = React.createElement

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {activations: [], query: "activations"};
    }

    handleChange(e) {
        this.setState({query: e.target.value});
      }

    render() {
        if (this.state.activations.length){
            let actValues = [];
            var activations = this.state.activations;
            let results = eval(this.state.query);
            let resultsList = results instanceof Array ? results : [results]
            for (let props of resultsList) {
                actValues.push(elem(Activation, props));
            }
            let search = <input onChange={this.handleChange} />;
            return elem("div", null, search, actValues);  
        }
        return null;        
    }

    componentDidMount() {
        let fetches = [];
        fetches.push(fetch("../activations.json").then(response => response.json()));
        fetches.push(fetch("../tokens.json").then(response => response.json()));
        fetches.push(fetch("../pred.txt"));
        Promise.all(fetches).then(([actValues, tokens, pred]) => 
            this.setState({activations: process(actValues, tokens), pred: pred})
        ).catch(function(e) {
            console.log(e);
        });
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
    let activations = [];
    for (let sentence = 0; sentence < actValues.length; sentence++){
        for (let word = 0; word < actValues[sentence].length; word++){
            let token = tokens[sentence][word]
            for (let layer = 0; layer < actValues[sentence][word].length; layer++){
                for (let ind = 0; ind < actValues[sentence][word][layer].length; ind++){
                    let actVal = actValues[sentence][word][layer][ind];
                    activations.push({actVal, token, sentence, word, layer, ind});
                }
            }
        }
    }
    return activations;
}