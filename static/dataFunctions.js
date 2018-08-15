
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

function* flatMap(func, values) {
    if (values instanceof Array || typeof values[Symbol.iterator] === 'function') {
        for (let value of values) {
            yield* flatMap(func, value) 
        }
    }
    else {
        yield func(values);
    }
}

// --------------------------------------------------------------------------------

Object.defineProperty(Array.prototype, 'take', {
    value: function(n) { return this.slice(0, n); }
});

Object.defineProperty(Array.prototype, 'reversed', {
    value: function() { return [].concat(this).reverse(); }
});

Object.defineProperty(Object.prototype, 'colorBy', {
    value: function*(colorSource) { yield* flatMap(elem => elem.colorBy(colorSource), this); }
});

Object.defineProperty(Object.prototype, 'colorAverage', {
    value: function*(colorSource) { yield* flatMap(elem => elem.colorBy(colorSource, true), this); }
});

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

TokenValue.prototype.getWord = function() {
    return this.word;
};
