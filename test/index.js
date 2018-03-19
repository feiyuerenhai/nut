const workerFarm = require('worker-farm');
const Workers = workerFarm(require.resolve('./child.js'));

Workers('hello', (err, ret)=>{
	console.log(ret);
})