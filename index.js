const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const http = require('http');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

async function stat(filename) {
  try {
    const s = await fsp.stat(filename);
    if (s.isDirectory()) {
      return 'directory';
    }
    if (s.isFile()) {
      return 'file';
    }
    return 'unknown';
  } catch {
  }
}

const server = http.createServer(async (req, res) => {
  const filename = path.join(dataDir, req.url) + '.json';
  if (!filename.startsWith(dataDir)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  if (req.method === 'GET') {
    if (await stat(filename) === 'file') {
      return fs.createReadStream(filename).pipe(res);
    }
  } else if (req.method === 'POST') {
    if (req.url !== '/') {
      const dirName = path.dirname(filename);
      await fsp.mkdir(dirName, { recursive: true });
      req.pipe(fs.createWriteStream(filename));
      return res.end('OK');
    }
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(parseInt(process.env.PORT || '3000'));
