const UglifyJS = require("uglify-js");

module.exports = code => {
	const result = UglifyJS.minify(code, {compress: { unused: true, dead_code: true }});
	return result.code;
};
