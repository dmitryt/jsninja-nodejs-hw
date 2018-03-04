const { Writable, Readable } = require('stream');

const EOL = '\r\n';
const CONTENT_DELIMITER = '\r\n\r\n';
const MPART_CONTENT_TYPE = 'multipart/form-data';

function parseRequestContentType(headers = {}) {
	const [name, meta = ''] = (headers['content-type'] || '').split('; ');
	const boundary = meta.startsWith('boundary=') ? meta.replace('boundary=', '') : null;
	return { name, boundary };
}

function parseContentChunk(content) {
	const headersEndIndex = content.indexOf(CONTENT_DELIMITER);
	const fieldHeaders = parseFieldHeaders(content.slice(0, headersEndIndex));
	const fieldValue = content.slice(headersEndIndex + CONTENT_DELIMITER.length, content.length - EOL.length);
	return { fieldHeaders, fieldValue };
}

function parseFieldHeaders(content) {
	return content.toString().split(EOL).reduce((acc, line) => {
		let [key, value] = line.split(': ');
		if (key === 'Content-Disposition') {
			value = parseContentDispositionHeader(value);
		}
		return Object.assign({}, acc, { [key]: value });
	}, {});
}

function parseContentDispositionHeader(value = "") {
	const expectedStart = 'form-data; ';
	if (!value.startsWith(expectedStart)) {
		return null;
	}
	return value.replace(expectedStart, '').split('; ').reduce((acc, pair) => {
		const [key, value] = pair.split('=');
		return Object.assign({}, acc, { [key]: value.slice(1, -1) }); // slicing ""
	}, {});
}

class Parser extends Writable {
	constructor(options, streamOptions) {
		super(streamOptions);
		this._lastData = Buffer.from('');
		this.contentType = parseRequestContentType(options.headers);
	}

	_parseField(chunk) {
		class FileStream extends Readable {
			constructor(options) {
				super(options);
				this.bytesRead = 0;
			}

			_read(size) {
				this.push(fieldValue.slice(this.bytesRead, this.bytesRead + size));
				this.bytesRead += size;
				if (this.bytesRead >= fieldValue.length) {
					this.push(null);
				}
			}
		}

		const { fieldHeaders = {}, fieldValue } = parseContentChunk(chunk);
		const meta = fieldHeaders['Content-Disposition'];
		if (fieldHeaders['Content-Type']) { // It's supposed to be a file
			this.emit('file', meta.name, new FileStream(), meta.filename, fieldHeaders['Content-Type'])
		} else { // otherwise we parse it as usual field
			this.emit('field', meta.name, fieldValue);
		}
	}

	_write(chunk, encoding, callback) {
		if (this.contentType.name !== MPART_CONTENT_TYPE || !this.contentType.boundary) {
			return callback();
		}
		const boundary = `--${this.contentType.boundary}${EOL}`;
		const endBoundary = `--${this.contentType.boundary}--${EOL}`;
		const data = Buffer.concat([this._lastData, chunk]);
		const endBoundaryIndex = data.indexOf(endBoundary);
		let currentIndex = 0;
		while (true) {
			let boundaryIndex = data.indexOf(boundary, currentIndex);
			let tpmIdx = boundaryIndex === -1 ? endBoundaryIndex : boundaryIndex;
			if (tpmIdx === -1) { // end of chunk
				this._lastData = data.slice(currentIndex);
				break;
			} else {
				if (currentIndex !== tpmIdx) { //filter empty buffers
					this._parseField(data.slice(currentIndex, tpmIdx));
				}
				if (boundaryIndex === -1) { // end of form
					break;
				}
				currentIndex = boundaryIndex + boundary.length;
			}
		}
		callback();
	}
}

module.exports = Parser;