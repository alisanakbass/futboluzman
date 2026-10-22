// Sıfır harici paket bağımlılığıyla yerel sunucu (Node.js dahili modülleri)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const activeRooms = new Map();

function cleanStaleRooms() {
    const now = Date.now();
    for (const [code, room] of activeRooms.entries()) {
        if (now - room.updatedAt > 10 * 60 * 1000) {
            activeRooms.delete(code);
        }
    }
}

const server = http.createServer((req, res) => {
    // API: Aktif Canlı Odalar (İzleyici Modu Keşfi)
    if (req.url.startsWith('/api/rooms')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        cleanStaleRooms();

        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(Array.from(activeRooms.values())));
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body || '{}');
                    if (data.code) {
                        activeRooms.set(data.code, {
                            code: data.code,
                            host: data.host || 'Dharma',
                            guest: data.guest || '',
                            status: data.status || 'Lobi',
                            round: data.round || 1,
                            updatedAt: Date.now()
                        });
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, count: activeRooms.size }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Geçersiz JSON' }));
                }
            });
            return;
        }

        if (req.method === 'DELETE') {
            const parts = req.url.split('/');
            const code = parts[parts.length - 1];
            if (code && activeRooms.has(code)) {
                activeRooms.delete(code);
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
            return;
        }
    }

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Sayfa Bulunamadı');
            } else {
                res.writeHead(500);
                res.end(`Sunucu Hatası: ${err.code}`);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIp = getLocalIp();

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`====================================================`);
        console.log(`Port ${PORT} zaten kullanimda! Oyun zaten aktif calisiyor.`);
        console.log(`Bilgisayardan Acin : http://localhost:${PORT}`);
        console.log(`Telefondan Acin    : http://${localIp}:${PORT}`);
        console.log(`====================================================`);
    } else {
        console.error('Sunucu Hatasi:', err);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`Scaude Scout Battle Oyunu Baslatildi!`);
    console.log(`Bilgisayardan Acin : http://localhost:${PORT}`);
    console.log(`Telefondan Acin (Wi-Fi): http://${localIp}:${PORT}`);
    console.log(`====================================================`);
});
