const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');
const resolve = require('resolve');

const resolveLocal = require('./resolveLocal');

const StampedMap = require('./StampedMap');

module.exports = {
	readFile: (filepath) => {
		return new Promise((resolve, reject)=>{
			fs.readFile(filepath, 'utf-8', (err, result)=>{
				if(err) return reject(err);
				return resolve(result);
			})
		})
	},
	writeFile: (filepath, content) => {
		return new Promise((resolve, reject)=>{
			const dirname = path.dirname(filepath);
			if (!fs.existsSync(dirname)) {
				mkdir.sync(dirname);
			};
			fs.writeFile(filepath, content, 'utf-8', (err, result)=>{
				if(err)return reject(err);
				return resolve(result);
			})
		})
	},
	resolveLocal,
	StampedMap,
	relative: (filepath)=>{
		return path.relative(process.cwd(), filepath);
	},
	countLines: s => {
		return s.split(/\r\n|\r|\n/).length;
	}
};
