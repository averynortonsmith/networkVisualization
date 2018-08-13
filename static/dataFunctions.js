
const average = (array) => array.reduce((a, b) => a + b) / array.length;

// --------------------------------------------------------------------------------

Object.defineProperty(Object.prototype, "take", {
    value: function*(n) {
        if (n > 0) {
            let result = this.next();
            if (result.value != undefined) {
                yield result.value;
                if (result.done == false) {
                    yield* this.take(n - 1);
                }
            }         
        }
    }
});

Object.defineProperty(Object.prototype, "map", {
    value: function*(func) {
        let result = this.next();
        if (result.value != undefined) {
            yield func(result.value);
            if (result.done == false) {
                yield* this.map(func);
            }
        }         
    }
});

Object.defineProperty(Array.prototype, "take", {
    value: function(n) { return this.slice(0, n); }
});

Object.defineProperty(Array.prototype, "reversed", {
    value: function() { return [].concat(this).reverse(); }
});

Object.defineProperty(Array.prototype, "colorBy", {
    value: function*(colorSource) {
        for (let elem of this) {
            yield elem.colorBy(colorSource);
        }
    }
});

Object.defineProperty(Array.prototype, "colorAverage", {
    value: function(colorSource) { return this.map(elem => elem.colorBy(colorSource, true)); }
});

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

TokenValue.prototype.getWord = function() {
    return this.word;
};

function select(value) {
    getToggleSelect()(value, true);
    return null;
}
