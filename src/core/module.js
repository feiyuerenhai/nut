const path = require('path');
const md5 = require('md5');
const fs = require('fs');
const resolve = require('resolve');

const {readFile, resolveLocal, relative} = require('../util');
const babylon = require('babylon');
const visit = require('./visitor');
const eslint = require('./eslint.js');
const translator = require('./translator.js');

const NODE_DIR = 'node_modules';

// 生成define函数
const makeDefine = function(id, code){
	return 'define('+(id && ('"'+id+'", '))+'function(require, exports, module) {\n' + (code || '') + '\n})';
}

// 是否为发行版
const maybeProduction = p => {
	return path.basename(p).toLowerCase().indexOf('min.') !== -1;
}

// 根据名称和路径生成一个模块
module.exports = (moduleFilePath, callback) => {
	try{
		let error;
		fs.readFile(moduleFilePath, 'utf-8', (err, raw) => {
			if(err){
				error = err;
				return callback(error, null);
			};
			// 文件类型
			const type = path.extname(moduleFilePath).split('.')[1];
			// 相对路径
			const rpath = relative(moduleFilePath);
			// 基础信息
			let module = {
				name: rpath,
				maybeThirdParty: rpath.indexOf( NODE_DIR ) == 0,
				filepath: moduleFilePath,
				type: type,
				md5: md5(raw),
				raw: raw,
				dependings: [],
			}

			if( /^jsx$|^js$/.test(type) ){

				// 尝试eslint
				if(!module.maybeThirdParty){
					const {fatal, message} = eslint(module);
					if(fatal){
						error = new Error(message);
						return callback(error, null);
					};
				}

				// 尝试将所有非第三库的es6+代码转换为es5
				if(!module.maybeThirdParty){
					try{
						module.es5code = translator.Es7toEs5(raw);
					}catch(e){
						error = e;
						return callback(error, null);
					}
				}else{
					// 第三方库中的直接使用源码
					module.es5code = raw;
				}

				// 为三方库且为发行版时不解析ast
				if(module.maybeThirdParty && maybeProduction(module.filepath)){
					module.generated = makeDefine(module.name, '');
				}else{
					// 解析代码生成静态语法树ast，访问ast得到依赖
					let ast;
					try{
						ast = babylon.parse(module.es5code, {sourceType: "module"});
					}catch(e){
						error = e;
						return callback(error, null);
					};
					const dependingIds = visit(ast);
					for(let i = 0; i < dependingIds.length; i++){
						let {moduleId, source} = dependingIds[i];
						// 丢弃核心模块
						if(resolve.isCore(moduleId))return;
						// 模块id的真实路径
						let moduleIdFilePath;
						try{
							moduleIdFilePath = resolveLocal(moduleFilePath, moduleId);
						}catch(e){
							error = e;
							return callback(error, null);
						};
						// 修改ast - 转换moduleId为真实路径
						source.value = relative(moduleIdFilePath);
						module.dependings.push(moduleIdFilePath);
					};
					// 生成代码
					let code;
					try{
						code = translator.ASTtoEs5(ast);
					}catch(e){
						error = e;
						return callback(error, null);
					};
					module.generated = makeDefine(module.name, code);
					ast = null;
				}
			}else if( /^css$|^scss$|^less$/.test(type) ){
				// css
				module.generated = makeDefine(module.name, '');
				dependencies = module.dependencies = [];
			}

			return callback(error, module);
		})
	}catch(error){
		return callback(error, null);
	}
}
