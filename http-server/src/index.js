const { createServer } = require('net');
const { EventEmitter } = require('events');

const createHttpRequest = require('./http-request');
const createHttpResponse = require('./http-response');

class HttpServer extends EventEmitter {
	listen(port) {
		const server = createServer();
		server.on('connection', socket => {
			console.log('New client has been detected', socket.address());
			socket.on('error', err => {
				console.error('Handle socket error', err);
			});
			createHttpRequest(socket).then(httpRequest => {
				this.emit('request', httpRequest, createHttpResponse(socket));
			});
		});
		server.on('error', err => {
			console.error('Handle server error', err);
		});
		server.on('listening', () => {
			console.log('Server is listening on', server.address());
		});

		server.listen(port);
	}
}

module.exports = () => new HttpServer();
