const fs = require('fs');
const es = require("event-stream");
const Readable = require('stream').Readable;
const envify = require('envify');

module.exports = code => {
	const ENV = 'development';
	process.env.NODE_ENV = ENV;
	return new Promise((resolve, reject) => {
		let inputStream = new Readable();
		inputStream.push(code);
		inputStream.push(null);
		inputStream.pipe(
			envify({
	  			NODE_ENV: ENV,
	  		})
		).pipe(es.mapSync(function(data) {
			resolve(data);
		}));
	});
};
