const envify = require('../core/JSEnvify');
const minifyjs = require('../minifiers/minifyjs');

/*JS打包器*/
module.exports = async (queue, pre = '', post = '') => {
	const JSQueue = queue;
	const facs = JSQueue.map(module => {
		return module.generated
	});
	let code = pre + '\n' + facs.join(';\n') + ';' + post;
	code = await envify(code);
	// code = minifyjs(code);
	return code;
};