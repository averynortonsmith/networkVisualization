
function getObjectColor(object) {
    let color = object.props.actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
    return {backgroundColor: color + Math.abs(object.props.actVal) ** .5 + ")"}
}


// --------------------------------------------------------------------------------

function SentenceValue(tokens, position, toggleSelect) {
    this.position = position;
    this.tokens = tokens;
    this.toggleSelect = toggleSelect;
    this.key = "Sentence " + position;
}

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

function getTokens(sentence) {
    console.log(sentence.getTokens())
    return sentence.getTokens();
}
 
SentenceValue.prototype.getComponents = function() {
    return <Sentence tokens={this.tokens} position={this.position} key={this.key} onClick={() => this.toggleSelect(this)} />;
};

class Sentence extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="sentence">
                <span className="sentenceName" onClick={this.props.onClick}>sentence</span>
                {this.props.tokens.map(token => token.getComponents())}
            </div>);
    }
}

// --------------------------------------------------------------------------------

function TokenValue(word, position, toggleSelect, actVal=0, colorer="") {
    this.position = position;
    this.word = word;
    this.toggleSelect = toggleSelect;
    this.actVal = actVal;
    this.key = "Token " + position + colorer;
}

TokenValue.prototype.getWord = function() {
    return this.word;
};

function getWord(token) {
    return token.getWord();
}

TokenValue.prototype.colorBy = function(neuron) {
    let [layer, ind] = neuron.position;
    let [sen, tok] = this.position;
    let actVal = window.activationsData[sen][tok][layer][ind];
    return new TokenValue(this.word, this.position, this.toggleSelect, actVal, neuron.key);
};
 
TokenValue.prototype.getComponents = function() {
    return <Token word={this.word} position={this.position} actVal={this.actVal} key={this.key} onClick={() => this.toggleSelect(this)} />;
};

class Token extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="tokenContainer"><span className="token" style={getObjectColor(this)}>
                <span className="itemName" onClick={this.props.onClick}>token</span>
                <span className="tokenString" onClick={this.props.onClick}>{this.props.word.string}</span>
                <span className="tokenWord">{this.props.word.getComponents()}</span>
            </span></div>);
    }
}

// --------------------------------------------------------------------------------

function WordValue(string, activations, toggleSelect, bold=false, actVal=0) {
    this.string = string;
    this.activations = activations;
    this.toggleSelect = toggleSelect;
    this.bold = bold;
    this.actVal = actVal;
    this.key = "Word " + string;
}
 
WordValue.prototype.getComponents = function() {
    return <Word string={this.string} bold={this.bold} position={this.position} actVal={this.actVal} key={this.key} onClick={() => this.toggleSelect(this)} />;
};

class Word extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="wordContainer"><span className="word" onClick={this.props.onClick} style={getObjectColor(this)}>
                <span className="itemName">word</span>
                {this.props.bold ? <strong style={{color: "#888"}}>{this.props.string}</strong> : <span>{this.props.string}</span>}
            </span></div>);
    }
}

// --------------------------------------------------------------------------------

function ActivationValue(actVal, stringData, position, toggleSelect) {
    this.position = position;
    this.actVal = actVal;
    this.stringData = stringData;
    this.toggleSelect = toggleSelect;
    this.key = "Activation " + position;
}

// --------------------------------------------------------------------------------

function NeuronValue(activations, positionString, toggleSelect) {
    this.positionString = positionString;
    this.position = positionString.split(":");
    this.activations = activations;
    this.toggleSelect = toggleSelect;
    this.key = "Neuron " + positionString
}
 
NeuronValue.prototype.getComponents = function() {
    let activationComponents = this.activations;
    return <Neuron positionString={this.positionString} activationComponents={activationComponents} key={this.key} onClick={() => this.toggleSelect(this)} />;
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