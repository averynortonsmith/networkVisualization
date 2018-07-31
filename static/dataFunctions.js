
// --------------------------------------------------------------------------------

Object.defineProperty(Array.prototype, 'take', {
    value: function(n) { return this.slice(0, n); }
});

Object.defineProperty(Array.prototype, 'reversed', {
    value: function() { return [].concat(this).reverse(); }
});

// --------------------------------------------------------------------------------

Object.defineProperty(Array.prototype, 'colorBy', {
    value: function(colorSource) { return this.map(elem => elem.colorBy(colorSource)); }
});

WordValue.prototype.colorBy = function(colorSource) {
	if (colorSource instanceof Array) {
		return colorSource.map(source => this.colorBy(source));
	}
	if (colorSource instanceof NeuronValue) {
		let newTokens = this.tokens.map(token => token.colorBy(colorSource)) 
	    return new SentenceValue(newTokens, this.position, colorSource);
	}
	return this;
};

// --------------------------------------------------------------------------------

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

// --------------------------------------------------------------------------------

TokenValue.prototype.getWord = function() {
    return this.word;
};


