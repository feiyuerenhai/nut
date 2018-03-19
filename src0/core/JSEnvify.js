const fs = require('fs');
const es = require("event-stream");
const Readable = require('stream').Readable;
const envify = require('envify');

process.env.NODE_ENV = 'production';

module.exports = code => {
	return new Promise((resolve, reject) => {
		let inputStream = new Readable();
		inputStream.push(code);
		inputStream.push(null);
		inputStream.pipe(
			envify({
	  			NODE_ENV: 'production'
	  		})
		).pipe(es.mapSync(function(data) {
			resolve(data);
		}));
	});
};
