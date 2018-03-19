var path = require('path');
var fs = require('fs');
var md5 = require('md5');

var resolve = require('resolve');

var babylon = require('babylon');
var translator = require('./translator.js');
var eslint = require('./eslint.js');
const {readFile, resolveLocal} = require('../util');
const visit = require('./visitor');

// 生成define函数
function makeDefine(id, code){
	return 'define('+(id && ('"'+id+'", '))+'function(require, exports, module) {\n' + (code || '') + '\n})';
}

// 访问一个可读的js文件，生成其在依赖树中的trunk
module.exports = async function generateTrunk(MODULES, FILES, STAMPS, moduleFilePath, name, tree, past){



	const stamped = (moduleFilePath) => {
		return moduleFilePath + '$' + ( STAMPS[moduleFilePath] || '' );
	};
	


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
			await generateTrunk(MODULES, FILES, STAMPS, moduleFilePath, moduleFilePath, _tree, past);
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