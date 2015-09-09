// requires
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var espree = require('espree');
var esrecurse = require('esrecurse');
var util = require('util');

// parser options
var options = { ecmaFeatures: { modules: true, arrowFunctions: true, blockBindings: true } };

// read input
var lines = fs.readFileSync('/dev/stdin').toString().split('\n');

// convert the lines into ASTs
var trees = lines.filter(function(line) { return line; }).map(function(line) {
	var parts = line.split(' ');
	var file = parts.pop().split('\t');
	return [path.resolve(file[1]), parts[2].slice(0, -3)];
}).filter(function(filenames) {
	return filenames[0].indexOf('.js') > -1;
}).map(function(filenames) {
	var filename = filenames[0];
	var hash = filenames[1];
	var after, before;
	try {
		after = fs.readFileSync(filename);
		before =  child_process.execSync('git show ' + hash);
	} catch(e) {
		console.error(e.stack);
	}
	return {
		filename: filename,
		before: espree.parse(before, options),
		after: espree.parse(after, options)
	};
});

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
		var o = Object.keys(a).every(function(key) {
			return deepEqual(a[key], b[key]);
		});
		if (!o) {
			console.log('"[' + a.type + ']" => "[' + b.type + ']"');
		}
		return o;
	}
	console.log('"' + a + '" => "' + b + '"');
	return false;
}

// console.log(trees.length);
trees.forEach(function(diff) {
	// deepEqual(diff.before, diff.after);
});


// compare 2 trees for differences in function
function getChangedFunctions(tree1, tree2) {
	var functions1 = [];
	var functions2 = [];
	function visitor(store) {
		return {
			FunctionExpression: function (node) {
				store.push({
					name: node.id && node.id.name || "[anonymous]", params: node.params.map(function (param) {
						return param.name;
					})
				});
			},
			FunctionDeclaration: function (node) {
				store.push({
					name: node.id.name, params: node.params.map(function (param) {
						return param.name;
					})
				});
			}
		};
	}
	esrecurse.visit(tree1, visitor(functions1));
	esrecurse.visit(tree2, visitor(functions2));
	return functions1.length + " vs. " + functions2.length;
}

function getChangedVariables(tree1, tree2) {
	var variables1 = [];
	var variables2 = [];
	function visitor(store) {
		return {
			VariableDeclarator: function (node) {
				store.push(node.id && node.id.name);
			},
			FunctionDeclaration: function (node) {
				store.push(node.id && node.id.name || '[anonymous]');
			}
		};
	}
	esrecurse.visit(tree1, visitor(variables1));
	esrecurse.visit(tree2, visitor(variables2));
	return variables1.map(function(variable) {
		return '-' + variable;
	}).concat(variables2.map(function(variable) {
		return '+' + variable;
	}));
}

function getOutputType(node) {
	var params = node.declaration.params.map(function(param) {
		return param.name;
	});
	var hasCallback = params[params.length - 1] === 'callback';
	var body = node.declaration.body.body || node.declaration.body;
	var hasReturn = body.some(function(node) {
		return node.type === 'ReturnStatement';
	});
	var returnOrExecute = hasReturn ? 'return' : '';
	return hasCallback ? 'callback' : returnOrExecute;
}

function getChangedExports(before, after) {
	var thing1 = {}, thing2 = {};
	function inspectExport(result, node) {
		result[node.declaration.id.name] = {
			name: node.declaration.id.name,
			params: node.declaration.params.map(function(param) {
				return param.name;
			}),
			outputType: getOutputType(node)
		};
	}
	esrecurse.visit(before, {
		ExportNamedDeclaration: inspectExport.bind(null, thing1)
	});
	esrecurse.visit(after, {
		ExportNamedDeclaration: inspectExport.bind(null, thing2)
	});
	return {
		before: thing1,
		after: thing2
	};
}

// convert the trees into some useful info
var diffs = trees.map(function(diff) {
	return {
		filename: diff.filename,
		exports: getChangedExports(diff.before, diff.after)
		// functions: getChangedFunctions(diff.before, diff.after),
		// variables: getChangedVariables(diff.before, diff.after)
	};
});

function getWhatHappened(exported) {
	if (!exported.before) {
		return "was added"
	}
	if (!exported.after) {
		return "was removed"
	}
	if (exported.before.outputType !== exported.after.outputType) {
		return "went from a " + exported.before.outputType + " to a " + exported.after.outputType;
	}
}

function getActualReadable(exports) {
	return Object.keys(exports).reduce(function(prev, curr, i) {
		var visiblity = "exported";
		var name = curr;
		var whatHappened = getWhatHappened(exports[curr]);
		var info = "The " + visiblity + " `" + name + "` function " + whatHappened + ".";
		return prev + (i + 1) + ". " + info + "\n";
	}, "");
}

function getReadableExports(exports) {
	var exported = Object.keys(exports.after).reduce(function(prev, curr) {
		prev[curr] = {
			before: exports.before[curr],
			after: exports.after[curr]
		};
		return prev;
	}, {});
	return getActualReadable(exported);
}

// console.log(util.inspect(miffs, { depth: null }));

var miffs = diffs.map(function(diff) {
	// console.log(diff);
	return diff.filename + "\n" + getReadableExports(diff.exports);
}).join("\n");

console.log(miffs);


