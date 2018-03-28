const convert = require('convert-source-map');
const combine = require('combine-source-map');
const {nlines} = require('../util');

const createCombiner = startAt => {
	let sourcemapData = [];
	let lineCount = startAt + 1;
	return {
		add: (offset, sourceMap, sourceFile) => {
			if (sourceMap) {
				// 有sourcemap
				sourcemapData.push([{
					source: `${sourceMap.sourcesContent[0] || ''}\n${convert.fromObject(sourceMap).toComment()}`,
					sourceFile: sourceFile,
				}, lineCount]);
				// 追加 offset 并且加上wrapper的define方法所作行数
				lineCount += offset + 2;
			}else{
				// 无sourcemap
				lineCount += offset;
			}
		},
		output: sourceMapFileName => {
			// 输出
			const sm = combine.create(sourceMapFileName || 'bundle.js');
			for (const [map, offset] of sourcemapData) {
				sm.addFile(map, { line: offset});
			}
			return convert.fromBase64(sm.base64()).toJSON();
		},
	};
}

module.exports = (queue, startAt, sourceMapFileName) => {
	const combiner = createCombiner(startAt);
	queue.forEach( module => {
		if(module.sourceMap){
			combiner.add(nlines(module.es5code), module.sourceMap, module.filepath);
		}else{
			combiner.add(nlines(module.generated));
		}
	});
	return combiner.output(sourceMapFileName);
}
