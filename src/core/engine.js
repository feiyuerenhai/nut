const fs = require('fs');
const md5 = require('md5');
const equal = require('fast-deep-equal');
const unique = require('array-unique');
const Events = require('events');
const self = new Events.EventEmitter();
const workerFarm = require('worker-farm');

const {readFile, StampedMap, resolveLocal} = require('../util');
const moduleParserScript = resolveLocal(__dirname, './module.js');

let ENTRY;

let Workers;

const Modules = new StampedMap();

let dependings = [];

let schedule = [];

let resolver;

let rejecter;

let hasAnyErrorOccured = false;

self.on('init', (entryFilePath)=>{
	ENTRY = entryFilePath;
	dependings = [entryFilePath];
	schedule = [entryFilePath];
	inputList = {};
	outputList = {};
	hasAnyErrorOccured = false;
	// 
	Workers = workerFarm(require.resolve(moduleParserScript));
	self.emit('input', schedule);
});

let inputList = {};
self.on('input', tasks => {
	tasks.forEach(task => {
		let module = Modules.get(task);
		if(module){
			self.emit('module_skip', task);
			dependings = dependings.concat(module.dependings);
			inputList[task] = true;
			self.emit('output', module.dependings);
		}else{
			Workers(task, (err, module) => {
				// 出错退出
				if(hasAnyErrorOccured) return;
				// 解析出错
				if(err){
					hasAnyErrorOccured = true;
					workerFarm.end(Workers);
					rejecter(err);
					return;
				};
				// if( Modules.get(module.filepath) && module.isThirdParty ) return;
				// 模块解析成功
				self.emit('module_parse', task);
				// 记录模块依赖
				dependings = dependings.concat(module.dependings);
				// 缓存模块
				Modules.set(module.filepath, module.md5, module);
				// 
				inputList[task] = true;
				self.emit('output', module.dependings);
			})
		}
	})
});

let outputList = {};
self.on('output', tasks => {
	schedule = schedule.concat(tasks);
	schedule = schedule.filter(k => {
		return !outputList[k];
	});
	schedule.forEach(k => {
		outputList[k] = true;
	});
	self.emit('input', [...schedule]);
	schedule = [];
	self.emit('check');
});

self.on('check', () => {
	if(equal(inputList, outputList)){
		dependings = unique(dependings).reverse();
		const queue = dependings.map(filepath => {
			return Modules.get(filepath);
		});
		resolver(queue);
	};
});

self.on('change', async filepath => {
	try{
		const sourceCode = await readFile(filepath);
		const stamp = md5(sourceCode);
		if(Modules.getStamp(filepath) === stamp) return;
		self.emit('module_change', filepath);
		Modules.setStamp(filepath, stamp);
	}catch(e){
		rejecter(e);
		Modules.setStamp(filepath, null);
	};
	self.emit('init', ENTRY);
});

module.exports.events = self;

module.exports.run = (entry, changedFilePath) => {
	return new Promise((resolve, reject)=>{
		if(changedFilePath){
			self.emit('change', changedFilePath);
		}else{
			self.emit('init', entry);
		};
		resolver = resolve;
		rejecter = reject;
	});
};
