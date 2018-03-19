const Events = require('events');
const self = new Events.EventEmitter();
const path = require('path');

const Terminal = require('./terminal');

const {relative, readFile, writeFile, resolveLocal} = require('../util');

const Engine = require('./engine');

const JSPackager = require('../packagers/JSPackager');
const CSSPackager = require('../packagers/CSSPackager');

const distDir = path.resolve('./dist/bundle');

const buildErr = async (dist, msg = '') => {
	let errJS = await readFile( resolveLocal(__dirname, '../error/index.js') );
	errJS = errJS.replace('${err-content}', msg);
	let errCSS = await readFile( resolveLocal(__dirname, '../error/index.css') );
	await writeFile(distDir + '.js', errJS);
	await writeFile(distDir + '.css', errCSS);
}

let isBuildSuccess = false;

let entry;

const watch = require('./watcher');
const watchAll = watch([], async (filepath)=>{
	await build(entry, filepath);
});

Engine.events.on('module_parse', Terminal.parse);

Engine.events.on('module_change', Terminal.change);

const build = async (entry, changedFilePath) => {

	const _t = Date.now();

	let error;
	let queue = [];
	try{
		queue = await Engine.run(entry, changedFilePath);
	}catch(e){
		error = e;
		Terminal.fail((e.formatted||e.message)+'\n').stop();
	};

	const isBuildSuccess = !error;

	Terminal.processing(`> ${distDir}`);

	// 
	let files = queue.map(module => module.filepath);
	let {currentList, addWatchList, unWatchList} = watchAll(files, !isBuildSuccess);

	if(!isBuildSuccess) return await buildErr(distDir);

	unWatchList.forEach(Terminal.remove);

	const umdModuleLoader = await readFile( resolveLocal(__dirname, './almond.js') );

	try{
		const js = await JSPackager(queue, umdModuleLoader, '\n\nrequire("' + relative(entry) + '");');
		await writeFile(distDir + '.js', js);
	}catch(e){
		Terminal.fail((e.formatted || e.message)+'\n').stop();
		return await buildErr(distDir);
	};

	try{
		const css = await CSSPackager(queue);
		await writeFile(distDir + '.css', css);
	}catch(e){
		Terminal.fail((e.formatted || e.message)+'\n').stop();
		return await buildErr(distDir);
	};

	Terminal.succeed(`${ Date.now() - _t }ms\n`);
};

self.on('init', async(filepath)=>{
	entry = filepath;
	Terminal.start(filepath);
	await build(entry);
});

module.exports = self;