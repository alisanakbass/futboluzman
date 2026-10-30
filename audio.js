// ===================================================================
// SCAUDE SCOUT - DİJİTAL SES MOTORU (Web Audio API)
// Harici mp3/wav dosyasına ihtiyaç duymayan kulağı yormayan sentetik efektler
// ===================================================================

class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // Yumuşak & Tok Modern UI Buton Tık Sesi (Kulağı asla yormaz)
    btnClick() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
    }

    // Gerçekçi & Yumuşak Hakem Düdüğü (Çift Frekanslı Akustik Rezonans & Doğal Trill)
    // isLong: true ise maç sonu için 3'lü bitiş düdüğü çalar (Düt-Düt-Düüüt)
    whistle(isLong = false) {
        if (this.muted) return;
        this.init();

        const playTrill = (startTime, duration, volume = 0.065) => {
            const t = startTime;
            // Çift rezonans frekansı (Gerçek Fox 40 / Acme akustik modeli)
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            const gain = this.ctx.createGain();

            // Doğal hava titreşimi (trill) için 22Hz LFO
            lfo.frequency.setValueAtTime(22, t);
            lfoGain.gain.setValueAtTime(40, t); // Yumuşak frekans salınımı

            lfo.connect(osc1.frequency);
            lfo.connect(osc2.frequency);

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(1820, t);
            osc2.frequency.setValueAtTime(2080, t);

            // Yumuşak hücum (attack) ve bitiş (decay) - Kulağa ani patlama yapmaz
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(volume, t + 0.025);
            gain.gain.setValueAtTime(volume * 0.9, t + duration - 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            lfo.start(t);
            osc1.start(t);
            osc2.start(t);

            lfo.stop(t + duration);
            osc1.stop(t + duration);
            osc2.stop(t + duration);
        };

        const now = this.ctx.currentTime;
        if (isLong) {
            // Maç sonu bitiş düdüğü: Kısa - Kısa - Uzun (Düt! Düt! Düüüüt!)
            playTrill(now, 0.14, 0.055);
            playTrill(now + 0.22, 0.14, 0.055);
            playTrill(now + 0.44, 0.42, 0.065);
        } else {
            // Maç başlama düdüğü: Tok ve dengeli tek üfleme
            playTrill(now, 0.26, 0.06);
        }
    }

    // Yazı Tura Para Çınlama Sesi (Zarif Metalik Ping)
    coinFlip() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1174.66, t); // D6
        osc2.frequency.setValueAtTime(2349.32, t); // D7

        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.4);
        osc2.stop(t + 0.4);
    }

    // Kart Üzerine Gelme / Gezinme (Çok Hafif Dokunma Geri Bildirimi)
    cardHover() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.025);

        gain.gain.setValueAtTime(0.022, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.025);
    }

    // Kart Seçim ve Kilitlenme (Lock-in) - Tok ve Tatmin Edici Mekanik Kilit
    lockCard() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // 1. Tok Bas Vuruş (Sub-kick)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, t);
        subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        subGain.gain.setValueAtTime(0.16, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);

        // 2. Hafif Metalik Çıt Sesi (Snap)
        const snapOsc = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(750, t);
        snapOsc.frequency.exponentialRampToValueAtTime(300, t + 0.06);

        snapGain.gain.setValueAtTime(0.05, t);
        snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        snapOsc.connect(snapGain);
        snapGain.connect(this.ctx.destination);

        subOsc.start(t);
        snapOsc.start(t);
        subOsc.stop(t + 0.14);
        snapOsc.stop(t + 0.06);
    }

    // Kalp Atışı / Gerilim (Heartbeat) - Yumuşak Sub-Bas Nabız
    heartbeat() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);

        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
    }

    // 3D Kart Çevrilme (Swoosh) Sesi - Kulağı Rahatsız Etmeyen Yumuşak Hava Akımı
    cardFlip() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;
        
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(350, t);
        filter.frequency.exponentialRampToValueAtTime(1400, t + 0.15);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.11, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(t);
        noise.stop(t + 0.22);
    }

    // Kâr Elde Edildiğinde Zafer Arpeji (Parlak & Neşeli Akort)
    profit() {
        if (this.muted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const t = this.ctx.currentTime + (idx * 0.07);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.10, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.35);
        });
    }

    // Zarar Edildiğinde Sempatik & Müzikal Düşüş Akordu (Testere dalgası kaldırıldı!)
    loss() {
        if (this.muted) return;
        this.init();
        // Cırtlak testere dalgası yerine yumuşak Rhodes / Marimba tarzı pesleşen akort
        const chords = [
            { f1: 349.23, f2: 440.00, time: 0 },    // F4, A4
            { f1: 329.63, f2: 392.00, time: 0.14 }, // E4, G4
            { f1: 293.66, f2: 349.23, time: 0.28 }  // D4, F4
        ];

        chords.forEach(c => {
            const t = this.ctx.currentTime + c.time;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, t);

            osc1.type = 'triangle';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(c.f1, t);
            osc2.frequency.setValueAtTime(c.f2, t);

            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + 0.22);
            osc2.stop(t + 0.22);
        });
    }

    // Joker / Bloklama Sesi (880Hz alarm kaldırıldı! Yerine tok Kalkan/Güç Alanı efekti)
    block() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.25);

        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.28);
    }

    // Şampiyonluk & Tezahürat (Stadyum Akustiği & Zafer Sesi)
    crowdCheer() {
        if (this.muted) return;
        this.init();
        this.profit();
    }
}

const soundFX = new SoundFX();
