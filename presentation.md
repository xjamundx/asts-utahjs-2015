![](trees.jpg)

## Harnessing the power of Abstract Syntax Trees

---

# [fit] *__Parsers__* 

^ take JavaScript and turn it into a AST

---

```js
console.log("UtahJS");
```

---

![fit](ast-utahjs.png)

---
```js
{
	type: "Program",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "CallExpression",
				callee: {
					type: "MemberExpression",
					computed: false,
					object: {
						type: "Identifier",
						name: "console"
					},
					property: {
						type: "Identifier",
						name: "log"
					}
				},
				arguments: [
					{
						type: "Literal",
						value: "UtahJS",
						raw: "\"UtahJS\""
					}
				]
			}
		}
	]
}
```

^ In JavaScript an AST is basically a JSON representation of your code.I know what you're thinking. You like the other version better?
I do to. Let's stick with pictures...

---

![fit](ast-utahjs.png)

^ Isn't that betteR?

---

# ASTs are Everywhere

^ They're in browsers, in transpilers, minifiers. All of the cool build tools these days 
are relying on ASTs to safely turn your code into play doe.

---


# [fit] *__Acorn__*

^ is the parser to beat these days

^ it's used by babel, so you know it's good.

---

# [fit] *__Espree__*

^ Is the parser I know the best. It's a fork off esprima, with better ES6 stuff and it's what we use in ESLint.
Which I work on a bit.

---

# An *__AST__* gives you super powers

^ I mentioned already that an AST is basically a JSON representation of your code.
^ But I didn't mention that they can give you actual super powers. 
^ Once you understand how ASTs work you can use them to build things that have never been built before.
^ That change how we interact with our programs. 
^ In case you think I'm messing with you, let's build something amazing! Right here. Right now.


---

# JS Aware <br> *__git diff__*

^ This is just an example of the cool things you can do with ASTs.

---

```js
console.log("UtahJS");
```

^ Let's start with some code

---

```js
console.log("SomeOtherConf");
```

^ But let's say I want to speak at another conference

---

```js
console.error("SomeOtherConf");
```

^ You know what. That's not cool. Let's make and error. So we started with logging UtahJs and end up with an error log about another conf What. 

---

![original, fit](git-diff.png)

^ let's diff this using normal `git giff` and see what happeend. ok , great. everything changed. thanks. how helpful of you. Can we do better?

---

# [fit] __*Yes we can!*__

^ And do you know why. Because Syntax Trees are great is why.

---

# *__Version 1__*

1. Create an AST from the new file and the old file
2. Run a tree-diffing algorithm
3. Display the differences in a more useful way


^ Let's break down how we'll achieve this spectacle.

---

```
git diff
```

^ first thing we need to do is this is get our output into something readable for js. This displays the changes, but we actually need the entire contents of the original file. In order to do that we need more information. 

---

![fit](diff-raw.png)

^ first thing we need to do is this is get our output into something readable for our javaScript progtram

---

![fit](diff-raw-notes-high.png)

^ What we care about here is the md5 hash of the original version of the file and the filename. We can use `git show` on the md5 hash to get
the original version of the file and we can use of course use the filename to get the current version. Now that we've learned how to read this output, let's teach our computer.

---

```js
git diff --raw | node compare.js
```

^  We'll start by piping it all into our node program .... Which we'll build out now ...

---

```js
// compare.js
```

----

```js
// let's read all of this input from stdin into an array
var lines = fs.readFileSync('/dev/stdin').toString().split('\n');
```

^ let's read all of the input off of stdin

---

```js
// lines now looks something like this
[':100644 100644 9a0b08f... 0000000... M	tree1.js']
```
^ yep. following me? because we're going to move quickly.

---

```js
lines.map(function(line) {
	var parts = line.split(' ');
	var file = parts.pop().split('\t');
	return [file[1], parts[2].slice(0, -3)];
});
```
^ next we'll map each of these lines into a tuple of the two important parts of that line

---

```js
// the key parts of each line in our git diff
[ [ "tree1.js", "9a0b08f"] ]
```

---

# Parsing

```js
// generate an AST from a string of code
espree.parse("console.log('UtahJS)");
```

^ once I get the actual JavaScript all i need to do is run `espree.parse()`. So let's convert our
tuple of files into some trees, sound goood?

---

```js
.map(function(files) {
	var after = fs.readFileSync(files[0]);
	var before = child_process.execSync("git show" + files[1]);
	return {
		filename: files[0],
		before: espree.parse(before, options),
		after: espree.parse(after, options)
	};
})
```
^ And now: Trees

---


```js
[{
		filename: "trees1.js",
		before: { type: "Program", body: [Object] },
	    after: { type: "Program", body: [Object] } 
}]
```

^ With that we now have gone from an array of stdin to an array of objects
with the filename and before an after trees... in not all the much code

---

```js
var lines = fs.readFileSync('/dev/stdin').toString().split('\n');
var trees = lines.map(function(line) {
	var parts = line.split(' ');
	var file = parts.pop().split('\t');
	return [path.resolve(file[1]), parts[2].slice(0, -3)];
}).filter(function(files) {
	return files[0].indexOf('.js') > -1;
}).map(function(files) {
	var after = fs.readFileSync(files[0]);
	var before = child_process.execSync("git show " + files[1]);
	return {
		filename: files[0],
		before: espree.parse(before, options),
		after: espree.parse(after, options)
	};
});
```

^ Here's what it looks like altogeher....and now....pictures.... 
Here's what those trees look like...

---

![fit](ast-utahjs.png)

^ Here's the first one. Where we're console.loggin("utahJS");

---

![fit](ast-error.png)

^ And of course the final change where we decide that was in error.....we've got the trees.

---

## __*Step 2*__


```js

// let's see if something changed
var different = deepEqual(treeBefore, treeAfter);
```

^ Now to comapre the two for differences, because they're _just objects_ we can use
a standard `deepEqual` function from a library like lo
dash or whatever. Here's a quick one I 
threw together that works well enough for this example


---

```js
function deepEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (Array.isArray(a)) {
		return a.every(function(item, i) {
			return deepEqual(item, b[i]);
		});
	}
	if (typeof a === 'object') {
		return Object.keys(a).every(function(key) {
			return deepEqual(a[key], b[key]);
		});
	}
	return false;
}
```

^ Super standad stuff. Not particularly fancy. You run that on these trees and it will tell you that there's a difference, but
we're interested in where the differences lie. To do that we have to add a few things. We know that each node in the tree is likely
to be an object, so we go to that conditional and we start messing around.

---
```js
if (typeof a === 'object') {
	var equal = Object.keys(a).every(function(key) {
		return deepEqual(a[key], b[key]);
	});
	if (!equal) {	
		 // log the type of any nodes that aren't equal
		console.log('[' + a.type + '] => [' + b.type + ']');
	}
	return equal;
}

// log the any raw values that aren't equal
console.log('"' + a + '" => "' + b + '"');
```

^ we'll modify this to log the node types when they aren't the same. we'll also log
the values when any comparison between literals is not the same.

---

```
git diff --raw | node compare.js 
```

```js
"log" => "error"
[Identifier] => [Identifier]
[MemberExpression] => [MemberExpression]
[CallExpression] => [CallExpression]
[ExpressionStatement] => [ExpressionStatement]
[Program] => [Program]
```

^ With this super small modification of our deep equal we're now able to see a little bit
more about what changed. 

---

![original, fit](git-diff.png)


^ Whereas before you see the whole code. Now you get to see the whole tree.

---

![fit](ast-diff.png)

^ Now you can see the full tree with changes marked clearly. It's powerful. For our last trick we're going to endeavor to make this actually useful on a large scale. 

---

![fit](huge-tree.png)


^ Of course where this cool tree diff falls apart is when you have more than 1 or 2 small changes.

---

# Useful Things To Detect

- require() statement changes?
- Changes to variables?
- Function argument changes
- Breaking Changes?

^ To keep this simple, but still useful I want to look at how you might go about detecting breaking changes.
Which we'll simply define as changes to inputs and outputs. How might we detect them?

---

# Let me tell you about building a house

---

```js
export function buildHouse(lot, color, size, bedrooms) {
	clearLot(lot);
	let foundation = buildFoundation(size);
	let walls = buildWalls(bedrooms);
	let paintedWalls = paintWalls(color, walls);
	let roof = buildRoof(foundation, walls);
	let house = foundation + paintedWalls + roof;

	// house is all done right-away
	return house;
}
```

^ Recently my family and I moved to lovely vashon Island, Washington. It's so nice and awesome and there are trees everywhere and whales and 
the power goes out all the time. And it's just amazing. And we bought this lot where we wnated to build a house and we picked out the color we
wanted and the size and how many bedrooms and we got our builder and told him we were all ready to go. This function represents how we thought
the process should go.
- clear the lot
- build the foundation
- the walls
- paint some stuff
- build a room
- and just like you're done. put it all together. move in. send me some dishes.
here's reality

---

```js
function getPermits(callback) {
	setTimeout(callback, 1.0519e10); // 4 months because trees
}

export function buildHouse(lot, color, size, bedrooms, callback) {
	getPermits((permits) => {
		clearLot(permits, lot);
		let foundation = buildFoundation(size);
		let walls = buildWalls(bedrooms);
		let paintedWalls = paintWalls(color, walls);
		let roof = buildRoof(foundation, walls);
		let house = foundation + paintedWalls + roof;

		// house will be ready in about a year
		callback(house);
	});
}

```

^ it turns out you need to get permits, before you can even clear the lot. It doesn;t
even matter that i bought the thing. They don't care. you can't touch it until the permits
come back, so what dooes that mean? We need a callback.
There are no promises when dealing with "King County". Trust me. (bad joke?)

---

![fit](git-dff-house.png)

^ even if we disable the whitespace the diff is almost useless. new stuff is mixed in with the old stuff. the return statement turning into a 
callback isn't that bad. the nesting of everything is gone. Because we added the getPermits function it doesnt' realize that only actual
change to our exported buildHouse functino was just the addition of the callback. It think's it's a new function. Which isn't so helpful. Let's
build smarter.

---

```
git diff --raw | node compare.js

house.js
1. The exported `buildHouse` function went from `return`ing to taking a callback function.
2. The private function `getPermits` was added.

```

^ What I want is for this to tell me what's going on in the world. The big picture. Let's see if we can get there in the next 3 minutes.
First let's recap what our data structure looks like:

---

# Our Data Structure


```js
[{
		filename: "trees1.js",
		before: { type: "Program", body: [Object] },
	    after: { type: "Program", body: [Object] } 
}]
```
^ So we have an array of objects representing the before and after ASTs for any changed file. Simple, yeah? In order to do something useful we'll need something more
powerful than our little `deepEqual` algorithm from before. We're goin gto use a tool called ESrecurse.

---

# Introducing ESRecurse

```js
var esrecurse = require('esrecurse');

esrecurse.visit(ast, {
	FunctionDeclaration: function(node) {
		console.log(node);
	}
});
```


^ ESrecurse has an interesting API. Where you basically pass in an object. With the names of the nodes in the tree that we care about. It will then pass you only those nodes. Handy for inspecting a subset of your tree. If you've ever written an ESLint rule or a babel plugin you'll probably be familiar with the API. For linters we use this to inspect nodes for violations to rule violations. You might inspect a `VariableDeclaration` to ensure you were using `let` instead of `var` or whatever. In our case we're going to look for nodes of type `ExportNamedDeclaration` and `FunctionDeclaration`.

---

# Inspecting Function Declarations

```js

function inspectFunction(node, visiblity) {
	return {
		name: node.id.name,
		params: node.params.map(function(param) {
			return param.name;
		}), // [ "buildHouse", "getPermits"]
		visibility: visiblity || "private",
		outputType: getOutputType(node) // "callback", "return", or ""
	};
}
```

^ Let's see what that function looks like....We care about a few things. 
1. Let's get the name of the function.
2. All of it's paramaters
3. We have something called visiblity which will tell us if it's being exported or not.
3. Lastly we get the output type.. >This is hard., but basically we just look to see if there's a callback paramater...

---

# Visiting Our Trees 

```js
.map(function(diff) {
	var functions = { before: {}, after: {} };
	esrecurse.visit(diff.before, {
	
		// export function a() {}
		ExportNamedDeclaration: function(node) { 
			var details = inspectFunction(node.declaration, "exported");
			functions.before[details.name] = details;
		},
		
		// function a() {}		
		FunctionDeclaration: function(node) { /* ... */
				 }		
	});
	// ...same for the after tree
	return {
		filename: diff.filename, 
		functions: functions
	};
})

```
^ Putting that altogeher.


---


```
git diff --raw | node compare.js
```

```js
[ filename: "house.js",
  exports: [ ][] { name: 'buildHouse',
      params: [ 'lot', 'color', 'size', 'bedrooms ],
  ed',
      outputType: 'return' },
 ] [ { name: 'buildHose',ted',
      params: [ 'lot', 'color', 'size', 'bedrooms', 'callback' ],
      outputType: 'callback' }ack] } ] }
```

---

^ Now with all of that in place our command gives us an array of arrays of objects that contain the exported function
names, their paramaters and the output type. Let's put it all together....

---

```
git diff --raw | node compare.js

house.js
1. The exported `buildHouse` function went from `return`ing to taking a callback function.
2. The private function `getPermits` was added.
```

^ Remember this is what we wanted...we wanted.

---



^ Here's how we get there...

---


# [fit] Getting Started

^ Now that i've hopefully wowed you with the possibilities, let's talk about getting started
in learning how to deal with ASTs.

---

2 things we need to know

---

Tooling

^1. What tooling is available to help tame these beasts

---

What does the JS AST look like?

^2. What does this AST look like

---

How many of you use *__babel__*?

^ To the first point. How many of use use babel?
I would definitley recommend looking at Babel Plugins as a great place to start if you're
interested in writing these "codemod" tools that change your JS from one thing to another.

---

![](babel-plugin.png)


^ Let's take a look at the example repo. It's 1 actual file. 

---

```js
module.exports = function (Babel) {
  return new Babel.Plugin("plugin-example", {
    visitor: {
      FunctionDeclaration: function (node, parent) {
        var id = node.id;
        node.type = "FunctionExpression";
        node.id   = null;

        return Babel.types.variableDeclaration("var", [
          Babel.types.variableDeclarator(id, node)
        ]);
      }
    }
  });
}
```

^ 15 lines of code. this is fractal level of how a tiny bit of code can lead to huge changes. And what do you have to know? Not very much!
What they rely on here is basic knowledge of the AST format. They're talkin about `FunctionDeclaration`s and basically replacing them with
`FunctionExpression` wrapped in a `VariableDeclaration`. It's not rocket science, but it can take your code to the moon.

---


```
   [  ]
    /\
   /  \
  /    \
[  ]  [  ]
```

^ Here's a tree.

---


#Quest2ions?























![](trees.jpg)

## Harnessing the power of Abstract Syntax Trees

---

# [fit] *__Parsers__* 

^ take JavaScript and turn it into a AST

---

```js
console.log("UtahJS");
```

---

![fit](ast-utahjs.png)

---
```js
{
	type: "Program",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "CallExpression",
				callee: {
					type: "MemberExpression",
					computed: false,
					object: {
						type: "Identifier",
						name: "console"
					},
					property: {
						type: "Identifier",
						name: "log"
					}
				},
				arguments: [
					{
						type: "Literal",
						value: "UtahJS",
						raw: "\"UtahJS\""
					}
				]
			}
		}
	]
}
```

^ In JavaScript an AST is basically a JSON representation of your code.I know what you're thinking. You like the other version better?
I do to. Let's stick with pictures...

---

![fit](ast-utahjs.png)

^ Isn't that betteR?

---

# ASTs are Everywhere

^ They're in browsers, in transpilers, minifiers. All of the cool build tools these days 
are relying on ASTs to safely turn your code into play doe.

---


# [fit] *__Acorn__*

^ is the parser to beat these days

^ it's used by babel, so you know it's good.

---

# [fit] *__Espree__*

^ Is the parser I know the best. It's a fork off esprima, with better ES6 stuff and it's what we use in ESLint.
Which I work on a bit.

---

# An *__AST__* gives you super powers

^ I mentioned already that an AST is basically a JSON representation of your code.
^ But I didn't mention that they can give you actual super powers. 
^ Once you understand how ASTs work you can use them to build things that have never been built before.
^ That change how we interact with our programs. 
^ In case you think I'm messing with you, let's build something amazing! Right here. Right now.


---

# JS Aware <br> *__git diff__*

^ This is just an example of the cool things you can do with ASTs.

---

```js
console.log("UtahJS");
```

^ Let's start with some code

---

```js
console.log("SomeOtherConf");
```

^ But let's say I want to speak at another conference

---

```js
console.error("SomeOtherConf");
```

^ You know what. That's not cool. Let's make and error. So we started with logging UtahJs and end up with an error log about another conf What. 

---

![original, fit](git-diff.png)

^ let's diff this using normal `git giff` and see what happeend. ok , great. everything changed. thanks. how helpful of you. Can we do better?

---

# [fit] __*Yes we can!*__

^ And do you know why. Because Syntax Trees are great is why.

---

# *__Version 1__*

1. Create an AST from the new file and the old file
2. Run a tree-diffing algorithm
3. Display the differences in a more useful way


^ Let's break down how we'll achieve this spectacle.

---

```
git diff
```

^ first thing we need to do is this is get our output into something readable for js. This displays the changes, but we actually need the entire contents of the original file. In order to do that we need more information. 

---

![fit](diff-raw.png)

^ first thing we need to do is this is get our output into something readable for our javaScript progtram

---

![fit](diff-raw-notes-high.png)

^ What we care about here is the md5 hash of the original version of the file and the filename. We can use `git show` on the md5 hash to get
the original version of the file and we can use of course use the filename to get the current version. Now that we've learned how to read this output, let's teach our computer.

---

```js
git diff --raw | node compare.js
```

^  We'll start by piping it all into our node program .... Which we'll build out now ...

---

```js
// compare.js
```

----

```js
// let's read all of this input from stdin into an array
var lines = fs.readFileSync('/dev/stdin').toString().split('\n');
```

^ let's read all of the input off of stdin

---

```js
// lines now looks something like this
[':100644 100644 9a0b08f... 0000000... M	tree1.js']
```
^ yep. following me? because we're going to move quickly.

---

```js
lines.map(function(line) {
	var parts = line.split(' ');
	var file = parts.pop().split('\t');
	return [file[1], parts[2].slice(0, -3)];
});
```
^ next we'll map each of these lines into a tuple of the two important parts of that line

---

```js
// the key parts of each line in our git diff
[ [ "tree1.js", "9a0b08f"] ]
```

---

# Parsing

```js
// generate an AST from a string of code
espree.parse("console.log('UtahJS)");
```

^ once I get the actual JavaScript all i need to do is run `espree.parse()`. So let's convert our
tuple of files into some trees, sound goood?

---

```js
.map(function(files) {
	var after = fs.readFileSync(files[0]);
	var before = child_process.execSync("git show" + files[1]);
	return {
		filename: files[0],
		before: espree.parse(before, options),
		after: espree.parse(after, options)
	};
})
```
^ And now: Trees

---


```js
[{
		filename: "trees1.js",
		before: { type: "Program", body: [Object] },
	    after: { type: "Program", body: [Object] } 
}]
```

^ With that we now have gone from an array of stdin to an array of objects
with the filename and before an after trees... in not all the much code

---

```js
var lines = fs.readFileSync('/dev/stdin').toString().split('\n');
var trees = lines.map(function(line) {
	var parts = line.split(' ');
	var file = parts.pop().split('\t');
	return [path.resolve(file[1]), parts[2].slice(0, -3)];
}).filter(function(files) {
	return files[0].indexOf('.js') > -1;
}).map(function(files) {
	var after = fs.readFileSync(files[0]);
	var before = child_process.execSync("git show " + files[1]);
	return {
		filename: files[0],
		before: espree.parse(before, options),
		after: espree.parse(after, options)
	};
});
```

^ Here's what it looks like altogeher....and now....pictures.... 
Here's what those trees look like...

---

![fit](ast-utahjs.png)

^ Here's the first one. Where we're console.loggin("utahJS");

---

![fit](ast-error.png)

^ And of course the final change where we decide that was in error.....we've got the trees.

---

## __*Step 2*__


```js

// let's see if something changed
var different = deepEqual(treeBefore, treeAfter);
```

^ Now to comapre the two for differences, because they're _just objects_ we can use
a standard `deepEqual` function from a library like lo
dash or whatever. Here's a quick one I 
threw together that works well enough for this example


---

```js
function deepEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (Array.isArray(a)) {
		return a.every(function(item, i) {
			return deepEqual(item, b[i]);
		});
	}
	if (typeof a === 'object') {
		return Object.keys(a).every(function(key) {
			return deepEqual(a[key], b[key]);
		});
	}
	return false;
}
```

^ Super standad stuff. Not particularly fancy. You run that on these trees and it will tell you that there's a difference, but
we're interested in where the differences lie. To do that we have to add a few things. We know that each node in the tree is likely
to be an object, so we go to that conditional and we start messing around.

---
```js
if (typeof a === 'object') {
	var equal = Object.keys(a).every(function(key) {
		return deepEqual(a[key], b[key]);
	});
	if (!equal) {	
		 // log the type of any nodes that aren't equal
		console.log('[' + a.type + '] => [' + b.type + ']');
	}
	return equal;
}

// log the any raw values that aren't equal
console.log('"' + a + '" => "' + b + '"');
```

^ we'll modify this to log the node types when they aren't the same. we'll also log
the values when any comparison between literals is not the same.

---

```
git diff --raw | node compare.js 
```

```js
"log" => "error"
[Identifier] => [Identifier]
[MemberExpression] => [MemberExpression]
[CallExpression] => [CallExpression]
[ExpressionStatement] => [ExpressionStatement]
[Program] => [Program]
```

^ With this super small modification of our deep equal we're now able to see a little bit
more about what changed. 

---

![original, fit](git-diff.png)


^ Whereas before you see the whole code. Now you get to see the whole tree.

---

![fit](ast-diff.png)

^ Now you can see the full tree with changes marked clearly. It's powerful. For our last trick we're going to endeavor to make this actually useful on a large scale. 

---

![fit](huge-tree.png)


^ Of course where this cool tree diff falls apart is when you have more than 1 or 2 small changes.

---

# Useful Things To Detect

- require() statement changes?
- Changes to variables?
- Function argument changes
- Breaking Changes?

^ To keep this simple, but still useful I want to look at how you might go about detecting breaking changes.
Which we'll simply define as changes to inputs and outputs. How might we detect them?

---

# Let me tell you about building a house

---

```js
export function buildHouse(lot, color, size, bedrooms) {
	clearLot(lot);
	let foundation = buildFoundation(size);
	let walls = buildWalls(bedrooms);
	let paintedWalls = paintWalls(color, walls);
	let roof = buildRoof(foundation, walls);
	let house = foundation + paintedWalls + roof;

	// house is all done right-away
	return house;
}
```

^ Recently my family and I moved to lovely vashon Island, Washington. It's so nice and awesome and there are trees everywhere and whales and 
the power goes out all the time. And it's just amazing. And we bought this lot where we wnated to build a house and we picked out the color we
wanted and the size and how many bedrooms and we got our builder and told him we were all ready to go. This function represents how we thought
the process should go.
- clear the lot
- build the foundation
- the walls
- paint some stuff
- build a room
- and just like you're done. put it all together. move in. send me some dishes.
here's reality

---

```js
function getPermits(callback) {
	setTimeout(callback, 1.0519e10); // 4 months because trees
}

export function buildHouse(lot, color, size, bedrooms, callback) {
	getPermits((permits) => {
		clearLot(permits, lot);
		let foundation = buildFoundation(size);
		let walls = buildWalls(bedrooms);
		let paintedWalls = paintWalls(color, walls);
		let roof = buildRoof(foundation, walls);
		let house = foundation + paintedWalls + roof;

		// house will be ready in about a year
		callback(house);
	});
}

```

^ it turns out you need to get permits, before you can even clear the lot. It doesn;t
even matter that i bought the thing. They don't care. you can't touch it until the permits
come back, so what dooes that mean? We need a callback.
There are no promises when dealing with "King County". Trust me. (bad joke?)

---

![fit](git-dff-house.png)

^ even if we disable the whitespace the diff is almost useless. new stuff is mixed in with the old stuff. the return statement turning into a 
callback isn't that bad. the nesting of everything is gone. Because we added the getPermits function it doesnt' realize that only actual
change to our exported buildHouse functino was just the addition of the callback. It think's it's a new function. Which isn't so helpful. Let's
build smarter.

---

```
git diff --raw | node compare.js

house.js
1. The exported `buildHouse` function went from `return`ing to taking a callback function.
2. The private function `getPermits` was added.

```

^ What I want is for this to tell me what's going on in the world. The big picture. Let's see if we can get there in the next 3 minutes.
First let's recap what our data structure looks like:

---

# Our Data Structure


```js
[{
		filename: "trees1.js",
		before: { type: "Program", body: [Object] },
	    after: { type: "Program", body: [Object] } 
}]
```
^ So we have an array of objects representing the before and after ASTs for any changed file. Simple, yeah? In order to do something useful we'll need something more
powerful than our little `deepEqual` algorithm from before. We're goin gto use a tool called ESrecurse.

---

# Introducing ESRecurse

```js
var esrecurse = require('esrecurse');

esrecurse.visit(ast, {
	FunctionDeclaration: function(node) {
		console.log(node);
	}
});
```


^ ESrecurse has an interesting API. Where you basically pass in an object. With the names of the nodes in the tree that we care about. It will then pass you only those nodes. Handy for inspecting a subset of your tree. If you've ever written an ESLint rule or a babel plugin you'll probably be familiar with the API. For linters we use this to inspect nodes for violations to rule violations. You might inspect a `VariableDeclaration` to ensure you were using `let` instead of `var` or whatever. In our case we're going to look for nodes of type `ExportNamedDeclaration` and `FunctionDeclaration`.

---

# Inspecting Function Declarations

```js

function inspectFunction(node, visiblity) {
	return {
		name: node.id.name,
		params: node.params.map(function(param) {
			return param.name;
		}), // [ "buildHouse", "getPermits"]
		visibility: visiblity || "private",
		outputType: getOutputType(node) // "callback", "return", or ""
	};
}
```

^ Let's see what that function looks like....We care about a few things. 
1. Let's get the name of the function.
2. All of it's paramaters
3. We have something called visiblity which will tell us if it's being exported or not.
3. Lastly we get the output type.. >This is hard., but basically we just look to see if there's a callback paramater...

---

# Visiting Our Trees 

```js
.map(function(diff) {
	var functions = { before: {}, after: {} };
	esrecurse.visit(diff.before, {
	
		// export function a() {}
		ExportNamedDeclaration: function(node) { 
			var details = inspectFunction(node.declaration, "exported");
			functions.before[details.name] = details;
		},
		
		// function a() {}
		FunctionDeclaration: function(node) { /* ... */ }
		
	});
	// ...same for the after tree
	return {
		filename: diff.filename, 
		functions: functions
	};
})

```
^ Putting that altogether.

---

```
git diff --raw | node compare.js
```

```js
[ filename: "house.js",
  functions: {
  	before: [ { name: 'buildHouse',
      params: [ 'lot', 'color', 'size', 'bedrooms' ],
      visibility: 'exported',
      outputType: 'return' },
    after: [ { name: 'buildHouse',
        visibility: 'exported',
        params: [ 'lot', 'color', 'size', 'bedrooms', 'callback' ],
        outputType: 'callback' },
      { name: 'getPermits',
        visibility: 'private',
        params: [ 'callback' ],
        outputType: 'callback' } ] }
```

---

^ Now with all of that in place our command gives us an array of arrays of objects that contain the exported function
names, their paramaters and the output type. Let's put it all together....

---

```
git diff --raw | node compare.js

house.js
1. The exported `buildHouse` function went from `return`ing to taking a callback function.
2. The private function `getPermits` was added.
```

^ Remember this is what we wanted...we wanted.

---



^ Here's how we get there...

---

# [fit] Getting Started

^ Now that i've hopefully wowed you with the possibilities, let's talk about getting started
in learning how to deal with ASTs.

---

2 things we need to know

---

Tooling

^1. What tooling is available to help tame these beasts

---

What does the JS AST look like?

^2. What does this AST look like

---

How many of you use *__babel__*?

^ To the first point. How many of use use babel?
I would definitley recommend looking at Babel Plugins as a great place to start if you're
interested in writing these "codemod" tools that change your JS from one thing to another.

---

![](babel-plugin.png)


^ Let's take a look at the example repo. It's 1 actual file. 

---

```js
module.exports = function (Babel) {
  return new Babel.Plugin("plugin-example", {
    visitor: {
      FunctionDeclaration: function (node, parent) {
        var id = node.id;
        node.type = "FunctionExpression";
        node.id   = null;

        return Babel.types.variableDeclaration("var", [
          Babel.types.variableDeclarator(id, node)
        ]);
      }
    }
  });
}
```

^ 15 lines of code. this is fractal level of how a tiny bit of code can lead to huge changes. And what do you have to know? Not very much!
What they rely on here is basic knowledge of the AST format. They're talkin about `FunctionDeclaration`s and basically replacing them with
`FunctionExpression` wrapped in a `VariableDeclaration`. It's not rocket science, but it can take your code to the moon.

---


```
   [  ]
    /\
   /  \
  /    \
[  ]  [  ]
```

^ Here's a tree.

---

---


#Quest2ions?