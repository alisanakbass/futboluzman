// oyuncular.json içindeki oyuncuların fotoğraflarını Wikipedia API üzerinden yüksek kaliteli resim URL'leri ile güncelleme
const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, 'oyuncular.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Wikipedia adı eşleştirme istisnaları
const NAME_OVERRIDES = {
    "Vinicius Junior": "Vin%C3%ADcius_J%C3%BAnior",
    "Ederson": "Ederson_(footballer,_born_1993)",
    "Kylian Mbappé": "Kylian_Mbapp%C3%A9",
    "Cristiano Ronaldo": "Cristiano_Ronaldo",
    "Lionel Messi": "Lionel_Messi",
    "Gabriel Magalhães": "Gabriel_Magalh%C3%A3es",
    "Kim Min-jae": "Kim_Min-jae_(footballer)",
    "Fernando Muslera": "Fernando_Muslera",
    "Dominik Livakovic": "Dominik_Livakovi%C3%A7",
    "Mert Günok": "Mert_G%C3%BCnok",
    "Uğurcan Çakır": "U%C4%9Furcan_%C3%87ak%C4%B1r",
    "Ferdi Kadıoğlu": "Ferdi_Kad%C4%B1o%C4%9Flu",
    "Arda Güler": "Arda_G%C3%BCler",
    "Barış Alper Yılmaz": "Bar%C4%B1%C5%9F_Alper_Y%C4%B1lmaz",
    "Semih Kılıçsoy": "Semih_K%C4%B1l%C4%B1%C3%A7soy",
    "Kerem Aktürkoğlu": "Kerem_Akt%C3%BCrko%C4%9Flu",
    "Mauro Icardi": "Mauro_Icardi",
    "Victor Osimhen": "Victor_Osimhen",
    "Fred": "Fred_(footballer,_born_1993)",
    "Rodri": "Rodri_(footballer)",
    "Pedro Porro": "Pedro_Porro"
};

function fetchPlayerImage(name) {
    return new Promise((resolve) => {
        const queryName = NAME_OVERRIDES[name] || encodeURIComponent(name.replace(/ /g, '_'));
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${queryName}`;

        https.get(url, { headers: { 'User-Agent': 'ScoutGameFifa/1.0 (contact@example.com)' } }, (res) => {
            if (res.statusCode !== 200) {
                return resolve(null);
            }
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.thumbnail && json.thumbnail.source) {
                        resolve(json.thumbnail.source);
                    } else if (json.originalimage && json.originalimage.source) {
                        resolve(json.originalimage.source);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function run() {
    console.log('Oyuncu fotoğrafları çekiliyor...');
    let total = 0;
    let found = 0;

    for (const position in data) {
        for (const player of data[position]) {
            total++;
            const imgUrl = await fetchPlayerImage(player.gercek_isim);
            if (imgUrl) {
                player.foto_url = imgUrl;
                found++;
                console.log(`[${found}/${total}] Bulundu: ${player.gercek_isim}`);
            } else {
                // Eğer wikipedia'da bulunamazsa şık bir Unsplash / Avatar servisi URL'si
                player.foto_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.gercek_isim)}&background=0f172a&color=00ff87&size=256&bold=true`;
                console.log(`[-] Avatar atandı: ${player.gercek_isim}`);
            }
            // Küçük bekleme (rate limit önlemi)
            await new Promise(r => setTimeout(r, 60));
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Bitti! Toplam ${total} oyuncudan ${found} tanesinin gerçek Wikipedia görseli bağlandı.`);
}

run();
