// 312 Elit oyuncunun eksik fotoğraflarını Wikipedia & Wikimedia API'leri ile tamamlayıcı script
const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, 'oyuncular.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function fetchJson(url) {
    return new Promise(resolve => {
        https.get(url, { headers: { 'User-Agent': 'ScoutAppPlayerDataset/2.0 (education@scoutgame.internal)' } }, res => {
            if (res.statusCode !== 200) return resolve(null);
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(d));
                } catch(e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

// 1. Yol: Wikipedia Sayfa Arama ile Thumbnail Bulma
async function searchPageThumbnail(name) {
    const q = encodeURIComponent(name + ' footballer');
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=1&prop=pageimages&pithumbsize=330&format=json`;
    const j = await fetchJson(url);
    if (!j || !j.query || !j.query.pages) return null;
    const pages = j.query.pages;
    const pId = Object.keys(pages)[0];
    return pages[pId]?.thumbnail?.source || null;
}

// 2. Yol: Wikimedia Dosya Araması ile Görsel Bulma
async function searchCommonsImage(name) {
    const q = encodeURIComponent(name);
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=330&format=json`;
    const j = await fetchJson(url);
    if (!j || !j.query || !j.query.pages) return null;
    const pages = j.query.pages;
    const pId = Object.keys(pages)[0];
    const info = pages[pId]?.imageinfo?.[0];
    return info?.thumburl || info?.url || null;
}

async function main() {
    console.log('Eksik fotoğraflar taranıyor ve güncelleniyor...');
    let fixed = 0;
    let totalMissing = 0;

    for (const pos in data) {
        for (const player of data[pos]) {
            if (!player.foto_url || player.foto_url.includes('ui-avatars')) {
                totalMissing++;
                let photo = await searchPageThumbnail(player.gercek_isim);
                if (!photo) {
                    photo = await searchCommonsImage(player.gercek_isim);
                }

                if (photo) {
                    player.foto_url = photo;
                    fixed++;
                    console.log(`[+] Fotoğraf Bağlandı (${fixed}): ${player.gercek_isim}`);
                } else {
                    console.log(`[-] Bulunamadı: ${player.gercek_isim}`);
                }

                // API nezaket gecikmesi
                await new Promise(r => setTimeout(r, 65));
            }
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`====================================================`);
    console.log(`Tamamlandı! Eksik olan ${totalMissing} oyuncudan ${fixed} tanesine gerçek fotoğraf bağlandı.`);
    console.log(`====================================================`);
}

main();
