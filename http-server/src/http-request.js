const { Readable } = require('stream');

const { END_OF_HEAD, splitHead } = require('./utils');

module.exports = socket => {
	class HttpRequest extends Readable {
		_updateMetadata({ method, url, headers }) {
			this.method = method;
			this.url = url;
			this.headers = headers;
		}

		_read() {
			if (socket.isPaused()) {
				socket.resume();
			}
		}
	}

	const httpRequest = new HttpRequest();

	function readHeaders() {
		let buf = Buffer.from('');
		let isHeadFetched = false;
		return new Promise((resolve, reject) => {
			socket.on('data', chunk => {
				if (isHeadFetched) {
					return httpRequest.push(chunk);
				}
				const eofIdx = chunk.indexOf(END_OF_HEAD);
				if (eofIdx === -1) {
					buf = Buffer.concat([buf, chunk]);
				} else {
					buf = Buffer.concat([buf, chunk.slice(0, eofIdx)]);
					httpRequest.unshift(chunk.slice(eofIdx + END_OF_HEAD.length));
					socket.pause();
					isHeadFetched = true;
					httpRequest._updateMetadata(splitHead(buf.toString('utf8')));
					resolve(httpRequest);
				}
			});
			socket.on('error', err => reject(err));
		});
	}

	return readHeaders();
};