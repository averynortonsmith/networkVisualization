
// and for my next trick, I will re-implement all of Haskell in ES6
const average = array => array.reduce((a, b) => a + b) / array.length;
const range = n => [...Array(n).keys()];
const sum = array => array.reduce((a, b) => a + b, 0)

function correlation(a, b) {
    let avgA = average(a);
    let avgB = average(b);
    let rmsA = Math.sqrt(sum(a.map(x => (x - avgA) ** 2)))
    let rmsB = Math.sqrt(sum(b.map(x => (x - avgB) ** 2)))
    return sum(range(a.length).map(i => (a[i] - avgA) * (b[i] - avgB))) / rmsA / rmsB;
}

function* takeGen(n, gen) {
    if (n > 0) {
        let result = gen.next();
        if (result.value != undefined) {
            yield result.value;
            if (result.done == false) {
                yield* takeGen(n - 1, gen);
            }
        }         
    }
}

// --------------------------------------------------------------------------------

Object.defineProperty(Array.prototype, 'take', {
    value: function(n) { return this.slice(0, n); }
});

Object.defineProperty(Array.prototype, 'reversed', {
    value: function() { return [].concat(this).reverse(); }
});

Object.defineProperty(Array.prototype, 'colorBy', {
    value: function(colorSource) { return this.map(elem => elem.colorBy(colorSource)); }
});

Object.defineProperty(Array.prototype, 'colorAverage', {
    value: function(colorSource) { return this.map(elem => elem.colorBy(colorSource, true)); }
});

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

TokenValue.prototype.getWord = function() {
    return this.word;
};
