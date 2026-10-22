// oyuncular.json verisetini fotoğraftaki birebir resmi lig ve Transfermarkt formatına dönüştürme
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'oyuncular.json');
const current = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

// Fotoğraftaki 4 kaleci ve diğer yıldızların resmi geçmiş sezon & güncel kayıtları
const EXACT_PLAYERS = {
    "Vanja Milinkovic-Savic": {
        sezon: "2024",
        gecmis: { deger: 8, yas: 27, lig: "SERIE A", mac: 30, stat_etiket: "Y. GOL", stat_deger: "32" },
        guncel: { yas: 29, deger: 20 },
        foto_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Vanja_Milinkovi%C4%87-Savi%C4%87_%28cropped%29.jpg/330px-Vanja_Milinkovi%C4%87-Savi%C4%87_%28cropped%29.jpg"
    },
    "Alex Meret": {
        sezon: "2021",
        gecmis: { deger: 20, yas: 25, lig: "SERIE A", mac: 28, stat_etiket: "Y. GOL", stat_deger: "26" },
        guncel: { yas: 29, deger: 8 },
        foto_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Alex_Meret_Napoli_2023.jpg/330px-Alex_Meret_Napoli_2023.jpg"
    },
    "Giorgi Mamardashvili": {
        sezon: "2023",
        gecmis: { deger: 20, yas: 21, lig: "LA LIGA", mac: 42, stat_etiket: "Y. GOL", stat_deger: "49" },
        guncel: { yas: 25, deger: 28 },
        foto_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Giorgi_Mamardashvili_2024.jpg/330px-Giorgi_Mamardashvili_2024.jpg"
    },
    "Inaki Pena": {
        sezon: "2023",
        gecmis: { deger: 8, yas: 24, lig: "LA LIGA", mac: 17, stat_etiket: "Y. GOL", stat_deger: "32" },
        guncel: { yas: 27, deger: 4 },
        foto_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/I%C3%B1aki_Pe%C3%B1a_2023.jpg/330px-I%C3%B1aki_Pe%C3%B1a_2023.jpg"
    }
};

const updatedData = {};

for (const position in current) {
    updatedData[position] = current[position].map((player, idx) => {
        const name = player.gercek_isim;

        // Fotoğraftaki birebir kaleciler varsa doğrudan ekle
        if (EXACT_PLAYERS[name]) {
            return {
                id: player.id,
                gercek_isim: name,
                sezon: EXACT_PLAYERS[name].sezon,
                gecmis: EXACT_PLAYERS[name].gecmis,
                guncel: EXACT_PLAYERS[name].guncel,
                foto_url: EXACT_PLAYERS[name].foto_url
            };
        }

        const isGK = position === "Kaleci";
        const currentAge = player.ipucu ? player.ipucu.yas : 27;
        const currentVal = player.guncel_deger || 25;
        const league = (player.ipucu && player.ipucu.lig) ? player.ipucu.lig.toUpperCase() : "PREMIER LEAGUE";
        const matches = (player.ipucu && player.ipucu.mac) ? player.ipucu.mac : 32;

        // Geçmiş sezon yılı (2021, 2022, 2023 veya 2024)
        const years = ["2021", "2022", "2023", "2024"];
        const seasonYear = years[idx % years.length];
        const yearDiff = 2025 - parseInt(seasonYear);
        const pastAge = Math.max(18, currentAge - yearDiff);

        // Kâr / Zarar kurgusu: 
        // Bazı oyuncular geçmişte ucuzdu değer kazandı (Kelepir),
        // Bazıları geçmişte pahalıydı değeri düştü (Fiyasko/Tuzak).
        let pastVal = currentVal;
        const varianceType = idx % 4; // 0: Kelepir, 1: Tuzak, 2: Hafif Kâr, 3: Hafif Zarar

        if (varianceType === 0) {
            // Büyük Kâr (+8M ile +35M)
            const gain = 8 + (idx * 3) % 25;
            pastVal = Math.max(2, currentVal - gain);
        } else if (varianceType === 1) {
            // Büyük Zarar (-6M ile -30M)
            const loss = 6 + (idx * 2) % 22;
            pastVal = currentVal + loss;
        } else if (varianceType === 2) {
            // Küçük Kâr (+2M ile +6M)
            pastVal = Math.max(1, currentVal - (2 + (idx % 4)));
        } else {
            // Küçük Zarar (-2M ile -5M)
            pastVal = currentVal + (2 + (idx % 4));
        }

        pastVal = Math.round(pastVal * 10) / 10;

        let statEtiket = isGK ? "Y. GOL" : "GOL / ASİST";
        let statDeger = "";

        if (isGK) {
            statDeger = player.ipucu && player.ipucu.stat ? player.ipucu.stat.replace(/[^0-9]/g, '') : "28";
        } else {
            statDeger = player.ipucu && player.ipucu.stat ? player.ipucu.stat : "12 Gol / 7 Asist";
        }

        return {
            id: player.id,
            gercek_isim: name,
            sezon: seasonYear,
            gecmis: {
                deger: pastVal,
                yas: pastAge,
                lig: league,
                mac: matches,
                stat_etiket: statEtiket,
                stat_deger: statDeger
            },
            guncel: {
                yas: currentAge,
                deger: currentVal
            },
            foto_url: player.foto_url
        };
    });
}

// Kalecilerin başına fotoğraftaki 4 kaleciyi ekleyelim/garanti edelim
const gkList = updatedData["Kaleci"];
Object.keys(EXACT_PLAYERS).forEach((exactName, i) => {
    const existingIndex = gkList.findIndex(p => p.gercek_isim.toLowerCase().includes(exactName.toLowerCase()));
    const exactObj = {
        id: 100 + i + 1,
        gercek_isim: exactName,
        sezon: EXACT_PLAYERS[exactName].sezon,
        gecmis: EXACT_PLAYERS[exactName].gecmis,
        guncel: EXACT_PLAYERS[exactName].guncel,
        foto_url: EXACT_PLAYERS[exactName].foto_url
    };
    if (existingIndex !== -1) {
        gkList[existingIndex] = exactObj;
    } else {
        gkList.unshift(exactObj);
    }
});

fs.writeFileSync(targetPath, JSON.stringify(updatedData, null, 2), 'utf8');
console.log('oyuncular.json başarıyla yeni fotoğraf formatına dönüştürüldü!');
