
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

TokenValue.prototype.colorBy = function(colorSource) {
	if (colorSource instanceof Array) {
		return colorSource.map(source => this.colorBy(source));
	}
    let [layer, ind] = colorSource.position;
    let [sen, tok]   = this.position;
    let actVal       = window.activationsData[sen][tok][layer][ind];
    let colorer      = colorSource.key
    return new TokenValue(this.word, this.position, actVal, colorer);
};

SentenceValue.prototype.colorBy = function(colorSource) {
	if (colorSource instanceof Array) {
		return colorSource.map(source => this.colorBy(source));
	}
	let newTokens = this.tokens.map(token => token.colorBy(colorSource)) 
    let colorer   = colorSource.key
    return new SentenceValue(newTokens, this.position, colorer);
};

// --------------------------------------------------------------------------------

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

// --------------------------------------------------------------------------------

TokenValue.prototype.getWord = function() {
    return this.word;
};


