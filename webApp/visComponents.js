
function SentenceValue(tokens, position, toggleSelect) {
    this.position = position;
    this.tokens = tokens;
    this.toggleSelect = toggleSelect;
    this.key = "Sentence " + position;
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

function TokenValue(string, position, toggleSelect) {
    this.position = position;
    this.string = string;
    this.toggleSelect = toggleSelect;
    this.key = "Token " + position;
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
            <div className="tokenContainer"><span className="token" onClick={this.props.onClick}>
                <span className="itemName">token</span>
                <span>{this.props.string}</span>
            </span></div>);
    }
}

// --------------------------------------------------------------------------------

function WordValue(string, toggleSelect, bold=false) {
    this.string = string;
    this.toggleSelect = toggleSelect;
    this.bold = bold;
    this.key = "Word " + string;
}
 
WordValue.prototype.getComponents = function() {
    return <Word string={this.string} bold={this.bold} position={this.position} key={this.key} onClick={() => this.toggleSelect(this)} />;
};

class Word extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="wordContainer"><span className="word" onClick={this.props.onClick}>
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
 
ActivationValue.prototype.getComponents = function() {
    return <Activation actVal={this.actVal} stringData={this.stringData} position={this.position} key={this.key} onClick={() => this.toggleSelect(this)} />;
};

class Activation extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let {before, after, string} = this.props.stringData
        let color = this.props.actVal > 0 ? "rgba(255, 0, 0," : "rgba(0, 0, 255,";
        let style = {backgroundColor: color + Math.abs(this.props.actVal) ** .5 + ")"}
        let valString = this.props.actVal.toFixed(3);
        return (
            <div><span className="activation">
                <span className="actValue" style={style} onClick={this.props.onClick}>{valString}</span>
                <span className="actText">
                    {before.length ? "..." : ""}
                    {before.map(word => word .getComponents())}
                    {string.getComponents()}
                    {after.map(word => word .getComponents())}
                    {after.length ? "..." : ""}
                </span>
            </span></div>);
    }
}

// --------------------------------------------------------------------------------

function NeuronValue(activations, position, toggleSelect) {
    this.position = position;
    this.activations = activations;
    this.toggleSelect = toggleSelect;
    this.key = "Neuron " + position
}
 
NeuronValue.prototype.getComponents = function() {
    let activationComponents = this.activations;
    return <Neuron position={this.position} activationComponents={activationComponents} key={this.key} onClick={() => this.toggleSelect(this)} />;
};


class Neuron extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div><span className="neuron" onClick={this.props.onClick}>
                <span className="itemName">neuron</span>
                <span className="neuronInfo">{this.props.position}</span>
            </span></div>);
    }
}