
const average = (array) => array.reduce((a, b) => a + b) / array.length;

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

// --------------------------------------------------------------------------------

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

// --------------------------------------------------------------------------------

TokenValue.prototype.getWord = function() {
    return this.word;
};


