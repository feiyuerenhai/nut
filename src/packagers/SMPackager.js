const convert = require('convert-source-map');
const combine = require('combine-source-map');

const countLines = s => {
	return s.split(/\r\n|\r|\n/).length;
}

const _createCombiner = preLineCount => {
    let sourcemapData = [];
    let lineCount = preLineCount;
    return {
      // 增加一条数据
      addFile: (producedCode, sourceMap, sourceFile, MM) => {
        // 有 map 输入
        if (sourceMap) {
          sourcemapData.push([{
            source: `${ producedCode || '' }\n${convert.fromObject(sourceMap).toComment()}`,
            sourceFile: sourceFile,
          }, lineCount + 1]);
          // 追加 offset
          lineCount += countLines(producedCode) + 4;
        }else{
          lineCount += countLines(MM.generated);
        }
      },

      // 输出
      output: file => {
        const sm = combine.create(file);
        for (const [map, offset] of sourcemapData) {
          sm.addFile(map, { line: offset});
        }
        return convert.fromBase64(sm.base64()).toJSON();
      },
    };
  }


module.exports = (pre, queue) => {

	const cm = _createCombiner(pre);

	queue.forEach(module => {
		cm.addFile(module.es5code, module.sourceMap, module.filepath, module);
	})

	const opt = cm.output('bundle.js');

	return opt;
}