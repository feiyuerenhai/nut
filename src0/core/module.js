var path = require('path');
var md5 = require('md5');

var resolve = require('resolve');

const {readFile, resolveLocal, relative} = require('../util');
var babylon = require('babylon');
const visit = require('./visitor');
var eslint = require('./eslint.js');
var translator = require('./translator.js');

// 生成define函数
function makeDefine(id, code){
	return 'define('+(id && ('"'+id+'", '))+'function(require, exports, module) {\n' + (code || '') + '\n})';
};

// 根据名称和路径生成一个模块
module.exports = async (moduleFilePath)=>{
	// 未命中缓存则开始解析
	console.log('🔥 ', moduleFilePath);
	// 文件类型
	const type = path.extname(moduleFilePath).split('.')[1];
	// 文件中的字符串
	let raw = await readFile(moduleFilePath);
	// 基础信息
	let module = {
		name: relative(moduleFilePath),
		filepath: moduleFilePath,
		type: type,
		md5: md5(raw),
		raw: raw,
	};
	// eslint
	if(/^jsx$|^js$/.test(type) && module.name.indexOf('node_modules')!==0){
		const {fatal, message} = eslint(module);
		if(fatal){
			throw new Error(message);
			return;
		};
	};
	// scss
	if( /^css$|^scss$|^less$/.test(type) ){
		module.generated = makeDefine(module.name, '');
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
			source.value = relative(moduleIdFilePath);
			module.dependings.push(moduleIdFilePath);
		};
		// 修改后的ast
		module.ast = ast;
		// 生成代码
		const code = translator.ASTtoJS(ast);
		module.generated = makeDefine(module.name, code);
	};

	return module;
};