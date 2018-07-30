
function getObjectColor(object) {
    let color = object.props.actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
    return {backgroundColor: color + Math.abs(object.props.actVal) ** .5 + ")"}
}


// --------------------------------------------------------------------------------

function SentenceValue(tokens, position, colorer="") {
    this.position = position;
    this.tokens   = tokens;
    this.colorer  = colorer;
    this.key      = "Sentence " + position + " " + colorer;
}

SentenceValue.prototype.copy = function(neuron) {
    return new SentenceValue(this.tokens, this.position);
};
 
SentenceValue.prototype.getComponents = function() {
    return (
        <Sentence
        tokens   = {this.tokens}
        position = {this.position}
        colorer  = {this.colorer}
        key      = {this.key}
        onClick  = {() => getToggleSelect()(this)} />);
};

class Sentence extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="sentence">
                <span className="sentenceName" onClick={this.props.onClick}>sentence{this.props.colorer ? " :: " + this.props.colorer : ""}</span>
                {this.props.tokens.map(token => token.getComponents())}
            </div>);
    }
}

// --------------------------------------------------------------------------------

function TokenValue(word, position, actVal=0, colorer="") {
    this.position = position;
    this.word     = word;
    this.actVal   = actVal;
    this.key      = "Token " + position + " " + colorer;
}

TokenValue.prototype.copy = function(neuron) {
    return new TokenValue(this.word, this.position);
};
 
TokenValue.prototype.getComponents = function() {
    return ( 
        <Token
        word     = {this.word}
        position = {this.position}
        actVal   = {this.actVal}
        key      = {this.key}
        onClick  = {() => getToggleSelect()(this)} />);
};

class Token extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="tokenContainer">
                <span className="token" style={getObjectColor(this)}>
                    <span className="itemName" onClick={this.props.onClick}>token</span>
                    <span className="tokenString" onClick={this.props.onClick}>{this.props.word.string}</span>
                    <span className="tokenWord">{this.props.word.getComponents()}</span>
                </span>
            </div>);
    }
}

// --------------------------------------------------------------------------------

function WordValue(string) {
    this.string = string;
    this.key    = "Word " + string;
}

WordValue.prototype.copy = function(neuron) {
    return new WordValue(this.string);
};
 
WordValue.prototype.getComponents = function() {
    return (
        <Word
        string   = {this.string}
        position = {this.position}
        key      = {this.key}
        onClick  = {() => getToggleSelect()(this)} />);
};

class Word extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="wordContainer">
                <span
                    className = "word"
                    onClick   = {this.props.onClick}
                    style     = {getObjectColor(this)}>
                    <span className="itemName">word</span>
                    <span>{this.props.string}</span>
                </span>
            </div>);
    }
}

// --------------------------------------------------------------------------------

function ActivationValue(actVal, position) {
    this.position = position;
    this.actVal   = actVal;
    this.key      = "Activation " + position;
}

// --------------------------------------------------------------------------------

function NeuronValue(activations, positionString) {
    this.positionString = positionString;
    this.position       = positionString.split(":");
    this.activations    = activations;
    this.key            = "Neuron " + positionString
}

NeuronValue.prototype.copy = function(neuron) {
    return new NeuronValue(this.activations, this.positionString);
};
 
NeuronValue.prototype.getComponents = function() {
    let activationComponents = this.activations;
    return (
        <Neuron
        positionString       = {this.positionString}
        activationComponents = {activationComponents}
        key                  = {this.key}
        onClick              = {() => getToggleSelect()(this)} />);
};

class Neuron extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div><span className="neuron" onClick={this.props.onClick}>
                <span className="itemName">neuron</span>
                <span className="neuronInfo">{this.props.positionString}</span>
            </span></div>);
    }
}