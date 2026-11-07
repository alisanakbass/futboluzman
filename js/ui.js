// ===================================================================
// SCAUDE SCOUT - ARAYÜZ (UI), MODALLAR & GÖRSEL KART MOTORU
// ===================================================================

const ScoutUI = {
    setupDOM(game) {
        game.screens = {
            mainMenu: document.getElementById('mainMenuScreen'),
            lobby: document.getElementById('lobbyScreen'),
            match: document.getElementById('matchScreen')
        };

        game.modals = {
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

        game.dom = {
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

            btnMenuSpectator: document.getElementById('btnMenuSpectator'),
            activeRoomsList: document.getElementById('activeRoomsList'),
            btnRefreshRooms: document.getElementById('btnRefreshRooms'),
            spectatorRoomCodeInput: document.getElementById('spectatorRoomCodeInput'),
            btnConfirmSpectator: document.getElementById('btnConfirmSpectator'),
            btnCancelSpectator: document.getElementById('btnCancelSpectator'),
            spectatorHeaderBadge: document.getElementById('spectatorHeaderBadge'),
            btnExitSpectator: document.getElementById('btnExitSpectator'),

            hostWaitingOverlay: document.getElementById('hostWaitingOverlay'),
            hostWaitingAttemptText: document.getElementById('hostWaitingAttemptText'),
            btnHostWaitingExit: document.getElementById('btnHostWaitingExit'),
            btnResumeContinue: document.getElementById('btnResumeContinue'),
            btnResumeDiscard: document.getElementById('btnResumeDiscard'),

            btnExitMatch: document.getElementById('btnExitMatch'),
            btnConfirmExitMatch: document.getElementById('btnConfirmExitMatch'),
            btnCancelExitMatch: document.getElementById('btnCancelExitMatch'),
            exitMatchDesc: document.getElementById('exitMatchDesc')
        };
    },

    switchScreen(game, screenName) {
        Object.values(game.screens).forEach(screen => screen && screen.classList.remove('active'));
        if (game.screens[screenName]) {
            game.screens[screenName].classList.add('active');
        }
    },

    updateScoreboard(game) {
        game.dom.teamAProfit.textContent = `${game.teams.teamA.totalProfit >= 0 ? '+' : ''}${game.teams.teamA.totalProfit.toFixed(1)} M€`;
        game.dom.teamAProfit.className = `profit-amount ${game.teams.teamA.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`;

        game.dom.teamBProfit.textContent = `${game.teams.teamB.totalProfit >= 0 ? '+' : ''}${game.teams.teamB.totalProfit.toFixed(1)} M€`;
        game.dom.teamBProfit.className = `profit-amount ${game.teams.teamB.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}`;

        if (game.currentTurn === 'teamA') {
            game.dom.teamACard.classList.add('active-turn');
            game.dom.teamBCard.classList.remove('active-turn');
        } else {
            game.dom.teamBCard.classList.add('active-turn');
            game.dom.teamACard.classList.remove('active-turn');
        }

        game.dom.teamABlockBadge.textContent = game.teams.teamA.hasBlock ? '🛡️ Blok: HAZIR' : '❌ Blok: KULLANILDI';
        game.dom.teamABlockBadge.className = `joker-badge ${game.teams.teamA.hasBlock ? 'joker-ready' : 'joker-used'}`;

        game.dom.teamBBlockBadge.textContent = game.teams.teamB.hasBlock ? '🛡️ Blok: HAZIR' : '❌ Blok: KULLANILDI';
        game.dom.teamBBlockBadge.className = `joker-badge ${game.teams.teamB.hasBlock ? 'joker-ready' : 'joker-used'}`;
    },

    updateActionBanner(game) {
        if (game.isRevealing) return;

        if (game.gameMode === 'spectator') {
            const activeTeam = game.teams[game.currentTurn];
            game.dom.actionTipText.innerHTML = `🔴 <strong style="color:#ff2a5f;">CANLI İZLENİYOR:</strong> <span class="tip-highlight" style="color:${activeTeam.color};">${activeTeam.name}</span> Seçim Yapıyor (${game.getCurrentPositionName()})`;
            game.dom.btnUseBlock.style.display = 'none';
            return;
        }

        const activeTeam = game.teams[game.currentTurn];
        const opponentKey = game.currentTurn === 'teamA' ? 'teamB' : 'teamA';
        const opponentTeam = game.teams[opponentKey];

        game.dom.actionTipText.innerHTML = `Sıradaki Seçim: <span class="tip-highlight" style="color:${activeTeam.color};">${activeTeam.name}</span> (${game.getCurrentPositionName()} Seçiyor)`;

        if (game.gameMode === 'online') {
            const isOpponentTurn = game.currentTurn !== game.myTeamKey;
            const myTeam = game.teams[game.myTeamKey];
            game.dom.btnUseBlock.disabled = !(isOpponentTurn && myTeam.hasBlock && game.blockedCardIndex === null);
            game.dom.btnUseBlock.textContent = `🛡️ ${activeTeam.name}'e BLOK AT`;
        } else {
            game.dom.btnUseBlock.disabled = !(opponentTeam.hasBlock && game.blockedCardIndex === null);
            game.dom.btnUseBlock.textContent = `🛡️ ${opponentTeam.name} BLOK KULLAN`;
        }
    },

    renderVideoCards(game) {
        game.dom.cardsArena.innerHTML = '';
        game.roundCards.forEach((player, index) => {
            const isBlocked = game.blockedCardIndex === index;
            const isPickedA = game.lockedPicks.teamA === index;
            const isPickedB = game.lockedPicks.teamB === index;

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
                ${isPickedA ? `<div class="team-choice-tag team-a">🔒 ${game.teams.teamA.name.toUpperCase()} SEÇTİ</div>` : ''}
                ${isPickedB ? `<div class="team-choice-tag team-b">🔒 ${game.teams.teamB.name.toUpperCase()} SEÇTİ</div>` : ''}

                <div class="yt-season-badge">${player.sezon}</div>

                <div class="yt-card-inner">
                    <div class="yt-card-face ${themeClass}">
                        <div class="yt-silhouette-box">
                            <svg class="yt-silhouette-icon" viewBox="0 0 100 100">
                                <circle cx="50" cy="34" r="20"/>
                                <path d="M12 95 C 12 62, 30 56, 50 56 C 70 56, 88 62, 88 95 Z"/>
                            </svg>
                        </div>

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
                if (!game.isRevealing && !card.classList.contains('is-flipped')) {
                    soundFX.cardHover();
                }
            });

            card.addEventListener('click', () => {
                game.onCardSelected(index);
            });

            game.dom.cardsArena.appendChild(card);
        });
    },

    getShortName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        if (parts.length <= 1) return fullName;
        return parts.slice(1).join(' ');
    },

    renderPitchNodes(game) {
        game.dom.pitchContainer.innerHTML = `
            <div class="pitch-line-center"></div>
            <div class="pitch-circle-center"></div>
            <div class="pitch-penalty-top"></div>
            <div class="pitch-penalty-bottom"></div>
        `;

        const targetSquad = game.teams[game.activePitchTeam].squad;

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
                    <div class="player-tag" title="${player.gercek_isim}">${this.getShortName(player.gercek_isim)}</div>
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

            game.dom.pitchContainer.appendChild(node);
        });
    },

    showNotice(game, title, message, icon = '⚠️') {
        if (!game.dom.noticeIcon) return;
        game.dom.noticeIcon.textContent = icon;
        game.dom.noticeTitle.textContent = title;
        game.dom.noticeMessage.innerHTML = message;
        game.modals.notice.classList.add('active');
        soundFX.cardHover();
    },

    closeNotice(game) {
        if (game.modals.notice) {
            game.modals.notice.classList.remove('active');
        }
    },

    openBlockModal(game, blockerKey, available) {
        game.dom.blockModalDesc.innerHTML = `<strong>${game.teams[blockerKey].name}</strong>, rakibin seçmesini engellemek istediğin kartı belirle:`;
        game.dom.blockCardsGrid.innerHTML = '';

        available.forEach(idx => {
            const card = game.roundCards[idx];
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
                game.modals.block.classList.remove('active');
                if (game.gameMode === 'online') {
                    multiplayer.send('BLOCK_USED', {
                        blockerTeam: blockerKey,
                        targetCardIndex: idx
                    });
                }
                game.applyBlock(blockerKey, idx);
            });
            game.dom.blockCardsGrid.appendChild(btn);
        });

        game.modals.block.classList.add('active');
    },

    showFinalCelebration(game) {
        soundFX.crowdCheer();

        if (typeof confetti === 'function') {
            confetti({ particleCount: 220, spread: 130, origin: { y: 0.6 } });
        }

        const aProfit = game.teams.teamA.totalProfit;
        const bProfit = game.teams.teamB.totalProfit;

        let winnerText = '';
        if (aProfit > bProfit) {
            winnerText = `🏆 ŞAMPİYON: ${game.teams.teamA.name.toUpperCase()}!`;
        } else if (bProfit > aProfit) {
            winnerText = `🏆 ŞAMPİYON: ${game.teams.teamB.name.toUpperCase()}!`;
        } else {
            const aVal = game.teams.teamA.totalValue;
            const bVal = game.teams.teamB.totalValue;
            if (aVal > bVal) {
                winnerText = `🏆 KADRO DEĞERİYLE ŞAMPİYON: ${game.teams.teamA.name.toUpperCase()}!`;
            } else if (bVal > aVal) {
                winnerText = `🏆 KADRO DEĞERİYLE ŞAMPİYON: ${game.teams.teamB.name.toUpperCase()}!`;
            } else {
                winnerText = `🤝 DOSTLUK KAZANDI: BERABERE!`;
            }
        }

        document.getElementById('winnerTeamTitle').textContent = winnerText;

        document.getElementById('finalScoreSummary').innerHTML = `
            <strong>${game.teams.teamA.name}:</strong> ${aProfit.toFixed(1)} M€ Net Kâr | Toplam Kadro Değeri: ${game.teams.teamA.totalValue.toFixed(1)} M€<br>
            <strong>${game.teams.teamB.name}:</strong> ${bProfit.toFixed(1)} M€ Net Kâr | Toplam Kadro Değeri: ${game.teams.teamB.totalValue.toFixed(1)} M€
        `;

        const allTransfers = [
            ...Object.values(game.teams.teamA.squad).map(p => ({ ...p, team: game.teams.teamA.name })),
            ...Object.values(game.teams.teamB.squad).map(p => ({ ...p, team: game.teams.teamB.name }))
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

        game.clearLiveSessionSnapshot();
        if (game.gameMode === 'online' && multiplayer.isHost && multiplayer.roomCode) {
            multiplayer.unregisterRoom(multiplayer.roomCode);
        }

        game.modals.winner.classList.add('active');
    },

    async loadAndRenderActiveRooms(game) {
        if (!game.dom.activeRoomsList) return;
        game.dom.activeRoomsList.innerHTML = '<div class="no-rooms-msg">🔄 Aktif canlı odalar taranıyor...</div>';

        const rooms = await multiplayer.getActiveRooms();

        if (!rooms || rooms.length === 0) {
            game.dom.activeRoomsList.innerHTML = `
                <div class="no-rooms-msg">
                    Şu anda listelenen açık canlı oda bulunamadı.<br>
                    <span style="font-size:0.75rem; color:#64748b;">(Aşağıdaki alana arkadaşınızın 4 haneli oda kodunu girerek maçı canlı izleyebilirsiniz.)</span>
                </div>
            `;
            return;
        }

        game.dom.activeRoomsList.innerHTML = '';
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
                game.startWatchingRoom(room.code);
            });
            game.dom.activeRoomsList.appendChild(card);
        });
    }
};

