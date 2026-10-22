const fs = require('fs');
const css = fs.readFileSync('style.css', 'utf8');
const lines = css.split(/\r?\n/);
console.log('Total lines in style.css:', lines.length);

// 1. Base (Variables, Reset, Menu, Header, Lobby): lines 0 to 325
const baseLines = lines.slice(0, 325);

// 2. Cards (Scoreboard, Action Banner, Cards Arena, EA FC Component, Floating Bar): lines 325 to 917
const cardsLines = lines.slice(325, 917);

// 3. Pitch (Pitch Section & Pitch Modal Box & Nodes): lines 917 to 1089 and 1371 to 1414
const pitchLines = [...lines.slice(917, 1089), ...lines.slice(1371, 1414)];

// 4. Modals (Host, Join, Local, Coin, Winner, Confirm, Notice, Block): lines 1089 to 1371 and 1713 to end
const modalsLines = [...lines.slice(1089, 1371), ...lines.slice(1713)];

// 5. Responsive (Tablets, Mobile Portrait, Mobile Landscape): lines 1414 to 1713
const responsiveLines = lines.slice(1414, 1713);

fs.writeFileSync('css/base.css', baseLines.join('\n'));
fs.writeFileSync('css/cards.css', cardsLines.join('\n'));
fs.writeFileSync('css/pitch.css', pitchLines.join('\n'));
fs.writeFileSync('css/modals.css', modalsLines.join('\n'));
fs.writeFileSync('css/responsive.css', responsiveLines.join('\n'));

console.log('Successfully written:');
console.log(' - css/base.css:', baseLines.length, 'lines');
console.log(' - css/cards.css:', cardsLines.length, 'lines');
console.log(' - css/pitch.css:', pitchLines.length, 'lines');
console.log(' - css/modals.css:', modalsLines.length, 'lines');
console.log(' - css/responsive.css:', responsiveLines.length, 'lines');
