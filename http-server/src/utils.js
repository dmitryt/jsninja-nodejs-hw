const EOL = `\r\n`;
const END_OF_HEAD = '\r\n\r\n';
const REASON_PHRASES = {
	200: 'OK',
	400: 'Bad Request',
	404: 'Not Found',
	500: 'Internal Server Error',
};

function splitHead(headStr) {
	const lines = headStr.split(EOL);
	const [method, url] = lines[0].split(/\s+/);
	const headers = lines.slice(1).reduce((acc, line) => {
		const [key, ...value] = line.split(':');
		if (key) {
			acc[key] = value.join(':').trim();
		}
		return acc;
	}, {});
	return { method, url, headers };
}

function generateStatusLine(code) {
	return `${EOL}HTTP/1.1 ${code} ${REASON_PHRASES[code]}${EOL}`;
}

function generateHead({statusCode, headers}) {
	const statusLine = generateStatusLine(statusCode);
	const headersStr = Object.keys(headers).reduce((acc, h) => {
		return acc += `${h}: ${headers[h]}${EOL}`;
	}, '');
	return `${statusLine}${headersStr}${EOL}`;
}

module.exports = {
	splitHead,
	generateHead,
	END_OF_HEAD,
};