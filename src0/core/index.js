
var uniq = require('uniq');
var Events = require('events'); 
var events = new Events.EventEmitter();
const {readFile, resolveLocal} = require('../util');
const Engine = require('./engine');

// 树扁平化
const uniqFlatten = tree => {
	// 转换类数组树为数组
	const _arraify = tree => {
		return Array.prototype.slice.call(tree);
	};
	// 深遍历树得到所有枝干的数组
	let trunks = [];
	const _traverse = tree => {
		_arraify(tree).forEach(_tree => {
			trunks.push(_tree);
			_traverse(_tree.dependencies)
		})
	};
	_traverse(tree);
	trunks = trunks.reverse();
	// 得到不重复枝干数组
	let uniqueTrunks = [];
	let cache = {};
	trunks.forEach(module => {
		if(!cache[module.filepath]){
			uniqueTrunks.push(module);
			console.log('💎 ', module.filepath);
			cache[module.filepath] = true;
		};
	});
	return uniqueTrunks;
}

// 访问一个可读的js文件，得到其依赖树

// 一个文件路径对应一个md5戳，使用md5戳作为版本号
// STAMPS中存放的应该是所有文件最新版本的md5戳对应关系
let STAMPS = {};
let FILES = [];
// 用于保存所有模块
// ${文件路径+$+md5戳}作为一个模块的版本标识

const stamped = (moduleFilePath) => {
	return moduleFilePath + '$' + ( STAMPS[moduleFilePath] || '' );
};

let MODULES = {};

// 构建入口
let ENTRYFILEPATH;
// 构建
async function build(entry){
	const t_start = +(new Date);

	FILES = [];
	var tree = {length: 0};
	let isBuildSuccess = true;
	try{
		await Engine(MODULES, FILES, STAMPS, ENTRYFILEPATH, ENTRYFILEPATH, tree, []);
	}catch(e){
		isBuildSuccess = false;
		console.log('💀 ', e.message);
	}
	// 
	events.emit('watch', uniq(FILES), isBuildSuccess);
	// 
	var queue = uniqFlatten(tree).map(trunk => {
		return MODULES[ stamped(trunk.filepath) ];
	});

	const t_end = +(new Date);
	console.log('🕑 ', t_end - t_start, 'ms\n');

	if(isBuildSuccess){
		events.emit('bundle', queue);
	};
};

// 初始化
events.on('init', async entry => {
	ENTRYFILEPATH = resolveLocal(entry, '');
	await build(ENTRYFILEPATH);
});

// 监控文件改变时触发
events.on('census', async file => {
	try{
		// 尝试读取文件，如果读取成功
		// 先计算其内容是否改变
		const raw = await readFile(file);
		const print = md5(raw);
		// 如果未记录过，或者记录了但是内容改变了，则更新文件注册表
		if(!STAMPS[file] || (STAMPS[file] && STAMPS[file] !== print) ){
			STAMPS[file] = print;
			// 这两种情况要重新构建
			await build(ENTRYFILEPATH);
		};
	}catch(e){
		// 尝试读取文件，如果读取失败，说明：
		// 由watcher监控文件变动传递来的文件已经不存在
		// 则删除该文件注册信息
		STAMPS[file] = undefined;
		// 依然要重新构建
		await build(ENTRYFILEPATH);
	};
});

module.exports = events;
