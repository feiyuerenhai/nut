const path = require('path');
const fs = require('fs');

const resolve = require('resolve');
/*
* 接受一个参考路径，以及一个模块名称
* 计算出模块的真实路径
*/
let cache = {};
module.exports = (referPath, name) => {
	// 如果有缓存直接取缓存
	const key = referPath + '$' + name;
	if(cache[key]){return cache[key]};
	// 可以探测的文件扩展类型如下
	const extensions = ['.js', '.jsx'];

	// 判断参考路径是否为文件夹
	const isReferPathDir = fs.lstatSync(referPath).isDirectory();
	// 如果为文件夹直接当做basedir，如果不是，取出其文件夹路径
	const basedir = isReferPathDir && referPath || path.dirname(referPath);

	// 如果没有name，使用referPath当做name
	if(!name){name = referPath};
	let filepath = resolve.sync(name, {basedir, extensions, preserveSymlinks: false});
	return cache[key] = filepath;
};
