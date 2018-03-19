const sass = require('../core/sass');
const minifycss = require('../minifiers/minifycss');

module.exports = async (queue, pre = '', post = '') => {

	const CSSQueue = queue.filter(module => {
		return /^less$|^scss$|^css$/.test(module.type);
	});

	// 这里可能也是一个奇巧淫技，probably bad idea
	// sass编译器接受两种参数，一是scss文件路径，一是scss文件内容
	// 文件路径也好，文件内容也好，每一次单独运行的结果都是相互割裂的
	// 即，假如，a.scss文件中定义了变量$x，b.scss文件也需要$x
	// 那么，分别运行a和b文件的时候，除非b.scss文件再引入一次a.scss文件
	// 否则，编译b.scss文件的时候就会报错找不到$x
	// 这里采用的解决办法比较投机取巧：把这些路径再拼成一个新的scss文本
	// 这样，编译器在处理的时候，就能把所有文件放在同一个上下文处理
	let data = new String();
	CSSQueue.reverse().forEach(module => {
		data += `@import "${module.filepath}";\n`;
	});

	let code = await sass(data);

	code = pre + code + post;
	// code = await minifycss(code);
	return code;
};
