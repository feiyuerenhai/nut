
var path = require('path');
var pretty = require('js-beautify');

const {readFile, writeFile, resolveLocal} = require('./util');

const watch = require('./core/watcher');
var core = require('./core/index');

const JSPackager = require('./packagers/JSPackager');
const CSSPackager = require('./packagers/CSSPackager');

module.exports = function init(entry){
	const _entry = path.resolve(__dirname, entry);

	console.log('🤖 ', _entry);

	setInterval(()=>{}, 10);
	let files = [];

	const watchAll = watch([], (filepath)=>{
		core.emit('census', filepath);
	})

	core.on('watch', (theseFiles, isBuildSuccess)=>{
		watchAll(theseFiles, !isBuildSuccess);
	});

	core.on('bundle', async (queue)=>{
		// 
		const loader = await readFile( resolveLocal(__dirname, './core/almond.js') );
		var js = await JSPackager(queue, loader, '\n\nrequire("'+_entry+'");');
		await writeFile('./project/bundle.js', js);
		// 
		var css = await CSSPackager(queue);
		await writeFile('./project/bundle.css', css);
		// 
	});
	core.emit('init', _entry);
};