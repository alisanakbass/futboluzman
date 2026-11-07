// ===================================================================
// SCAUDE SCOUT - OYUN KURALLARI, KART HAVUZU & TUR MOTORU
// ===================================================================

const GameEngine = {
    generateRoundCards(game, positionName) {
        const pool = game.database[positionName];
        if (!pool || pool.length < 4) return [];

        const calcProfit = (player) => Math.round((player.guncel.deger - player.gecmis.deger) * 10) / 10;

        const karOyuncular = pool.filter(p => calcProfit(p) > 0).sort((a, b) => calcProfit(b) - calcProfit(a));
        const zararOyuncular = pool.filter(p => calcProfit(p) <= 0).sort((a, b) => calcProfit(b) - calcProfit(a));

        const cokKarHavuzu = karOyuncular.slice(0, Math.ceil(karOyuncular.length / 2));
        const hafifKarHavuzu = karOyuncular.slice(Math.ceil(karOyuncular.length / 2));

        const hafifZararHavuzu = zararOyuncular.slice(0, Math.ceil(zararOyuncular.length / 2));
        const cokZararHavuzu = zararOyuncular.slice(Math.ceil(zararOyuncular.length / 2));

        const pickRandom = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

        let card1 = pickRandom(cokKarHavuzu) || pickRandom(karOyuncular);
        let card2 = pickRandom(hafifKarHavuzu) || pickRandom(karOyuncular);
        let card3 = pickRandom(hafifZararHavuzu) || pickRandom(zararOyuncular);
        let card4 = pickRandom(cokZararHavuzu) || pickRandom(zararOyuncular);

        if (card1 && card2 && card1.id === card2.id) {
            const others = karOyuncular.filter(p => p.id !== card1.id);
            if (others.length > 0) card2 = pickRandom(others);
        }

        if (card3 && card4 && card3.id === card4.id) {
            const others = zararOyuncular.filter(p => p.id !== card3.id);
            if (others.length > 0) card4 = pickRandom(others);
        }

        const chosen = [card1, card2, card3, card4].filter(Boolean);
        const uniqueChosen = Array.from(new Set(chosen));

        while (uniqueChosen.length < 4) {
            const extra = pool[Math.floor(Math.random() * pool.length)];
            if (!uniqueChosen.some(p => p.id === extra.id)) {
                uniqueChosen.push(extra);
            }
        }

        const shuffled = [...uniqueChosen].sort(() => 0.5 - Math.random());

        return shuffled.map((player) => {
            const profit = calcProfit(player);
            return {
                ...player,
                profit
            };
        });
    },

    startPositionRound(game) {
        if (!game.matchPositions || game.matchPositions.length === 0) {
            game.matchPositions = [...POSITIONS].sort(() => 0.5 - Math.random());
        }

        if (game.currentRound >= game.matchPositions.length) {
            game.endGame();
            return;
        }

        const positionName = game.getCurrentPositionName();

        if (game.gameMode === 'local' || (game.gameMode === 'online' && multiplayer.isHost)) {
            game.roundCards = this.generateRoundCards(game, positionName);
            game.lockedPicks = {};
            game.blockedCardIndex = null;
            game.isRevealing = false;
            game.currentTurn = game.firstPicker;

            if (game.gameMode === 'online') {
                multiplayer.send('START_ROUND_SYNC', {
                    round: game.currentRound,
                    cards: game.roundCards,
                    turn: game.currentTurn,
                    firstPicker: game.firstPicker,
                    matchPositions: game.matchPositions
                });
            }

            game.renderRound();
        }
    },

    async startSuspenseRevealSequence(game) {
        const seqId = ++game.activeRevealId;
        game.isRevealing = true;
        game.dom.btnUseBlock.disabled = true;

        const pickA = game.lockedPicks.teamA;
        const pickB = game.lockedPicks.teamB;
        const unpickedIndices = [0, 1, 2, 3].filter(idx => idx !== pickA && idx !== pickB);

        game.dom.actionTipText.innerHTML = `⏳ <strong style="color:var(--gold-card-primary);">SEÇİMLER KİLİTLENDİ!</strong> Önce Seçilmeyen Kartlar Açılıyor...`;
        soundFX.heartbeat();
        await new Promise(r => setTimeout(r, 2400));
        if (game.activeRevealId !== seqId) return;

        // 2. Adım: Seçilmeyen 1. Kart Açılır
        const unpickedCard0 = game.roundCards[unpickedIndices[0]];
        const cardElem0 = document.getElementById(`card-${unpickedIndices[0]}`);
        if (cardElem0) {
            cardElem0.classList.add('is-flipped');
            soundFX.cardFlip();
        }
        game.dom.actionTipText.innerHTML = `👀 Seçenek #${unpickedIndices[0] + 1} (${unpickedCard0.gercek_isim} - ${unpickedCard0.kulup || ''}) Kaçırıldı! (Fark: ${unpickedCard0.profit >= 0 ? '+' : ''}${unpickedCard0.profit}M€)`;
        if (unpickedCard0.profit > 0) soundFX.profit(); else soundFX.loss();
        await game.waitForSkipOrTimeout(15000, 'card', 1);
        if (game.activeRevealId !== seqId) return;

        // 3. Adım: Seçilmeyen 2. Kart Açılır
        const unpickedCard1 = game.roundCards[unpickedIndices[1]];
        const cardElem1 = document.getElementById(`card-${unpickedIndices[1]}`);
        if (cardElem1) {
            cardElem1.classList.add('is-flipped');
            soundFX.cardFlip();
        }
        game.dom.actionTipText.innerHTML = `👀 Seçenek #${unpickedIndices[1] + 1} (${unpickedCard1.gercek_isim} - ${unpickedCard1.kulup || ''}) Kaçırıldı! (Fark: ${unpickedCard1.profit >= 0 ? '+' : ''}${unpickedCard1.profit}M€)`;
        if (unpickedCard1.profit > 0) soundFX.profit(); else soundFX.loss();
        await game.waitForSkipOrTimeout(15000, 'card', 2);
        if (game.activeRevealId !== seqId) return;

        // 4. Adım: 1. Takımın Seçimi Açılıyor!
        const team1Key = game.firstPicker;
        const team1 = game.teams[team1Key];
        const team1PickIndex = game.lockedPicks[team1Key];
        const team1Player = game.roundCards[team1PickIndex];

        game.dom.actionTipText.innerHTML = `🔥 <span style="color:${team1.color};font-weight:900;">${team1.name}</span> Seçimi Açılıyor: Seçenek #${team1PickIndex + 1}...`;
        soundFX.heartbeat();
        await new Promise(r => setTimeout(r, 2200));
        if (game.activeRevealId !== seqId) return;

        const team1CardElem = document.getElementById(`card-${team1PickIndex}`);
        if (team1CardElem) {
            team1CardElem.classList.add('is-flipped');
            soundFX.cardFlip();
        }

        team1.totalProfit += team1Player.profit;
        team1.totalValue += team1Player.guncel.deger;
        team1.squad[game.getCurrentPositionName()] = team1Player;
        game.updateScoreboard();
        game.renderPitchNodes();

        if (team1Player.profit > 0) soundFX.profit(); else soundFX.loss();
        game.dom.actionTipText.innerHTML = `⭐ ${team1.name} transferi: <strong>${team1Player.gercek_isim} (${team1Player.kulup || ''})</strong> (${team1Player.profit >= 0 ? '+' : ''}${team1Player.profit}M€)`;
        await game.waitForSkipOrTimeout(15000, 'card', 3);
        if (game.activeRevealId !== seqId) return;

        // 5. Adım: 2. Takımın Seçimi Açılıyor!
        const team2Key = game.firstPicker === 'teamA' ? 'teamB' : 'teamA';
        const team2 = game.teams[team2Key];
        const team2PickIndex = game.lockedPicks[team2Key];
        const team2Player = game.roundCards[team2PickIndex];

        game.dom.actionTipText.innerHTML = `🔥 <span style="color:${team2.color};font-weight:900;">${team2.name}</span> Seçimi Açılıyor: Seçenek #${team2PickIndex + 1}...`;
        soundFX.heartbeat();
        await new Promise(r => setTimeout(r, 2200));
        if (game.activeRevealId !== seqId) return;

        const team2CardElem = document.getElementById(`card-${team2PickIndex}`);
        if (team2CardElem) {
            team2CardElem.classList.add('is-flipped');
            soundFX.cardFlip();
        }

        team2.totalProfit += team2Player.profit;
        team2.totalValue += team2Player.guncel.deger;
        team2.squad[game.getCurrentPositionName()] = team2Player;
        game.updateScoreboard();
        game.renderPitchNodes();

        if (team2Player.profit > 0) soundFX.profit(); else soundFX.loss();
        game.dom.actionTipText.innerHTML = `⭐ ${team2.name} transferi: <strong>${team2Player.gercek_isim} (${team2Player.kulup || ''})</strong> (${team2Player.profit >= 0 ? '+' : ''}${team2Player.profit}M€)`;

        // 4 Kart da açıldı! 'Sıradaki Mevkiye Geç'
        await game.waitForSkipOrTimeout(15000, 'round', 4);
        if (game.activeRevealId !== seqId) return;

        if (game.dom.btnFloatingSkip) {
            game.dom.btnFloatingSkip.classList.remove('visible');
        }

        // 6. Adım: Turu Tamamla ve Sıradaki Mevkiye Geç (Online modda yalnızca Host)
        if (game.gameMode === 'local' || (game.gameMode === 'online' && multiplayer.isHost)) {
            game.currentRound++;
            game.firstPicker = game.firstPicker === 'teamA' ? 'teamB' : 'teamA';
            game.currentTurn = game.firstPicker;

            if (game.currentRound < (game.matchPositions ? game.matchPositions.length : 11)) {
                game.startPositionRound();
            } else {
                if (game.gameMode === 'online' && multiplayer.isHost) {
                    multiplayer.send('END_GAME_SYNC', {});
                }
                game.endGame();
            }
        }
    },

    waitForSkipOrTimeout(game, durationMs, stepType = 'card', stepNum = 1) {
        return new Promise(resolve => {
            game.skipVotes = { teamA: false, teamB: false };
            game.currentStepResolver = resolve;
            game.currentStepType = stepType;
            game.currentRevealStep = stepNum;

            if (game.dom.btnFloatingSkip) {
                game.dom.btnFloatingSkip.classList.remove('voted-ready');
                game.dom.btnFloatingSkip.classList.add('visible');
            }

            let remainingSeconds = Math.ceil(durationMs / 1000);
            this.updateSkipButtonUI(game, remainingSeconds);

            if (game.skipCountdownInterval) clearInterval(game.skipCountdownInterval);
            game.skipCountdownInterval = setInterval(() => {
                remainingSeconds--;
                if (remainingSeconds <= 0) {
                    clearInterval(game.skipCountdownInterval);
                    this.completeCurrentStep(game);
                } else {
                    this.updateSkipButtonUI(game, remainingSeconds);
                }
            }, 1000);
        });
    },

    updateSkipButtonUI(game, seconds) {
        if (!game.dom.floatingSkipText) return;

        const isRoundChange = game.currentStepType === 'round';
        const actionLabel = isRoundChange ? 'SIRADAKİ MEVKİ' : 'HIZLI GEÇ';

        if (game.gameMode === 'spectator') {
            game.dom.btnFloatingSkip.classList.remove('voted-ready');
            game.dom.floatingSkipText.textContent = `🔴 CANLI YAYIN • ${seconds}s`;
            return;
        }

        if (game.gameMode === 'online') {
            const myVoted = game.skipVotes[game.myTeamKey];
            const voteCount = (game.skipVotes.teamA ? 1 : 0) + (game.skipVotes.teamB ? 1 : 0);

            if (myVoted) {
                game.dom.btnFloatingSkip.classList.add('voted-ready');
                game.dom.floatingSkipText.textContent = `✅ SEN HAZIRSIN (${voteCount}/2) • ${seconds}s`;
            } else {
                game.dom.btnFloatingSkip.classList.remove('voted-ready');
                game.dom.floatingSkipText.textContent = `⚡ ${actionLabel} (${voteCount}/2) • ${seconds}s`;
            }
        } else {
            game.dom.floatingSkipText.textContent = `⚡ ${actionLabel} • ${seconds}s`;
        }
    },

    handleSkipButtonClick(game) {
        if (!game.currentStepResolver) return;
        soundFX.cardHover();

        if (game.gameMode === 'online') {
            if (game.skipVotes[game.myTeamKey]) return;

            game.skipVotes[game.myTeamKey] = true;
            multiplayer.send('SKIP_VOTE', {
                team: game.myTeamKey,
                step: game.currentRevealStep
            });
            this.updateSkipButtonUI(game, 15);

            if (game.skipVotes.teamA && game.skipVotes.teamB) {
                this.completeCurrentStep(game);
            }
        } else {
            this.completeCurrentStep(game);
        }
    },

    handleRemoteSkipVote(game, teamKey, stepNum) {
        if (!game.currentStepResolver) return;
        if (stepNum !== undefined && stepNum !== game.currentRevealStep) return;

        game.skipVotes[teamKey] = true;
        this.updateSkipButtonUI(game, 15);
        if (game.skipVotes.teamA && game.skipVotes.teamB) {
            this.completeCurrentStep(game);
        }
    },

    completeCurrentStep(game) {
        if (game.skipCountdownInterval) {
            clearInterval(game.skipCountdownInterval);
            game.skipCountdownInterval = null;
        }

        if (game.currentStepResolver) {
            const resolve = game.currentStepResolver;
            game.currentStepResolver = null;
            resolve();
        }
    }
};

