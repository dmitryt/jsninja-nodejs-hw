const fs = require('fs');

const port = process.env.PORT || 3001;
const client = require('net').createConnection({ port });
const testData = fs.readFileSync('test-big.txt');

client.on('connect', info => {
	console.log('Connected to server', info);
});

client.write(testData);
