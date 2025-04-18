import * as http from "node:http";
import * as https from "node:https";
import * as fs from "node:fs";
import path from "node:path";
import mime from 'mime-types';
import zlib from 'node:zlib';
import { marked } from "marked";

export function startServer(config = { port: 3000, root: 'public', spa: false }) {
  const { root, port, spa } = config;

  const handler = (req, res) => {
    // 🔐 Basic auth (if enabled)
    if (config.auth) {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return rejectAuth(res);
      }

      const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
      const [reqUser, reqPass] = credentials.split(':');

      if (reqUser !== config.auth.username || reqPass !== config.auth.password) {
        return rejectAuth(res);
      }
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const urlPath = decodeURIComponent(url.pathname);
    const requestedPath = path.join(root, urlPath);
    const queryParams = url.searchParams

    fs.stat(requestedPath, (err, stats) => {
      console.log(`Requested path: ${ requestedPath }`)
      if (!err && stats.isDirectory()) {
        const indexPath = path.join(requestedPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return serveFile(indexPath, res, req, queryParams);
        } else {
          return serveDirectoryListing(requestedPath, urlPath, res);
        }
      }

      if (!err && stats.isFile()) {
        return serveFile(requestedPath, res, req, queryParams);
      }

      // Fallback: serve index.html for SPA routing
      const isRequestingAsset = path.extname(urlPath);
      const fallbackPath = path.join(root, 'index.html');

      if (spa && !isRequestingAsset && fs.existsSync(fallbackPath)) {
        return serveFile(fallbackPath, res, req, queryParams);
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found.');
    });
  };

  function serveFile(filePath, res, req, queryParams) {
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        return res.end('Not found');
      }

      const contentType = mime.lookup(filePath) || 'application/octet-stream';
      const ext = path.extname(filePath);
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const etag = `${ stats.size }-${ stats.mtimeMs.toString(16) }`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('ETag', etag);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());

      // Set Cache-Control policy
      const isImmutable = ['.js', '.css', '.woff2', '.png', '.jpg'].includes(ext);
      if (isImmutable) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }

      // ETag check: return 304 if unchanged
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304);
        return res.end();
      }

      // Handle md file render
      if (path.extname(filePath) === '.md' && !queryParams.get('raw')) {
        fs.readFile(filePath, 'utf-8', (err, mdContent) => {
          if (err) {
            res.writeHead(500);
            return res.end('Error reading markdown.');
          }

          const html = `
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <title>${path.basename(filePath)}</title>
                <style>
                  body { font-family: sans-serif; max-width: 720px; margin: 2rem auto; padding: 1rem; line-height: 1.6rem; }
                  h1, h2, h3 { margin-top: 2rem; }
                  pre { background: #f4f4f4; padding: 0.75rem; overflow-x: auto; }
                  code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
                  a { color: #0366d6; text-decoration: none; }
                </style>
              </head>
              <body>
                ${marked.parse(mdContent)}
              </body>
            </html>
          `;

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        });

        return;
      }

      // Handle gzip compression
      const stream = fs.createReadStream(filePath);

      if (acceptEncoding.includes('gzip')) {
        res.writeHead(200, { 'Content-Encoding': 'gzip' });
        stream.pipe(zlib.createGzip()).pipe(res);
      } else {
        res.writeHead(200);
        stream.pipe(res);
      }

      stream.on('error', () => {
        res.writeHead(500);
        res.end('Internal Server Error');
      });
    });
  }

  function serveDirectoryListing(dirPath, urlPath, res) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        res.writeHead(500);
        return res.end('Internal Server Error');
      }

      const html = `
      <html lang="en"><head><title>Index of ${ urlPath }</title></head><body>
      <h1>Index of ${ urlPath }</h1>
      <ul>
        ${ urlPath !== '/' ? `<li><a href="${ path.join(urlPath, '..') }">../</a></li>` : '' }
        ${ files.map(file => {
        const slash = file.isDirectory() ? '/' : '';
        const href = path.posix.join(urlPath, file.name) + slash;
        return `<li><a href="${ href }">${ file.name }${ slash }</a></li>`;
      }).join('\n') }
      </ul>
      </body></html>
    `;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }

  function rejectAuth(res) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
      'Content-Type': 'text/plain'
    });
    res.end('401 Unauthorized.');
  }

  let server;

  if (config.https) {
    const sslOptions = {
      key: fs.readFileSync(config.sslKeyPath),
      cert: fs.readFileSync(config.sslCertPath)
    };

    server = https.createServer(sslOptions, handler);
    console.log(`🔒 HTTPS server running at https://localhost:${config.port}`)
  } else {
    server = http.createServer(handler);
    console.log(`📡 HTTP server running at http://localhost:${config.port}`)
  }

  server.listen(port);
}