// server-simple.js - Serveur minimal SANS dépendances (test uniquement)
// ATTENTION: Ceci est une VERSION SIMPLE pour tester le site HTML/JS
// En PRODUCTION, utiliser server.js avec Express complet

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const BASE_DIR = __dirname;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// API Mock Database
const mockDb = {
  properties: [
    {
      id: 1,
      ownerId: 2,
      title: 'Chambre Lumineuse - Paris 16',
      description: 'Belle chambre moderne proche du métro',
      price: 450,
      city: 'Paris',
      address: '12 Rue du Parc, 75016',
      bedrooms: 1,
      bathrooms: 1,
      area: 18,
      amenities: ['Wi-Fi', 'Climatisation', 'Chauffage'],
      status: 'available'
    },
    {
      id: 2,
      ownerId: 2,
      title: 'Studio Cosy - Marais',
      description: 'Studio cosy au cœur du Marais',
      price: 550,
      city: 'Paris',
      address: '45 Rue des Tournelles, 75004',
      bedrooms: 1,
      bathrooms: 1,
      area: 25,
      amenities: ['Wi-Fi', 'Cuisine équipée'],
      status: 'available'
    }
  ]
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // ==================== API ROUTES ====================

  // GET /api/properties
  if (pathname === '/api/properties' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockDb.properties));
    return;
  }

  // GET /api/properties/:id
  const propertyMatch = pathname.match(/^\/api\/properties\/(\d+)$/);
  if (propertyMatch && req.method === 'GET') {
    const id = parseInt(propertyMatch[1]);
    const property = mockDb.properties.find(p => p.id === id);
    if (property) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(property));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Property not found' }));
    }
    return;
  }

  // ==================== STATIC FILES ====================

  // Serve index.html for root
  if (pathname === '/' || pathname === '/index.html') {
    pathname = '/pages/index.html';
  }

  // Resolve file path
  let filePath = path.join(BASE_DIR, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Try index.html if directory
      if (err.code === 'ENOENT') {
        const indexPath = path.join(filePath, 'index.html');
        fs.stat(indexPath, (err2) => {
          if (!err2) {
            filePath = indexPath;
            serveFile(filePath);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fs.stat(filePath, (err) => {
        if (!err) {
          serveFile(filePath);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        }
      });
    } else {
      serveFile(filePath);
    }
  });

  function serveFile(filePath) {
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + err.message);
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        res.end(data);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🎯 RoomRover - Serveur Simple        ║
║   📍 http://localhost:${PORT}              ║
║   ⚠️  DEV ONLY (pas d'API complète)    ║
╚════════════════════════════════════════╝

Pour la PRODUCTION:
  npm install
  npm start

Pages disponibles:
  / → pages/index.html
  /pages/login.html
  /pages/register.html
  /admin.html
  /owner.html
  /tenant.html
  /pages/*

API Mock (GET uniquement):
  /api/properties
  /api/properties/:id
  `);
});

module.exports = server;
