const path = require('path');
const core = require('./core/index');

module.exports = function init(entry, options = {}) {
	// running man
	setInterval(() => { }, 10);
	// 入口
	const _entry = path.resolve(__dirname, entry);
	core.emit('init', _entry, options);
};