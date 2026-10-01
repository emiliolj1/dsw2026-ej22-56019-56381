import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

// Servidor estático: solo archivos reales del repositorio, sin fixtures.
export async function startServer(port = 0) {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      const resource = pathname === '/' ? '/login.html' : pathname;
      const filename = path.resolve(root, `.${resource}`);
      if (!filename.startsWith(root) || resource.split('/').some((part) => part.startsWith('.'))) {
        response.writeHead(403).end(); return;
      }
      const type = mime[path.extname(filename)];
      if (!type) { response.writeHead(404).end(); return; }
      const content = await readFile(filename);
      response.writeHead(200, { 'Content-Type': `${type}${type.startsWith('text/') ? '; charset=utf-8' : ''}`, 'Cache-Control': 'no-cache' });
      response.end(content);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Archivo no disponible');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { url } = await startServer(Number(process.argv[2]) || 5500);
  console.log(`Servidor estático: ${url}/login.html`);
}
