
var path = require('path');
var fs = require('fs');
var md5 = require('md5');
var uniq = require('uniq');

var Events = require('events'); 
var events = new Events.EventEmitter();

var resolve = require('resolve');

var babylon = require('babylon');

var translator = require('./translator.js');
var parseSass = require('./sass.js');
var eslint = require('./eslint.js');

const {readFile, resolveLocal} = require('../util');

console.log('------------------>')

// 生成define函数
function makeDefine(id, code){
	return 'define('+(id && ('"'+id+'", '))+'function(require, exports, module) {\n' + (code || '') + '\n})';
}

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
	// console.log('----->', trunks)
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

const visit = require('./visitor');

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
// 访问一个可读的js文件，生成其在依赖树中的trunk
async function generateTrunk(moduleFilePath, name, tree, past){
	
	/*避免循环依赖*/
	// 抄下抵达该模块的过程中都经过了哪些过往模块
	const _past = [...past];
	// 当前模块也记录下并传递给下级模块
	past.push(moduleFilePath);

	FILES.push(moduleFilePath);

	const type = path.extname(moduleFilePath).split('.')[1];

	let module;
	let dependencies;
	// 先尝试取文件md5戳，有可能取不到，取不到说明未缓存过
	// (如果stamp取不到，也不可能走进这里)
	if(MODULES[ stamped(moduleFilePath) ]){
		// 命中缓存则直接从缓存中取
		console.log('🏓 ', moduleFilePath);
		// 
		module = MODULES[ stamped(moduleFilePath) ];
		// 从缓存取依赖
		dependencies = module.dependencies;
	}else{
		// 未命中缓存则开始解析
		console.log('🔥 ', moduleFilePath);
		// 文件中的字符串
		let raw = await readFile(moduleFilePath);
		// 文件指纹
		STAMPS[moduleFilePath] = md5(raw);
		// 基础信息
		module = {
			name: name,
			filepath: moduleFilePath,
			type: type,
			raw: raw,
			past: _past,
		};

		// eslint
		if(/^jsx$|^js$/.test(type)){
			const {fatal, message} = eslint(module);
			if(fatal){
				throw new Error(message);
				return;
			}
		};

		// scss
		if( /^css$|^scss$|^less$/.test(type) ){
			module.generated = makeDefine(module.name, '')
			dependencies = module.dependencies = [];
			module.dependings = [];
		};

		if( /^js$/.test(type) ){
			module.es5code = raw;
		};
		if( /^jsx$/.test(type) ){
			module.es5code = translator.JSXtoJS(raw);
		};
		if( /^jsx$|^js$/.test(type) ){

			const ast = babylon.parse(module.es5code, {sourceType: "module"});
			module.dependings = [];

			const dependingIds = visit(ast);
			for(let i = 0; i < dependingIds.length; i++){
				let {moduleId, source} = dependingIds[i];
				// 丢弃核心模块
				if(resolve.isCore(moduleId))return;
				// 模块id的真实路径
				const moduleIdFilePath = resolveLocal(moduleFilePath, moduleId);
				// 修改ast - 转换moduleId为真实路径
				source.value = moduleIdFilePath;
				module.dependings.push(moduleIdFilePath);
			};

			// 修改后的ast
			module.ast = ast;
			// 生成代码
			const code = translator.ASTtoJS(ast);
			module.generated = makeDefine(module.name, code);
		};
		// 缓存
		MODULES[ stamped(moduleFilePath) ] = module;
	};

	// 递归调用
	let _tree = {length: 0};
	async function recursion(module) {
		for(const moduleFilePath of module.dependings) {
			// 遍历该模块的子依赖路径，如果发现与过往模块重复，则直接跳过
			if(_past.includes(moduleFilePath)){
				continue;
			};
			await generateTrunk(moduleFilePath, moduleFilePath, _tree, past);
		}
	};
	await recursion(module);

	dependencies = module.dependencies = _tree;

	const trunk = {
		filepath: moduleFilePath,
		type,
		dependencies,
	};

	tree[tree.length++] = trunk;
};

// 构建入口
let ENTRYFILEPATH;
// 构建
async function build(entry){
	const t_start = +(new Date);

	FILES = [];
	var tree = {length: 0};
	let isBuildSuccess = true;
	try{
		await generateTrunk(ENTRYFILEPATH, ENTRYFILEPATH, tree, []);
	}catch(e){
		isBuildSuccess = false;
		console.log('💀 ', e.message);
	}
	// 
	events.emit('watch', uniq(FILES), isBuildSuccess);
	// 
	var queue = uniqFlatten(tree);
	// 
	var rrrQueue = queue.map(trunk => {
		return MODULES[ stamped(trunk.filepath) ];
	});

	const t_end = +(new Date);
	console.log('🕑 ', t_end - t_start, 'ms\n');

	if(isBuildSuccess){
		events.emit('bundle', rrrQueue);
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
