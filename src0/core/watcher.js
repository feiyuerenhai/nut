const chokidar = require('chokidar');
const uniq = require('uniq');

const debounce = require('debounce');

/*监测文件改动*/
module.exports = (initList, listener) => {
	
	// 是否为初次执行
	let isInitialExecution = true;

	// 延时执行的时间
	const delay = 2000;

	// 当前监控的文件列表
	let currentList = initList;
	
	// “主watcher”只监测文件的改动以及删除
	// (因为watcher会自动更新监测列表，所以只需要关注这两种情况)
	// 当两种情况出现时，均重新编译
	const watcher = chokidar
	.watch(currentList)
	.on('change', listener)
	.on('unlink', listener)

	// “次watcher”用于当“过敏”模式启动时，监测“所有文件”改动
	// 过敏模式用于当上次构建失败时
	// 比如需要的模块不存在而导致了构建失败
	// 此时，任何文件系统的改动都应该尝试触发重新编译
	// 但是，node在运行时，目录下的所有文件都会经过暂存性标记改变
	// 意味着，会有成千上万个文件瞬间变动，触发多次watch
	// 这里是一个折中办法，也是bad-idea，使用debounce
	// 在每一次运行时都用一个时间段来掩盖这些系统性改变
	let isAllergic = false;
	const debouncedListener = debounce(listener, delay, true);
	const debouncedAllergicListener = (filepath) => {
		if(isAllergic){
			debouncedListener(filepath);
		};
	};
	const _watcher = chokidar
	.watch( process.cwd() )
	.on('change', debouncedAllergicListener)
	.on('add', debouncedAllergicListener)
	.on('addDir', debouncedAllergicListener)
	.on('unlink', debouncedAllergicListener)
	.on('unlinkDir', debouncedAllergicListener)

	return (appendList, allergic = false) => {
		// 过敏模式开关
		if(allergic){
			// 避开初次执行时node导致的文件系统变更
			if(isInitialExecution){
				isInitialExecution = false;
				setTimeout(()=>{
					isAllergic = true;
				}, delay);
			}else{
				isAllergic = true;
			}
		}else{
			isAllergic = false;
		};

		// 实时更新监控内容
		const totalList = uniq(currentList.concat(appendList));
		// 去除依赖中不需要
		let unWatchList = [];
		// 添加新增的文件
		let addWatchList = [];
		totalList.forEach(filepath => {
			if(currentList.includes(filepath) && !appendList.includes(filepath)){
				unWatchList.push(filepath);
			};
			if(!currentList.includes(filepath) && appendList.includes(filepath)){
				addWatchList.push(filepath);
			}
		});
		currentList = appendList;
		watcher.unwatch(unWatchList);
		watcher.add(addWatchList);
	}
};
