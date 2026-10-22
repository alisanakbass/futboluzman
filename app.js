// ===================================================================
// SCAUDE SCOUT - EA SPORTS FC OYUN MOTORU & KURALLAR
// ===================================================================

class ScoutGame {
    constructor() {
        this.database = null;
        this.gameMode = 'local'; // 'local' veya 'online'
        this.myTeamKey = 'teamA'; // Online modda host teamA, misafir teamB

        // Mevki Sıralaması (Her Maçta Tamamen Rastgele Karıştırılır!)
        this.matchPositions = typeof POSITIONS !== 'undefined' ? [...POSITIONS] : [];

        this.teams = {
            teamA: {
                id: 'teamA',
                name: 'Dharma',
                color: '#00d2ff',
                squad: {},
                totalProfit: 0,
                totalValue: 0,
                hasBlock: true
            },
            teamB: {
                id: 'teamB',
                name: 'The Hunters',
                color: '#ff9100',
                squad: {},
                totalProfit: 0,
                totalValue: 0,
                hasBlock: true
            }
        };

        this.currentRound = 0; // 0..10
        this.firstPicker = 'teamA'; // Turda ilk seçen
        this.currentTurn = 'teamA'; // Şu anki hamle sırası
        this.roundCards = []; // 4 EA FC Kartı
        this.lockedPicks = {}; // { teamA: cardIndex, teamB: cardIndex }
        this.blockedCardIndex = null;
        this.activePitchTeam = 'teamA';
        this.isRevealing = false;

        // 15 Saniyelik Geçiş & Hızlı Geç (Skip) Durumu
        this.skipVotes = { teamA: false, teamB: false };
        this.skipCountdownInterval = null;
        this.currentStepResolver = null;
        this.currentStepType = 'card'; // 'card' veya 'round'

        // Seçim Onay Modalı Durumu
        this.pendingCardPickIndex = null;

        this.init();
    }

    async init() {
        await this.loadDatabase();
        this.setupDOM();
        this.setupEventListeners();
        this.setupMultiplayerEvents();
        this.renderPitchNodes();
        this.checkResumableSession();
    }

    async loadDatabase() {
        try {
            const res = await fetch('oyuncular.json');
            this.database = await res.json();
            console.log('oyuncular.json yüklendi.');
        } catch (e) {
            console.error('Veritabanı okunamadı:', e);
        }
    }

    setupDOM() {
        this.screens = {
            mainMenu: document.getElementById('mainMenuScreen'),
            lobby: document.getElementById('lobbyScreen'),
            match: document.getElementById('matchScreen')
        };

        this.modals = {
            host: document.getElementById('hostModal'),
            join: document.getElementById('joinModal'),
            local: document.getElementById('localModal'),
            coin: document.getElementById('coinModal'),
            winner: document.getElementById('winnerModal'),
            pitch: document.getElementById('pitchModal'),
            confirmPick: document.getElementById('confirmPickModal'),
            notice: document.getElementById('noticeModal'),
            block: document.getElementById('blockModal'),
            spectator: document.getElementById('spectatorModal'),
            resumeSession: document.getElementById('resumeSessionModal'),
            exitMatch: document.getElementById('exitMatchModal')
        };

        this.dom = {
            cardsArena: document.getElementById('cardsArena'),
            currentPositionTitle: document.getElementById('currentPositionTitle'),
            currentRoundStep: document.getElementById('currentRoundStep'),
            actionTipText: document.getElementById('actionTipText'),
            btnUseBlock: document.getElementById('btnUseBlock'),
            teamACard: document.getElementById('teamACard'),
            teamBCard: document.getElementById('teamBCard'),
            teamAName: document.getElementById('teamAName'),
            teamBName: document.getElementById('teamBName'),
            teamAProfit: document.getElementById('teamAProfit'),
            teamBProfit: document.getElementById('teamBProfit'),
            teamABlockBadge: document.getElementById('teamABlockBadge'),
            teamBBlockBadge: document.getElementById('teamBBlockBadge'),
            pitchContainer: document.getElementById('pitchContainer'),
            tabTeamA: document.getElementById('tabTeamA'),
            tabTeamB: document.getElementById('tabTeamB'),
            audioToggle: document.getElementById('audioToggle'),
            displayRoomCode: document.getElementById('displayRoomCode'),
            lobbyNameA: document.getElementById('lobbyNameA'),
            lobbyNameB: document.getElementById('lobbyNameB'),
            lobbyStatusB: document.getElementById('lobbyStatusB'),
            btnLobbyStartMatch: document.getElementById('btnLobbyStartMatch'),
            coinElement: document.getElementById('coinElement'),
            coinResultText: document.getElementById('coinResultText'),
            btnFlipCoin: document.getElementById('btnFlipCoin'),
            btnFloatingPitch: document.getElementById('btnFloatingPitch'),
            btnClosePitchModal: document.getElementById('btnClosePitchModal'),
            btnFloatingSkip: document.getElementById('btnFloatingSkip'),
            floatingSkipText: document.getElementById('floatingSkipText'),

            // Modallar
            confirmPickTeamName: document.getElementById('confirmPickTeamName'),
            confirmPickSlot: document.getElementById('confirmPickSlot'),
            confirmPickSeason: document.getElementById('confirmPickSeason'),
            confirmPickVal: document.getElementById('confirmPickVal'),
            confirmPickPos: document.getElementById('confirmPickPos'),
            btnConfirmPickYes: document.getElementById('btnConfirmPickYes'),
            btnConfirmPickNo: document.getElementById('btnConfirmPickNo'),

            noticeIcon: document.getElementById('noticeIcon'),
            noticeTitle: document.getElementById('noticeTitle'),
            noticeMessage: document.getElementById('noticeMessage'),
            btnNoticeClose: document.getElementById('btnNoticeClose'),

            blockModalDesc: document.getElementById('blockModalDesc'),
            blockCardsGrid: document.getElementById('blockCardsGrid'),
            btnCancelBlock: document.getElementById('btnCancelBlock'),

            // İzleyici Modu Elemanları
            btnMenuSpectator: document.getElementById('btnMenuSpectator'),
            activeRoomsList: document.getElementById('activeRoomsList'),
            btnRefreshRooms: document.getElementById('btnRefreshRooms'),
            spectatorRoomCodeInput: document.getElementById('spectatorRoomCodeInput'),
            btnConfirmSpectator: document.getElementById('btnConfirmSpectator'),
            btnCancelSpectator: document.getElementById('btnCancelSpectator'),
            spectatorHeaderBadge: document.getElementById('spectatorHeaderBadge'),
            btnExitSpectator: document.getElementById('btnExitSpectator'),

            // Oturum Kurtarma & Host Bekleme Elemanları
            hostWaitingOverlay: document.getElementById('hostWaitingOverlay'),
            hostWaitingAttemptText: document.getElementById('hostWaitingAttemptText'),
            btnHostWaitingExit: document.getElementById('btnHostWaitingExit'),
            btnResumeContinue: document.getElementById('btnResumeContinue'),
            btnResumeDiscard: document.getElementById('btnResumeDiscard'),

            // Maçtan Ayrılma Elemanları
            btnExitMatch: document.getElementById('btnExitMatch'),
            btnConfirmExitMatch: document.getElementById('btnConfirmExitMatch'),
            btnCancelExitMatch: document.getElementById('btnCancelExitMatch'),
            exitMatchDesc: document.getElementById('exitMatchDesc')
        };
    }

    switchScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    setupEventListeners() {
        // --- 1. ANA MENÜ BUTONLARI ---
        document.getElementById('btnMenuHost').addEventListener('click', () => {
            soundFX.whistle();
            this.modals.host.classList.add('active');
        });

        document.getElementById('btnMenuJoin').addEventListener('click', () => {
            soundFX.whistle();
            this.modals.join.classList.add('active');
        });

        document.getElementById('btnMenuLocal').addEventListener('click', () => {
            soundFX.whistle();
            this.modals.local.classList.add('active');
        });

        // İzleyici Modu Menü Butonu
        if (this.dom.btnMenuSpectator) {
            this.dom.btnMenuSpectator.addEventListener('click', () => {
                soundFX.whistle();
                this.loadAndRenderActiveRooms();
                this.modals.spectator.classList.add('active');
            });
        }

        // --- 2. HOST ONAY BUTONU ---
        document.getElementById('btnConfirmHost').addEventListener('click', () => {
            this.clearLiveSessionSnapshot();
            const hostName = document.getElementById('hostTeamNameInput').value.trim() || 'Dharma';
            this.teams.teamA.name = hostName;
            this.myTeamKey = 'teamA';
            this.gameMode = 'online';

            this.modals.host.classList.remove('active');
            multiplayer.createRoom(null, hostName);

            this.dom.lobbyNameA.textContent = hostName;
            this.dom.lobbyNameB.textContent = 'Bekleniyor...';
            this.dom.lobbyStatusB.textContent = 'BEKLENİYOR ⏳';
            this.dom.lobbyStatusB.className = 'lobby-status-tag status-waiting';
            this.dom.btnLobbyStartMatch.style.display = 'none';

            this.switchScreen('lobby');
        });

        // --- 3. JOIN ONAY BUTONU ---
        document.getElementById('btnConfirmJoin').addEventListener('click', () => {
            this.clearLiveSessionSnapshot();
            const code = document.getElementById('joinRoomCodeInput').value.trim();
            const joinName = document.getElementById('joinTeamNameInput').value.trim() || 'The Hunters';

            if (!code) {
                this.showNotice('EKSİK BİLGİ', 'Lütfen geçerli 4 haneli oda kodunu girin.', '⚠️');
                return;
            }

            this.teams.teamB.name = joinName;
            this.myTeamKey = 'teamB';
            this.gameMode = 'online';

            this.modals.join.classList.remove('active');
            multiplayer.joinRoom(code);

            this.dom.displayRoomCode.textContent = code;
            this.dom.lobbyNameA.textContent = 'Ev Sahibi';
            this.dom.lobbyNameB.textContent = joinName;
            this.dom.lobbyStatusB.textContent = 'BAĞLANILIYOR...';

            this.switchScreen('lobby');
        });

        // --- 4. YEREL 2 KİŞİ ONAY BUTONU ---
        document.getElementById('btnConfirmLocal').addEventListener('click', () => {
            this.clearLiveSessionSnapshot();
            const nameA = document.getElementById('localTeamANameInput').value.trim() || 'Dharma';
            const nameB = document.getElementById('localTeamBNameInput').value.trim() || 'The Hunters';

            this.teams.teamA.name = nameA;
            this.teams.teamB.name = nameB;
            this.gameMode = 'local';

            this.modals.local.classList.remove('active');
            this.startCoinTossFlow();
        });

        // Lobi Geri Dön Butonu
        document.getElementById('btnLobbyBack').addEventListener('click', () => {
            multiplayer.disconnect();
            this.switchScreen('mainMenu');
        });

        // Oda Kodu Kopyala
        document.getElementById('btnCopyRoomCode').addEventListener('click', () => {
            const code = this.dom.displayRoomCode.textContent;
            navigator.clipboard.writeText(code);
            this.showNotice('KOPYALANDI', `Oda kodu (<strong>${code}</strong>) panoya kopyalandı! Arkadaşınızla paylaşabilirsiniz.`, '📋');
        });

        // Host Lobiden Maçı Başlat
        this.dom.btnLobbyStartMatch.addEventListener('click', () => {
            if (this.gameMode === 'online' && multiplayer.isHost) {
                this.matchPositions = [...POSITIONS].sort(() => 0.5 - Math.random());
                multiplayer.send('HOST_START_MATCH', {
                    teamA: this.teams.teamA.name,
                    teamB: this.teams.teamB.name,
                    matchPositions: this.matchPositions
                });
            }
            this.startCoinTossFlow();
        });

        // Yazı Tura Atma Butonu
        this.dom.btnFlipCoin.addEventListener('click', () => {
            this.runCoinToss();
        });

        // Blok / Joker Butonu
        this.dom.btnUseBlock.addEventListener('click', () => {
            this.handleBlockRequest();
        });

        // Saha Sekmeleri
        this.dom.tabTeamA.addEventListener('click', () => {
            this.activePitchTeam = 'teamA';
            this.dom.tabTeamA.classList.add('active');
            this.dom.tabTeamB.classList.remove('active');
            this.renderPitchNodes();
        });

        this.dom.tabTeamB.addEventListener('click', () => {
            this.activePitchTeam = 'teamB';
            this.dom.tabTeamB.classList.add('active');
            this.dom.tabTeamA.classList.remove('active');
            this.renderPitchNodes();
        });

        // Ses Aç / Kapa Butonu
        this.dom.audioToggle.addEventListener('click', () => {
            const isMuted = soundFX.toggleMute();
            this.dom.audioToggle.textContent = isMuted ? '🔇' : '🔊';
        });

        // Sol Alttaki 4-3-3 Kadro Modalı Butonları
        if (this.dom.btnFloatingPitch) {
            this.dom.btnFloatingPitch.addEventListener('click', () => {
                soundFX.cardHover();
                this.modals.pitch.classList.add('active');
                this.renderPitchNodes();
            });
        }

        if (this.dom.btnClosePitchModal) {
            this.dom.btnClosePitchModal.addEventListener('click', () => {
                this.modals.pitch.classList.remove('active');
            });
        }

        // Sağ Alttaki Asılı Hızlı Geç (Skip) Butonu
        if (this.dom.btnFloatingSkip) {
            this.dom.btnFloatingSkip.addEventListener('click', () => {
                this.handleSkipButtonClick();
            });
        }

        // Yeniden Oyna
        document.getElementById('btnRestartGame').addEventListener('click', () => {
            this.clearLiveSessionSnapshot();
            window.location.reload();
        });

        // Seçim Onay Modalı Butonları
        if (this.dom.btnConfirmPickYes) {
            this.dom.btnConfirmPickYes.addEventListener('click', () => {
                this.executeConfirmPick();
            });
        }
        if (this.dom.btnConfirmPickNo) {
            this.dom.btnConfirmPickNo.addEventListener('click', () => {
                this.cancelConfirmPick();
            });
        }

        // Bildirim Modalı Kapatma
        if (this.dom.btnNoticeClose) {
            this.dom.btnNoticeClose.addEventListener('click', () => {
                this.closeNotice();
            });
        }

        // Blok Modalı İptal
        if (this.dom.btnCancelBlock) {
            this.dom.btnCancelBlock.addEventListener('click', () => {
                this.modals.block.classList.remove('active');
            });
        }

        // İzleyici Modu Butonları
        if (this.dom.btnRefreshRooms) {
            this.dom.btnRefreshRooms.addEventListener('click', () => {
                this.loadAndRenderActiveRooms();
            });
        }

        if (this.dom.btnConfirmSpectator) {
            this.dom.btnConfirmSpectator.addEventListener('click', () => {
                const code = this.dom.spectatorRoomCodeInput.value.trim();
                this.startWatchingRoom(code);
            });
        }

        if (this.dom.btnCancelSpectator) {
            this.dom.btnCancelSpectator.addEventListener('click', () => {
                this.modals.spectator.classList.remove('active');
            });
        }

        if (this.dom.btnExitSpectator) {
            this.dom.btnExitSpectator.addEventListener('click', () => {
                this.exitSpectatorMode();
            });
        }

        // --- 7. OTURUM KURTARMA VE BEKLEME BUTONLARI ---
        if (this.dom.btnResumeContinue) {
            this.dom.btnResumeContinue.addEventListener('click', () => {
                this.resumeLiveSession();
            });
        }

        if (this.dom.btnResumeDiscard) {
            this.dom.btnResumeDiscard.addEventListener('click', () => {
                this.discardLiveSession();
            });
        }

        if (this.dom.btnHostWaitingExit) {
            this.dom.btnHostWaitingExit.addEventListener('click', () => {
                this.discardLiveSession();
            });
        }

        // --- 8. KAZARA YENİLEME / SEKME KAPATMA KORUMASI ---
        window.addEventListener('beforeunload', (e) => {
            if (this.screens.match && this.screens.match.classList.contains('active') && this.currentRound < 11) {
                this.saveLiveSessionSnapshot();
                e.preventDefault();
                e.returnValue = 'Devam eden bir maçınız var! Ayrılmak istediğinize emin misiniz?';
                return e.returnValue;
            }
        });

        // --- 9. MAÇTAN AYRILMA BUTONU VE MODALI ---
        if (this.dom.btnExitMatch) {
            this.dom.btnExitMatch.addEventListener('click', () => {
                if (this.gameMode === 'online' && multiplayer.isHost) {
                    this.dom.exitMatchDesc.innerHTML = 'Maçtan ayrılmak istediğinize emin misiniz?<br><strong>Ev sahibi</strong> olarak ayrılırsanız oda tamamen kapatılacak ve diğer oyuncu bilgilendirilecektir.';
                } else if (this.gameMode === 'online' && !multiplayer.isHost) {
                    this.dom.exitMatchDesc.innerHTML = 'Maçtan ayrılmak istediğinize emin misiniz?<br>Maçı terk ederseniz oda sonlandırılacak ve ana menüye dönülecektir.';
                } else {
                    this.dom.exitMatchDesc.innerHTML = 'Yerel maçtan ayrılıp ana menüye dönmek istediğinize emin misiniz?';
                }
                this.modals.exitMatch.classList.add('active');
            });
        }

        if (this.dom.btnCancelExitMatch) {
            this.dom.btnCancelExitMatch.addEventListener('click', () => {
                this.modals.exitMatch.classList.remove('active');
            });
        }

        if (this.dom.btnConfirmExitMatch) {
            this.dom.btnConfirmExitMatch.addEventListener('click', () => {
                this.abandonMatch();
            });
        }

        // Klavye ile ESC tuşuna basınca açık modalları kapat
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modals.confirmPick && this.modals.confirmPick.classList.contains('active')) {
                    this.cancelConfirmPick();
                }
                if (this.modals.notice && this.modals.notice.classList.contains('active')) {
                    this.closeNotice();
                }
                if (this.modals.block && this.modals.block.classList.contains('active')) {
                    this.modals.block.classList.remove('active');
                }
                if (this.modals.pitch && this.modals.pitch.classList.contains('active')) {
                    this.modals.pitch.classList.remove('active');
                }
                if (this.modals.spectator && this.modals.spectator.classList.contains('active')) {
                    this.modals.spectator.classList.remove('active');
                }
                if (this.modals.exitMatch && this.modals.exitMatch.classList.contains('active')) {
                    this.modals.exitMatch.classList.remove('active');
                }
            }
        });
    }

    setupMultiplayerEvents() {
        multiplayer.on('roomCreated', (data) => {
            this.dom.displayRoomCode.textContent = data.roomCode;
        });

        multiplayer.on('peerConnected', (data) => {
            soundFX.whistle();
            if (data.isHost) {
                // Host tarafı: Misafir bağlandı
                this.dom.lobbyStatusB.textContent = 'HAZIR ✅';
                this.dom.lobbyStatusB.className = 'lobby-status-tag status-ready';
                this.dom.btnLobbyStartMatch.style.display = 'block';

                multiplayer.send('SYNC_LOBBY_NAMES', {
                    teamA: this.teams.teamA.name,
                    teamB: this.teams.teamB.name
                });

                // Eğer maç devam ederken misafir düşüp yeniden bağlandıysa: CANLI MAÇI GERİ YÜKLE
                if (this.screens.match.classList.contains('active') || this.currentRound > 0) {
                    multiplayer.send('RECONNECT_SYNC', {
                        teamA: this.teams.teamA,
                        teamB: this.teams.teamB,
                        currentRound: this.currentRound,
                        matchPositions: this.matchPositions,
                        roundCards: this.roundCards,
                        currentTurn: this.currentTurn,
                        firstPicker: this.firstPicker,
                        lockedPicks: this.lockedPicks,
                        blockedCardIndex: this.blockedCardIndex,
                        isRevealing: this.isRevealing
                    });
                }
            } else {
                // Misafir tarafı: Odaya bağlandı
                this.dom.lobbyStatusB.textContent = 'BAĞLANDI (HAZIR) ✅';
                this.dom.lobbyStatusB.className = 'lobby-status-tag status-ready';
                document.getElementById('lobbySubtitleText').textContent = 'Host maç başlatınca oyun başlayacaktır...';
                
                multiplayer.send('GUEST_NAME_UPDATE', {
                    name: this.teams.teamB.name
                });
            }
        });

        multiplayer.on('RECONNECT_SYNC', (payload) => {
            console.log('Maça yeniden bağlanıldı! Canlı durum eşitleniyor...', payload);
            this.teams.teamA = payload.teamA;
            this.teams.teamB = payload.teamB;
            this.currentRound = payload.currentRound;
            this.matchPositions = payload.matchPositions || [...POSITIONS];
            this.roundCards = payload.roundCards || [];
            this.currentTurn = payload.currentTurn;
            this.firstPicker = payload.firstPicker;
            this.lockedPicks = payload.lockedPicks || {};
            this.blockedCardIndex = payload.blockedCardIndex;
            this.isRevealing = payload.isRevealing || false;

            // Bütün modalları ve bekleme katmanını kapatıp doğrudan maç ekranına gir
            Object.values(this.modals).forEach(m => m && m.classList.remove('active'));
            if (this.dom.hostWaitingOverlay) {
                this.dom.hostWaitingOverlay.classList.remove('active');
            }

            this.dom.teamAName.textContent = this.teams.teamA.name;
            this.dom.teamBName.textContent = this.teams.teamB.name;
            this.dom.tabTeamA.textContent = this.teams.teamA.name;
            this.dom.tabTeamB.textContent = this.teams.teamB.name;
            this.updateScoreboard();

            this.switchScreen('match');
            this.renderRound();
            this.renderPitchNodes();
            this.saveLiveSessionSnapshot();
            soundFX.whistle();
            this.showNotice('MAÇA DÖNÜLDÜ', '✅ Ev sahibi ile bağlantı tekrar kuruldu! Maç kaldığı yerden devam ediyor.', '⚡');
        });

        multiplayer.on('GUEST_NAME_UPDATE', (payload) => {
            this.teams.teamB.name = payload.name;
            this.dom.lobbyNameB.textContent = payload.name;
        });

        multiplayer.on('SYNC_LOBBY_NAMES', (payload) => {
            this.teams.teamA.name = payload.teamA;
            this.dom.lobbyNameA.textContent = payload.teamA;
        });

        multiplayer.on('HOST_START_MATCH', (payload) => {
            this.teams.teamA.name = payload.teamA;
            this.teams.teamB.name = payload.teamB;
            if (payload.matchPositions) {
                this.matchPositions = payload.matchPositions;
            }
            this.startCoinTossFlow();
        });

        multiplayer.on('COIN_TOSS_RESULT', (payload) => {
            this.applyCoinTossResult(payload.winner);
        });

        multiplayer.on('START_ROUND_SYNC', (payload) => {
            this.currentRound = payload.round;
            if (payload.matchPositions) {
                this.matchPositions = payload.matchPositions;
            }
            this.roundCards = payload.cards;
            this.lockedPicks = {};
            this.blockedCardIndex = null;
            this.isRevealing = false;
            this.currentTurn = payload.turn;
            this.firstPicker = payload.firstPicker;
            this.renderRound();
        });

        multiplayer.on('CARD_LOCKED_SYNC', (payload) => {
            if (this.modals.confirmPick && this.modals.confirmPick.classList.contains('active')) {
                this.cancelConfirmPick();
            }
            this.applyLockCard(payload.cardIndex, payload.pickerTeam);
        });

        multiplayer.on('BLOCK_USED', (payload) => {
            if (this.modals.confirmPick && this.modals.confirmPick.classList.contains('active')) {
                if (this.pendingCardPickIndex === payload.targetCardIndex) {
                    this.cancelConfirmPick();
                }
            }
            this.applyBlock(payload.blockerTeam, payload.targetCardIndex);
        });

        multiplayer.on('SKIP_VOTE', (payload) => {
            this.handleRemoteSkipVote(payload.team);
        });

        // Host: Yeni bir izleyici bağlandığında canlı maç durumunu ona gönder
        multiplayer.on('spectatorConnected', () => {
            if (this.gameMode === 'online' && multiplayer.isHost) {
                multiplayer.broadcastToSpectators('LIVE_SYNC_SPECTATOR', {
                    teamA: this.teams.teamA,
                    teamB: this.teams.teamB,
                    currentRound: this.currentRound,
                    matchPositions: this.matchPositions,
                    roundCards: this.roundCards,
                    currentTurn: this.currentTurn,
                    firstPicker: this.firstPicker,
                    lockedPicks: this.lockedPicks,
                    blockedCardIndex: this.blockedCardIndex,
                    isRevealing: this.isRevealing,
                    inMatch: this.screens.match.classList.contains('active')
                });
            }
        });

        // İzleyici: Canlı maç durumu alındı
        multiplayer.on('LIVE_SYNC_SPECTATOR', (payload) => {
            this.teams.teamA = payload.teamA;
            this.teams.teamB = payload.teamB;
            this.currentRound = payload.currentRound;
            this.matchPositions = payload.matchPositions || [...POSITIONS];
            this.roundCards = payload.roundCards || [];
            this.currentTurn = payload.currentTurn;
            this.firstPicker = payload.firstPicker;
            this.lockedPicks = payload.lockedPicks || {};
            this.blockedCardIndex = payload.blockedCardIndex;
            this.isRevealing = payload.isRevealing;

            this.dom.teamAName.textContent = this.teams.teamA.name;
            this.dom.teamBName.textContent = this.teams.teamB.name;
            this.dom.tabTeamA.textContent = this.teams.teamA.name;
            this.dom.tabTeamB.textContent = this.teams.teamB.name;

            // Bütün modalları kapatıp doğrudan maç ekranına gir
            Object.values(this.modals).forEach(m => m && m.classList.remove('active'));
            this.switchScreen('match');
            this.renderRound();
            this.renderPitchNodes();

            if (this.dom.spectatorHeaderBadge) this.dom.spectatorHeaderBadge.style.display = 'flex';
            if (this.dom.btnExitSpectator) this.dom.btnExitSpectator.style.display = 'flex';
            this.dom.btnUseBlock.style.display = 'none';

            this.showNotice('CANLI YAYIN BAĞLANDI', `🔴 <strong>${this.teams.teamA.name}</strong> vs <strong>${this.teams.teamB.name}</strong> maçına bağlandınız!`, '📺');
        });

        // Bağlantı Kopması (Host veya Misafir Düşünce)
        multiplayer.on('peerDisconnected', () => {
            if (this.screens.match && this.screens.match.classList.contains('active') && this.currentRound < 11) {
                if (!multiplayer.isHost && !multiplayer.isSpectator) {
                    // Misafir tarafı: Ev sahibi sayfayı yeniledi veya koptu
                    if (this.dom.hostWaitingOverlay) {
                        this.dom.hostWaitingOverlay.classList.add('active');
                        if (this.dom.hostWaitingAttemptText) {
                            this.dom.hostWaitingAttemptText.textContent = 'Ev sahibine yeniden bağlanılıyor...';
                        }
                    }
                    if (multiplayer.roomCode) {
                        multiplayer.startAutoReconnect(multiplayer.roomCode);
                    }
                } else if (multiplayer.isHost) {
                    // Host tarafı: Misafir koptu
                    this.showNotice(
                        'MİSAFİR OYUNCU KOPTU',
                        'Rakip oyuncunun bağlantısı geçici olarak koptu. Yeniden bağlanması bekleniyor...',
                        '⏳'
                    );
                }
            }
        });

        multiplayer.on('reconnectAttempt', (data) => {
            if (this.dom.hostWaitingAttemptText) {
                this.dom.hostWaitingAttemptText.textContent = `Yeniden bağlanma deneniyor (${data.attempt}/${data.maxAttempts})...`;
            }
        });

        multiplayer.on('reconnectFailed', () => {
            if (this.dom.hostWaitingAttemptText) {
                this.dom.hostWaitingAttemptText.textContent = 'Bağlantı zaman aşımına uğradı.';
            }
            this.showNotice(
                'BAĞLANTI KURULAMADI',
                'Ev sahibine tekrar bağlanılamadı. Lütfen internet bağlantınızı kontrol edip ana menüye dönün.',
                '❌'
            );
        });

        multiplayer.on('peerReconnected', () => {
            if (this.dom.hostWaitingAttemptText) {
                this.dom.hostWaitingAttemptText.textContent = 'Bağlandı! Maç senkronize ediliyor...';
            }
        });

        // Rakip Oyuncu Maçtan Ayrıldı
        multiplayer.on('MATCH_ABANDONED', (payload) => {
            this.clearLiveSessionSnapshot();
            Object.values(this.modals).forEach(m => m && m.classList.remove('active'));
            if (this.dom.hostWaitingOverlay) {
                this.dom.hostWaitingOverlay.classList.remove('active');
            }
            multiplayer.disconnect();
            this.switchScreen('mainMenu');
            this.showNotice(
                'MAÇ SONLANDIRILDI',
                `⚠️ <strong>${payload.teamName || 'Rakip oyuncu'}</strong> maçtan ayrıldı.<br><br>Oda kapatıldı ve ana menüye yönlendirildiniz.`,
                '🚪'
            );
        });
    }

    // Yazı Tura Başlangıcı
    startCoinTossFlow() {
        this.dom.teamAName.textContent = this.teams.teamA.name;
        this.dom.teamBName.textContent = this.teams.teamB.name;
        this.dom.tabTeamA.textContent = this.teams.teamA.name;
        this.dom.tabTeamB.textContent = this.teams.teamB.name;

        document.getElementById('coinSideAName').textContent = this.teams.teamA.name;
        document.getElementById('coinSideBName').textContent = this.teams.teamB.name;

        this.switchScreen('match');
        this.modals.coin.classList.add('active');

        if (this.gameMode === 'online' && !multiplayer.isHost) {
            this.dom.coinResultText.textContent = `${this.teams.teamA.name} (Ev Sahibi) parayı havaya atıyor...`;
            this.dom.btnFlipCoin.style.display = 'none';
        } else {
            this.dom.coinResultText.textContent = 'Hazır olduğunuzda para atışını başlatın!';
            this.dom.btnFlipCoin.style.display = 'block';
            this.dom.btnFlipCoin.disabled = false;
        }
    }

    runCoinToss() {
        this.dom.btnFlipCoin.disabled = true;
        soundFX.coinFlip();

        const isA = Math.random() < 0.5;
        const winner = isA ? 'teamA' : 'teamB';

        this.dom.coinElement.className = 'coin ' + (isA ? 'flipping-a' : 'flipping-b');

        setTimeout(() => {
            this.applyCoinTossResult(winner);
            if (this.gameMode === 'online' && multiplayer.isHost) {
                multiplayer.send('COIN_TOSS_RESULT', { winner });
            }
        }, 2600);
    }

    applyCoinTossResult(winner) {
        this.firstPicker = winner;
        this.currentTurn = winner;
        const winnerTeamName = this.teams[winner].name;

        this.dom.coinResultText.innerHTML = `🏆 Yazı-Turayı <strong>${winnerTeamName}</strong> kazandı! İlk seçimi onlar yapacak.`;
        soundFX.whistle();

        setTimeout(() => {
            this.modals.coin.classList.remove('active');
            this.startMatch();
        }, 2200);
    }

    getCurrentPositionName() {
        if (!this.matchPositions || this.matchPositions.length === 0) {
            return (typeof POSITIONS !== 'undefined' ? POSITIONS[this.currentRound] : 'Mevki') || 'Mevki';
        }
        return this.matchPositions[this.currentRound] || 'Mevki';
    }

    startMatch() {
        this.currentRound = 0;
        // 11 Mevkiyi her maçta tamamen rastgele karıştır!
        if (this.gameMode === 'local' || (this.gameMode === 'online' && multiplayer.isHost)) {
            this.matchPositions = [...POSITIONS].sort(() => 0.5 - Math.random());
        }
        this.startPositionRound();
    }

    // ===================================================================
    // RESMİ LİG KAYITLARI & GEÇMİŞ SEZON KARTLARI
    // ===================================================================
    generateRoundCards(positionName) {
        const pool = this.database[positionName];
        if (!pool || pool.length < 4) return [];

        // Her mevkide havuzdan TAMAMEN RASTGELE 4 kart seçimi
        const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 4);

        return selected.map((player) => {
            const profit = Math.round((player.guncel.deger - player.gecmis.deger) * 10) / 10;
            return {
                ...player,
                profit
            };
        });
    }

    startPositionRound() {
        if (!this.matchPositions || this.matchPositions.length === 0) {
            this.matchPositions = [...POSITIONS].sort(() => 0.5 - Math.random());
        }

        if (this.currentRound >= this.matchPositions.length) {
            this.endGame();
            return;
        }

        const positionName = this.getCurrentPositionName();

        if (this.gameMode === 'local' || (this.gameMode === 'online' && multiplayer.isHost)) {
            this.roundCards = this.generateRoundCards(positionName);
            this.lockedPicks = {};
            this.blockedCardIndex = null;
            this.isRevealing = false;
            this.currentTurn = this.firstPicker;

            if (this.gameMode === 'online') {
                multiplayer.send('START_ROUND_SYNC', {
                    round: this.currentRound,
                    cards: this.roundCards,
                    turn: this.currentTurn,
                    firstPicker: this.firstPicker,
                    matchPositions: this.matchPositions
                });
            }

            this.renderRound();
        }
    }

    renderRound() {
        const positionName = this.getCurrentPositionName();
        this.dom.currentPositionTitle.textContent = positionName;
        this.dom.currentRoundStep.textContent = `Mevki ${this.currentRound + 1} / 11`;

        this.updateScoreboard();
        this.renderVideoCards();
        this.updateActionBanner();
        this.saveLiveSessionSnapshot();
    }

    updateScoreboard() {
        this.dom.teamAProfit.textContent = `${this.teams.teamA.totalProfit >= 0 ? '+' : ''}${this.teams.teamA.totalProfit.toFixed(1)} M€`;
        this.dom.teamAProfit.className = `profit-amount ${this.teams.teamA.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`;

        this.dom.teamBProfit.textContent = `${this.teams.teamB.totalProfit >= 0 ? '+' : ''}${this.teams.teamB.totalProfit.toFixed(1)} M€`;
        this.dom.teamBProfit.className = `profit-amount ${this.teams.teamB.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`;

        if (this.currentTurn === 'teamA') {
            this.dom.teamACard.classList.add('active-turn');
            this.dom.teamBCard.classList.remove('active-turn');
        } else {
            this.dom.teamBCard.classList.add('active-turn');
            this.dom.teamACard.classList.remove('active-turn');
        }

        this.dom.teamABlockBadge.textContent = this.teams.teamA.hasBlock ? '🛡️ Blok: HAZIR' : '❌ Blok: KULLANILDI';
        this.dom.teamABlockBadge.className = `joker-badge ${this.teams.teamA.hasBlock ? 'joker-ready' : 'joker-used'}`;

        this.dom.teamBBlockBadge.textContent = this.teams.teamB.hasBlock ? '🛡️ Blok: HAZIR' : '❌ Blok: KULLANILDI';
        this.dom.teamBBlockBadge.className = `joker-badge ${this.teams.teamB.hasBlock ? 'joker-ready' : 'joker-used'}`;
    }

    updateActionBanner() {
        if (this.isRevealing) return;

        if (this.gameMode === 'spectator') {
            const activeTeam = this.teams[this.currentTurn];
            this.dom.actionTipText.innerHTML = `🔴 <strong style="color:#ff2a5f;">CANLI İZLENİYOR:</strong> <span class="tip-highlight" style="color:${activeTeam.color};">${activeTeam.name}</span> Seçim Yapıyor (${this.getCurrentPositionName()})`;
            this.dom.btnUseBlock.style.display = 'none';
            return;
        }

        const activeTeam = this.teams[this.currentTurn];
        const opponentKey = this.currentTurn === 'teamA' ? 'teamB' : 'teamA';
        const opponentTeam = this.teams[opponentKey];

        this.dom.actionTipText.innerHTML = `Sıradaki Seçim: <span class="tip-highlight" style="color:${activeTeam.color};">${activeTeam.name}</span> (${this.getCurrentPositionName()} Seçiyor)`;

        if (this.gameMode === 'online') {
            const isOpponentTurn = this.currentTurn !== this.myTeamKey;
            const myTeam = this.teams[this.myTeamKey];
            this.dom.btnUseBlock.disabled = !(isOpponentTurn && myTeam.hasBlock && this.blockedCardIndex === null);
            this.dom.btnUseBlock.textContent = `🛡️ ${activeTeam.name}'e BLOK AT`;
        } else {
            this.dom.btnUseBlock.disabled = !(opponentTeam.hasBlock && this.blockedCardIndex === null);
            this.dom.btnUseBlock.textContent = `🛡️ ${opponentTeam.name} BLOK KULLAN`;
        }
    }

    // ===================================================================
    // YOUTUBE FORMATINDA BİREBİR KARTLARIN ÇİZİMİ
    // ===================================================================
    renderVideoCards() {
        this.dom.cardsArena.innerHTML = '';
        this.roundCards.forEach((player, index) => {
            const isBlocked = this.blockedCardIndex === index;
            const isPickedA = this.lockedPicks.teamA === index;
            const isPickedB = this.lockedPicks.teamB === index;

            // Kart rengi: Başlangıçta GRİ, Takım A (Mavi) seçerse MAVİ, Takım B (Kırmızı) seçerse KIRMIZI olur
            let themeClass = 'theme-grey';
            if (isPickedA) {
                themeClass = 'theme-cyan';
            } else if (isPickedB) {
                themeClass = 'theme-red';
            }

            const card = document.createElement('div');
            card.className = `yt-card-container ${isBlocked ? 'is-blocked' : ''} ${isPickedA ? 'locked-team-a' : ''} ${isPickedB ? 'locked-team-b' : ''}`;
            card.id = `card-${index}`;

            const profit = player.profit;
            const isGain = profit > 0;
            const isLoss = profit < 0;

            card.innerHTML = `
                ${isPickedA ? `<div class="team-choice-tag team-a">🔒 ${this.teams.teamA.name.toUpperCase()} SEÇTİ</div>` : ''}
                ${isPickedB ? `<div class="team-choice-tag team-b">🔒 ${this.teams.teamB.name.toUpperCase()} SEÇTİ</div>` : ''}

                <!-- Sol Üst Eğik Yıl Rozeti (2021, 2023, 2024 vb.) -->
                <div class="yt-season-badge">${player.sezon}</div>

                <div class="yt-card-inner">
                    <!-- ÖN YÜZ (GİZLİ SEZON KARTI) -->
                    <div class="yt-card-face ${themeClass}">
                        <div class="yt-silhouette-box">
                            <svg class="yt-silhouette-icon" viewBox="0 0 100 100">
                                <circle cx="50" cy="34" r="20"/>
                                <path d="M12 95 C 12 62, 30 56, 50 56 C 70 56, 88 62, 88 95 Z"/>
                            </svg>
                        </div>

                        <!-- 5 Satırlı Resmi İstatistik Tablosu -->
                        <table class="yt-stats-table">
                            <tr>
                                <td class="col-label">DEĞER</td>
                                <td class="col-val">${player.gecmis.deger}M €</td>
                            </tr>
                            <tr>
                                <td class="col-label">YAŞ</td>
                                <td class="col-val">${player.gecmis.yas}</td>
                            </tr>
                            <tr>
                                <td class="col-label">LİG</td>
                                <td class="col-val" style="font-size:0.95rem;">${player.gecmis.lig}</td>
                            </tr>
                            <tr>
                                <td class="col-label">MAÇ</td>
                                <td class="col-val">${player.gecmis.mac}</td>
                            </tr>
                            <tr>
                                <td class="col-label">${player.gecmis.stat_etiket}</td>
                                <td class="col-val" style="font-size:0.95rem;">${player.gecmis.stat_deger}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- ARKA YÜZ (AÇILAN GÜNCEL KART) -->
                    <div class="yt-card-face yt-card-back ${themeClass}">
                        <div class="yt-back-header">
                            <div class="yt-player-info">
                                <div class="yt-player-name" title="${player.gercek_isim}">${player.gercek_isim}</div>
                                <div class="yt-player-club" title="${player.kulup || ''}">${player.kulup || ''}</div>
                            </div>
                            <div class="yt-profit-pill ${isGain ? 'gain' : (isLoss ? 'loss' : 'neutral')}">
                                ${isGain ? '+' + profit + 'M' : (isLoss ? profit + 'M' : '0M')}
                            </div>
                        </div>

                        <div class="yt-photo-box">
                            <img src="${player.foto_url}" class="yt-player-photo" alt="${player.gercek_isim}"
                                 loading="lazy" decoding="async" referrerpolicy="no-referrer"
                                 onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.gercek_isim)}&background=0f172a&color=ffd700&size=256&bold=true';">
                        </div>

                        <!-- 2 Satırlı Güncel Özet Tablosu -->
                        <table class="yt-summary-table">
                            <tr>
                                <td class="col-label">YAŞ</td>
                                <td class="col-val">${player.guncel.yas}</td>
                            </tr>
                            <tr>
                                <td class="col-label">DEĞER</td>
                                <td class="col-val">${player.guncel.deger}M €</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;

            card.addEventListener('mouseenter', () => {
                if (!this.isRevealing && !card.classList.contains('is-flipped')) {
                    soundFX.cardHover();
                }
            });

            card.addEventListener('click', () => {
                this.onCardSelected(index);
            });

            this.dom.cardsArena.appendChild(card);
        });
    }

    // ===================================================================
    // KART SEÇİMİ (ONAY MODALI VE KİLİTLEME)
    // ===================================================================
    onCardSelected(cardIndex) {
        if (this.isRevealing) return;

        if (this.gameMode === 'spectator') {
            this.showNotice('CANLI YAYIN', 'Canlı maçı izliyorsunuz. Kart seçimi yalnızca maçı oynayan takımlar tarafından yapılabilir.', '📺');
            return;
        }

        if (this.lockedPicks.teamA === cardIndex || this.lockedPicks.teamB === cardIndex) return;
        if (this.blockedCardIndex === cardIndex) {
            this.showNotice('KART BLOKLANDI', '🚫 Bu kart rakip tarafından <strong>BLOKLANDI</strong>!<br>Lütfen başka bir seçenek belirleyin.', '🚫');
            return;
        }

        if (this.gameMode === 'online' && this.currentTurn !== this.myTeamKey) {
            this.showNotice('SIRA RAKİPTE', '⏳ Lütfen rakibinizin seçim yapmasını bekleyin.', '⏳');
            return;
        }

        // Onay modalını açarak oyuncunun teyit etmesini sağla
        this.openConfirmPickModal(cardIndex);
    }

    openConfirmPickModal(cardIndex) {
        this.pendingCardPickIndex = cardIndex;
        const card = this.roundCards[cardIndex];
        const currentTeam = this.teams[this.currentTurn];
        const posName = this.getCurrentPositionName();

        const season = card.sezon || card.yil || '';
        const value = (card.gecmis && card.gecmis.deger !== undefined) ? card.gecmis.deger : (card.piyasaDegeri || 0);
        const league = (card.gecmis && card.gecmis.lig) ? card.gecmis.lig : '';

        soundFX.cardHover();
        this.dom.confirmPickTeamName.textContent = currentTeam.name;
        this.dom.confirmPickSlot.textContent = `SEÇENEK #${cardIndex + 1}`;
        this.dom.confirmPickSeason.textContent = season ? `📅 ${season} Sezonu ${league ? '• ' + league : ''}` : (league ? `📅 ${league}` : '📅 Sezon Bilgisi');
        this.dom.confirmPickVal.textContent = `💰 ${value} M€`;
        this.dom.confirmPickPos.textContent = `⚽ ${posName.toUpperCase()}`;

        this.modals.confirmPick.classList.add('active');
    }

    executeConfirmPick() {
        if (this.pendingCardPickIndex === null) return;
        const cardIndex = this.pendingCardPickIndex;
        this.pendingCardPickIndex = null;
        this.modals.confirmPick.classList.remove('active');

        if (this.gameMode === 'online') {
            multiplayer.send('CARD_LOCKED_SYNC', {
                cardIndex,
                pickerTeam: this.currentTurn
            });
        }

        this.applyLockCard(cardIndex, this.currentTurn);
    }

    cancelConfirmPick() {
        this.pendingCardPickIndex = null;
        if (this.modals.confirmPick) {
            this.modals.confirmPick.classList.remove('active');
        }
    }

    applyLockCard(cardIndex, pickerTeam) {
        soundFX.lockCard();
        this.lockedPicks[pickerTeam] = cardIndex;

        // Kartı kilitli olarak işaretle (açma!)
        this.renderVideoCards();

        // 1. Seçim mi yoksa her iki takım da seçti mi?
        if (Object.keys(this.lockedPicks).length === 1) {
            // Sırayı 2. takıma geçir
            this.currentTurn = this.currentTurn === 'teamA' ? 'teamB' : 'teamA';
            this.blockedCardIndex = null;
            this.updateScoreboard();
            this.updateActionBanner();
            this.saveLiveSessionSnapshot();
        } else if (Object.keys(this.lockedPicks).length === 2) {
            // HER İKİ TAKIM DA KARTINI KİLİTLEDİ! BÜYÜK AÇILIŞ BAŞLIYOR!
            this.saveLiveSessionSnapshot();
            this.startSuspenseRevealSequence();
        }
    }

    // ===================================================================
    // NEFES KESEN GERİLİMLİ AÇILIŞ AŞAMASI (15 SN SÜRE VE HIZLI GEÇ BUTONU)
    // ===================================================================
    async startSuspenseRevealSequence() {
        this.isRevealing = true;
        this.dom.btnUseBlock.disabled = true;

        const pickA = this.lockedPicks.teamA;
        const pickB = this.lockedPicks.teamB;

        // Seçilmeyen 2 kartı bul
        const unpickedIndices = [0, 1, 2, 3].filter(idx => idx !== pickA && idx !== pickB);

        // 1. Adım: Başlangıç Gerilimi
        this.dom.actionTipText.innerHTML = `⏳ <strong style="color:var(--gold-card-primary);">SEÇİMLER KİLİTLENDİ!</strong> Önce Seçilmeyen Kartlar Açılıyor...`;
        soundFX.heartbeat();
        await new Promise(r => setTimeout(r, 2400));

        // 2. Adım: Seçilmeyen 1. Kart Açılır
        const unpickedCard0 = this.roundCards[unpickedIndices[0]];
        const cardElem0 = document.getElementById(`card-${unpickedIndices[0]}`);
        if (cardElem0) {
            cardElem0.classList.add('is-flipped');
            soundFX.cardFlip();
        }
        this.dom.actionTipText.innerHTML = `👀 Seçenek #${unpickedIndices[0] + 1} (${unpickedCard0.gercek_isim} - ${unpickedCard0.kulup || ''}) Kaçırıldı! (Fark: ${unpickedCard0.profit >= 0 ? '+' : ''}${unpickedCard0.profit}M€)`;
        if (unpickedCard0.profit > 0) soundFX.profit(); else soundFX.loss();
        await this.waitForSkipOrTimeout(15000, 'card');

        // 3. Adım: Seçilmeyen 2. Kart Açılır
        const unpickedCard1 = this.roundCards[unpickedIndices[1]];
        const cardElem1 = document.getElementById(`card-${unpickedIndices[1]}`);
        if (cardElem1) {
            cardElem1.classList.add('is-flipped');
            soundFX.cardFlip();
        }
        this.dom.actionTipText.innerHTML = `👀 Seçenek #${unpickedIndices[1] + 1} (${unpickedCard1.gercek_isim} - ${unpickedCard1.kulup || ''}) Kaçırıldı! (Fark: ${unpickedCard1.profit >= 0 ? '+' : ''}${unpickedCard1.profit}M€)`;
        if (unpickedCard1.profit > 0) soundFX.profit(); else soundFX.loss();
        await this.waitForSkipOrTimeout(15000, 'card');

        // 4. Adım: 1. Takımın Seçimi Açılıyor!
        const team1Key = this.firstPicker;
        const team1 = this.teams[team1Key];
        const team1PickIndex = this.lockedPicks[team1Key];
        const team1Player = this.roundCards[team1PickIndex];

        this.dom.actionTipText.innerHTML = `🔥 <span style="color:${team1.color};font-weight:900;">${team1.name}</span> Seçimi Açılıyor: Seçenek #${team1PickIndex + 1}...`;
        soundFX.heartbeat();
        await new Promise(r => setTimeout(r, 2200));

        const team1CardElem = document.getElementById(`card-${team1PickIndex}`);
        if (team1CardElem) {
            team1CardElem.classList.add('is-flipped');
            soundFX.cardFlip();
        }

        team1.totalProfit += team1Player.profit;
        team1.totalValue += team1Player.guncel.deger;
        team1.squad[this.getCurrentPositionName()] = team1Player;
        this.updateScoreboard();
        this.renderPitchNodes();

        if (team1Player.profit > 0) soundFX.profit(); else soundFX.loss();
        this.dom.actionTipText.innerHTML = `⭐ ${team1.name} transferi: <strong>${team1Player.gercek_isim} (${team1Player.kulup || ''})</strong> (${team1Player.profit >= 0 ? '+' : ''}${team1Player.profit}M€)`;
        await this.waitForSkipOrTimeout(15000, 'card');

        // 5. Adım: 2. Takımın Seçimi Açılıyor!
        const team2Key = this.firstPicker === 'teamA' ? 'teamB' : 'teamA';
        const team2 = this.teams[team2Key];
        const team2PickIndex = this.lockedPicks[team2Key];
        const team2Player = this.roundCards[team2PickIndex];

        this.dom.actionTipText.innerHTML = `🔥 <span style="color:${team2.color};font-weight:900;">${team2.name}</span> Seçimi Açılıyor: Seçenek #${team2PickIndex + 1}...`;
        soundFX.heartbeat();
        await new Promise(r => setTimeout(r, 2200));

        const team2CardElem = document.getElementById(`card-${team2PickIndex}`);
        if (team2CardElem) {
            team2CardElem.classList.add('is-flipped');
            soundFX.cardFlip();
        }

        team2.totalProfit += team2Player.profit;
        team2.totalValue += team2Player.guncel.deger;
        team2.squad[this.getCurrentPositionName()] = team2Player;
        this.updateScoreboard();
        this.renderPitchNodes();

        if (team2Player.profit > 0) soundFX.profit(); else soundFX.loss();
        this.dom.actionTipText.innerHTML = `⭐ ${team2.name} transferi: <strong>${team2Player.gercek_isim} (${team2Player.kulup || ''})</strong> (${team2Player.profit >= 0 ? '+' : ''}${team2Player.profit}M€)`;
        
        // 4 Kart da açıldı! 'Sıradaki Mevkiye Geç' butonu aktif!
        await this.waitForSkipOrTimeout(15000, 'round');

        // Geç butonunu gizle
        if (this.dom.btnFloatingSkip) {
            this.dom.btnFloatingSkip.classList.remove('visible');
        }

        // 6. Adım: Turu Tamamla ve Sıradaki Mevkiye Geç
        this.currentRound++;
        this.firstPicker = this.firstPicker === 'teamA' ? 'teamB' : 'teamA';
        this.currentTurn = this.firstPicker;

        if (this.currentRound < (this.matchPositions ? this.matchPositions.length : 11)) {
            this.startPositionRound();
        } else {
            this.endGame();
        }
    }

    // ===================================================================
    // HIZLI GEÇ (SKIP) VE GERİ SAYIM MOTORU
    // ===================================================================
    waitForSkipOrTimeout(durationMs, stepType = 'card') {
        return new Promise(resolve => {
            this.skipVotes = { teamA: false, teamB: false };
            this.currentStepResolver = resolve;
            this.currentStepType = stepType;

            if (this.dom.btnFloatingSkip) {
                this.dom.btnFloatingSkip.classList.remove('voted-ready');
                this.dom.btnFloatingSkip.classList.add('visible');
            }

            let remainingSeconds = Math.ceil(durationMs / 1000);
            this.updateSkipButtonUI(remainingSeconds);

            if (this.skipCountdownInterval) clearInterval(this.skipCountdownInterval);
            this.skipCountdownInterval = setInterval(() => {
                remainingSeconds--;
                if (remainingSeconds <= 0) {
                    clearInterval(this.skipCountdownInterval);
                    this.completeCurrentStep();
                } else {
                    this.updateSkipButtonUI(remainingSeconds);
                }
            }, 1000);
        });
    }

    updateSkipButtonUI(seconds) {
        if (!this.dom.floatingSkipText) return;

        const isRoundChange = this.currentStepType === 'round';
        const actionLabel = isRoundChange ? 'SIRADAKİ MEVKİ' : 'HIZLI GEÇ';

        if (this.gameMode === 'spectator') {
            this.dom.btnFloatingSkip.classList.remove('voted-ready');
            this.dom.floatingSkipText.textContent = `🔴 CANLI YAYIN • ${seconds}s`;
            return;
        }

        if (this.gameMode === 'online') {
            const myVoted = this.skipVotes[this.myTeamKey];
            const voteCount = (this.skipVotes.teamA ? 1 : 0) + (this.skipVotes.teamB ? 1 : 0);

            if (myVoted) {
                this.dom.btnFloatingSkip.classList.add('voted-ready');
                this.dom.floatingSkipText.textContent = `✅ SEN HAZIRSIN (${voteCount}/2) • ${seconds}s`;
            } else {
                this.dom.btnFloatingSkip.classList.remove('voted-ready');
                this.dom.floatingSkipText.textContent = `⚡ ${actionLabel} (${voteCount}/2) • ${seconds}s`;
            }
        } else {
            // Yerel mod
            this.dom.floatingSkipText.textContent = `⚡ ${actionLabel} • ${seconds}s`;
        }
    }

    handleSkipButtonClick() {
        if (!this.currentStepResolver) return;

        soundFX.cardHover();

        if (this.gameMode === 'online') {
            if (this.skipVotes[this.myTeamKey]) return; // Zaten bastı

            this.skipVotes[this.myTeamKey] = true;
            multiplayer.send('SKIP_VOTE', { team: this.myTeamKey });
            this.updateSkipButtonUI(15);

            if (this.skipVotes.teamA && this.skipVotes.teamB) {
                this.completeCurrentStep();
            }
        } else {
            // Yerel modda tek tıkla hemen sıradaki adıma geç
            this.completeCurrentStep();
        }
    }

    handleRemoteSkipVote(teamKey) {
        this.skipVotes[teamKey] = true;
        this.updateSkipButtonUI(15);
        if (this.skipVotes.teamA && this.skipVotes.teamB) {
            this.completeCurrentStep();
        }
    }

    completeCurrentStep() {
        if (this.skipCountdownInterval) {
            clearInterval(this.skipCountdownInterval);
            this.skipCountdownInterval = null;
        }

        if (this.currentStepResolver) {
            const resolve = this.currentStepResolver;
            this.currentStepResolver = null;
            resolve();
        }
    }

    // Blok Kullanımı (Şık Modal ile)
    handleBlockRequest() {
        const blockerKey = this.currentTurn === 'teamA' ? 'teamB' : 'teamA';
        const blocker = this.teams[blockerKey];

        if (!blocker.hasBlock) return;

        const available = [0, 1, 2, 3].filter(i => this.lockedPicks.teamA !== i && this.lockedPicks.teamB !== i);
        if (available.length <= 1) {
            this.showNotice('YETERSİZ KART', 'Bloklanabilecek yeterli kart kalmadı.', '⚠️');
            return;
        }

        this.openBlockModal(blockerKey, available);
    }

    openBlockModal(blockerKey, available) {
        this.dom.blockModalDesc.innerHTML = `<strong>${this.teams[blockerKey].name}</strong>, rakibin seçmesini engellemek istediğin kartı belirle:`;
        this.dom.blockCardsGrid.innerHTML = '';

        available.forEach(idx => {
            const card = this.roundCards[idx];
            const season = card.sezon || card.yil || '';
            const val = (card.gecmis && card.gecmis.deger !== undefined) ? card.gecmis.deger : (card.piyasaDegeri || 0);
            const league = (card.gecmis && card.gecmis.lig) ? card.gecmis.lig : '';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-block-target';
            btn.innerHTML = `
                <span style="color:var(--gold-card-primary); font-size:1.15rem; font-weight:900;">#${idx + 1}. SEÇENEK</span>
                <span style="font-size:0.82rem; color:#cbd5e1;">${season} • ${val} M€ ${league ? '• ' + league : ''}</span>
            `;
            btn.addEventListener('click', () => {
                this.modals.block.classList.remove('active');
                if (this.gameMode === 'online') {
                    multiplayer.send('BLOCK_USED', {
                        blockerTeam: blockerKey,
                        targetCardIndex: idx
                    });
                }
                this.applyBlock(blockerKey, idx);
            });
            this.dom.blockCardsGrid.appendChild(btn);
        });

        this.modals.block.classList.add('active');
    }

    applyBlock(blockerKey, targetIdx) {
        this.teams[blockerKey].hasBlock = false;
        this.blockedCardIndex = targetIdx;
        soundFX.block();

        this.renderVideoCards();
        this.updateScoreboard();
        this.updateActionBanner();
        this.saveLiveSessionSnapshot();
        this.showNotice('JOKER KULLANILDI', `🛡️ <strong>${this.teams[blockerKey].name}</strong> JOKERİNİ KULLANDI!<br><br>Seçenek #${targetIdx + 1} bloklandı.<br>Rakip başka bir kart seçmek zorunda!`, '🛡️');
    }

    // ===================================================================
    // ŞIK BİLDİRİM & UYARI MODAL METOTLARI
    // ===================================================================
    showNotice(title, message, icon = '⚠️') {
        if (!this.dom.noticeIcon) return;
        this.dom.noticeIcon.textContent = icon;
        this.dom.noticeTitle.textContent = title;
        this.dom.noticeMessage.innerHTML = message;
        this.modals.notice.classList.add('active');
        soundFX.cardHover();
    }

    closeNotice() {
        if (this.modals.notice) {
            this.modals.notice.classList.remove('active');
        }
    }

    // ===================================================================
    // İZLEYİCİ (SPECTATOR) VE AÇIK ODALAR METOTLARI
    // ===================================================================
    async loadAndRenderActiveRooms() {
        if (!this.dom.activeRoomsList) return;
        this.dom.activeRoomsList.innerHTML = '<div class="no-rooms-msg">🔄 Aktif canlı odalar taranıyor...</div>';

        const rooms = await multiplayer.getActiveRooms();

        if (!rooms || rooms.length === 0) {
            this.dom.activeRoomsList.innerHTML = `
                <div class="no-rooms-msg">
                    Şu anda listelenen açık canlı oda bulunamadı.<br>
                    <span style="font-size:0.75rem; color:#64748b;">(Aşağıdaki alana arkadaşınızın 4 haneli oda kodunu girerek maçı canlı izleyebilirsiniz.)</span>
                </div>
            `;
            return;
        }

        this.dom.activeRoomsList.innerHTML = '';
        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-item-card';
            card.innerHTML = `
                <div class="room-item-info">
                    <div class="room-code-tag">ODA #${room.code}</div>
                    <div class="room-match-title">${room.host || 'Dharma'} ${room.guest ? 'vs ' + room.guest : '(Rakip Bekleniyor)'}</div>
                    <div class="room-status-badge">
                        <span class="live-dot"></span>
                        <span>${room.status || 'Canlı Maç'}</span>
                    </div>
                </div>
                <button type="button" class="btn-watch-room" data-code="${room.code}">
                    📺 İZLE
                </button>
            `;
            card.querySelector('.btn-watch-room').addEventListener('click', () => {
                this.startWatchingRoom(room.code);
            });
            this.dom.activeRoomsList.appendChild(card);
        });
    }

    startWatchingRoom(roomCode) {
        if (!roomCode || roomCode.trim().length < 4) {
            this.showNotice('EKSİK KOD', 'Lütfen geçerli bir 4 haneli oda kodu girin.', '⚠️');
            return;
        }

        const code = roomCode.trim();
        this.gameMode = 'spectator';
        this.myTeamKey = null;

        this.modals.spectator.classList.remove('active');
        this.showNotice('BAĞLANILIYOR...', `Oda #${code} aranıyor ve canlı maça bağlanılıyor...`, '📡');

        multiplayer.watchRoom(code);
    }

    exitSpectatorMode() {
        multiplayer.disconnect();
        this.gameMode = 'local';
        if (this.dom.spectatorHeaderBadge) this.dom.spectatorHeaderBadge.style.display = 'none';
        if (this.dom.btnExitSpectator) this.dom.btnExitSpectator.style.display = 'none';
        this.switchScreen('mainMenu');
        this.showNotice('YAYINDAN AYRILDINIZ', 'Canlı maç izleme modundan çıkış yapıldı.', 'ℹ️');
    }

    renderPitchNodes() {
        this.dom.pitchContainer.innerHTML = `
            <div class="pitch-line-center"></div>
            <div class="pitch-circle-center"></div>
            <div class="pitch-penalty-top"></div>
            <div class="pitch-penalty-bottom"></div>
        `;

        const targetSquad = this.teams[this.activePitchTeam].squad;

        POSITIONS.forEach(posName => {
            const coord = PITCH_COORDS[posName];
            const player = targetSquad[posName];

            const node = document.createElement('div');
            node.className = `player-node ${player ? 'filled' : ''} ${player && player.profit < 0 ? 'loss' : ''}`;
            node.style.top = `${coord.top}%`;
            node.style.left = `${coord.left}%`;

            if (player) {
                node.innerHTML = `
                    <div class="player-pin">${coord.label}</div>
                    <div class="player-tag">${player.gercek_isim}</div>
                    <div class="player-profit-pill ${player.profit >= 0 ? 'gain' : 'loss'}">
                        ${player.profit >= 0 ? '+' : ''}${player.profit.toFixed(1)}M€
                    </div>
                `;
            } else {
                node.innerHTML = `
                    <div class="player-pin">${coord.label}</div>
                    <div class="player-tag">${posName}</div>
                `;
            }

            this.dom.pitchContainer.appendChild(node);
        });
    }

    endGame() {
        soundFX.crowdCheer();

        if (typeof confetti === 'function') {
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        }

        const aProfit = this.teams.teamA.totalProfit;
        const bProfit = this.teams.teamB.totalProfit;

        let winnerText = '';
        if (aProfit > bProfit) {
            winnerText = `🏆 ŞAMPİYON: ${this.teams.teamA.name.toUpperCase()}!`;
        } else if (bProfit > aProfit) {
            winnerText = `🏆 ŞAMPİYON: ${this.teams.teamB.name.toUpperCase()}!`;
        } else {
            winnerText = `🤝 DOSTLUK KAZANDI: BERABERE!`;
        }

        document.getElementById('winnerTeamTitle').textContent = winnerText;
        document.getElementById('finalScoreSummary').innerHTML = `
            <strong>${this.teams.teamA.name}:</strong> ${aProfit.toFixed(1)} M€ Net Kâr | Toplam Değer: ${this.teams.teamA.totalValue.toFixed(1)} M€<br>
            <strong>${this.teams.teamB.name}:</strong> ${bProfit.toFixed(1)} M€ Net Kâr | Toplam Değer: ${this.teams.teamB.totalValue.toFixed(1)} M€
        `;

        const allTransfers = [
            ...Object.values(this.teams.teamA.squad).map(p => ({ ...p, team: this.teams.teamA.name })),
            ...Object.values(this.teams.teamB.squad).map(p => ({ ...p, team: this.teams.teamB.name }))
        ].sort((a, b) => b.profit - a.profit);

        const best = allTransfers[0];
        const worst = allTransfers[allTransfers.length - 1];

        if (best) {
            document.getElementById('bestTransferName').textContent = `${best.gercek_isim} (${best.team})`;
            document.getElementById('bestTransferProfit').textContent = `+${best.profit.toFixed(1)} M€ KÂR`;
        }

        if (worst) {
            document.getElementById('worstTransferName').textContent = `${worst.gercek_isim} (${worst.team})`;
            document.getElementById('worstTransferProfit').textContent = `${worst.profit.toFixed(1)} M€ ZARAR`;
        }

        this.clearLiveSessionSnapshot();
        if (this.gameMode === 'online' && multiplayer.isHost && multiplayer.roomCode) {
            multiplayer.unregisterRoom(multiplayer.roomCode);
        }
        this.modals.winner.classList.add('active');
    }

    // ===================================================================
    // HOST SAYFA YENİLEME VE OTURUM KURTARMA (HOST RECOVERY) MOTORU
    // ===================================================================
    saveLiveSessionSnapshot() {
        if (!this.screens.match || !this.screens.match.classList.contains('active')) {
            return;
        }
        if (this.currentRound >= (this.matchPositions ? this.matchPositions.length : 11)) {
            return;
        }

        const snapshot = {
            gameMode: this.gameMode,
            myTeamKey: this.myTeamKey,
            isHost: multiplayer.isHost,
            roomCode: multiplayer.roomCode,
            teams: this.teams,
            currentRound: this.currentRound,
            matchPositions: this.matchPositions,
            roundCards: this.roundCards,
            currentTurn: this.currentTurn,
            firstPicker: this.firstPicker,
            lockedPicks: this.lockedPicks,
            blockedCardIndex: this.blockedCardIndex,
            isRevealing: this.isRevealing,
            timestamp: Date.now()
        };

        try {
            sessionStorage.setItem('scout_live_session', JSON.stringify(snapshot));
        } catch (e) {
            console.warn('Canlı maç snapshot kaydedilemedi:', e);
        }
    }

    clearLiveSessionSnapshot() {
        try {
            sessionStorage.removeItem('scout_live_session');
        } catch (e) {}
    }

    checkResumableSession() {
        try {
            const raw = sessionStorage.getItem('scout_live_session');
            if (!raw) return;
            const data = JSON.parse(raw);

            // 3 saatten eski oturumları temizle
            if (!data || (Date.now() - (data.timestamp || 0)) > 3 * 60 * 60 * 1000) {
                this.clearLiveSessionSnapshot();
                return;
            }

            // Devam eden bir maç varsa modalı göster
            if (data.currentRound < (data.matchPositions ? data.matchPositions.length : 11) && data.teams) {
                const roomBadge = document.getElementById('resumeRoomCodeBadge');
                const teamsVs = document.getElementById('resumeTeamsVs');
                const roundStatus = document.getElementById('resumeRoundStatus');

                if (roomBadge) {
                    roomBadge.textContent = data.roomCode ? `ODA: #${data.roomCode}` : 'YEREL MAÇ';
                }
                if (teamsVs) {
                    teamsVs.textContent = `${data.teams.teamA.name} vs ${data.teams.teamB.name}`;
                }
                if (roundStatus) {
                    const posName = data.matchPositions && data.matchPositions[data.currentRound] ? (POSITION_NAMES[data.matchPositions[data.currentRound]] || data.matchPositions[data.currentRound]) : 'Aktif Tur';
                    roundStatus.textContent = `Mevki ${data.currentRound + 1} / 11 • ${posName}`;
                }

                if (this.modals.resumeSession) {
                    this.modals.resumeSession.classList.add('active');
                }
            }
        } catch (e) {
            console.warn('Oturum kurtarma verisi okunamadı:', e);
        }
    }

    resumeLiveSession() {
        try {
            const raw = sessionStorage.getItem('scout_live_session');
            if (!raw) return;
            const data = JSON.parse(raw);

            this.gameMode = data.gameMode || 'local';
            this.myTeamKey = data.myTeamKey || 'teamA';
            this.teams = data.teams;
            this.currentRound = data.currentRound;
            this.matchPositions = data.matchPositions || [...POSITIONS];
            this.roundCards = data.roundCards || [];
            this.currentTurn = data.currentTurn;
            this.firstPicker = data.firstPicker;
            this.lockedPicks = data.lockedPicks || {};
            this.blockedCardIndex = data.blockedCardIndex;
            this.isRevealing = data.isRevealing || false;

            if (this.modals.resumeSession) {
                this.modals.resumeSession.classList.remove('active');
            }

            // Skor ve arayüzü güncelle
            this.dom.teamAName.textContent = this.teams.teamA.name;
            this.dom.teamBName.textContent = this.teams.teamB.name;
            this.dom.tabTeamA.textContent = this.teams.teamA.name;
            this.dom.tabTeamB.textContent = this.teams.teamB.name;
            this.updateScoreboard();

            // Ekranı aç
            this.switchScreen('match');
            this.renderRound();
            this.renderPitchNodes();

            // Eğer Online Mod ise ve Host ise: Odayı aynı kodla geri al!
            if (this.gameMode === 'online' && data.isHost && data.roomCode) {
                this.showNotice(
                    '👑 ODA GERİ ALINIYOR',
                    `Oda <strong>#${data.roomCode}</strong> tekrar talep ediliyor. Misafirinizin yeniden bağlanması bekleniyor...`,
                    '🔄'
                );
                multiplayer.reclaimRoom(data.roomCode, this.teams.teamA.name);
            } else if (this.gameMode === 'online' && !data.isHost && data.roomCode) {
                // Misafir ise otomatik yeniden bağlanmayı başlat
                if (this.dom.hostWaitingOverlay) {
                    this.dom.hostWaitingOverlay.classList.add('active');
                }
                multiplayer.startAutoReconnect(data.roomCode);
            } else {
                soundFX.whistle();
            }
        } catch (e) {
            console.error('Oturum kurtarma hatası:', e);
            this.clearLiveSessionSnapshot();
            this.switchScreen('mainMenu');
        }
    }

    discardLiveSession() {
        this.clearLiveSessionSnapshot();
        if (multiplayer.isHost && multiplayer.roomCode) {
            multiplayer.unregisterRoom(multiplayer.roomCode);
        }
        if (this.modals.resumeSession) {
            this.modals.resumeSession.classList.remove('active');
        }
        if (this.dom.hostWaitingOverlay) {
            this.dom.hostWaitingOverlay.classList.remove('active');
        }
        multiplayer.disconnect();
        this.switchScreen('mainMenu');
    }

    abandonMatch() {
        if (this.gameMode === 'online') {
            multiplayer.send('MATCH_ABANDONED', {
                by: multiplayer.isHost ? 'host' : 'guest',
                teamName: this.teams[this.myTeamKey] ? this.teams[this.myTeamKey].name : 'Oyuncu'
            });

            if (multiplayer.isHost && multiplayer.roomCode) {
                multiplayer.unregisterRoom(multiplayer.roomCode);
            }
        }

        this.clearLiveSessionSnapshot();
        multiplayer.disconnect();

        if (this.modals.exitMatch) this.modals.exitMatch.classList.remove('active');
        if (this.dom.hostWaitingOverlay) this.dom.hostWaitingOverlay.classList.remove('active');

        this.switchScreen('mainMenu');
        this.showNotice('MAÇTAN AYRILDINIZ', 'Maç başarıyla sonlandırıldı ve ana menüye dönüldü.', '🚪');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new ScoutGame();
});
