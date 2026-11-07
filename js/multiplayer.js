// ===================================================================
// PeerJS Tabanlı Sade ve Kararlı P2P Çok Oyunculu Bağlantı Motoru
// ===================================================================

class MultiplayerManager {
    constructor() {
        this.peer = null;
        this.conn = null;           // Misafir/İzleyici tarafında aktif bağlantı
        this.playerConn = null;     // Host tarafında misafir oyuncu bağlantısı
        this.spectatorConns = [];   // Host tarafında bağlı izleyiciler
        this.isHost = false;
        this.isSpectator = false;
        this.roomCode = null;
        this.callbacks = {};
        this.connected = false;
        this.connectTimer = null;
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

    generateRoomCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    getPeerConfig() {
        return {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:stun.cloudflare.com:3478' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    {
                        urls: [
                            'turn:openrelay.metered.ca:80',
                            'turn:openrelay.metered.ca:443',
                            'turns:openrelay.metered.ca:443?transport=tcp'
                        ],
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ],
                iceCandidatePoolSize: 10,
                sdpSemantics: 'unified-plan'
            }
        };
    }

    clearConnectTimer() {
        if (this.connectTimer) {
            clearTimeout(this.connectTimer);
            this.connectTimer = null;
        }
    }

    cleanupPeerOnly() {
        this.clearConnectTimer();
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
    }

    // ===================================================================
    // 1. EV SAHİBİ (HOST) OLARAK ODA KUR
    // ===================================================================
    createRoom(customCode = null, hostTeamName = 'Dharma') {
        this.cleanupPeerOnly();

        const code = (customCode || this.generateRoomCode()).toString().trim();
        const peerId = `scout-game-${code}`;
        this.isHost = true;
        this.isSpectator = false;
        this.roomCode = code;

        try {
            this.peer = new Peer(peerId, this.getPeerConfig());

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
                    if (this.playerConn && this.playerConn !== connection) {
                        try { this.playerConn.close(); } catch (e) {}
                    }
                    this.conn = connection;
                    this.playerConn = connection;
                    this.setupPlayerConnection(connection);
                }
            });

            this.peer.on('error', (err) => {
                console.warn('Host PeerJS Hatası:', err);
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
    // 2. MİSAFİR OYUNCU OLARAK KATIL
    // ===================================================================
    joinRoom(roomCode) {
        this.cleanupPeerOnly();

        this.isHost = false;
        this.isSpectator = false;
        this.roomCode = roomCode.toString().trim();
        const hostPeerId = `scout-game-${this.roomCode}`;

        try {
            this.peer = new Peer(this.getPeerConfig());

            this.peer.on('open', () => {
                const connection = this.peer.connect(hostPeerId, {
                    reliable: true,
                    serialization: 'json',
                    metadata: { isSpectator: false }
                });
                this.conn = connection;
                this.setupPlayerConnection(connection);

                this.connectTimer = setTimeout(() => {
                    if (!this.connected) {
                        console.warn('[joinRoom] Bağlantı zaman aşımına uğradı');
                        this.emit('error', { type: 'timeout', message: 'Odaya bağlanma zaman aşımına uğradı.' });
                    }
                }, 15000);
            });

            this.peer.on('error', (err) => {
                this.clearConnectTimer();
                console.warn('Odaya bağlanma hatası:', err);
                this.emit('error', err);
            });
        } catch (e) {
            this.clearConnectTimer();
            console.error('Bağlantı hatası:', e);
            this.emit('error', e);
        }
    }

    // ===================================================================
    // 3. İZLEYİCİ (SPECTATOR) OLARAK MAÇA BAĞLAN
    // ===================================================================
    watchRoom(roomCode) {
        this.cleanupPeerOnly();

        this.isHost = false;
        this.isSpectator = true;
        this.roomCode = roomCode.toString().trim();
        const hostPeerId = `scout-game-${this.roomCode}`;

        try {
            this.peer = new Peer(this.getPeerConfig());

            this.peer.on('open', () => {
                const connection = this.peer.connect(hostPeerId, {
                    reliable: true,
                    serialization: 'json',
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

    // ===================================================================
    // 4. BAĞLANTI KANALI OLAYLARI
    // ===================================================================
    setupPlayerConnection(connection) {
        connection.on('open', () => {
            this.clearConnectTimer();
            this.connected = true;
            this.emit('peerConnected', { isHost: this.isHost, roomCode: this.roomCode });
        });

        connection.on('data', (data) => {
            if (data && data.action) {
                this.emit(data.action, data.payload);
                if (this.isHost && this.spectatorConns.length > 0) {
                    this.broadcastToSpectators(data.action, data.payload);
                }
            }
        });

        connection.on('close', () => {
            this.clearConnectTimer();
            this.connected = false;
            this.emit('peerDisconnected', { isHost: this.isHost, roomCode: this.roomCode });
        });

        connection.on('error', (err) => {
            this.clearConnectTimer();
            console.error('Veri kanalı hatası:', err);
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
    // 5. MESAJ GÖNDERME
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

        if (this.isHost) {
            this.broadcastToSpectators(action, payload);
        }
    }

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
            } catch (e) {}
        });
    }

    // ===================================================================
    // 6. ODA KAYDI VE TEMİZLİK
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

    disconnect() {
        this.stopRoomHeartbeat();
        this.cleanupPeerOnly();
        this.isHost = false;
        this.isSpectator = false;
        this.roomCode = null;
    }
}

const multiplayer = new MultiplayerManager();
