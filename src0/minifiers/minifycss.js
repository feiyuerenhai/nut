const cssnano = require('cssnano');
const postcss = require('postcss');

module.exports = css => {
	return postcss([cssnano]).process(css, {from: undefined, to: undefined});
};
