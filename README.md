# AST talk Utah JS 2015


Markdown: [presentation.md](https://github.com/xjamundx/asts-utahjs-2015/blob/master/presentation.md)

PDF: [presentation.pdf](https://github.com/xjamundx/asts-utahjs-2015/blob/master/presentation.pdf)

Code: [compare.js](https://github.com/xjamundx/asts-utahjs-2015/blob/master/code/compare.js)

Presented with [Deckset](http://www.decksetapp.com)


## Example


To run the compare script:

```
cp code/complex2.js code/complex1.js
git diff --raw code/complex1.js | node code/compare.js
```

Results:

```
~/asts-utahjs-2015/code/complex1.js
1. The exported `buildHouse` function went from a return to a callback.
2. The private `getPermits` function was added.
```