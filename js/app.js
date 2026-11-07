// ===================================================================
// SCAUDE SCOUT - ANA UYGULAMA, ETKİNLİK VE MULTIPLAYER BAĞLAYICI
// ===================================================================

class ScoutGame {
    constructor() {
        this.database = null;
        this.gameMode = 'local'; // 'local', 'online' veya 'spectator'
        this.myTeamKey = 'teamA'; // Online modda host teamA, misafir teamB

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
        this.firstPicker = 'teamA';
        this.currentTurn = 'teamA';
        this.roundCards = [];
        this.lockedPicks = {};
        this.blockedCardIndex = null;
        this.activePitchTeam = 'teamA';
        this.isRevealing = false;

        // 15 Saniyelik Hızlı Geç (Skip) Durumu
        this.skipVotes = { teamA: false, teamB: false };
        this.skipCountdownInterval = null;
        this.currentStepResolver = null;
        this.currentStepType = 'card';
        this.currentRevealStep = 0;
        this.activeRevealId = 0;

        // Seçim Onay Modalı
        this.pendingCardPickIndex = null;

        // Rakip Bekleme (3 Dakika Sayacı)
        this.isWaitingForOpponent = false;
        this.opponentWaitTimer = null;
        this.opponentWaitSeconds = 180;

        this.init();
    }

    resetMatchState(nameA = 'Dharma', nameB = 'The Hunters') {
        this.activeRevealId++;
        if (this.skipCountdownInterval) {
            clearInterval(this.skipCountdownInterval);
            this.skipCountdownInterval = null;
        }
        this.currentStepResolver = null;
        if (this.dom && this.dom.btnFloatingSkip) {
            this.dom.btnFloatingSkip.classList.remove('visible', 'voted-ready');
        }

        this.teams.teamA = {
            id: 'teamA',
            name: nameA,
            color: '#00d2ff',
            squad: {},
            totalProfit: 0,
            totalValue: 0,
            hasBlock: true
        };
        this.teams.teamB = {
            id: 'teamB',
            name: nameB,
            color: '#ff9100',
            squad: {},
            totalProfit: 0,
            totalValue: 0,
            hasBlock: true
        };

        this.currentRound = 0;
        this.firstPicker = 'teamA';
        this.currentTurn = 'teamA';
        this.roundCards = [];
        this.lockedPicks = {};
        this.blockedCardIndex = null;
        this.activePitchTeam = 'teamA';
        this.isRevealing = false;
        this.pendingCardPickIndex = null;
        this.clearLiveSessionSnapshot();
    }

    async init() {
        await this.loadDatabase();
        ScoutUI.setupDOM(this);
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

    // UI Köprüsü Metotları
    switchScreen(screenName) { ScoutUI.switchScreen(this, screenName); }
    updateScoreboard() { ScoutUI.updateScoreboard(this); }
    updateActionBanner() { ScoutUI.updateActionBanner(this); }
    renderVideoCards() { ScoutUI.renderVideoCards(this); }
    renderPitchNodes() { ScoutUI.renderPitchNodes(this); }
    showNotice(title, msg, icon) { ScoutUI.showNotice(this, title, msg, icon); }
    closeNotice() { ScoutUI.closeNotice(this); }
    loadAndRenderActiveRooms() { ScoutUI.loadAndRenderActiveRooms(this); }

    // Oyun Motoru Köprüsü Metotları
    startPositionRound() { GameEngine.startPositionRound(this); }
    startSuspenseRevealSequence() { return GameEngine.startSuspenseRevealSequence(this); }
    waitForSkipOrTimeout(ms, type, num) { return GameEngine.waitForSkipOrTimeout(this, ms, type, num); }
    handleSkipButtonClick() { GameEngine.handleSkipButtonClick(this); }
    handleRemoteSkipVote(team, step) { GameEngine.handleRemoteSkipVote(this, team, step); }

    getCurrentPositionName() {
        if (!this.matchPositions || this.matchPositions.length === 0) {
            return (typeof POSITIONS !== 'undefined' ? POSITIONS[this.currentRound] : 'Mevki') || 'Mevki';
        }
        return this.matchPositions[this.currentRound] || 'Mevki';
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

    // Yazı Tura Akışı
    startCoinTossFlow() {
        this.dom.coinElement.className = 'coin';
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
        const isA = Math.random() < 0.5;
        const winner = isA ? 'teamA' : 'teamB';

        if (this.gameMode === 'online' && multiplayer.isHost) {
            multiplayer.send('COIN_FLIP_START', { winner });
        }

        this.animateCoinFlip(winner);
    }

    animateCoinFlip(winner) {
        this.dom.btnFlipCoin.disabled = true;
        soundFX.coinFlip();
        const isA = winner === 'teamA';
        this.dom.coinElement.className = 'coin';
        void this.dom.coinElement.offsetWidth;
        this.dom.coinElement.className = 'coin ' + (isA ? 'flipping-a' : 'flipping-b');

        setTimeout(() => {
            this.applyCoinTossResult(winner);
        }, 2600);
    }

    applyCoinTossResult(winner) {
        this.firstPicker = winner;
        this.currentTurn = winner;
        const winnerTeamName = this.teams[winner].name;

        this.dom.coinResultText.innerHTML = `🏆 Yazı-Turayı <strong>${winnerTeamName}</strong> kazandı! İlk seçimi onlar yapacak.`;
        soundFX.whistle();

        setTimeout(() => {
            if (this.gameMode === 'local' || (this.gameMode === 'online' && multiplayer.isHost)) {
                this.modals.coin.classList.remove('active');
                this.startMatch();
            }
        }, 2200);
    }

    startMatch() {
        this.currentRound = 0;
        if (this.gameMode === 'local' || !this.matchPositions || this.matchPositions.length === 0) {
            this.matchPositions = [...POSITIONS].sort(() => 0.5 - Math.random());
        }
        this.startPositionRound();
    }

    // Kart Seçimi & Kilitleme
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

        if (this.gameMode === 'online' && this.currentTurn !== this.myTeamKey) {
            return;
        }

        const pickerTeam = this.gameMode === 'online' ? this.myTeamKey : this.currentTurn;

        if (this.gameMode === 'online') {
            multiplayer.send('CARD_LOCKED_SYNC', {
                cardIndex,
                pickerTeam
            });
        }

        this.applyLockCard(cardIndex, pickerTeam);
    }

    cancelConfirmPick() {
        this.pendingCardPickIndex = null;
        if (this.modals.confirmPick) {
            this.modals.confirmPick.classList.remove('active');
        }
    }

    applyLockCard(cardIndex, pickerTeam) {
        if (this.lockedPicks[pickerTeam] !== undefined) return;
        soundFX.lockCard();
        this.lockedPicks[pickerTeam] = cardIndex;

        this.renderVideoCards();

        const hasA = this.lockedPicks.teamA !== undefined;
        const hasB = this.lockedPicks.teamB !== undefined;

        if (hasA && hasB) {
            this.saveLiveSessionSnapshot();
            this.startSuspenseRevealSequence();
        } else {
            this.currentTurn = pickerTeam === 'teamA' ? 'teamB' : 'teamA';
            this.blockedCardIndex = null;
            this.updateScoreboard();
            this.updateActionBanner();
            this.saveLiveSessionSnapshot();
        }
    }

    // Blok Kullanımı
    handleBlockRequest() {
        const blockerKey = this.currentTurn === 'teamA' ? 'teamB' : 'teamA';
        const blocker = this.teams[blockerKey];

        if (!blocker.hasBlock) return;

        const available = [0, 1, 2, 3].filter(i => this.lockedPicks.teamA !== i && this.lockedPicks.teamB !== i);
        if (available.length <= 1) {
            this.showNotice('YETERSİZ KART', 'Bloklanabilecek yeterli kart kalmadı.', '⚠️');
            return;
        }

        ScoutUI.openBlockModal(this, blockerKey, available);
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

    endGame() {
        soundFX.whistle(true);
        this.dom.actionTipText.innerHTML = `⚽ <strong style="color:var(--primary-neon);">11 TRANSFER TAMAMLANDI! ŞAMPİYON BELİRLENİYOR...</strong>`;
        setTimeout(() => {
            ScoutUI.showFinalCelebration(this);
        }, 1500);
    }

    // İzleyici Modu
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

    // Canlı Oturum Kaydı & Host Kurtarma
    saveLiveSessionSnapshot() {
        if (!this.screens.match || !this.screens.match.classList.contains('active')) return;
        if (this.currentRound >= (this.matchPositions ? this.matchPositions.length : 11)) return;

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

            if (!data || (Date.now() - (data.timestamp || 0)) > 3 * 60 * 1000) {
                this.clearLiveSessionSnapshot();
                return;
            }

            if (data.currentRound < (data.matchPositions ? data.matchPositions.length : 11) && data.teams) {
                const roomBadge = document.getElementById('resumeRoomCodeBadge');
                const teamsVs = document.getElementById('resumeTeamsVs');
                const roundStatus = document.getElementById('resumeRoundStatus');

                if (roomBadge) roomBadge.textContent = data.roomCode ? `ODA: #${data.roomCode}` : 'YEREL MAÇ';
                if (teamsVs) teamsVs.textContent = `${data.teams.teamA.name} vs ${data.teams.teamB.name}`;
                if (roundStatus) {
                    const posName = data.matchPositions && data.matchPositions[data.currentRound] ? data.matchPositions[data.currentRound] : 'Aktif Tur';
                    roundStatus.textContent = `Mevki ${data.currentRound + 1} / 11 • ${posName}`;
                }

                if (this.modals.resumeSession) {
                    this.modals.resumeSession.classList.add('active');
                }
            }
        } catch (e) {
            console.warn('Oturum kurtarma verisi okunamadı:', e);
            this.clearLiveSessionSnapshot();
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

            this.dom.teamAName.textContent = this.teams.teamA.name;
            this.dom.teamBName.textContent = this.teams.teamB.name;
            this.dom.tabTeamA.textContent = this.teams.teamA.name;
            this.dom.tabTeamB.textContent = this.teams.teamB.name;
            this.updateScoreboard();

            this.switchScreen('match');
            this.renderRound();
            this.renderPitchNodes();

            if (this.gameMode === 'online' && data.roomCode) {
                this.showNotice(
                    '🔄 ODAYA DÖNÜLÜYOR',
                    `Oda <strong>#${data.roomCode}</strong> kontrol ediliyor. Diğer oyuncuyla bağlantı kuruluyor...`,
                    '⚡'
                );
                if (data.isHost) {
                    multiplayer.createRoom(data.roomCode, this.teams.teamA.name);
                } else {
                    multiplayer.joinRoom(data.roomCode);
                }
            } else {
                soundFX.btnClick();
            }
        } catch (e) {
            console.error('Oturum kurtarma hatası:', e);
            this.clearLiveSessionSnapshot();
            this.switchScreen('mainMenu');
        }
    }

    discardLiveSession() {
        this.stopOpponentCountdown();
        this.clearLiveSessionSnapshot();
        if (multiplayer.roomCode) {
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
        this.stopOpponentCountdown();
        if (this.gameMode === 'online') {
            multiplayer.send('MATCH_ABANDONED', {
                by: multiplayer.isHost ? 'host' : 'guest',
                teamName: this.teams[this.myTeamKey] ? this.teams[this.myTeamKey].name : 'Oyuncu'
            });

            if (multiplayer.roomCode) {
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

    // Rakip Bekleme Sayacı
    startOpponentCountdown(roomCode, titleText, descHtml) {
        this.stopOpponentCountdown();
        this.isWaitingForOpponent = true;
        this.opponentWaitSeconds = 180;

        if (this.dom.hostWaitingOverlay) {
            const titleEl = this.dom.hostWaitingOverlay.querySelector('.host-waiting-title');
            const descEl = document.getElementById('hostWaitingDesc');
            if (titleEl) titleEl.textContent = titleText || 'RAKİP BEKLENİYOR...';
            if (descEl) descEl.innerHTML = descHtml || `Rakibinizin <strong>#${roomCode}</strong> koduyla odaya katılması bekleniyor...`;
            if (this.dom.hostWaitingAttemptText) {
                this.dom.hostWaitingAttemptText.textContent = '⏱️ Kalan Süre: 03:00';
            }
            this.dom.hostWaitingOverlay.classList.add('active');
        }

        this.opponentWaitTimer = setInterval(() => {
            this.opponentWaitSeconds--;
            const mins = Math.floor(this.opponentWaitSeconds / 60);
            const secs = this.opponentWaitSeconds % 60;
            const timeStr = `⏱️ Kalan Süre: 0${mins}:${secs < 10 ? '0' : ''}${secs}`;

            if (this.dom.hostWaitingAttemptText) {
                this.dom.hostWaitingAttemptText.textContent = timeStr;
            }

            if (this.opponentWaitSeconds <= 0) {
                this.stopOpponentCountdown();
                this.clearLiveSessionSnapshot();
                if (multiplayer.roomCode) {
                    multiplayer.unregisterRoom(multiplayer.roomCode);
                }
                multiplayer.disconnect();
                this.switchScreen('mainMenu');
                this.showNotice(
                    'SÜRE DOLDU (3 DAKİKA)',
                    'Bekleme süresi doldu ve odaya kimse dönmediği için maç ve tüm veriler tamamen sıfırlandı.',
                    '⏱️'
                );
            }
        }, 1000);
    }

    stopOpponentCountdown() {
        if (this.opponentWaitTimer) {
            clearInterval(this.opponentWaitTimer);
            this.opponentWaitTimer = null;
        }
        this.isWaitingForOpponent = false;
        if (this.dom.hostWaitingOverlay) {
            this.dom.hostWaitingOverlay.classList.remove('active');
        }
    }

    handlePeerDrop() {
        if (this.screens.match && this.screens.match.classList.contains('active') && this.currentRound < 11) {
            if (multiplayer.isHost) {
                this.startOpponentCountdown(
                    multiplayer.roomCode,
                    '⏳ RAKİP OYUNCU KOPTU',
                    `Rakip oyuncunun bağlantısı koptu.<br><strong>#${multiplayer.roomCode}</strong> koduyla tekrar katılması bekleniyor...`
                );
            } else if (!multiplayer.isSpectator) {
                this.clearLiveSessionSnapshot();
                Object.values(this.modals).forEach(m => m && m.classList.remove('active'));
                multiplayer.disconnect();
                this.switchScreen('mainMenu');
                this.showNotice(
                    'BAĞLANTI KOPTU',
                    '⚠️ Ev sahibi ile bağlantı koptu veya oda kapatıldı. Ana menüye yönlendirildiniz.',
                    '🔌'
                );
            }
        }
    }

    // ===================================================================
    // ETKİNLİK DİNLEYİCİLERİ
    // ===================================================================
    setupEventListeners() {
        document.getElementById('btnMenuHost').addEventListener('click', () => {
            soundFX.btnClick();
            this.modals.host.classList.add('active');
        });

        document.getElementById('btnMenuJoin').addEventListener('click', () => {
            soundFX.btnClick();
            this.modals.join.classList.add('active');
        });

        document.getElementById('btnMenuLocal').addEventListener('click', () => {
            soundFX.btnClick();
            this.modals.local.classList.add('active');
        });

        if (this.dom.btnMenuSpectator) {
            this.dom.btnMenuSpectator.addEventListener('click', () => {
                soundFX.btnClick();
                this.loadAndRenderActiveRooms();
                this.modals.spectator.classList.add('active');
            });
        }

        document.getElementById('btnConfirmHost').addEventListener('click', () => {
            const hostName = document.getElementById('hostTeamNameInput').value.trim() || 'Dharma';
            this.resetMatchState(hostName, 'Bekleniyor...');
            this.myTeamKey = 'teamA';
            this.gameMode = 'online';

            this.modals.host.classList.remove('active');
            this.dom.displayRoomCode.textContent = '....';
            this.dom.lobbyNameA.textContent = hostName;
            this.dom.lobbyNameB.textContent = 'Bekleniyor...';
            this.dom.lobbyStatusB.textContent = 'BEKLENİYOR ⏳';
            this.dom.lobbyStatusB.className = 'lobby-status-tag status-waiting';
            this.dom.btnLobbyStartMatch.style.display = 'none';
            document.getElementById('lobbySubtitleText').textContent = 'Arkadaşınızın odaya katılması bekleniyor...';

            this.switchScreen('lobby');
            multiplayer.createRoom(null, hostName);
        });

        document.getElementById('btnConfirmJoin').addEventListener('click', () => {
            const code = document.getElementById('joinRoomCodeInput').value.trim();
            const joinName = document.getElementById('joinTeamNameInput').value.trim() || 'The Hunters';

            if (!code) {
                this.showNotice('EKSİK BİLGİ', 'Lütfen geçerli 4 haneli oda kodunu girin.', '⚠️');
                return;
            }

            this.resetMatchState('Ev Sahibi', joinName);
            this.myTeamKey = 'teamB';
            this.gameMode = 'online';

            this.modals.join.classList.remove('active');
            this.dom.displayRoomCode.textContent = code;
            this.dom.lobbyNameA.textContent = 'Ev Sahibi';
            this.dom.lobbyNameB.textContent = joinName;
            this.dom.lobbyStatusB.textContent = 'BAĞLANILIYOR...';
            this.dom.lobbyStatusB.className = 'lobby-status-tag status-waiting';
            this.dom.btnLobbyStartMatch.style.display = 'none';
            document.getElementById('lobbySubtitleText').textContent = 'Odaya bağlanılıyor, lütfen bekleyin...';

            this.switchScreen('lobby');
            multiplayer.joinRoom(code);
        });

        document.getElementById('btnConfirmLocal').addEventListener('click', () => {
            const nameA = document.getElementById('localTeamANameInput').value.trim() || 'Dharma';
            const nameB = document.getElementById('localTeamBNameInput').value.trim() || 'The Hunters';

            this.resetMatchState(nameA, nameB);
            this.gameMode = 'local';

            this.modals.local.classList.remove('active');
            this.startCoinTossFlow();
        });

        document.getElementById('btnLobbyBack').addEventListener('click', () => {
            multiplayer.disconnect();
            this.switchScreen('mainMenu');
        });

        document.getElementById('btnCopyRoomCode').addEventListener('click', () => {
            const code = this.dom.displayRoomCode.textContent;
            if (!code || code.includes('.') || code.includes('-')) return;
            navigator.clipboard.writeText(code);
            this.showNotice('KOPYALANDI', `Oda kodu (<strong>${code}</strong>) panoya kopyalandı! Arkadaşınızla paylaşabilirsiniz.`, '📋');
        });

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

        this.dom.btnFlipCoin.addEventListener('click', () => {
            this.runCoinToss();
        });

        this.dom.btnUseBlock.addEventListener('click', () => {
            this.handleBlockRequest();
        });

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

        this.dom.audioToggle.addEventListener('click', () => {
            const isMuted = soundFX.toggleMute();
            this.dom.audioToggle.textContent = isMuted ? '🔇' : '🔊';
        });

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

        if (this.dom.btnFloatingSkip) {
            this.dom.btnFloatingSkip.addEventListener('click', () => {
                this.handleSkipButtonClick();
            });
        }

        document.getElementById('btnRestartGame').addEventListener('click', () => {
            this.clearLiveSessionSnapshot();
            window.location.reload();
        });

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

        if (this.dom.btnNoticeClose) {
            this.dom.btnNoticeClose.addEventListener('click', () => {
                this.closeNotice();
            });
        }

        if (this.dom.btnCancelBlock) {
            this.dom.btnCancelBlock.addEventListener('click', () => {
                this.modals.block.classList.remove('active');
            });
        }

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
                this.stopOpponentCountdown();
                this.discardLiveSession();
            });
        }

        window.addEventListener('beforeunload', (e) => {
            if (this.screens.match && this.screens.match.classList.contains('active') && this.currentRound < 11) {
                if (this.isWaitingForOpponent) {
                    this.clearLiveSessionSnapshot();
                    if (multiplayer.roomCode) {
                        multiplayer.unregisterRoom(multiplayer.roomCode);
                    }
                    return;
                }

                multiplayer.sendLeavingNotice();
                this.saveLiveSessionSnapshot();
                e.preventDefault();
                e.returnValue = 'Devam eden bir maçınız var! Ayrılmak istediğinize emin misiniz?';
                return e.returnValue;
            }
        });

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

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modals.confirmPick && this.modals.confirmPick.classList.contains('active')) this.cancelConfirmPick();
                if (this.modals.notice && this.modals.notice.classList.contains('active')) this.closeNotice();
                if (this.modals.block && this.modals.block.classList.contains('active')) this.modals.block.classList.remove('active');
                if (this.modals.pitch && this.modals.pitch.classList.contains('active')) this.modals.pitch.classList.remove('active');
                if (this.modals.spectator && this.modals.spectator.classList.contains('active')) this.modals.spectator.classList.remove('active');
                if (this.modals.exitMatch && this.modals.exitMatch.classList.contains('active')) this.modals.exitMatch.classList.remove('active');
            }
        });
    }

    // ===================================================================
    // MULTIPLAYER ETKİNLİK BAĞLAYICILARI
    // ===================================================================
    setupMultiplayerEvents() {
        multiplayer.on('roomCreated', (data) => {
            this.dom.displayRoomCode.textContent = data.roomCode;
        });

        multiplayer.on('peerConnected', (data) => {
            soundFX.btnClick();
            if (data.isHost) {
                this.dom.lobbyStatusB.textContent = 'HAZIR ✅';
                this.dom.lobbyStatusB.className = 'lobby-status-tag status-ready';
                this.dom.btnLobbyStartMatch.style.display = 'block';

                multiplayer.send('SYNC_LOBBY_NAMES', {
                    teamA: this.teams.teamA.name,
                    teamB: this.teams.teamB.name
                });

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
                this.dom.lobbyStatusB.textContent = 'BAĞLANDI (HAZIR) ✅';
                this.dom.lobbyStatusB.className = 'lobby-status-tag status-ready';
                document.getElementById('lobbySubtitleText').textContent = 'Host maç başlatınca oyun başlayacaktır...';
                
                multiplayer.send('GUEST_NAME_UPDATE', {
                    name: this.teams.teamB.name
                });
            }
        });

        multiplayer.on('RECONNECT_SYNC', (payload) => {
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
            soundFX.btnClick();
            this.showNotice('MAÇA DÖNÜLDÜ', '✅ Ev sahibi ile bağlantı tekrar kuruldu! Maç kaldığı yerden devam ediyor.', '⚡');
        });

        multiplayer.on('GUEST_NAME_UPDATE', (payload) => {
            this.teams.teamB.name = payload.name;
            this.dom.lobbyNameB.textContent = payload.name;
            if (multiplayer.isHost) {
                multiplayer.send('SYNC_LOBBY_NAMES', {
                    teamA: this.teams.teamA.name,
                    teamB: this.teams.teamB.name
                });
            }
        });

        multiplayer.on('SYNC_LOBBY_NAMES', (payload) => {
            this.teams.teamA.name = payload.teamA;
            this.dom.lobbyNameA.textContent = payload.teamA;
            if (payload.teamB) {
                this.teams.teamB.name = payload.teamB;
                this.dom.lobbyNameB.textContent = payload.teamB;
            }
        });

        multiplayer.on('HOST_START_MATCH', (payload) => {
            this.teams.teamA.name = payload.teamA;
            this.teams.teamB.name = payload.teamB;
            if (payload.matchPositions) {
                this.matchPositions = payload.matchPositions;
            }
            this.startCoinTossFlow();
        });

        multiplayer.on('COIN_FLIP_START', (payload) => {
            this.animateCoinFlip(payload.winner);
        });

        multiplayer.on('COIN_TOSS_RESULT', (payload) => {
            this.applyCoinTossResult(payload.winner);
        });

        multiplayer.on('START_ROUND_SYNC', (payload) => {
            this.activeRevealId++;
            if (this.skipCountdownInterval) {
                clearInterval(this.skipCountdownInterval);
                this.skipCountdownInterval = null;
            }
            this.currentStepResolver = null;
            if (this.dom.btnFloatingSkip) {
                this.dom.btnFloatingSkip.classList.remove('visible', 'voted-ready');
            }
            if (this.modals.coin) {
                this.modals.coin.classList.remove('active');
            }

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

        multiplayer.on('END_GAME_SYNC', () => {
            this.activeRevealId++;
            if (this.skipCountdownInterval) {
                clearInterval(this.skipCountdownInterval);
                this.skipCountdownInterval = null;
            }
            this.currentStepResolver = null;
            if (this.dom.btnFloatingSkip) {
                this.dom.btnFloatingSkip.classList.remove('visible', 'voted-ready');
            }
            this.endGame();
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
            this.handleRemoteSkipVote(payload.team, payload.step);
        });

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

            Object.values(this.modals).forEach(m => m && m.classList.remove('active'));
            this.switchScreen('match');
            this.renderRound();
            this.renderPitchNodes();

            if (this.dom.spectatorHeaderBadge) this.dom.spectatorHeaderBadge.style.display = 'flex';
            if (this.dom.btnExitSpectator) this.dom.btnExitSpectator.style.display = 'flex';
            this.dom.btnUseBlock.style.display = 'none';

            this.showNotice('CANLI YAYIN BAĞLANDI', `🔴 <strong>${this.teams.teamA.name}</strong> vs <strong>${this.teams.teamB.name}</strong> maçına bağlandınız!`, '📺');
        });

        multiplayer.on('PEER_LEAVING', () => {
            this.handlePeerDrop();
        });

        multiplayer.on('peerDisconnected', () => {
            this.handlePeerDrop();
        });

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

        multiplayer.on('error', (err) => {
            console.error('Multiplayer bağlantı hatası:', err);
            if (this.screens.lobby && this.screens.lobby.classList.contains('active')) {
                if (this.dom.lobbyStatusB) {
                    this.dom.lobbyStatusB.textContent = 'BAĞLANTI BAŞARISIZ ❌';
                    this.dom.lobbyStatusB.className = 'lobby-status-tag status-not-ready';
                }
                const msg = (err && (err.type === 'peer-unavailable' || (err.message && err.message.includes('unavailable'))))
                    ? 'Bu koda sahip açık bir oda bulunamadı veya oda kapandı. Lütfen oda kodunu kontrol edin.'
                    : 'Odaya bağlanılamadı. Lütfen oda kodunu ve internet bağlantınızı kontrol edin.';
                this.showNotice('BAĞLANTI HATASI', msg, '⚠️');
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new ScoutGame();
});
