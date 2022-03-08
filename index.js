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
  if (req.method === 'GET') {
    for (const s = req.url.split('/').filter((x) => x); s.length; s.pop()) {
      const dirName = path.join(dataDir, ...s);
      const filename = dirName + '.json';
      if (await stat(filename) === 'file') {
        return fs.createReadStream(filename).pipe(res);
      }
      if (await stat(dirName) === 'directory') {
        const files = (await fsp.readdir(dirName)).filter((file) => file.endsWith('.json'));
        if (files.length > 0) {
          return fs.createReadStream(path.join(dirName, files[0])).pipe(res);
        }
      }
    }
  } else if (req.method === 'POST') {
    if (req.url !== '/') {
      const filename = path.join(dataDir, req.url) + '.json';
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
