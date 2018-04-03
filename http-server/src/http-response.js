const { Writable, Duplex } = require('stream');

const { generateHead } = require('./utils');

module.exports = socket => {

	let isPiping = false;

	class HttpResponse extends Writable {
		constructor(options, socket) {
			super(options);
			this.headersSent = false;
			this._headers = {};
			this._statusCode = 200;
		}

		setHeader(headerName, value) {
			if (this.headersSent) {
				return socket.emit('error', new Error('Headers were sent'));
			}
			console.log('[SET HEADER]', headerName, value);
			this._headers[headerName] = value;
		}

		setStatus(statusCode) {
			if (this.headersSent) {
				throw new Error('Headers were sent');
			}
			console.log('[SET STATUS]', statusCode);
			this._statusCode = statusCode;
		}

		_writeHead() {
			const head = generateHead({
				statusCode: this._statusCode,
				headers: this._headers,
			});
			this.headersSent = true;
			socket.write(head);
		}

		writeHead(statusCode, headers = {}) {
			this._statusCode = statusCode;
			Object.assign(this._headers, headers);
			console.log('[WRITE HEAD]', headers);
			this._writeHead();
		}

		_write(chunk, encoding, callback) {
			if (!this.headersSent) {
				this._writeHead();
			}
			console.log('[WRITING]', chunk.length, this.writableLength);
			socket.write(chunk, encoding, () => {
				if (chunk.length === this.writableLength && !isPiping) {
					socket.end();
				}
				callback();
			});
		}
	}

	const httpResponse = new HttpResponse();

	httpResponse.on('pipe', stream => {
		console.log('[PIPING]');
		isPiping = true;
		stream.on('end', () => {
			console.log('[END PIPING]');
			socket.end();
		});
	});

	httpResponse.on('error', err => {
		console.error('[ERROR]', err);
		isPiping = false;
		socket.emit('error', err);
	});

	httpResponse.on('end', () => {
		console.error('[END WRITING]');
		isPiping = false;
		socket.end();
	});

	return httpResponse;
};
