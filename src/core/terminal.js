const chalk = require('chalk');
const ora = require('ora');
const wrapAnsi = require('wrap-ansi');

let spinner;

const lining = text => {
	// 输入折成多行以避免ora.clear()错误
	return wrapAnsi(`--${text}`, process.stdout.columns, {hard: true}).slice(2)
};

const nextLine = (symbol, text, color) => {
	text = lining(text);
	spinner.stopAndPersist({symbol: chalk[color](symbol), text: chalk[color](text)});
	spinner.start(text);
};

// 任务开始
module.exports.start = text => {
	console.log(chalk.green('@', text));
	spinner = ora().start(lining(text));
	return module.exports;
};

// 任务中
module.exports.processing = (text) => {
	text = lining(text);
	spinner.text = chalk.yellow(text);
	return module.exports;
};

// 任务成功
module.exports.succeed = text => {
	spinner.succeed(text);
	return module.exports;
};

// 任务失败
module.exports.fail = text => {
	spinner.fail(text);
	return module.exports;
};

// 任务停止
module.exports.stop = text => {
	spinner.stop();
	return module.exports;
};

// 模块解析
module.exports.parse = (text) => {
	nextLine('>', text, 'green');
	return module.exports;
};

// 模块变动
module.exports.change = text => {
	nextLine('~', text, 'yellow');
	return module.exports;
};

// 模块移除
module.exports.remove = (text)=>{
	nextLine('-', text, 'red');
	return module.exports;
};
