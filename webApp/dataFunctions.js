Object.defineProperty(Array.prototype, 'take', {
    value: function(n) { return this.slice(0, n) }
});

Object.defineProperty(Array.prototype, 'reversed', {
    value: function(n) { return [].concat(this).reverse(); }
});

function colorBy(source, target) {

}

// array.reversed
// array.take
// sentence.getTokens
// token.getWord 
// colorBy