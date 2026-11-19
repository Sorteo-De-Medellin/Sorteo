// Servidor local para la página del sorteo. No necesita instalar nada más que Node.js.
// Uso: node server.js   (o: npm run dev)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1'; // solo tu computador. No lo cambies si no sabes para qué.
const CLAVE = process.env.CLAVE || 'cambia-esta-clave'; // clave del modo administrador
const ARCHIVO = path.join(__dirname, 'index.html');

http
  .createServer((req, res) => {
    const ruta = new URL(req.url, 'http://x').pathname;

    // Guardar cambios hechos desde el panel de administración
    if (req.method === 'POST' && ruta === '/guardar') {
      if (req.headers['x-clave'] !== CLAVE) {
        res.writeHead(401);
        return res.end('clave incorrecta');
      }
      const partes = [];
      let tam = 0;
      req.on('data', (c) => {
        tam += c.length;
        if (tam > 25e6) req.destroy();
        else partes.push(c);
      });
      req.on('end', () => {
        const html = Buffer.concat(partes).toString('utf8');
        if (!html.includes('id="cfg"')) {
          res.writeHead(400);
          return res.end('archivo no valido');
        }
        fs.copyFileSync(ARCHIVO, ARCHIVO + '.bak'); // copia de seguridad de la versión anterior
        fs.writeFileSync(ARCHIVO, html);
        res.writeHead(200);
        res.end('ok');
      });
      return;
    }

    // Mostrar la página
    if (req.method === 'GET' && (ruta === '/' || ruta === '/index.html')) {
      fs.readFile(ARCHIVO, (err, data) => {
        if (err) {
          res.writeHead(500);
          return res.end('No se encontró index.html');
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(data);
      });
      return;
    }

    res.writeHead(ruta === '/favicon.ico' ? 204 : 404);
    res.end();
  })
  .listen(PORT, HOST, () => {
    console.log(`Página:         http://localhost:${PORT}`);
    console.log(`Administrador:  http://localhost:${PORT}/#admin`);
    if (CLAVE === 'cambia-esta-clave') {
      console.log('AVISO: estás usando la clave por defecto. Cámbiala al iniciar, por ejemplo:');
      console.log('  Windows (PowerShell): $env:CLAVE="mi-clave"; npm run dev');
      console.log('  Mac/Linux:            CLAVE=mi-clave npm run dev');
    }
  });
