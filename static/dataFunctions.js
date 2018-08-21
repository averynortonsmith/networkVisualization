
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
    if (values instanceof Array || typeof values[Symbol.iterator] === "function") {
        for (let value of values) {
            yield* flatMap(func, value) 
        }
    }
    else if (values instanceof(VisComponent)) {
        yield func(values);
    }
    else {
        throw {name : "TypeError", message : "cannot render type " + typeof values}; 
    }
}

function* flatten(values) {
    if (values instanceof Array || typeof values[Symbol.iterator] === "function") {
        for (let value of values) {
            yield* flatten(value) 
        }
    }
    else {
        yield values;
    }
}

function* filter(func, values) {
    for (let value of values) {
        if (func(value)) {
            yield value;
        }
    }
}


// --------------------------------------------------------------------------------

Object.defineProperty(Array.prototype, "take", {
    value: function(n) { return this.slice(0, n); }
});

Object.defineProperty(Array.prototype, "reversed", {
    value: function() { return [].concat(this).reverse(); }
});

// --------------------------------------------------------------------------------

Object.defineProperty(Object.prototype, "map", {
    value: func => flatMap(func, copyDedupe(this))
});

Object.defineProperty(Object.prototype, "filter", {
    value: func => filter(func, copyDedupe(this))
});

Object.defineProperty(Object.prototype, "colorSort", {
    // me: hey, javascript, if I accidentally mark a normal function (has a return statement) as a
    //     generator, you'll make sure to throw an error so that I realize my mistake, right?
    // js: nah
    value: function(colorSource) {
        let values = Array.from(flatten(copyDedupe(this).colorBy(colorSource)));
        values.sort((a, b) => a.actVal < b.actVal);
        console.log(values);
        return values;
    }
});

Object.defineProperty(Object.prototype, "colorBy", {
    value: function*(colorSource) { yield* flatMap(elem => elem.colorBy(colorSource), copyDedupe(this)); }
});

Object.defineProperty(Object.prototype, "colorAverage", {
    value: function*(colorSource) { yield* flatMap(elem => elem.colorBy(colorSource, true), copyDedupe(this)); }
});

Object.defineProperty(Object.prototype, "getColorers", {
    value: function*() { yield* flatMap(elem => elem.colorer, this); }
});

Object.defineProperty(Object.prototype, "modify", {
    value: function(selection, value) {
        let mods = [];
        for (let token of copyDedupe(this)) {
            if (token instanceof TokenValue == false) {
                let errorMessage = "Bad Input Type For Method Modify";
                throw {name: "Bad Input Type For Method Modify" , message: "should be [tokens].modify([neurons], intValue)"};
            }
            for (let neuron of selection) {
                if (neuron instanceof NeuronValue == false) {
                    throw {name: "Bad Input Type For Method Modify" , message: "should be [tokens].modify([neurons], intValue)"};
                }
                let [sen, tok] = token.position;
                let [layer, ind] = neuron.position;
                mods.push(JSON.stringify([sen, tok, layer, ind, value].map(Number)) + "\n");
            }
        }
        getAddMods()(mods);
        return null;
    }
});

SentenceValue.prototype.getTokens = function() {
    return this.tokens;
};

TokenValue.prototype.getWord = function() {
    return this.word;
};

WordValue.prototype.getString = function() {
    return this.string;
};

function* deduplicate(values) {
    let keySet = new Set([]);

    for (let value of values) {
        if (value.key in keySet == false) {
            yield value;
            keySet.add(value);
        }
    }
}

function copyDedupe(values) {
    return deduplicate(flatMap(elem => elem.copy(), values));
}