const path = require('path');
const fs = require('fs');
const createServer = require('./src');

function getCodeFromFsError(err) {
	return {
		ENOENT: 404,
		EACCES: 400,
	}[err.code] || 500;
}

const server = createServer();
server.on('request', (req, res) => {
	res.on('error', err => {
		console.log('Handle error', err);
	});
	const filepath = path.join(__dirname, 'static', req.url);
	fs.access(filepath, fs.constants.R_OK, (err, fd) => {
		if (err) {
			console.error(err);
			res.setStatus(getCodeFromFsError(err));
			err.code && res.write(err.code);
			return res.end();
		}
		fs.createReadStream(filepath).pipe(res);
	});
});
server.listen(3001);