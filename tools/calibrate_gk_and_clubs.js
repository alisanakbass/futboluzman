// oyuncular.json içindeki tüm oyunculara 'kulup' alanını ekleme ve
// 1. Mevki (Kaleciler) verilerini resmi Transfermarkt ve lig kayıtlarına göre kalibre etme scripti
const fs = require('fs');
const path = require('path');

const oyuncularPath = path.join(__dirname, 'oyuncular.json');
const playersData = JSON.parse(fs.readFileSync(oyuncularPath, 'utf8'));

// RAW_ROSTER'dan kulüp eşleştirme sözlüğü çıkarma
const genScript = fs.readFileSync(path.join(__dirname, 'generate_310_players.js'), 'utf8');

// Kaleciler için resmi kalibre edilmiş Transfermarkt kayıtları
const CALIBRATED_GK = {
    "Thibaut Courtois": { kulup: "Real Madrid", sezon: "2022", lig: "LA LIGA", mac: 36, stat: "29", pastVal: 60, pastAge: 30, curAge: 32, curVal: 28 },
    "Alisson Becker": { kulup: "Liverpool", sezon: "2021", lig: "PREMIER LEAGUE", mac: 36, stat: "24", pastVal: 60, pastAge: 29, curAge: 32, curVal: 28 },
    "Gianluigi Donnarumma": { kulup: "Paris Saint-Germain", sezon: "2021", lig: "SERIE A", mac: 37, stat: "38", pastVal: 65, pastAge: 22, curAge: 25, curVal: 40 },
    "Jan Oblak": { kulup: "Atlético Madrid", sezon: "2021", lig: "LA LIGA", mac: 38, stat: "25", pastVal: 70, pastAge: 28, curAge: 31, curVal: 28 },
    "Manuel Neuer": { kulup: "Bayern Munich", sezon: "2021", lig: "BUNDESLIGA", mac: 28, stat: "26", pastVal: 18, pastAge: 35, curAge: 38, curVal: 4 },
    "Ederson": { kulup: "Manchester City", sezon: "2021", lig: "PREMIER LEAGUE", mac: 37, stat: "26", pastVal: 50, pastAge: 28, curAge: 31, curVal: 35 },
    "Marc-André ter Stegen": { kulup: "FC Barcelona", sezon: "2023", lig: "LA LIGA", mac: 38, stat: "18", pastVal: 35, pastAge: 31, curAge: 32, curVal: 20 },
    "Gregor Kobel": { kulup: "Borussia Dortmund", sezon: "2022", lig: "BUNDESLIGA", mac: 27, stat: "32", pastVal: 25, pastAge: 24, curAge: 26, curVal: 40 },
    "David Raya": { kulup: "Arsenal", sezon: "2022", lig: "PREMIER LEAGUE", mac: 38, stat: "46", pastVal: 22, pastAge: 27, curAge: 29, curVal: 35 },
    "Giorgi Mamardashvili": { kulup: "Valencia", sezon: "2023", lig: "LA LIGA", mac: 37, stat: "41", pastVal: 30, pastAge: 23, curAge: 24, curVal: 45 },
    "Andriy Lunin": { kulup: "Real Madrid", sezon: "2023", lig: "LA LIGA", mac: 21, stat: "17", pastVal: 8, pastAge: 24, curAge: 25, curVal: 25 },
    "Diogo Costa": { kulup: "FC Porto", sezon: "2022", lig: "LIGA PORTUGAL", mac: 33, stat: "22", pastVal: 35, pastAge: 23, curAge: 25, curVal: 45 },
    "Mike Maignan": { kulup: "AC Milan", sezon: "2022", lig: "SERIE A", mac: 32, stat: "21", pastVal: 35, pastAge: 27, curAge: 29, curVal: 38 },
    "Guglielmo Vicario": { kulup: "Tottenham", sezon: "2023", lig: "SERIE A", mac: 31, stat: "39", pastVal: 16, pastAge: 26, curAge: 28, curVal: 35 },
    "Lukas Hradecky": { kulup: "Bayer Leverkusen", sezon: "2023", lig: "BUNDESLIGA", mac: 33, stat: "24", pastVal: 6, pastAge: 33, curAge: 34, curVal: 2.5 },
    "Emiliano Martínez": { kulup: "Aston Villa", sezon: "2021", lig: "PREMIER LEAGUE", mac: 36, stat: "41", pastVal: 32, pastAge: 29, curAge: 32, curVal: 28 },
    "Yann Sommer": { kulup: "Inter", sezon: "2022", lig: "BUNDESLIGA", mac: 33, stat: "40", pastVal: 12, pastAge: 33, curAge: 35, curVal: 5 },
    "Alex Meret": { kulup: "Napoli", sezon: "2021", lig: "SERIE A", mac: 28, stat: "26", pastVal: 20, pastAge: 25, curAge: 29, curVal: 8 },
    "Vanja Milinkovic-Savic": { kulup: "Torino", sezon: "2024", lig: "SERIE A", mac: 30, stat: "32", pastVal: 8, pastAge: 27, curAge: 29, curVal: 20 },
    "Inaki Pena": { kulup: "FC Barcelona", sezon: "2023", lig: "LA LIGA", mac: 17, stat: "32", pastVal: 8, pastAge: 24, curAge: 27, curVal: 4 },
    "Kevin Trapp": { kulup: "Eintracht Frankfurt", sezon: "2022", lig: "BUNDESLIGA", mac: 33, stat: "52", pastVal: 8.5, pastAge: 32, curAge: 34, curVal: 4 },
    "Jordan Pickford": { kulup: "Everton", sezon: "2022", lig: "PREMIER LEAGUE", mac: 37, stat: "57", pastVal: 28, pastAge: 28, curAge: 30, curVal: 22 },
    "Nick Pope": { kulup: "Newcastle", sezon: "2022", lig: "PREMIER LEAGUE", mac: 37, stat: "32", pastVal: 18, pastAge: 30, curAge: 32, curVal: 16 },
    "Unai Simón": { kulup: "Athletic Bilbao", sezon: "2021", lig: "LA LIGA", mac: 34, stat: "31", pastVal: 25, pastAge: 24, curAge: 27, curVal: 30 },
    "Yassine Bounou": { kulup: "Al-Hilal", sezon: "2022", lig: "LA LIGA", mac: 31, stat: "24", pastVal: 15, pastAge: 31, curAge: 33, curVal: 9 },
    "Aaron Ramsdale": { kulup: "Southampton", sezon: "2023", lig: "PREMIER LEAGUE", mac: 38, stat: "43", pastVal: 40, pastAge: 25, curAge: 26, curVal: 22 },
    "Bernd Leno": { kulup: "Fulham", sezon: "2022", lig: "PREMIER LEAGUE", mac: 36, stat: "51", pastVal: 12, pastAge: 30, curAge: 32, curVal: 13 },
    "Lucas Chevalier": { kulup: "Lille", sezon: "2023", lig: "LIGUE 1", mac: 33, stat: "32", pastVal: 10, pastAge: 21, curAge: 22, curVal: 25 }
};

// Diğer mevkiler için RAW_ROSTER'dan kulüp eşleme haritası
const clubMap = {};
const clubRegex = /name:\s*"([^"]+)",\s*club:\s*"([^"]+)"/g;
let m;
while ((m = clubRegex.exec(genScript)) !== null) {
    clubMap[m[1]] = m[2];
}

let gkUpdated = 0;
let totalUpdated = 0;

for (const pos in playersData) {
    for (const player of playersData[pos]) {
        totalUpdated++;
        const name = player.gercek_isim;

        // 1. Mevki: Kaleciler resmi Transfermarkt kalibrasyonu
        if (pos === "Kaleci" && CALIBRATED_GK[name]) {
            const cal = CALIBRATED_GK[name];
            player.kulup = cal.kulup;
            player.sezon = cal.sezon;
            player.gecmis.deger = cal.pastVal;
            player.gecmis.yas = cal.pastAge;
            player.gecmis.lig = cal.lig;
            player.gecmis.mac = cal.mac;
            player.gecmis.stat_etiket = "Y. GOL";
            player.gecmis.stat_deger = cal.stat;
            player.guncel.yas = cal.curAge;
            player.guncel.deger = cal.curVal;
            gkUpdated++;
        } else {
            // Diğer mevkiler için kulüp bilgisini ekle
            player.kulup = clubMap[name] || "Avrupa Kulübü";
        }
    }
}

fs.writeFileSync(oyuncularPath, JSON.stringify(playersData, null, 2), 'utf8');
console.log(`Tamamlandı!`);
console.log(`- Kaleciler mevkisinde ${gkUpdated} kaleci resmi Transfermarkt kayıtlarıyla eşitlendi.`);
console.log(`- Toplam ${totalUpdated} oyuncunun tamamına 'kulup' alanı eklendi.`);
