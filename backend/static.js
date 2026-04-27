// ===== Obsluha statických souborů =====
// Servíruje HTML, CSS, JS a obrázky z kořenového adresáře projektu.
// Obsahuje ochranu proti path traversal útokům (/../ sekvence).

const fs = require('fs');
const path = require('path');

const { MIME_TYPES, ROOT_DIR } = require('./config');
const { getSecurityHeaders, sendText } = require('./http');

async function handleStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  // Normalizace cesty a odstranění případných /../ sekvencí
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT_DIR, normalized);

  // Druhá linie obrany: výsledná cesta musí být uvnitř ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    sendText(req, res, 403, 'Forbidden');
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      sendText(req, res, 403, 'Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const isImmutable = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2'].includes(ext);
    const cacheControl = ext === '.html' ? 'no-cache' : isImmutable ? 'public, max-age=3600' : 'no-cache';

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
      ...getSecurityHeaders()
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    try {
      const page404 = path.join(ROOT_DIR, '404.html');
      const html = await fs.promises.readFile(page404, 'utf8');
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        ...getSecurityHeaders()
      });
      res.end(html);
    } catch {
      sendText(req, res, 404, 'Not found');
    }
  }
}

module.exports = {
  handleStatic
};