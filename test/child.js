var a = {};
var b = {x: a};
a.y = b;

module.exports = function (inp, callback) {
	callback(null, a);
};