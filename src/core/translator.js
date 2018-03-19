const babel = require('babel-core');
const babel_env = require("babel-preset-env");

const ASTtoEs5 = ast => {
	let module = babel.transformFromAst(ast, '', {
		"presets": [babel_env],
		"plugins": [
			require("babel-plugin-transform-es2015-modules-commonjs")
		],
	});
	return module.code;
};

// babel-plugin-transform-async-generator-functions
// babel-plugin-transform-async-to-generator
// babel-plugin-transform-es2015-arrow-functions
// babel-plugin-transform-es2015-block-scoped-functions
// babel-plugin-transform-es2015-block-scoping
// babel-plugin-transform-es2015-classes
// babel-plugin-transform-es2015-computed-properties
// babel-plugin-transform-es2015-destructuring
// babel-plugin-transform-es2015-duplicate-keys
// babel-plugin-transform-es2015-for-of
// babel-plugin-transform-es2015-function-name
// babel-plugin-transform-es2015-literals
// babel-plugin-transform-es2015-modules-amd
// babel-plugin-transform-es2015-object-super
// babel-plugin-transform-es2015-parameters
// babel-plugin-transform-es2015-shorthand-properties
// babel-plugin-transform-es2015-sticky-regex
// babel-plugin-transform-es2015-template-literals
// babel-plugin-transform-es2015-typeof-symbol
// babel-plugin-transform-es2015-unicode-regex
// babel-plugin-transform-exponentiation-operator
// babel-plugin-transform-react-jsx-source
// babel-plugin-transform-regenerator

const Es7toEs5 = code => {
	let module = babel.transform(code, {
		"presets": [babel_env],
		"plugins": [
			require("babel-plugin-transform-decorators-legacy").default,
			require("babel-plugin-transform-decorators"),
			require("babel-plugin-transform-class-properties"),
			require("babel-plugin-transform-class-constructor-call"),
			require("babel-plugin-transform-do-expressions"),
			require("babel-plugin-transform-es2015-spread"),
			require("babel-plugin-transform-es3-member-expression-literals"),
			require("babel-plugin-transform-es3-property-literals"),
			require("babel-plugin-transform-export-extensions"),
			require("babel-plugin-transform-flow-strip-types"),
			require("babel-plugin-transform-function-bind"),
			require("babel-plugin-transform-inline-environment-variables"),
			require("babel-plugin-transform-object-rest-spread"),
			require("babel-plugin-transform-object-assign"),
			require("babel-plugin-transform-proto-to-assign"),
			require("babel-plugin-transform-react-jsx"),
			require("babel-plugin-transform-react-jsx-self"),
			// require("babel-plugin-transform-react-jsx-source"),
			require("babel-plugin-transform-react-display-name"),
			require("babel-plugin-transform-strict-mode"),
		]
	});
	return module.code;
};

module.exports = {ASTtoEs5, Es7toEs5};
