const sass = require('node-sass');

module.exports = data => {
	return new Promise((resolve, reject) => {
		sass.render({
			data,
		}, (err, result) => {
			if(err || !result) return reject(err);
			const css = result.css.toString();
			return resolve(css);
		});
	});
};
