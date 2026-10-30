// ===================================================================
// PeerJS Tabanlı P2P Çok Oyunculu & Dinamik Ev Sahibi Devri (Host Migration)
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
        this.reconnectTimer = null;
        this.isReconnecting = false;
        this.isMigrating = false;
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
    // 1.1 DİNAMİK EV SAHİBİ DEVRİ (HOST MIGRATION)
    // Ev sahibi ayrıldığında misafir bu fonksiyonla odanın yeni resmi Host'u olur!
    // ===================================================================
    promoteToHost(roomCode, hostTeamName = 'Ev Sahibi', attempt = 1) {
        this.stopAutoReconnect();
        this.isMigrating = true;

        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.playerConn) {
            try { this.playerConn.close(); } catch (e) {}
            this.playerConn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }

        const cleanCode = roomCode.toString().trim();
        const peerId = `scout-game-${cleanCode}`;
        this.isHost = true;
        this.isSpectator = false;
        this.roomCode = cleanCode;
        this.spectatorConns = [];

        const maxAttempts = 20;
        this.emit('hostMigrationAttempt', { roomCode: cleanCode, attempt, maxAttempts });

        try {
            this.peer = new Peer(peerId, { debug: 1 });

            this.peer.on('open', (id) => {
                this.isMigrating = false;
                console.log(`[Host Migration] Oda #${cleanCode} kontrolü başarıyla devralındı! Peer ID: ${id}`);
                this.registerRoom({
                    code: this.roomCode,
                    host: hostTeamName,
                    guest: '',
                    status: 'Canlı Maç (Devralındı)',
                    round: 1
                });
                this.startRoomHeartbeat(this.roomCode, hostTeamName);
                this.emit('hostMigrationSuccess', { roomCode: this.roomCode, peerId: id });
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
                    // Rakip oyuncu odaya katıldı / geri döndü!
                    this.conn = connection;
                    this.playerConn = connection;
                    this.setupPlayerConnection(connection);
                    this.emit('opponentReconnected', { connection, roomCode: this.roomCode });
                }
            });

            this.peer.on('error', (err) => {
                console.warn(`[Host Migration] Odayı devralma denemesi #${attempt} sonuç:`, err);
                if (err.type === 'unavailable-id') {
                    // Eski host'un soketinin PeerJS broker'ından düşmesi 2-3 saniye sürebilir
                    if (attempt < maxAttempts && this.isMigrating) {
                        setTimeout(() => {
                            if (this.isMigrating) {
                                this.promoteToHost(cleanCode, hostTeamName, attempt + 1);
                            }
                        }, 1500);
                    } else {
                        this.isMigrating = false;
                        this.emit('hostMigrationFailed', { message: 'Oda devralınamadı (Zaman aşımı).' });
                    }
                } else {
                    this.isMigrating = false;
                    this.emit('error', err);
                }
            });
        } catch (e) {
            console.error('Host migration başlatılırken hata:', e);
            this.isMigrating = false;
            this.emit('hostMigrationFailed', { message: e.message });
        }
    }

    // ===================================================================
    // 1.2 HOST SAYFA YENİLEME SONRASI AYNI ODAYI GERİ AL (RECLAIM)
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
                    this.emit('opponentReconnected', { connection, roomCode: this.roomCode });
                }
            });

            this.peer.on('error', (err) => {
                console.warn(`[Host] Odayı geri alma denemesi #${attempt} sonuç:`, err);
                if (err.type === 'unavailable-id') {
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
    // 1.3 AKILLI ODAYA YENİDEN GİRİŞ (REJOIN ROOM)
    // İster eski Host ister Misafir olsun: Önce odaya misafir olarak bağlanmayı dener.
    // Eğer diğer oyuncu odayı devralıp Host olmuşsa anında ona bağlanır.
    // Eğer odada kimse yoksa ve boşsa, odayı kendisi Host olarak devralır!
    // ===================================================================
    rejoinRoom(roomCode, teamName = 'Oyuncu') {
        const cleanCode = roomCode.toString().trim();
        const hostPeerId = `scout-game-${cleanCode}`;
        this.roomCode = cleanCode;

        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
        }

        this.peer = new Peer({ debug: 1 });

        let resolved = false;

        this.peer.on('open', () => {
            const connection = this.peer.connect(hostPeerId, {
                reliable: true,
                metadata: { isSpectator: false, isReconnecting: true }
            });

            connection.on('open', () => {
                if (resolved) return;
                resolved = true;
                this.isHost = false;
                this.isSpectator = false;
                this.conn = connection;
                this.setupPlayerConnection(connection);
                this.emit('peerReconnected', { roomCode: cleanCode });
            });

            // 3 saniye içinde Host'a bağlanamazsa, demek ki diğer oyuncu henüz Host olmamış veya koptu.
            // Bu durumda odayı biz Host olarak devralalım!
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.log(`[Rejoin] Odada aktif Host bulunamadı, odayı Host olarak talep ediyoruz...`);
                    try { connection.close(); } catch (e) {}
                    this.promoteToHost(cleanCode, teamName);
                }
            }, 3000);
        });

        this.peer.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                console.log(`[Rejoin] Misafir olarak bağlanılamadı, Host devri başlatılıyor...`, err);
                this.promoteToHost(cleanCode, teamName);
            }
        });
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
            this.emit('peerDisconnected', { isHost: this.isHost, roomCode: this.roomCode });
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
        const target = this.isHost ? this.playerConn : this.conn;
        if (target && target.open) {
            try {
                target.send({ action, payload });
            } catch (e) {
                console.warn('Veri gönderilemedi:', e);
            }
        }

        // Host ise izleyicilere de anında dağıt (broadcast)
        if (this.isHost) {
            this.broadcastToSpectators(action, payload);
        }
    }

    // Sayfa kapanırken veya yenilenirken karşı tarafa anında haber ver
    sendLeavingNotice() {
        if (this.connected) {
            try {
                this.send('PEER_LEAVING', { isHost: this.isHost, roomCode: this.roomCode });
            } catch (e) {}
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
            const fresh = list.filter(r => (now - (r.updatedAt || 0)) < 10 * 60 * 1000).slice(0, 5);
            localStorage.setItem('scout_active_rooms', JSON.stringify(fresh));
            return fresh;
        } catch (e) {
            return [];
        }
    }

    async registerRoom(roomData) {
        try {
            const list = this.cleanExpiredRooms();
            const filtered = list.filter(r => r.code !== roomData.code);
            filtered.unshift({ ...roomData, updatedAt: Date.now() });
            localStorage.setItem('scout_active_rooms', JSON.stringify(filtered.slice(0, 5)));
        } catch (e) {}

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

        try {
            const list = JSON.parse(localStorage.getItem('scout_active_rooms') || '[]');
            const filtered = list.filter(r => r.code !== codeStr);
            localStorage.setItem('scout_active_rooms', JSON.stringify(filtered));
        } catch (e) {}

        try {
            await fetch(`/api/rooms/${codeStr}`, { method: 'DELETE' });
        } catch (e) {}
    }

    async getActiveRooms() {
        try {
            const res = await fetch('/api/rooms');
            if (res.ok) {
                const rooms = await res.json();
                if (Array.isArray(rooms) && rooms.length > 0) {
                    return rooms;
                }
            }
        } catch (e) {}

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
        }, 30000);
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
        this.isMigrating = false;
        this.stopRoomHeartbeat();
        this.stopAutoReconnect();
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.playerConn) {
            try { this.playerConn.close(); } catch (e) {}
            this.playerConn = null;
        }
        this.spectatorConns.forEach(c => {
            try { c.close(); } catch (e) {}
        });
        this.spectatorConns = [];
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this.connected = false;
        this.isHost = false;
        this.isSpectator = false;
        this.roomCode = null;
    }
}

const multiplayer = new MultiplayerManager();
