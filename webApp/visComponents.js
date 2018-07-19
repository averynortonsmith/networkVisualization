
function SentenceValue(tokens, position) {
    this.position = position;
    this.tokens = tokens;
    this.key = "Sentence " + this.position;
}
 
SentenceValue.prototype.getComponents = function() {
    return <Sentence tokens={this.tokens} position={this.position} key={this.key} />;
};

class Sentence extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="sentence">
                {this.props.tokens.map(token => token.getComponents())}
            </div>);
    }
}

// --------------------------------------------------------------------------------

function TokenValue(string, position, toggleSelect) {
    this.position = position;
    this.string = string;
    this.toggleSelect = toggleSelect;
    this.key = "Token " + this.position;
}
 
TokenValue.prototype.getComponents = function() {
    return <Token string={this.string} position={this.position} key={this.key} onClick={() => this.toggleSelect(this)} />;
};

class Token extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="token" onClick={this.props.onClick}>
                <div>{this.props.string}</div>
            </div>);
    }
}

// --------------------------------------------------------------------------------

function ActivationValue(actVal, position) {
    this.position = position;
    this.actVal = actVal;
    this.key = "Activation " + this.position;
}
 
ActivationValue.prototype.getComponents = function() {
    return <Activation actVal={this.actVal} position={this.position} key={this.key} />;
};

class Activation extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let color = this.props.actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
        let style = {backgroundColor: color + Math.abs(this.props.actVal) ** .7 + ")"}
        let valString = this.props.actVal.toFixed(3);
        return <div className="activation" style={style} >{valString}</div>;
    }
}

// --------------------------------------------------------------------------------

function NeuronValue(activations, position) {
    this.position = position;
    this.activations = activations;
    this.key = "Neuron " + this.position
}
 
NeuronValue.prototype.getComponents = function() {
    let activationComponents = this.activations;
    return <Neuron position={this.position} activationComponents={activationComponents} key={this.key} />;
};


class Neuron extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="neuron">
                <span>{this.props.position}</span>
            </div>);
    }
}