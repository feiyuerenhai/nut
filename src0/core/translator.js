const babel = require('babel-core');
const babel_env = require("babel-preset-env");

const ASTtoJS = ast => {
	let module = babel.transformFromAst(ast, '', {
		"presets": [babel_env],
		"plugins": [
			require("babel-plugin-transform-es2015-modules-commonjs")
		],
	});
	return module.code;
};

const JSXtoJS = code => {
	let module = babel.transform(code, {
		"presets": [babel_env],
		"plugins": [
			require("babel-plugin-transform-class-constructor-call"),
			require("babel-plugin-transform-class-properties"),
			require("babel-plugin-transform-decorators"),
			// require("babel-plugin-transform-decorators-legacy"),
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

module.exports = {ASTtoJS, JSXtoJS};
