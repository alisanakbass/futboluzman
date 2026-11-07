// ===================================================================
// SCAUDE SCOUT - OYUN SABİTLERİ VE SAHA KOORDİNATLARI
// ===================================================================

const POSITIONS = [
    "Kaleci",
    "Sağ Bek",
    "1. Stoper",
    "2. Stoper",
    "Sol Bek",
    "Ön Libero",
    "Merkez Orta Saha",
    "Ofansif Orta Saha",
    "Sağ Kanat",
    "Sol Kanat",
    "Santrafor"
];

const POS_BADGES = {
    "Kaleci": "KL",
    "Sağ Bek": "SB",
    "1. Stoper": "STP",
    "2. Stoper": "STP",
    "Sol Bek": "SLB",
    "Ön Libero": "ÖNL",
    "Merkez Orta Saha": "MOS",
    "Ofansif Orta Saha": "OOS",
    "Sağ Kanat": "SK",
    "Sol Kanat": "SLK",
    "Santrafor": "SNT"
};

const PITCH_COORDS = {
    "Kaleci": { top: 88, left: 50, label: "KL" },
    "Sağ Bek": { top: 72, left: 84, label: "SB" },
    "1. Stoper": { top: 76, left: 62, label: "STP" },
    "2. Stoper": { top: 76, left: 38, label: "STP" },
    "Sol Bek": { top: 72, left: 16, label: "SLB" },
    "Ön Libero": { top: 58, left: 50, label: "ÖNL" },
    "Merkez Orta Saha": { top: 45, left: 32, label: "MOS" },
    "Ofansif Orta Saha": { top: 40, left: 68, label: "OOS" },
    "Sağ Kanat": { top: 22, left: 84, label: "SK" },
    "Sol Kanat": { top: 22, left: 16, label: "SLK" },
    "Santrafor": { top: 15, left: 50, label: "SNT" }
};
