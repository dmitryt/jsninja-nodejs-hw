const { createServer } = require('http');
const { createReadStream } = require('fs');
const Parser = require('./src/parser'); // ваш код

const port = process.env.PORT || 8000;

createServer((req, res) => {
  if (req.method === 'POST') {
    const parser = new Parser({ headers: req.headers });
    parser.on('file', (fieldname, file, filename, contentType) => {
      // file должен быть Readable stream
      file.on('data', ({ length }) => console.log(`Got ${length} bytes`));
      file.on('end', () => console.log('File finished'));
    });
    parser.on('field', (fieldname, value) => {
      console.log(`${fieldname}`);
    });
    parser.on('finish', function () {
      console.log('Done parsing form!');
      res.writeHead(200);
      res.end(JSON.stringify('{ success: true }'));
    });
    req.pipe(parser);
  } else if (req.method === 'GET') {
    if (req.url === '/') {
      createReadStream('client.html').pipe(res);
    } else {
      res.writeHead(200, { Connection: 'close' });
      res.end('OK');
    }
  }
}).listen(port, () => console.log('Listening on', port));