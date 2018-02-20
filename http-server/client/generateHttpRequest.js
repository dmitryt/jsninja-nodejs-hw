const faker = require('faker');
const fs = require('fs');

const HEADERS_CNT = 1000;
const BODY_CNT = 1000;

let DATA = `POST /hello/world HTTP/1.1
Host: localhost:3001
Connection: keep-alive
Content-Length: 35
Cache-Control: no-cache
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36
Content-Type: application/json
Accept: */*
Accept-Encoding: gzip, deflate, br
Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7`;

function main() {
	for (let i = 0; i < HEADERS_CNT; i++) {
		DATA += `${faker.lorem.word()}-${new Date().getTime()}: ${faker.lorem.paragraph()}\r\n`;
	}
	DATA += '\r\n\r\n';
	const tmp = {};
	for (let i = 0; i < BODY_CNT; i++) {
		tmp[faker.lorem.word() + new Date().getTime()] = faker.lorem.paragraph();
	}
	DATA += JSON.stringify(tmp);
}

main();
fs.writeFileSync('test-big.txt', DATA);
