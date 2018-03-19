const walk = require('babylon-walk');
const types = require('babel-types');

module.exports = ast => {
	let dependingIds = [];
	// 遍历节点树，一旦触发以下visitor，便会执行对应操作，主要操作为：将对应id替换为真实路径，递归每个依赖模块
	walk.simple(ast, {
		ImportDeclaration: (node, state) => {
			const moduleId = node.source.value;
			// 收集依赖模块id集合
			dependingIds.push({moduleId, source: node.source});
		},
		ExportNamedDeclaration: (node, state) => {},
    	ExportAllDeclaration: (node, state) => {},
    	ExportDefaultDeclaration: (node, state) => {},
		CallExpression: (node, state) => {
    		let {callee, arguments: args} = node;
		    const isRequire = types.isIdentifier(callee) && callee.name === 'require' && args.length === 1 && types.isStringLiteral(args[0]);
		    if (!isRequire) {return;}
		    const moduleId = args[0].value;
		    // 收集依赖模块id集合
		    dependingIds.push({moduleId, source: args[0]});
		}
	}, {});
	return dependingIds;
};