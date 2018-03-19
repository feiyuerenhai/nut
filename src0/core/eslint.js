const codeFrame = require('babel-code-frame');

const Linter = require("eslint").Linter;
const linter = new Linter();

const config = {
	parser: "babel-eslint",
	extends: ["eslint:recommended"],
    plugins: ["class-property"],
	parserOptions: {
        "ecmaVersion": 7,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    rules: {
        semi: 2
    },
};

const verify = (code, config) => {
	return linter.verify(code, config);
};

const displayError = (code, error) => {
	const {fatal, line, column, message} = error;
	const frame = codeFrame(code, line, column);
	return `${message}`;
};

module.exports = module => {
	const messages = verify(module.raw, config);
	const fatalExceptions = messages.filter(exception => {
		return exception.fatal;
	});
	const fatal = fatalExceptions.length !== 0;
	const message = module.filepath + '\n' + fatalExceptions.map(exception => {
		return displayError(module.raw, exception);
	}).join('\n\n');
	return {
		fatal,
		message,
	};
};
