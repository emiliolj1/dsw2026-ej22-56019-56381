import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('./fixtures/', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Los reemplazos existen solo en este servidor de prueba. No se crean módulos
// de producción ni se alteran archivos de los otros integrantes.
export async function startPreview({ port = 5501, quiet = false } = {}) {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/favicon.ico') {
        response.writeHead(204).end();
        return;
      }
      let filePath;
      if (pathname === '/') {
        filePath = path.join(fixtureRoot, 'index.html');
      } else if (pathname === '/_qa/shell-fixture.css') {
        filePath = path.join(fixtureRoot, 'shell.css');
      } else {
        filePath = path.resolve(repositoryRoot, `.${pathname}`);
        if (!filePath.startsWith(repositoryRoot) || pathname.split('/').some((part) => part.startsWith('.'))) {
          response.writeHead(403).end('Acceso denegado');
          return;
        }
      }
      if (!types[path.extname(filePath)]) {
        response.writeHead(404).end('Archivo no disponible');
        return;
      }
      let content;
      try {
        content = await readFile(filePath);
      } catch (error) {
        if (error.code === 'ENOENT' && pathname === '/js/shell.js') {
          filePath = path.join(fixtureRoot, 'shell.js');
          content = await readFile(filePath);
        } else if (error.code === 'ENOENT' && pathname === '/specialties.html') {
          filePath = path.join(fixtureRoot, 'specialties-destination.html');
          content = await readFile(filePath);
        } else {
          throw error;
        }
      }
      response.writeHead(200, { 'Content-Type': types[path.extname(filePath)], 'Cache-Control': 'no-store' });
      response.end(content);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('No se pudo servir el archivo');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  if (!quiet) {
    console.log(`Vista aislada U06: ${url}/`);
    console.log('Usa el login, la sesión y el store reales. Si faltan shell o listado, usa fixtures rotuladas de prueba.');
  }
  return { server, url };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await startPreview({ port: Number(process.argv[2]) || 5501 });
}
