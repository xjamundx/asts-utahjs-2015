// requires
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var espree = require('espree');
var esrecurse = require('esrecurse');
var util = require('util');

// parser options
var options = { ecmaFeatures: { modules: true } };

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

// convert the trees into some useful info
var diffs = trees.map(function(diff) {
	return {
		filename: diff.filename,
		functions: getChangedFunctions(diff.before, diff.after),
		variables: getChangedVariables(diff.before, diff.after)
	};
});

console.log(util.inspect(diffs, { depth: null }));

