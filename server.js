'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const widgetHandler = require('./api/widget');
const metadataHandler = require('./api/metadata');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Mock Vercel response helper
  const vercelRes = {
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(data) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
      return this;
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
    send(data) {
      res.end(data);
      return this;
    },
    end(data) {
      res.end(data);
      return this;
    }
  };

  // 1. API: /api/metadata
  if (pathname === '/api/metadata') {
    req.query = parsedUrl.query;
    await metadataHandler(req, vercelRes);
    return;
  }

  // 2. API: /api/:widget.svg -> api/widget.js
  const widgetMatch = pathname.match(/^\/api\/([\w-]+)\.svg$/);
  if (widgetMatch) {
    const type = widgetMatch[1];
    req.query = { ...parsedUrl.query, type };
    await widgetHandler(req, vercelRes);
    return;
  }

  // 3. Static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Security check: ensure filePath is within __dirname
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing, or 404
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.svg': 'image/svg+xml; charset=utf-8',
      '.png': 'image/png',
      '.json': 'application/json'
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
