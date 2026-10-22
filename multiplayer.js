// ===================================================================
// PeerJS Tabanlı P2P Çok Oyunculu & İzleyici (Spectator) Motoru
// ===================================================================

class MultiplayerManager {
    constructor() {
        this.peer = null;
        this.conn = null; // Aktif bağlantı (Misafir veya İzleyici tarafında)
        this.playerConn = null; // Host tarafında misafir oyuncu bağlantısı
        this.spectatorConns = []; // Host tarafında bağlı izleyiciler
        this.isHost = false;
        this.isSpectator = false;
        this.roomCode = null;
        this.callbacks = {};
        this.connected = false;
        this.heartbeatTimer = null;
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    // Rastgele 4 haneli oda kodu üret
    generateRoomCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    // ===================================================================
    // 1. EV SAHİBİ (HOST) OLARAK ODA KUR
    // ===================================================================
    createRoom(customCode = null, hostTeamName = 'Dharma') {
        const code = customCode || this.generateRoomCode();
        const peerId = `scout-game-${code}`;
        this.isHost = true;
        this.isSpectator = false;
        this.roomCode = code;
        this.spectatorConns = [];

        try {
            this.peer = new Peer(peerId, { debug: 1 });

            this.peer.on('open', (id) => {
                this.registerRoom({
                    code: this.roomCode,
                    host: hostTeamName,
                    guest: '',
                    status: 'Lobi Bekleniyor',
                    round: 1
                });
                this.startRoomHeartbeat(this.roomCode, hostTeamName);
                this.emit('roomCreated', { roomCode: this.roomCode, peerId: id });
            });

            this.peer.on('connection', (connection) => {
                const isSpectator = connection.metadata && connection.metadata.isSpectator;

                if (isSpectator) {
                    connection.on('open', () => {
                        this.spectatorConns.push(connection);
                        this.emit('spectatorConnected', { connection, count: this.spectatorConns.length });
                    });

                    connection.on('close', () => {
                        this.spectatorConns = this.spectatorConns.filter(c => c !== connection);
                        this.emit('spectatorCountChanged', { count: this.spectatorConns.length });
                    });
                } else {
                    // Misafir Oyuncu
                    this.conn = connection;
                    this.playerConn = connection;
                    this.setupPlayerConnection(connection);
                }
            });

            this.peer.on('error', (err) => {
                console.warn('PeerJS Hatası:', err);
                if (err.type === 'unavailable-id') {
                    this.createRoom(null, hostTeamName);
                } else {
                    this.emit('error', err);
                }
            });
        } catch (e) {
            console.error('Peer oluşturulamadı:', e);
            this.emit('error', e);
        }
    }

    // ===================================================================
    // 1.1 HOST SAYFA YENİLEME SONRASI AYNI ODAYI GERİ AL (RECLAIM)
    // ===================================================================
    reclaimRoom(roomCode, hostTeamName = 'Dharma', attempt = 1) {
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
        }

        const cleanCode = roomCode.toString().trim();
        const peerId = `scout-game-${cleanCode}`;
        this.isHost = true;
        this.isSpectator = false;
        this.roomCode = cleanCode;
        this.spectatorConns = [];

        this.emit('reclaimingRoom', { roomCode: cleanCode, attempt });

        try {
            this.peer = new Peer(peerId, { debug: 1 });

            this.peer.on('open', (id) => {
                console.log(`[Host] Oda #${cleanCode} başarıyla geri alındı (Peer ID: ${id})`);
                this.registerRoom({
                    code: this.roomCode,
                    host: hostTeamName,
                    guest: '',
                    status: 'Canlı Maç (Devam Ediyor)',
                    round: 1
                });
                this.startRoomHeartbeat(this.roomCode, hostTeamName);
                this.emit('roomReclaimed', { roomCode: this.roomCode, peerId: id });
                this.emit('roomCreated', { roomCode: this.roomCode, peerId: id });
            });

            this.peer.on('connection', (connection) => {
                const isSpectator = connection.metadata && connection.metadata.isSpectator;

                if (isSpectator) {
                    connection.on('open', () => {
                        this.spectatorConns.push(connection);
                        this.emit('spectatorConnected', { connection, count: this.spectatorConns.length });
                    });

                    connection.on('close', () => {
                        this.spectatorConns = this.spectatorConns.filter(c => c !== connection);
                        this.emit('spectatorCountChanged', { count: this.spectatorConns.length });
                    });
                } else {
                    // Misafir Oyuncu yeniden bağlandı!
                    this.conn = connection;
                    this.playerConn = connection;
                    this.setupPlayerConnection(connection);
                }
            });

            this.peer.on('error', (err) => {
                console.warn(`[Host] Odayı geri alma denemesi #${attempt} sonuç:`, err);
                if (err.type === 'unavailable-id') {
                    // PeerJS sunucusu eski soketin düştüğünü birkaç saniyede anlar, 2 sn sonra aynı kodla tekrar dene!
                    if (attempt < 15) {
                        setTimeout(() => {
                            this.reclaimRoom(cleanCode, hostTeamName, attempt + 1);
                        }, 2000);
                    } else {
                        this.emit('error', { type: 'reclaim-failed', message: 'Oda kodu geri alınamadı.' });
                    }
                } else {
                    this.emit('error', err);
                }
            });
        } catch (e) {
            console.error('Oda geri alınırken hata:', e);
            this.emit('error', e);
        }
    }

    // ===================================================================
    // 2. MİSAFİR OYUNCU OLARAK KATIL
    // ===================================================================
    joinRoom(roomCode) {
        this.isHost = false;
        this.isSpectator = false;
        this.roomCode = roomCode.trim();
        const hostPeerId = `scout-game-${this.roomCode}`;

        try {
            this.peer = new Peer({ debug: 1 });

            this.peer.on('open', (id) => {
                const connection = this.peer.connect(hostPeerId, {
                    reliable: true,
                    metadata: { isSpectator: false }
                });
                this.conn = connection;
                this.setupPlayerConnection(connection);
            });

            this.peer.on('error', (err) => {
                console.warn('Odaya bağlanma hatası:', err);
                this.emit('error', err);
            });
        } catch (e) {
            console.error('Bağlantı hatası:', e);
            this.emit('error', e);
        }
    }

    // ===================================================================
    // 3. İZLEYİCİ (SPECTATOR) OLARAK MAÇA BAĞLAN
    // ===================================================================
    watchRoom(roomCode) {
        this.isHost = false;
        this.isSpectator = true;
        this.roomCode = roomCode.trim();
        const hostPeerId = `scout-game-${this.roomCode}`;

        try {
            this.peer = new Peer({ debug: 1 });

            this.peer.on('open', (id) => {
                const connection = this.peer.connect(hostPeerId, {
                    reliable: true,
                    metadata: { isSpectator: true }
                });
                this.conn = connection;
                this.setupSpectatorConnection(connection);
            });

            this.peer.on('error', (err) => {
                console.warn('İzleyici bağlantı hatası:', err);
                this.emit('error', err);
            });
        } catch (e) {
            console.error('İzleyici hatası:', e);
            this.emit('error', e);
        }
    }

    setupPlayerConnection(connection) {
        connection.on('open', () => {
            this.connected = true;
            this.emit('peerConnected', { isHost: this.isHost, roomCode: this.roomCode });
        });

        connection.on('data', (data) => {
            if (data && data.action) {
                this.emit(data.action, data.payload);
                // Host ise, misafir oyuncudan gelen aksiyonu izleyicilere de canlı aktar!
                if (this.isHost && this.spectatorConns.length > 0) {
                    this.broadcastToSpectators(data.action, data.payload);
                }
            }
        });

        connection.on('close', () => {
            this.connected = false;
            this.emit('peerDisconnected', {});
        });

        connection.on('error', (err) => {
            console.error('Bağlantı hatası:', err);
            this.emit('error', err);
        });
    }

    setupSpectatorConnection(connection) {
        connection.on('open', () => {
            this.connected = true;
            this.emit('spectatorJoined', { roomCode: this.roomCode });
        });

        connection.on('data', (data) => {
            if (data && data.action) {
                this.emit(data.action, data.payload);
            }
        });

        connection.on('close', () => {
            this.connected = false;
            this.emit('spectatorDisconnected', {});
        });

        connection.on('error', (err) => {
            console.error('İzleyici kanalı hatası:', err);
            this.emit('error', err);
        });
    }

    // ===================================================================
    // MESAJ VE AKSİYON GÖNDERME
    // ===================================================================
    send(action, payload = {}) {
        // Misafir oyuncuya gönder
        const target = this.isHost ? this.playerConn : this.conn;
        if (target && target.open) {
            target.send({ action, payload });
        }

        // Host ise izleyicilere de anında dağıt (broadcast)
        if (this.isHost) {
            this.broadcastToSpectators(action, payload);
        }
    }

    broadcastToSpectators(action, payload = {}) {
        this.spectatorConns = this.spectatorConns.filter(c => c && c.open);
        this.spectatorConns.forEach(conn => {
            try {
                conn.send({ action, payload });
            } catch (e) {
                console.warn('İzleyiciye veri aktarılamadı:', e);
            }
        });
    }

    // ===================================================================
    // AÇIK ODALAR KEŞFİ VE KAYDI (API & LOCAL FALLBACK - 10 DK TTL)
    // ===================================================================
    cleanExpiredRooms() {
        try {
            const list = JSON.parse(localStorage.getItem('scout_active_rooms') || '[]');
            const now = Date.now();
            // 10 dakikadan eski odaları at ve en fazla 5 odayı tut
            const fresh = list.filter(r => (now - (r.updatedAt || 0)) < 10 * 60 * 1000).slice(0, 5);
            localStorage.setItem('scout_active_rooms', JSON.stringify(fresh));
            return fresh;
        } catch (e) {
            return [];
        }
    }

    async registerRoom(roomData) {
        // 1. Yerel Depolama (Maksimum 5 taze oda, 10 dk ömür)
        try {
            const list = this.cleanExpiredRooms();
            const filtered = list.filter(r => r.code !== roomData.code);
            filtered.unshift({ ...roomData, updatedAt: Date.now() });
            localStorage.setItem('scout_active_rooms', JSON.stringify(filtered.slice(0, 5)));
        } catch (e) {}

        // 2. Sunucu API Kaydı (Çalışıyorsa)
        try {
            await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
        } catch (e) {}
    }

    async unregisterRoom(roomCode) {
        if (!roomCode) return;
        this.stopRoomHeartbeat();
        const codeStr = roomCode.toString().trim();

        // 1. localStorage'dan anında sil
        try {
            const list = JSON.parse(localStorage.getItem('scout_active_rooms') || '[]');
            const filtered = list.filter(r => r.code !== codeStr);
            localStorage.setItem('scout_active_rooms', JSON.stringify(filtered));
        } catch (e) {}

        // 2. Canlı sunucu API'sinden sil
        try {
            await fetch(`/api/rooms/${codeStr}`, { method: 'DELETE' });
        } catch (e) {}
    }

    async getActiveRooms() {
        // 1. Önce canlı sunucu API'sini dene
        try {
            const res = await fetch('/api/rooms');
            if (res.ok) {
                const rooms = await res.json();
                if (Array.isArray(rooms) && rooms.length > 0) {
                    return rooms;
                }
            }
        } catch (e) {}

        // 2. Sunucu yoksa veya Netlify statik moddaysa temizlenmiş localStorage'dan oku
        return this.cleanExpiredRooms();
    }

    startRoomHeartbeat(roomCode, hostTeamName = 'Dharma') {
        this.stopRoomHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isHost && this.roomCode) {
                this.registerRoom({
                    code: this.roomCode,
                    host: hostTeamName,
                    guest: '',
                    status: 'Canlı Maç Devam Ediyor',
                    round: 1
                });
            }
        }, 30000); // 30 saniyede bir odayı güncelle
    }

    stopRoomHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ===================================================================
    // MİSAFİR OTOMATİK YENİDEN BAĞLANMA DÖNGÜSÜ
    // ===================================================================
    startAutoReconnect(hostRoomCode) {
        this.stopAutoReconnect();
        let attempt = 0;
        const maxAttempts = 25;
        this.isReconnecting = true;
        const cleanCode = hostRoomCode.toString().trim();

        const tryConnect = () => {
            if (!this.isReconnecting) return;
            attempt++;
            this.emit('reconnectAttempt', { attempt, maxAttempts });

            if (attempt > maxAttempts) {
                this.stopAutoReconnect();
                this.emit('reconnectFailed', {});
                return;
            }

            console.log(`[Misafir] Host'a bağlanma deneniyor (${attempt}/${maxAttempts})...`);

            if (!this.peer || this.peer.destroyed) {
                this.peer = new Peer({ debug: 1 });
            }

            const hostPeerId = `scout-game-${cleanCode}`;

            const doConnect = () => {
                try {
                    const connection = this.peer.connect(hostPeerId, {
                        reliable: true,
                        metadata: { isSpectator: false }
                    });

                    let opened = false;
                    connection.on('open', () => {
                        opened = true;
                        this.stopAutoReconnect();
                        this.conn = connection;
                        this.setupPlayerConnection(connection);
                        this.emit('peerReconnected', { roomCode: cleanCode });
                    });

                    setTimeout(() => {
                        if (!opened && this.isReconnecting) {
                            try { connection.close(); } catch (e) {}
                        }
                    }, 2400);
                } catch (e) {
                    console.warn('Yeniden bağlanma isteği hatası:', e);
                }
            };

            if (this.peer.open) {
                doConnect();
            } else {
                this.peer.once('open', () => doConnect());
            }
        };

        tryConnect();
        this.reconnectTimer = setInterval(tryConnect, 2800);
    }

    stopAutoReconnect() {
        this.isReconnecting = false;
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    disconnect() {
        this.stopRoomHeartbeat();
        this.stopAutoReconnect();
        if (this.conn) this.conn.close();
        if (this.playerConn) this.playerConn.close();
        this.spectatorConns.forEach(c => c.close());
        this.spectatorConns = [];
        if (this.peer) this.peer.destroy();
        this.connected = false;
    }
}

const multiplayer = new MultiplayerManager();

