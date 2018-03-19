const ora = require('ora');
// const spinner = ora().start();

const wrapAnsi = require('wrap-ansi');

const lining = text => {
	return wrapAnsi(`--${text}`, process.stdout.columns, {hard: true})
	.slice(2)
}

let spinner = ora().start();


const input = '123ahzoa啊哈哈哈xajklxj就是我啦kljal知道吗kxjlkjlksjlkskljxlkskjxlklklzjklajlzkakljzlkakzhkjahkjzhahjkzhajkhzkjahzazsjakljskajsjakjslkjalkjslkajlkslkasashahklsklaklsaklhklzhkaklajklakljzlkajlkzjakljzlkakljzlkajlkjlkajklakllksalkjlksj123';

// console.log( lining('ahzoaxajklxjkljalkxjlkjlksjlkskljxlkskjxlklklzjklajlzkakljzlkakzhkjahkjzhahjkzhajkhzkjahzazsjakljskajsjakjslkjalkjslkajlkslkasashahklsklaklsaklhklzhkaklajklakljzlkajlkzjakljzlkakljzlkajlkjlkajklakllksalkjlksj123') );


setInterval(() => {
	let aa = lining( input + Date.now() )
	// const cc = wrapAnsi('--' + aa).split('\n')
	// .reduce((count, line) => {
	// 	return count + Math.max(1, Math.ceil((line.length) / process.stdout.columns));
	// }, 0);
	// console.log( cc );
	spinner.text = lining( aa );
}, 100)

// console.log( lining(input) );
