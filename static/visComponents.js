
// --------------------------------------------------------------------------------

function ActivationValue(actVal, position) {
    this.position = position;
    this.actVal   = actVal;
    this.key      = "Activation " + position;
}

// --------------------------------------------------------------------------------

function VisComponent() {}

SentenceValue.prototype = Object.create(VisComponent.prototype);
SentenceValue.prototype.constructor = SentenceValue;

TokenValue.prototype = Object.create(VisComponent.prototype);
TokenValue.prototype.constructor = TokenValue;

WordValue.prototype = Object.create(VisComponent.prototype);
WordValue.prototype.constructor = WordValue;

NeuronValue.prototype = Object.create(VisComponent.prototype);
NeuronValue.prototype.constructor = NeuronValue;

// --------------------------------------------------------------------------------

function SentenceValue(tokens, position, colorer=null) {
    this.position = position;
    this.tokens   = tokens;
    this.colorer  = colorer;
    this.key      = "Sentence " + position + (colorer ? " " + colorer.key : "");
}

SentenceValue.prototype.copy = function(neuron) {
    return new SentenceValue(this.tokens.map(token => token.copy()), this.position);
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

SentenceValue.prototype.colorAverage = function(colorer) {
    return this.colorBy(colorer, true);
};

SentenceValue.prototype.colorBy = function(colorer, average=false) {
    if (colorer instanceof Array && !average) {
        return colorer.map(source => this.colorBy(source, average));
    }
    let newTokens = this.tokens.map(token => token.colorAverage(colorer, average))
    return new SentenceValue(newTokens, this.position, colorer);
};

class Sentence extends React.Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div>
                <span className={"sentence" + (this.props.colorer instanceof NeuronValue ? " color" : "")}>
                    {this.props.colorer instanceof NeuronValue ? this.props.colorer.getComponents() : []}
                    <span className="itemName" onClick={this.props.onClick}>sentence</span>
                    {this.props.tokens.map(token => token.getComponents())}
                </span>
            </div>);
    }
}

// --------------------------------------------------------------------------------

function TokenValue(word, position, colorer=null) {
    this.position = position;
    this.word     = word;
    this.colorer  = colorer;
    this.key      = "Token " + position + (colorer ? " " + colorer.key : "");
}

TokenValue.prototype.copy = function(neuron) {
    return new TokenValue(this.word, this.position);
};
 
TokenValue.prototype.getComponents = function() {
    return ( 
        <Token
        word     = {this.word}
        position = {this.position}
        colorer  = {this.colorer}
        key      = {this.key}
        onClick  = {() => getToggleSelect()(this)} />);
};

TokenValue.prototype.colorAverage = function(colorer) {
    return this.colorBy(colorer, true);
};

TokenValue.prototype.colorBy = function(colorer, average=false) {
    if (colorer instanceof Array && !average) {
        return colorer.map(source => this.colorBy(source));
    }
    return new TokenValue(this.word, this.position, colorer);
};

class Token extends React.Component {
    constructor(props) {
        super(props);
        this.getColorStyle = this.getColorStyle.bind(this);
    }

    getColorStyle() {
        if (this.props.colorer instanceof NeuronValue) {
            let [layer, ind] = this.props.colorer.position;
            let [sen, tok]   = this.props.position;
            // layer and ind are really strings, not ints
            // in a sane language this would cause an error, but js doesn't care
            let actVal = getActivations()[sen][tok][layer][ind];
            let color  = actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
            return {backgroundColor: color + Math.abs(actVal) ** .5 + ")", marginRight: "0px", borderWidth: "0px"};
        }
        if (this.props.colorer instanceof Array) {
            let actVal = average(this.props.colorer.map((function(colorer) {
                let [layer, ind] = colorer.position;
                let [sen, tok]   = this.props.position;
                return getActivations()[sen][tok][layer][ind];
            }).bind(this)));
            let color  = actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
            return {backgroundColor: color + Math.abs(actVal) ** .5 + ")", marginRight: "0px", borderWidth: "0px"};
        }
        return {};
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div className="tokenContainer">
                <span className="token" style={this.getColorStyle()}>
                    {this.props.colorer instanceof NeuronValue ? this.props.colorer.getComponents() : []}
                    <span className="itemName" onClick={this.props.onClick}>token</span>
                    <span className="tokenString" onClick={this.props.onClick}>{this.props.word.string}</span>
                    <span className="tokenWord">{this.props.word.getComponents()}</span>
                </span>
            </div>);
    }
}

// --------------------------------------------------------------------------------

function WordValue(string, averages, colorer=null) {
    this.string   = string;
    this.averages = averages;
    this.colorer  = colorer;
    this.key      = "Word " + string + (colorer ? " " + colorer.key : "");
}

WordValue.prototype.copy = function(neuron) {
    return new WordValue(this.string);
};
 
WordValue.prototype.getComponents = function() {
    return (
        <Word
        string   = {this.string}
        averages = {this.averages}
        colorer  = {this.colorer}
        key      = {this.key}
        onClick  = {() => getToggleSelect()(this)} />);
};

WordValue.prototype.colorAverage = function(colorer) {
    return this.colorBy(colorer, true);
};

WordValue.prototype.colorBy = function(colorer, average=false) {
    if (colorer instanceof Array && !average) {
        return colorer.map(source => this.colorBy(source));
    }
    return new WordValue(this.string, this.averages, colorer);
};

class Word extends React.Component {
    constructor(props) {
        super(props);
        this.getColorStyle = this.getColorStyle.bind(this);
    }

    getColorStyle() {
        if (this.props.colorer instanceof NeuronValue) {
            let actVal = this.props.averages[this.props.colorer.positionString];
            let color  = actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
            return {backgroundColor: color + Math.abs(actVal) ** .5 + ")", marginRight: "0px", border: "none"};
        }
        if (this.props.colorer instanceof Array) {
            let actVal = average(this.props.colorer.map(colorer => this.props.averages[colorer.positionString]));
            let color  = actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
            return {backgroundColor: color + Math.abs(actVal) ** .5 + ")", marginRight: "0px", border: "none"};
        }
        return {};
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div className="wordContainer">
                <span
                    className = "word"
                    style     = {this.getColorStyle()}
                    onClick   = {this.props.onClick}>
                    {this.props.colorer instanceof NeuronValue ? this.props.colorer.getComponents() : []}
                    <span className="itemName">word</span>
                    <span>{this.props.string}</span>
                </span>
            </div>);
    }
}

// --------------------------------------------------------------------------------

function NeuronValue(activations, positionString, colorer=null) {
    this.positionString = positionString;
    this.position       = positionString.split(":");
    this.activations    = activations;
    this.colorer        = colorer;
    this.key            = "Neuron " + positionString + (colorer ? " " + colorer.key : "");
}

NeuronValue.prototype.copy = function(neuron) {
    return new NeuronValue(this.activations, this.positionString);
};
 
NeuronValue.prototype.getComponents = function() {
    return (
        <Neuron
        positionString = {this.positionString}
        activations    = {this.activations}
        colorer        = {this.colorer}
        key            = {this.key}
        onClick        = {() => getToggleSelect()(this)} />);
};

NeuronValue.prototype.colorBy = function(colorer) {
    if (colorer instanceof Array) {
        return colorer.map(source => this.colorBy(source));
    }
    return new NeuronValue(this.activations, this.positionString, colorer);
};


class Neuron extends React.Component {
    constructor(props) {
        super(props);
    }

    getColorStyle() {
        if (this.props.colorer instanceof NeuronValue) {
            let thisVals  = this.props.activations.map(act => act.actVal);
            let otherVals = this.props.colorer.activations.map(act => act.actVal);
            let actVal    = correlation(thisVals, otherVals);
            let color     = actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
            return [actVal, {backgroundColor: color + Math.abs(actVal) ** .5 + ")", marginRight: "0px", border: "none"}];
        }
        return [0, {}];
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        let [actVal, colorStyle] = this.getColorStyle();
        let alignmentSpace = actVal >= 0 ? "\u00A0" : ""
        return (
            <div className="neuronDiv">
                <span className = "neuron"
                      style     = {colorStyle} >
                      {this.props.colorer instanceof NeuronValue ? this.props.colorer.getComponents() : []}
                      {this.props.colorer instanceof NeuronValue ? <span className="corrVal">{alignmentSpace}{parseFloat(actVal).toFixed(3)}</span> : ""}
                    <span className = "itemName"
                          onClick   = {this.props.onClick} >
                          neuron {this.props.positionString}
                    </span>
                </span>
            </div>);
    }
}
