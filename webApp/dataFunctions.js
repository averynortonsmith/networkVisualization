Object.defineProperty(Array.prototype, 'take', {
    value: function(n) { this.slice(0, n) }
});

Object.defineProperty(Array.prototype, 'average', {
    value: function(n) {
        let total = this.map(getValue).reduce((a, b) => a + b);
        return <Activation actVal={total / this.length} />;
    }
});

Object.defineProperty(Array.prototype, 'reversed', {
    value: function(n) { return reversed(this); }
});

function reversed(sentence) {
    return [].concat(sentence).reverse();
}
