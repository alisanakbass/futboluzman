// 310 Seçkin Avrupa Yıldızından (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) oluşan dev veriseti üretici
const fs = require('fs');
const https = require('https');
const path = require('path');

const RAW_ROSTER = {
    "Kaleci": [
        { name: "Manuel Neuer", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 38, curVal: 4, pastSeason: "2021", pastAge: 35, pastVal: 18, pastMac: 28, stat: "26" },
        { name: "Thibaut Courtois", club: "Real Madrid", lig: "LA LIGA", curAge: 32, curVal: 28, pastSeason: "2022", pastAge: 30, pastVal: 60, pastMac: 36, stat: "29" },
        { name: "Alisson Becker", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 32, curVal: 28, pastSeason: "2021", pastAge: 29, pastVal: 60, pastMac: 36, stat: "24" },
        { name: "Ederson", club: "Man City", lig: "PREMIER LEAGUE", curAge: 31, curVal: 35, pastSeason: "2021", pastAge: 28, pastVal: 50, pastMac: 37, stat: "26" },
        { name: "Gianluigi Donnarumma", club: "PSG", lig: "LIGUE 1", curAge: 25, curVal: 40, pastSeason: "2021", pastAge: 22, pastVal: 65, pastMac: 37, stat: "38" },
        { name: "Jan Oblak", club: "Atletico Madrid", lig: "LA LIGA", curAge: 31, curVal: 28, pastSeason: "2021", pastAge: 28, pastVal: 70, pastMac: 38, stat: "25" },
        { name: "Marc-André ter Stegen", club: "Barcelona", lig: "LA LIGA", curAge: 32, curVal: 20, pastSeason: "2023", pastAge: 31, pastVal: 35, pastMac: 38, stat: "18" },
        { name: "David Raya", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 29, curVal: 35, pastSeason: "2022", pastAge: 27, pastVal: 22, pastMac: 38, stat: "46" },
        { name: "Gregor Kobel", club: "Dortmund", lig: "BUNDESLIGA", curAge: 26, curVal: 40, pastSeason: "2022", pastAge: 24, pastVal: 25, pastMac: 27, stat: "32" },
        { name: "Mike Maignan", club: "Milan", lig: "SERIE A", curAge: 29, curVal: 38, pastSeason: "2022", pastAge: 27, pastVal: 35, pastMac: 32, stat: "21" },
        { name: "Emiliano Martínez", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 32, curVal: 28, pastSeason: "2021", pastAge: 29, pastVal: 32, pastMac: 36, stat: "41" },
        { name: "Yann Sommer", club: "Inter", lig: "SERIE A", curAge: 35, curVal: 5, pastSeason: "2022", pastAge: 33, pastVal: 12, pastMac: 33, stat: "40" },
        { name: "Guglielmo Vicario", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 28, curVal: 35, pastSeason: "2023", pastAge: 26, pastVal: 16, pastMac: 31, stat: "39" },
        { name: "Giorgi Mamardashvili", club: "Valencia", lig: "LA LIGA", curAge: 25, curVal: 28, pastSeason: "2023", pastAge: 21, pastVal: 20, pastMac: 42, stat: "49" },
        { name: "Alex Meret", club: "Napoli", lig: "SERIE A", curAge: 29, curVal: 8, pastSeason: "2021", pastAge: 25, pastVal: 20, pastMac: 28, stat: "26" },
        { name: "Vanja Milinkovic-Savic", club: "Torino", lig: "SERIE A", curAge: 29, curVal: 20, pastSeason: "2024", pastAge: 27, pastVal: 8, pastMac: 30, stat: "32" },
        { name: "Inaki Pena", club: "Barcelona", lig: "LA LIGA", curAge: 27, curVal: 4, pastSeason: "2023", pastAge: 24, pastVal: 8, pastMac: 17, stat: "32" },
        { name: "Lukas Hradecky", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 34, curVal: 2.5, pastSeason: "2023", pastAge: 33, pastVal: 6, pastMac: 33, stat: "24" },
        { name: "Kevin Trapp", club: "Frankfurt", lig: "BUNDESLIGA", curAge: 34, curVal: 4, pastSeason: "2022", pastAge: 32, pastVal: 8.5, pastMac: 33, stat: "52" },
        { name: "Jordan Pickford", club: "Everton", lig: "PREMIER LEAGUE", curAge: 30, curVal: 22, pastSeason: "2022", pastAge: 28, pastVal: 28, pastMac: 37, stat: "57" },
        { name: "Andriy Lunin", club: "Real Madrid", lig: "LA LIGA", curAge: 25, curVal: 25, pastSeason: "2023", pastAge: 24, pastVal: 8, pastMac: 21, stat: "17" },
        { name: "Nick Pope", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 32, curVal: 16, pastSeason: "2022", pastAge: 30, pastVal: 18, pastMac: 37, stat: "32" },
        { name: "Unai Simón", club: "Athletic Bilbao", lig: "LA LIGA", curAge: 27, curVal: 30, pastSeason: "2021", pastAge: 24, pastVal: 25, pastMac: 34, stat: "31" },
        { name: "Yassine Bounou", club: "Al-Hilal", lig: "SAUDI PRO LEAGUE", curAge: 33, curVal: 9, pastSeason: "2022", pastAge: 31, pastVal: 15, pastMac: 31, stat: "24" },
        { name: "Aaron Ramsdale", club: "Southampton", lig: "PREMIER LEAGUE", curAge: 26, curVal: 22, pastSeason: "2023", pastAge: 25, pastVal: 40, pastMac: 38, stat: "43" },
        { name: "Bernd Leno", club: "Fulham", lig: "PREMIER LEAGUE", curAge: 32, curVal: 13, pastSeason: "2022", pastAge: 30, pastVal: 12, pastMac: 36, stat: "51" },
        { name: "Lucas Chevalier", club: "Lille", lig: "LIGUE 1", curAge: 22, curVal: 25, pastSeason: "2023", pastAge: 21, pastVal: 10, pastMac: 33, stat: "32" },
        { name: "Diogo Costa", club: "Porto", lig: "LIGA PORTUGAL", curAge: 25, curVal: 45, pastSeason: "2022", pastAge: 23, pastVal: 35, pastMac: 33, stat: "22" }
    ],
    "Sağ Bek": [
        { name: "Trent Alexander-Arnold", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 26, curVal: 70, pastSeason: "2022", pastAge: 24, pastVal: 80, pastMac: 37, stat: "2 Gol / 9 Asist" },
        { name: "Achraf Hakimi", club: "PSG", lig: "LIGUE 1", curAge: 25, curVal: 60, pastSeason: "2021", pastAge: 22, pastVal: 70, pastMac: 32, stat: "4 Gol / 6 Asist" },
        { name: "Dani Carvajal", club: "Real Madrid", lig: "LA LIGA", curAge: 32, curVal: 12, pastSeason: "2023", pastAge: 31, pastVal: 12, pastMac: 28, stat: "4 Gol / 4 Asist" },
        { name: "Jules Koundé", club: "Barcelona", lig: "LA LIGA", curAge: 25, curVal: 55, pastSeason: "2022", pastAge: 23, pastVal: 60, pastMac: 29, stat: "1 Gol / 3 Asist" },
        { name: "Kyle Walker", club: "Man City", lig: "PREMIER LEAGUE", curAge: 34, curVal: 10, pastSeason: "2021", pastAge: 31, pastVal: 25, pastMac: 31, stat: "1 Gol / 2 Asist" },
        { name: "Jeremie Frimpong", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 23, curVal: 50, pastSeason: "2023", pastAge: 22, pastVal: 35, pastMac: 31, stat: "9 Gol / 9 Asist" },
        { name: "Reece James", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 24, curVal: 35, pastSeason: "2022", pastAge: 22, pastVal: 70, pastMac: 26, stat: "5 Gol / 9 Asist" },
        { name: "Ben White", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 27, curVal: 55, pastSeason: "2022", pastAge: 25, pastVal: 45, pastMac: 38, stat: "2 Gol / 5 Asist" },
        { name: "Pedro Porro", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 25, curVal: 45, pastSeason: "2022", pastAge: 23, pastVal: 25, pastMac: 29, stat: "3 Gol / 7 Asist" },
        { name: "Giovanni Di Lorenzo", club: "Napoli", lig: "SERIE A", curAge: 31, curVal: 15, pastSeason: "2023", pastAge: 29, pastVal: 25, pastMac: 37, stat: "3 Gol / 4 Asist" },
        { name: "Denzel Dumfries", club: "Inter", lig: "SERIE A", curAge: 28, curVal: 24, pastSeason: "2022", pastAge: 26, pastVal: 28, pastMac: 34, stat: "4 Gol / 5 Asist" },
        { name: "Josip Stanišić", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 24, curVal: 28, pastSeason: "2023", pastAge: 23, pastVal: 12, pastMac: 20, stat: "3 Gol / 4 Asist" },
        { name: "Sacha Boey", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 24, curVal: 18, pastSeason: "2023", pastAge: 23, pastVal: 16, pastMac: 31, stat: "1 Gol / 4 Asist" },
        { name: "Kieran Trippier", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 34, curVal: 10, pastSeason: "2023", pastAge: 32, pastVal: 15, pastMac: 38, stat: "1 Gol / 7 Asist" },
        { name: "Malo Gusto", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 21, curVal: 35, pastSeason: "2023", pastAge: 20, pastVal: 25, pastMac: 27, stat: "0 Gol / 6 Asist" },
        { name: "Noussair Mazraoui", club: "Man United", lig: "PREMIER LEAGUE", curAge: 26, curVal: 30, pastSeason: "2022", pastAge: 24, pastVal: 28, pastMac: 19, stat: "0 Gol / 3 Asist" },
        { name: "Diogo Dalot", club: "Man United", lig: "PREMIER LEAGUE", curAge: 25, curVal: 40, pastSeason: "2022", pastAge: 23, pastVal: 32, pastMac: 32, stat: "1 Gol / 2 Asist" },
        { name: "Nahuel Molina", club: "Atletico Madrid", lig: "LA LIGA", curAge: 26, curVal: 28, pastSeason: "2023", pastAge: 25, pastVal: 35, pastMac: 33, stat: "4 Gol / 2 Asist" },
        { name: "Lutsharel Geertruida", club: "Leipzig", lig: "BUNDESLIGA", curAge: 24, curVal: 32, pastSeason: "2023", pastAge: 23, pastVal: 25, pastMac: 34, stat: "8 Gol / 5 Asist" },
        { name: "Benjamin Henrichs", club: "Leipzig", lig: "BUNDESLIGA", curAge: 27, curVal: 20, pastSeason: "2023", pastAge: 26, pastVal: 18, pastMac: 33, stat: "2 Gol / 5 Asist" },
        { name: "Conor Bradley", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 21, curVal: 18, pastSeason: "2023", pastAge: 20, pastVal: 2, pastMac: 11, stat: "1 Gol / 3 Asist" },
        { name: "Tino Livramento", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 21, curVal: 35, pastSeason: "2023", pastAge: 20, pastVal: 25, pastMac: 26, stat: "1 Gol / 0 Asist" },
        { name: "Vanderson", club: "Monaco", lig: "LIGUE 1", curAge: 23, curVal: 20, pastSeason: "2023", pastAge: 22, pastVal: 18, pastMac: 20, stat: "3 Gol / 1 Asist" },
        { name: "Wilfried Singo", club: "Monaco", lig: "LIGUE 1", curAge: 23, curVal: 25, pastSeason: "2023", pastAge: 22, pastVal: 12, pastMac: 25, stat: "1 Gol / 1 Asist" },
        { name: "Stefan Posch", club: "Bologna", lig: "SERIE A", curAge: 27, curVal: 14, pastSeason: "2023", pastAge: 26, pastVal: 10, pastMac: 31, stat: "6 Gol / 2 Asist" },
        { name: "Jonathan Clauss", club: "Nice", lig: "LIGUE 1", curAge: 32, curVal: 10, pastSeason: "2023", pastAge: 31, pastVal: 15, pastMac: 27, stat: "3 Gol / 4 Asist" },
        { name: "Raoul Bellanova", club: "Atalanta", lig: "SERIE A", curAge: 24, curVal: 20, pastSeason: "2023", pastAge: 23, pastVal: 10, pastMac: 37, stat: "1 Gol / 7 Asist" },
        { name: "Ridle Baku", club: "Wolfsburg", lig: "BUNDESLIGA", curAge: 26, curVal: 9, pastSeason: "2021", pastAge: 23, pastVal: 25, pastMac: 34, stat: "3 Gol / 5 Asist" }
    ],
    "1. Stoper": [
        { name: "Virgil van Dijk", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 33, curVal: 30, pastSeason: "2021", pastAge: 30, pastVal: 55, pastMac: 34, stat: "3 Gol / 1 Asist" },
        { name: "Ruben Dias", club: "Man City", lig: "PREMIER LEAGUE", curAge: 27, curVal: 80, pastSeason: "2021", pastAge: 24, pastVal: 75, pastMac: 32, stat: "1 Gol / 1 Asist" },
        { name: "Antonio Rüdiger", club: "Real Madrid", lig: "LA LIGA", curAge: 31, curVal: 25, pastSeason: "2022", pastAge: 29, pastVal: 40, pastMac: 33, stat: "1 Gol / 0 Asist" },
        { name: "William Saliba", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 23, curVal: 80, pastSeason: "2022", pastAge: 21, pastVal: 40, pastMac: 27, stat: "2 Gol / 1 Asist" },
        { name: "Ronald Araújo", club: "Barcelona", lig: "LA LIGA", curAge: 25, curVal: 70, pastSeason: "2022", pastAge: 23, pastVal: 60, pastMac: 22, stat: "0 Gol / 2 Asist" },
        { name: "Jonathan Tah", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 28, curVal: 30, pastSeason: "2023", pastAge: 27, pastVal: 20, pastMac: 31, stat: "4 Gol / 1 Asist" },
        { name: "Dayot Upamecano", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 25, curVal: 45, pastSeason: "2022", pastAge: 23, pastVal: 50, pastMac: 29, stat: "0 Gol / 1 Asist" },
        { name: "Kim Min-jae", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 27, curVal: 45, pastSeason: "2023", pastAge: 26, pastVal: 60, pastMac: 35, stat: "2 Gol / 2 Asist" },
        { name: "Nico Schlotterbeck", club: "Dortmund", lig: "BUNDESLIGA", curAge: 24, curVal: 40, pastSeason: "2022", pastAge: 22, pastVal: 33, pastMac: 28, stat: "4 Gol / 5 Asist" },
        { name: "Edmond Tapsoba", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 25, curVal: 45, pastSeason: "2023", pastAge: 24, pastVal: 30, pastMac: 28, stat: "3 Gol / 1 Asist" },
        { name: "Gleison Bremer", club: "Juventus", lig: "SERIE A", curAge: 27, curVal: 60, pastSeason: "2022", pastAge: 25, pastVal: 35, pastMac: 30, stat: "4 Gol / 1 Asist" },
        { name: "Eder Militão", club: "Real Madrid", lig: "LA LIGA", curAge: 26, curVal: 60, pastSeason: "2022", pastAge: 24, pastVal: 70, pastMac: 33, stat: "5 Gol / 0 Asist" },
        { name: "Marquinhos", club: "PSG", lig: "LIGUE 1", curAge: 30, curVal: 50, pastSeason: "2021", pastAge: 27, pastVal: 75, pastMac: 32, stat: "5 Gol / 0 Asist" },
        { name: "Cristian Romero", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 26, curVal: 65, pastSeason: "2022", pastAge: 24, pastVal: 55, pastMac: 27, stat: "0 Gol / 1 Asist" },
        { name: "Ibrahima Konaté", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 25, curVal: 45, pastSeason: "2022", pastAge: 23, pastVal: 35, pastMac: 18, stat: "0 Gol / 0 Asist" },
        { name: "John Stones", club: "Man City", lig: "PREMIER LEAGUE", curAge: 30, curVal: 38, pastSeason: "2023", pastAge: 29, pastVal: 40, pastMac: 23, stat: "2 Gol / 2 Asist" },
        { name: "Gonçalo Inácio", club: "Sporting", lig: "LIGA PORTUGAL", curAge: 23, curVal: 45, pastSeason: "2023", pastAge: 22, pastVal: 30, pastMac: 32, stat: "1 Gol / 1 Asist" },
        { name: "Giorgio Scalvini", club: "Atalanta", lig: "SERIE A", curAge: 20, curVal: 45, pastSeason: "2023", pastAge: 19, pastVal: 20, pastMac: 33, stat: "2 Gol / 1 Asist" },
        { name: "Alessandro Buongiorno", club: "Napoli", lig: "SERIE A", curAge: 25, curVal: 35, pastSeason: "2023", pastAge: 24, pastVal: 20, pastMac: 29, stat: "3 Gol / 0 Asist" },
        { name: "Piero Hincapié", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 22, curVal: 40, pastSeason: "2023", pastAge: 21, pastVal: 25, pastMac: 26, stat: "1 Gol / 1 Asist" },
        { name: "Castello Lukeba", club: "Leipzig", lig: "BUNDESLIGA", curAge: 21, curVal: 40, pastSeason: "2023", pastAge: 20, pastVal: 20, pastMac: 32, stat: "1 Gol / 0 Asist" },
        { name: "Kevin Danso", club: "Lens", lig: "LIGUE 1", curAge: 26, curVal: 25, pastSeason: "2023", pastAge: 24, pastVal: 16, pastMac: 30, stat: "1 Gol / 0 Asist" },
        { name: "Axel Disasi", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 26, curVal: 35, pastSeason: "2023", pastAge: 25, pastVal: 25, pastMac: 31, stat: "2 Gol / 0 Asist" },
        { name: "Yann Aurel Bisseck", club: "Inter", lig: "SERIE A", curAge: 23, curVal: 25, pastSeason: "2023", pastAge: 22, pastVal: 7, pastMac: 16, stat: "2 Gol / 1 Asist" },
        { name: "Marc Guéhi", club: "Crystal Palace", lig: "PREMIER LEAGUE", curAge: 24, curVal: 45, pastSeason: "2023", pastAge: 23, pastVal: 35, pastMac: 25, stat: "0 Gol / 1 Asist" },
        { name: "Willian Pacho", club: "PSG", lig: "LIGUE 1", curAge: 23, curVal: 40, pastSeason: "2023", pastAge: 22, pastVal: 11, pastMac: 33, stat: "0 Gol / 1 Asist" },
        { name: "Mohamed Simakan", club: "Al-Nassr", lig: "SAUDI PRO LEAGUE", curAge: 24, curVal: 35, pastSeason: "2023", pastAge: 23, pastVal: 28, pastMac: 32, stat: "2 Gol / 1 Asist" },
        { name: "Manuel Akanji", club: "Man City", lig: "PREMIER LEAGUE", curAge: 29, curVal: 45, pastSeason: "2022", pastAge: 27, pastVal: 30, pastMac: 29, stat: "0 Gol / 1 Asist" }
    ],
    "2. Stoper": [
        { name: "Gabriel Magalhães", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 26, curVal: 75, pastSeason: "2022", pastAge: 24, pastVal: 40, pastMac: 38, stat: "3 Gol / 0 Asist" },
        { name: "Alessandro Bastoni", club: "Inter", lig: "SERIE A", curAge: 25, curVal: 70, pastSeason: "2022", pastAge: 23, pastVal: 55, pastMac: 29, stat: "0 Gol / 2 Asist" },
        { name: "Lisandro Martínez", club: "Man United", lig: "PREMIER LEAGUE", curAge: 26, curVal: 45, pastSeason: "2022", pastAge: 24, pastVal: 32, pastMac: 27, stat: "1 Gol / 0 Asist" },
        { name: "Matthijs de Ligt", club: "Man United", lig: "PREMIER LEAGUE", curAge: 25, curVal: 55, pastSeason: "2022", pastAge: 23, pastVal: 75, pastMac: 31, stat: "3 Gol / 1 Asist" },
        { name: "Micky van de Ven", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 23, curVal: 55, pastSeason: "2023", pastAge: 22, pastVal: 30, pastMac: 27, stat: "3 Gol / 0 Asist" },
        { name: "Pau Torres", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 27, curVal: 45, pastSeason: "2022", pastAge: 25, pastVal: 50, pastMac: 34, stat: "0 Gol / 0 Asist" },
        { name: "Mats Hummels", club: "Roma", lig: "SERIE A", curAge: 35, curVal: 5, pastSeason: "2023", pastAge: 34, pastVal: 6, pastMac: 25, stat: "3 Gol / 0 Asist" },
        { name: "David Alaba", club: "Real Madrid", lig: "LA LIGA", curAge: 32, curVal: 15, pastSeason: "2021", pastAge: 29, pastVal: 55, pastMac: 30, stat: "2 Gol / 3 Asist" },
        { name: "Aymeric Laporte", club: "Al-Nassr", lig: "SAUDI PRO LEAGUE", curAge: 30, curVal: 20, pastSeason: "2021", pastAge: 27, pastVal: 45, pastMac: 33, stat: "4 Gol / 0 Asist" },
        { name: "Nathan Aké", club: "Man City", lig: "PREMIER LEAGUE", curAge: 29, curVal: 40, pastSeason: "2022", pastAge: 27, pastVal: 28, pastMac: 26, stat: "1 Gol / 0 Asist" },
        { name: "Sven Botman", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 24, curVal: 45, pastSeason: "2022", pastAge: 22, pastVal: 30, pastMac: 36, stat: "0 Gol / 2 Asist" },
        { name: "Andreas Christensen", club: "Barcelona", lig: "LA LIGA", curAge: 28, curVal: 30, pastSeason: "2022", pastAge: 26, pastVal: 35, pastMac: 23, stat: "1 Gol / 1 Asist" },
        { name: "Jean-Clair Todibo", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 24, curVal: 35, pastSeason: "2023", pastAge: 23, pastVal: 30, pastMac: 30, stat: "0 Gol / 2 Asist" },
        { name: "Mario Hermoso", club: "Roma", lig: "SERIE A", curAge: 29, curVal: 18, pastSeason: "2023", pastAge: 28, pastVal: 20, pastMac: 31, stat: "0 Gol / 1 Asist" },
        { name: "Gianluca Mancini", club: "Roma", lig: "SERIE A", curAge: 28, curVal: 25, pastSeason: "2023", pastAge: 27, pastVal: 18, pastMac: 36, stat: "4 Gol / 1 Asist" },
        { name: "Fikayo Tomori", club: "Milan", lig: "SERIE A", curAge: 26, curVal: 32, pastSeason: "2022", pastAge: 24, pastVal: 45, pastMac: 33, stat: "1 Gol / 0 Asist" },
        { name: "Ousmane Diomande", club: "Sporting", lig: "LIGA PORTUGAL", curAge: 20, curVal: 40, pastSeason: "2023", pastAge: 19, pastVal: 10, pastMac: 26, stat: "2 Gol / 1 Asist" },
        { name: "Riccardo Calafiori", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 22, curVal: 45, pastSeason: "2023", pastAge: 21, pastVal: 5, pastMac: 30, stat: "2 Gol / 5 Asist" },
        { name: "Murillo", club: "Nottingham Forest", lig: "PREMIER LEAGUE", curAge: 22, curVal: 40, pastSeason: "2023", pastAge: 21, pastVal: 12, pastMac: 32, stat: "0 Gol / 2 Asist" },
        { name: "Ezri Konsa", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 26, curVal: 35, pastSeason: "2023", pastAge: 25, pastVal: 22, pastMac: 35, stat: "1 Gol / 0 Asist" },
        { name: "Strahinja Pavlović", club: "Milan", lig: "SERIE A", curAge: 23, curVal: 25, pastSeason: "2023", pastAge: 22, pastVal: 8, pastMac: 26, stat: "2 Gol / 2 Asist" },
        { name: "Willi Orbán", club: "Leipzig", lig: "BUNDESLIGA", curAge: 31, curVal: 10, pastSeason: "2022", pastAge: 29, pastVal: 14, pastMac: 33, stat: "4 Gol / 0 Asist" },
        { name: "Waldemar Anton", club: "Dortmund", lig: "BUNDESLIGA", curAge: 28, curVal: 24, pastSeason: "2023", pastAge: 27, pastVal: 10, pastMac: 33, stat: "0 Gol / 3 Asist" },
        { name: "Marcos Senesi", club: "Bournemouth", lig: "PREMIER LEAGUE", curAge: 27, curVal: 22, pastSeason: "2023", pastAge: 26, pastVal: 14, pastMac: 31, stat: "4 Gol / 5 Asist" },
        { name: "Lewis Dunk", club: "Brighton", lig: "PREMIER LEAGUE", curAge: 32, curVal: 12, pastSeason: "2023", pastAge: 31, pastVal: 16, pastMac: 33, stat: "3 Gol / 0 Asist" },
        { name: "Joachim Andersen", club: "Fulham", lig: "PREMIER LEAGUE", curAge: 28, curVal: 35, pastSeason: "2023", pastAge: 27, pastVal: 28, pastMac: 38, stat: "2 Gol / 2 Asist" },
        { name: "Jannik Vestergaard", club: "Leicester", lig: "PREMIER LEAGUE", curAge: 32, curVal: 3, pastSeason: "2021", pastAge: 29, pastVal: 18, pastMac: 10, stat: "0 Gol / 0 Asist" },
        { name: "Robin Le Normand", club: "Atletico Madrid", lig: "LA LIGA", curAge: 27, curVal: 40, pastSeason: "2023", pastAge: 26, pastVal: 30, pastMac: 32, stat: "2 Gol / 0 Asist" }
    ],
    "Sol Bek": [
        { name: "Alphonso Davies", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 23, curVal: 50, pastSeason: "2021", pastAge: 21, pastVal: 70, pastMac: 22, stat: "0 Gol / 4 Asist" },
        { name: "Theo Hernández", club: "Milan", lig: "SERIE A", curAge: 27, curVal: 60, pastSeason: "2022", pastAge: 25, pastVal: 55, pastMac: 32, stat: "4 Gol / 3 Asist" },
        { name: "Federico Dimarco", club: "Inter", lig: "SERIE A", curAge: 26, curVal: 50, pastSeason: "2022", pastAge: 24, pastVal: 25, pastMac: 33, stat: "4 Gol / 3 Asist" },
        { name: "Andrew Robertson", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 30, curVal: 30, pastSeason: "2021", pastAge: 27, pastVal: 65, pastMac: 29, stat: "3 Gol / 10 Asist" },
        { name: "Marc Cucurella", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 26, curVal: 30, pastSeason: "2022", pastAge: 24, pastVal: 55, pastMac: 24, stat: "0 Gol / 2 Asist" },
        { name: "Alejandro Grimaldo", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 29, curVal: 45, pastSeason: "2023", pastAge: 28, pastVal: 25, pastMac: 33, stat: "10 Gol / 13 Asist" },
        { name: "Ferland Mendy", club: "Real Madrid", lig: "LA LIGA", curAge: 29, curVal: 22, pastSeason: "2021", pastAge: 26, pastVal: 50, pastMac: 22, stat: "2 Gol / 1 Asist" },
        { name: "Destiny Udogie", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 21, curVal: 45, pastSeason: "2023", pastAge: 20, pastVal: 25, pastMac: 28, stat: "2 Gol / 3 Asist" },
        { name: "Nuno Mendes", club: "PSG", lig: "LIGUE 1", curAge: 22, curVal: 55, pastSeason: "2022", pastAge: 20, pastVal: 60, pastMac: 18, stat: "1 Gol / 6 Asist" },
        { name: "David Raum", club: "Leipzig", lig: "BUNDESLIGA", curAge: 26, curVal: 25, pastSeason: "2022", pastAge: 24, pastVal: 26, pastMac: 28, stat: "2 Gol / 2 Asist" },
        { name: "Alejandro Balde", club: "Barcelona", lig: "LA LIGA", curAge: 21, curVal: 40, pastSeason: "2023", pastAge: 19, pastVal: 50, pastMac: 33, stat: "1 Gol / 6 Asist" },
        { name: "Luke Shaw", club: "Man United", lig: "PREMIER LEAGUE", curAge: 29, curVal: 28, pastSeason: "2022", pastAge: 27, pastVal: 35, pastMac: 31, stat: "1 Gol / 2 Asist" },
        { name: "Oleksandr Zinchenko", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 27, curVal: 35, pastSeason: "2022", pastAge: 25, pastVal: 32, pastMac: 27, stat: "1 Gol / 2 Asist" },
        { name: "Rayan Aït-Nouri", club: "Wolves", lig: "PREMIER LEAGUE", curAge: 23, curVal: 35, pastSeason: "2023", pastAge: 22, pastVal: 22, pastMac: 33, stat: "2 Gol / 2 Asist" },
        { name: "Pervis Estupiñán", club: "Brighton", lig: "PREMIER LEAGUE", curAge: 26, curVal: 30, pastSeason: "2023", pastAge: 25, pastVal: 35, pastMac: 19, stat: "2 Gol / 3 Asist" },
        { name: "Lucas Digne", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 31, curVal: 12, pastSeason: "2021", pastAge: 28, pastVal: 30, pastMac: 28, stat: "0 Gol / 4 Asist" },
        { name: "Ian Maatsen", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 22, curVal: 40, pastSeason: "2023", pastAge: 21, pastVal: 12, pastMac: 16, stat: "1 Gol / 2 Asist" },
        { name: "Ramy Bensebaini", club: "Dortmund", lig: "BUNDESLIGA", curAge: 29, curVal: 9, pastSeason: "2022", pastAge: 27, pastVal: 20, pastMac: 28, stat: "6 Gol / 1 Asist" },
        { name: "Miguel Gutiérrez", club: "Girona", lig: "LA LIGA", curAge: 23, curVal: 25, pastSeason: "2023", pastAge: 22, pastVal: 10, pastMac: 35, stat: "2 Gol / 7 Asist" },
        { name: "Milos Kerkez", club: "Bournemouth", lig: "PREMIER LEAGUE", curAge: 20, curVal: 20, pastSeason: "2023", pastAge: 19, pastVal: 15, pastMac: 28, stat: "0 Gol / 1 Asist" },
        { name: "Adrien Truffert", club: "Rennes", lig: "LIGUE 1", curAge: 22, curVal: 18, pastSeason: "2023", pastAge: 21, pastVal: 15, pastMac: 30, stat: "1 Gol / 2 Asist" },
        { name: "Fabiano Parisi", club: "Fiorentina", lig: "SERIE A", curAge: 23, curVal: 10, pastSeason: "2023", pastAge: 22, pastVal: 12, pastMac: 33, stat: "2 Gol / 2 Asist" },
        { name: "José Gayà", club: "Valencia", lig: "LA LIGA", curAge: 29, curVal: 12, pastSeason: "2021", pastAge: 26, pastVal: 35, pastMac: 28, stat: "2 Gol / 4 Asist" },
        { name: "Sergio Reguilón", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 27, curVal: 12, pastSeason: "2021", pastAge: 24, pastVal: 28, pastMac: 25, stat: "2 Gol / 3 Asist" },
        { name: "Kieran Tierney", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 27, curVal: 10, pastSeason: "2021", pastAge: 24, pastVal: 32, pastMac: 22, stat: "1 Gol / 3 Asist" },
        { name: "Emerson Palmieri", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 30, curVal: 12, pastSeason: "2023", pastAge: 29, pastVal: 12, pastMac: 36, stat: "1 Gol / 2 Asist" },
        { name: "Vitaliy Mykolenko", club: "Everton", lig: "PREMIER LEAGUE", curAge: 25, curVal: 28, pastSeason: "2023", pastAge: 24, pastVal: 25, pastMac: 28, stat: "2 Gol / 1 Asist" },
        { name: "Antonee Robinson", club: "Fulham", lig: "PREMIER LEAGUE", curAge: 27, curVal: 25, pastSeason: "2023", pastAge: 26, pastVal: 15, pastMac: 37, stat: "0 Gol / 6 Asist" }
    ],
    "Ön Libero": [
        { name: "Rodri", club: "Man City", lig: "PREMIER LEAGUE", curAge: 28, curVal: 130, pastSeason: "2021", pastAge: 25, pastVal: 70, pastMac: 33, stat: "7 Gol / 2 Asist" },
        { name: "Declan Rice", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 25, curVal: 120, pastSeason: "2022", pastAge: 23, pastVal: 80, pastMac: 37, stat: "4 Gol / 2 Asist" },
        { name: "Aurelien Tchouameni", club: "Real Madrid", lig: "LA LIGA", curAge: 24, curVal: 100, pastSeason: "2022", pastAge: 22, pastVal: 60, pastMac: 35, stat: "3 Gol / 2 Asist" },
        { name: "Eduardo Camavinga", club: "Real Madrid", lig: "LA LIGA", curAge: 21, curVal: 100, pastSeason: "2022", pastAge: 19, pastVal: 55, pastMac: 26, stat: "2 Gol / 1 Asist" },
        { name: "Joshua Kimmich", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 29, curVal: 50, pastSeason: "2021", pastAge: 26, pastVal: 85, pastMac: 28, stat: "3 Gol / 11 Asist" },
        { name: "Granit Xhaka", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 32, curVal: 20, pastSeason: "2023", pastAge: 31, pastVal: 15, pastMac: 33, stat: "3 Gol / 0 Asist" },
        { name: "Casemiro", club: "Man United", lig: "PREMIER LEAGUE", curAge: 32, curVal: 15, pastSeason: "2021", pastAge: 29, pastVal: 70, pastMac: 32, stat: "1 Gol / 3 Asist" },
        { name: "Bruno Guimarães", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 26, curVal: 85, pastSeason: "2022", pastAge: 24, pastVal: 40, pastMac: 17, stat: "5 Gol / 1 Asist" },
        { name: "Moises Caicedo", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 22, curVal: 75, pastSeason: "2023", pastAge: 21, pastVal: 55, pastMac: 37, stat: "1 Gol / 1 Asist" },
        { name: "Joao Palhinha", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 29, curVal: 50, pastSeason: "2023", pastAge: 28, pastVal: 40, pastMac: 33, stat: "4 Gol / 1 Asist" },
        { name: "Manuel Ugarte", club: "Man United", lig: "PREMIER LEAGUE", curAge: 23, curVal: 50, pastSeason: "2023", pastAge: 22, pastVal: 35, pastMac: 25, stat: "0 Gol / 2 Asist" },
        { name: "Robert Andrich", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 30, curVal: 17, pastSeason: "2023", pastAge: 29, pastVal: 11, pastMac: 28, stat: "4 Gol / 2 Asist" },
        { name: "Martín Zubimendi", club: "Real Sociedad", lig: "LA LIGA", curAge: 25, curVal: 60, pastSeason: "2023", pastAge: 24, pastVal: 40, pastMac: 31, stat: "4 Gol / 1 Asist" },
        { name: "Amadou Onana", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 23, curVal: 50, pastSeason: "2023", pastAge: 22, pastVal: 45, pastMac: 30, stat: "2 Gol / 0 Asist" },
        { name: "Exequiel Palacios", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 26, curVal: 45, pastSeason: "2023", pastAge: 25, pastVal: 22, pastMac: 24, stat: "4 Gol / 5 Asist" },
        { name: "Mats Wieffer", club: "Brighton", lig: "PREMIER LEAGUE", curAge: 24, curVal: 30, pastSeason: "2023", pastAge: 23, pastVal: 15, pastMac: 29, stat: "5 Gol / 3 Asist" },
        { name: "Douglas Luiz", club: "Juventus", lig: "SERIE A", curAge: 26, curVal: 55, pastSeason: "2023", pastAge: 25, pastVal: 40, pastMac: 35, stat: "9 Gol / 5 Asist" },
        { name: "Manuel Locatelli", club: "Juventus", lig: "SERIE A", curAge: 26, curVal: 28, pastSeason: "2021", pastAge: 23, pastVal: 35, pastMac: 34, stat: "4 Gol / 2 Asist" },
        { name: "Ismaël Bennacer", club: "Milan", lig: "SERIE A", curAge: 26, curVal: 30, pastSeason: "2022", pastAge: 24, pastVal: 40, pastMac: 28, stat: "2 Gol / 2 Asist" },
        { name: "Youssouf Fofana", club: "Milan", lig: "SERIE A", curAge: 25, curVal: 30, pastSeason: "2023", pastAge: 24, pastVal: 25, pastMac: 32, stat: "4 Gol / 4 Asist" },
        { name: "Adam Wharton", club: "Crystal Palace", lig: "PREMIER LEAGUE", curAge: 20, curVal: 30, pastSeason: "2023", pastAge: 19, pastVal: 4, pastMac: 16, stat: "0 Gol / 3 Asist" },
        { name: "Roméo Lavia", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 20, curVal: 35, pastSeason: "2023", pastAge: 19, pastVal: 25, pastMac: 29, stat: "1 Gol / 0 Asist" },
        { name: "Denis Zakaria", club: "Monaco", lig: "LIGUE 1", curAge: 27, curVal: 25, pastSeason: "2021", pastAge: 24, pastVal: 30, pastMac: 25, stat: "2 Gol / 1 Asist" },
        { name: "Wataru Endo", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 31, curVal: 13, pastSeason: "2023", pastAge: 30, pastVal: 6, pastMac: 29, stat: "1 Gol / 0 Asist" },
        { name: "Edson Álvarez", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 26, curVal: 35, pastSeason: "2023", pastAge: 25, pastVal: 35, pastMac: 31, stat: "1 Gol / 1 Asist" },
        { name: "Jefferson Lerma", club: "Crystal Palace", lig: "PREMIER LEAGUE", curAge: 29, curVal: 18, pastSeason: "2023", pastAge: 28, pastVal: 15, pastMac: 28, stat: "1 Gol / 1 Asist" },
        { name: "Anton Stach", club: "Hoffenheim", lig: "BUNDESLIGA", curAge: 25, curVal: 15, pastSeason: "2023", pastAge: 24, pastVal: 12, pastMac: 33, stat: "2 Gol / 4 Asist" },
        { name: "Pierre-Emile Hojbjerg", club: "Marseille", lig: "LIGUE 1", curAge: 29, curVal: 18, pastSeason: "2022", pastAge: 27, pastVal: 45, pastMac: 35, stat: "4 Gol / 5 Asist" }
    ],
    "Merkez Orta Saha": [
        { name: "Jude Bellingham", club: "Real Madrid", lig: "LA LIGA", curAge: 21, curVal: 180, pastSeason: "2022", pastAge: 19, pastVal: 90, pastMac: 31, stat: "8 Gol / 4 Asist" },
        { name: "Federico Valverde", club: "Real Madrid", lig: "LA LIGA", curAge: 26, curVal: 130, pastSeason: "2022", pastAge: 24, pastVal: 70, pastMac: 34, stat: "7 Gol / 4 Asist" },
        { name: "Pedri", club: "Barcelona", lig: "LA LIGA", curAge: 21, curVal: 80, pastSeason: "2021", pastAge: 18, pastVal: 80, pastMac: 37, stat: "3 Gol / 3 Asist" },
        { name: "Gavi", club: "Barcelona", lig: "LA LIGA", curAge: 20, curVal: 90, pastSeason: "2022", pastAge: 18, pastVal: 70, pastMac: 36, stat: "2 Gol / 4 Asist" },
        { name: "Frenkie de Jong", club: "Barcelona", lig: "LA LIGA", curAge: 27, curVal: 70, pastSeason: "2021", pastAge: 24, pastVal: 90, pastMac: 37, stat: "3 Gol / 4 Asist" },
        { name: "Nicolo Barella", club: "Inter", lig: "SERIE A", curAge: 27, curVal: 80, pastSeason: "2021", pastAge: 24, pastVal: 65, pastMac: 36, stat: "3 Gol / 9 Asist" },
        { name: "Luka Modric", club: "Real Madrid", lig: "LA LIGA", curAge: 39, curVal: 6, pastSeason: "2021", pastAge: 36, pastVal: 10, pastMac: 28, stat: "2 Gol / 8 Asist" },
        { name: "Alexis Mac Allister", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 25, curVal: 75, pastSeason: "2022", pastAge: 23, pastVal: 16, pastMac: 35, stat: "10 Gol / 2 Asist" },
        { name: "Enzo Fernández", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 23, curVal: 75, pastSeason: "2022", pastAge: 21, pastVal: 20, pastMac: 17, stat: "1 Gol / 5 Asist" },
        { name: "Hakan Çalhanoğlu", club: "Inter", lig: "SERIE A", curAge: 30, curVal: 45, pastSeason: "2021", pastAge: 27, pastVal: 35, pastMac: 34, stat: "7 Gol / 12 Asist" },
        { name: "Ilkay Gündogan", club: "Man City", lig: "PREMIER LEAGUE", curAge: 33, curVal: 12, pastSeason: "2021", pastAge: 30, pastVal: 40, pastMac: 28, stat: "13 Gol / 2 Asist" },
        { name: "Leon Goretzka", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 29, curVal: 30, pastSeason: "2021", pastAge: 26, pastVal: 70, pastMac: 19, stat: "3 Gol / 3 Asist" },
        { name: "Marcel Sabitzer", club: "Dortmund", lig: "BUNDESLIGA", curAge: 30, curVal: 20, pastSeason: "2021", pastAge: 27, pastVal: 42, pastMac: 27, stat: "8 Gol / 4 Asist" },
        { name: "Bernardo Silva", club: "Man City", lig: "PREMIER LEAGUE", curAge: 30, curVal: 70, pastSeason: "2021", pastAge: 27, pastVal: 70, pastMac: 35, stat: "8 Gol / 4 Asist" },
        { name: "Vitinha", club: "PSG", lig: "LIGUE 1", curAge: 24, curVal: 55, pastSeason: "2022", pastAge: 22, pastVal: 30, pastMac: 30, stat: "2 Gol / 3 Asist" },
        { name: "Koke", club: "Atletico Madrid", lig: "LA LIGA", curAge: 32, curVal: 12, pastSeason: "2021", pastAge: 29, pastVal: 60, pastMac: 37, stat: "1 Gol / 2 Asist" },
        { name: "Fabián Ruiz", club: "PSG", lig: "LIGUE 1", curAge: 28, curVal: 35, pastSeason: "2022", pastAge: 26, pastVal: 55, pastMac: 32, stat: "7 Gol / 4 Asist" },
        { name: "Mateo Kovacic", club: "Man City", lig: "PREMIER LEAGUE", curAge: 30, curVal: 30, pastSeason: "2021", pastAge: 27, pastVal: 45, pastMac: 25, stat: "2 Gol / 5 Asist" },
        { name: "Adrien Rabiot", club: "Marseille", lig: "LIGUE 1", curAge: 29, curVal: 35, pastSeason: "2023", pastAge: 28, pastVal: 40, pastMac: 32, stat: "8 Gol / 4 Asist" },
        { name: "Kobbie Mainoo", club: "Man United", lig: "PREMIER LEAGUE", curAge: 19, curVal: 55, pastSeason: "2023", pastAge: 18, pastVal: 1, pastMac: 24, stat: "3 Gol / 1 Asist" },
        { name: "Rúben Neves", club: "Al-Hilal", lig: "SAUDI PRO LEAGUE", curAge: 27, curVal: 32, pastSeason: "2022", pastAge: 25, pastVal: 40, pastMac: 33, stat: "4 Gol / 2 Asist" },
        { name: "Tijjani Reijnders", club: "Milan", lig: "SERIE A", curAge: 26, curVal: 30, pastSeason: "2023", pastAge: 25, pastVal: 14, pastMac: 36, stat: "3 Gol / 3 Asist" },
        { name: "Teun Koopmeiners", club: "Juventus", lig: "SERIE A", curAge: 26, curVal: 55, pastSeason: "2023", pastAge: 25, pastVal: 30, pastMac: 34, stat: "12 Gol / 5 Asist" },
        { name: "Mikel Merino", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 28, curVal: 50, pastSeason: "2022", pastAge: 26, pastVal: 50, pastMac: 33, stat: "2 Gol / 9 Asist" },
        { name: "Conor Gallagher", club: "Atletico Madrid", lig: "LA LIGA", curAge: 24, curVal: 50, pastSeason: "2022", pastAge: 22, pastVal: 25, pastMac: 34, stat: "8 Gol / 3 Asist" },
        { name: "Youri Tielemans", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 27, curVal: 30, pastSeason: "2021", pastAge: 24, pastVal: 55, pastMac: 38, stat: "6 Gol / 4 Asist" },
        { name: "Lorenzo Pellegrini", club: "Roma", lig: "SERIE A", curAge: 28, curVal: 25, pastSeason: "2022", pastAge: 26, pastVal: 45, pastMac: 28, stat: "9 Gol / 5 Asist" },
        { name: "Warren Zaïre-Emery", club: "PSG", lig: "LIGUE 1", curAge: 18, curVal: 60, pastSeason: "2023", pastAge: 17, pastVal: 20, pastMac: 26, stat: "2 Gol / 0 Asist" },
        { name: "João Neves", club: "PSG", lig: "LIGUE 1", curAge: 20, curVal: 60, pastSeason: "2023", pastAge: 19, pastVal: 10, pastMac: 33, stat: "3 Gol / 1 Asist" },
        { name: "Rodrigo De Paul", club: "Atletico Madrid", lig: "LA LIGA", curAge: 30, curVal: 30, pastSeason: "2021", pastAge: 27, pastVal: 40, pastMac: 36, stat: "9 Gol / 9 Asist" }
    ],
    "Ofansif Orta Saha": [
        { name: "Kevin De Bruyne", club: "Man City", lig: "PREMIER LEAGUE", curAge: 33, curVal: 45, pastSeason: "2021", pastAge: 30, pastVal: 100, pastMac: 30, stat: "15 Gol / 8 Asist" },
        { name: "Jamal Musiala", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 21, curVal: 130, pastSeason: "2022", pastAge: 19, pastVal: 65, pastMac: 33, stat: "12 Gol / 10 Asist" },
        { name: "Florian Wirtz", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 21, curVal: 130, pastSeason: "2021", pastAge: 18, pastVal: 45, pastMac: 24, stat: "7 Gol / 10 Asist" },
        { name: "Martin Ødegaard", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 25, curVal: 110, pastSeason: "2022", pastAge: 23, pastVal: 60, pastMac: 37, stat: "15 Gol / 7 Asist" },
        { name: "Bruno Fernandes", club: "Man United", lig: "PREMIER LEAGUE", curAge: 30, curVal: 65, pastSeason: "2021", pastAge: 27, pastVal: 90, pastMac: 36, stat: "10 Gol / 6 Asist" },
        { name: "Cole Palmer", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 22, curVal: 90, pastSeason: "2023", pastAge: 21, pastVal: 15, pastMac: 14, stat: "0 Gol / 1 Asist" },
        { name: "Xavi Simons", club: "Leipzig", lig: "BUNDESLIGA", curAge: 21, curVal: 80, pastSeason: "2023", pastAge: 20, pastVal: 40, pastMac: 34, stat: "19 Gol / 8 Asist" },
        { name: "Paulo Dybala", club: "Roma", lig: "SERIE A", curAge: 30, curVal: 20, pastSeason: "2022", pastAge: 28, pastVal: 40, pastMac: 29, stat: "10 Gol / 5 Asist" },
        { name: "James Maddison", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 27, curVal: 60, pastSeason: "2022", pastAge: 25, pastVal: 50, pastMac: 30, stat: "10 Gol / 9 Asist" },
        { name: "Julian Brandt", club: "Dortmund", lig: "BUNDESLIGA", curAge: 28, curVal: 40, pastSeason: "2022", pastAge: 26, pastVal: 28, pastMac: 32, stat: "9 Gol / 8 Asist" },
        { name: "Dani Olmo", club: "Barcelona", lig: "LA LIGA", curAge: 26, curVal: 60, pastSeason: "2023", pastAge: 25, pastVal: 40, pastMac: 21, stat: "4 Gol / 5 Asist" },
        { name: "Lucas Paquetá", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 27, curVal: 55, pastSeason: "2022", pastAge: 25, pastVal: 35, pastMac: 28, stat: "4 Gol / 3 Asist" },
        { name: "Phil Foden", club: "Man City", lig: "PREMIER LEAGUE", curAge: 24, curVal: 150, pastSeason: "2022", pastAge: 22, pastVal: 90, pastMac: 32, stat: "11 Gol / 5 Asist" },
        { name: "Arda Güler", club: "Real Madrid", lig: "LA LIGA", curAge: 19, curVal: 45, pastSeason: "2023", pastAge: 18, pastVal: 11, pastMac: 20, stat: "4 Gol / 3 Asist" },
        { name: "Christopher Nkunku", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 26, curVal: 65, pastSeason: "2022", pastAge: 24, pastVal: 80, pastMac: 25, stat: "16 Gol / 4 Asist" },
        { name: "Kai Havertz", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 25, curVal: 75, pastSeason: "2022", pastAge: 23, pastVal: 60, pastMac: 35, stat: "7 Gol / 1 Asist" },
        { name: "Giovanni Reyna", club: "Dortmund", lig: "BUNDESLIGA", curAge: 21, curVal: 18, pastSeason: "2021", pastAge: 18, pastVal: 42, pastMac: 32, stat: "4 Gol / 7 Asist" },
        { name: "Mohammed Kudus", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 24, curVal: 50, pastSeason: "2023", pastAge: 23, pastVal: 30, pastMac: 30, stat: "11 Gol / 3 Asist" },
        { name: "Eberechi Eze", club: "Crystal Palace", lig: "PREMIER LEAGUE", curAge: 26, curVal: 60, pastSeason: "2023", pastAge: 25, pastVal: 32, pastMac: 38, stat: "10 Gol / 4 Asist" },
        { name: "Morgan Gibbs-White", club: "Nottingham Forest", lig: "PREMIER LEAGUE", curAge: 24, curVal: 40, pastSeason: "2023", pastAge: 23, pastVal: 25, pastMac: 37, stat: "5 Gol / 8 Asist" },
        { name: "Álex Baena", club: "Villarreal", lig: "LA LIGA", curAge: 23, curVal: 40, pastSeason: "2023", pastAge: 22, pastVal: 20, pastMac: 34, stat: "2 Gol / 14 Asist" },
        { name: "Thomas Müller", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 35, curVal: 8, pastSeason: "2021", pastAge: 32, pastVal: 30, pastMac: 32, stat: "8 Gol / 18 Asist" },
        { name: "Tomáš Souček", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 29, curVal: 30, pastSeason: "2021", pastAge: 26, pastVal: 40, pastMac: 38, stat: "10 Gol / 1 Asist" },
        { name: "Martin Baturina", club: "Dinamo Zagreb", lig: "PRVA HNL", curAge: 21, curVal: 20, pastSeason: "2023", pastAge: 20, pastVal: 6.5, pastMac: 34, stat: "6 Gol / 12 Asist" },
        { name: "Eljif Elmas", club: "Leipzig", lig: "BUNDESLIGA", curAge: 25, curVal: 20, pastSeason: "2023", pastAge: 23, pastVal: 26, pastMac: 36, stat: "6 Gol / 3 Asist" },
        { name: "Lovro Majer", club: "Wolfsburg", lig: "BUNDESLIGA", curAge: 26, curVal: 20, pastSeason: "2022", pastAge: 24, pastVal: 22, pastMac: 36, stat: "6 Gol / 8 Asist" },
        { name: "Fábio Carvalho", club: "Brentford", lig: "PREMIER LEAGUE", curAge: 22, curVal: 14, pastSeason: "2022", pastAge: 20, pastVal: 20, pastMac: 36, stat: "10 Gol / 8 Asist" },
        { name: "Rayan Cherki", club: "Lyon", lig: "LIGUE 1", curAge: 21, curVal: 20, pastSeason: "2023", pastAge: 19, pastVal: 18, pastMac: 34, stat: "4 Gol / 6 Asist" }
    ],
    "Sağ Kanat": [
        { name: "Bukayo Saka", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 23, curVal: 140, pastSeason: "2021", pastAge: 20, pastVal: 65, pastMac: 38, stat: "11 Gol / 7 Asist" },
        { name: "Mohamed Salah", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 32, curVal: 55, pastSeason: "2021", pastAge: 29, pastVal: 100, pastMac: 35, stat: "23 Gol / 13 Asist" },
        { name: "Lamine Yamal", club: "Barcelona", lig: "LA LIGA", curAge: 17, curVal: 150, pastSeason: "2023", pastAge: 16, pastVal: 25, pastMac: 37, stat: "5 Gol / 8 Asist" },
        { name: "Rodrygo", club: "Real Madrid", lig: "LA LIGA", curAge: 23, curVal: 110, pastSeason: "2022", pastAge: 21, pastVal: 60, pastMac: 33, stat: "4 Gol / 4 Asist" },
        { name: "Ousmane Dembélé", club: "PSG", lig: "LIGUE 1", curAge: 27, curVal: 60, pastSeason: "2022", pastAge: 25, pastVal: 50, pastMac: 25, stat: "5 Gol / 7 Asist" },
        { name: "Leroy Sané", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 28, curVal: 60, pastSeason: "2021", pastAge: 25, pastVal: 70, pastMac: 32, stat: "7 Gol / 7 Asist" },
        { name: "Raphinha", club: "Barcelona", lig: "LA LIGA", curAge: 27, curVal: 60, pastSeason: "2022", pastAge: 25, pastVal: 45, pastMac: 35, stat: "11 Gol / 3 Asist" },
        { name: "Takefusa Kubo", club: "Real Sociedad", lig: "LA LIGA", curAge: 23, curVal: 50, pastSeason: "2023", pastAge: 22, pastVal: 15, pastMac: 35, stat: "9 Gol / 7 Asist" },
        { name: "Jarrod Bowen", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 27, curVal: 50, pastSeason: "2022", pastAge: 25, pastVal: 35, pastMac: 36, stat: "12 Gol / 12 Asist" },
        { name: "Riyad Mahrez", club: "Al-Ahli", lig: "SAUDI PRO LEAGUE", curAge: 33, curVal: 12, pastSeason: "2021", pastAge: 30, pastVal: 42, pastMac: 28, stat: "11 Gol / 5 Asist" },
        { name: "Lionel Messi", club: "Inter Miami", lig: "MLS", curAge: 37, curVal: 25, pastSeason: "2021", pastAge: 34, pastVal: 80, pastMac: 35, stat: "30 Gol / 9 Asist" },
        { name: "Serge Gnabry", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 29, curVal: 40, pastSeason: "2021", pastAge: 26, pastVal: 70, pastMac: 34, stat: "14 Gol / 5 Asist" },
        { name: "Kingsley Coman", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 28, curVal: 40, pastSeason: "2022", pastAge: 26, pastVal: 60, pastMac: 24, stat: "8 Gol / 5 Asist" },
        { name: "Federico Chiesa", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 26, curVal: 30, pastSeason: "2021", pastAge: 23, pastVal: 70, pastMac: 30, stat: "8 Gol / 8 Asist" },
        { name: "Dejan Kulusevski", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 24, curVal: 55, pastSeason: "2022", pastAge: 22, pastVal: 35, pastMac: 18, stat: "5 Gol / 8 Asist" },
        { name: "Michael Olise", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 22, curVal: 65, pastSeason: "2023", pastAge: 21, pastVal: 38, pastMac: 37, stat: "2 Gol / 11 Asist" },
        { name: "Johan Bakayoko", club: "PSV", lig: "EREDIVISIE", curAge: 21, curVal: 45, pastSeason: "2023", pastAge: 20, pastVal: 10, pastMac: 33, stat: "12 Gol / 9 Asist" },
        { name: "Noni Madueke", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 22, curVal: 35, pastSeason: "2023", pastAge: 21, pastVal: 28, pastMac: 23, stat: "5 Gol / 2 Asist" },
        { name: "Leon Bailey", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 27, curVal: 42, pastSeason: "2023", pastAge: 26, pastVal: 28, pastMac: 35, stat: "10 Gol / 9 Asist" },
        { name: "Pedro Neto", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 24, curVal: 55, pastSeason: "2023", pastAge: 23, pastVal: 32, pastMac: 20, stat: "2 Gol / 9 Asist" },
        { name: "Moussa Diaby", club: "Al-Ittihad", lig: "SAUDI PRO LEAGUE", curAge: 25, curVal: 55, pastSeason: "2022", pastAge: 23, pastVal: 50, pastMac: 33, stat: "9 Gol / 8 Asist" },
        { name: "Bryan Mbeumo", club: "Brentford", lig: "PREMIER LEAGUE", curAge: 25, curVal: 40, pastSeason: "2023", pastAge: 24, pastVal: 28, pastMac: 25, stat: "9 Gol / 6 Asist" },
        { name: "Domenico Berardi", club: "Sassuolo", lig: "SERIE B", curAge: 30, curVal: 10, pastSeason: "2021", pastAge: 27, pastVal: 35, pastMac: 33, stat: "15 Gol / 14 Asist" },
        { name: "Yeremy Pino", club: "Villarreal", lig: "LA LIGA", curAge: 21, curVal: 30, pastSeason: "2022", pastAge: 19, pastVal: 40, pastMac: 36, stat: "4 Gol / 6 Asist" },
        { name: "Viktor Tsygankov", club: "Girona", lig: "LA LIGA", curAge: 26, curVal: 30, pastSeason: "2023", pastAge: 25, pastVal: 22, pastMac: 30, stat: "8 Gol / 7 Asist" },
        { name: "Nicolás González", club: "Juventus", lig: "SERIE A", curAge: 26, curVal: 35, pastSeason: "2023", pastAge: 25, pastVal: 30, pastMac: 29, stat: "12 Gol / 2 Asist" },
        { name: "Takumi Minamino", club: "Monaco", lig: "LIGUE 1", curAge: 29, curVal: 20, pastSeason: "2023", pastAge: 28, pastVal: 10, pastMac: 30, stat: "9 Gol / 6 Asist" },
        { name: "Edon Zhegrova", club: "Lille", lig: "LIGUE 1", curAge: 25, curVal: 25, pastSeason: "2023", pastAge: 24, pastVal: 10, pastMac: 33, stat: "6 Gol / 6 Asist" }
    ],
    "Sol Kanat": [
        { name: "Vinicius Junior", club: "Real Madrid", lig: "LA LIGA", curAge: 24, curVal: 200, pastSeason: "2021", pastAge: 21, pastVal: 40, pastMac: 35, stat: "17 Gol / 10 Asist" },
        { name: "Rafael Leão", club: "Milan", lig: "SERIE A", curAge: 25, curVal: 75, pastSeason: "2022", pastAge: 23, pastVal: 85, pastMac: 35, stat: "15 Gol / 8 Asist" },
        { name: "Khvicha Kvaratskhelia", club: "Napoli", lig: "SERIE A", curAge: 23, curVal: 80, pastSeason: "2022", pastAge: 21, pastVal: 15, pastMac: 34, stat: "12 Gol / 10 Asist" },
        { name: "Gabriel Martinelli", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 23, curVal: 60, pastSeason: "2022", pastAge: 21, pastVal: 40, pastMac: 36, stat: "15 Gol / 5 Asist" },
        { name: "Luis Díaz", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 27, curVal: 80, pastSeason: "2022", pastAge: 25, pastVal: 45, pastMac: 17, stat: "4 Gol / 2 Asist" },
        { name: "Nico Williams", club: "Athletic Bilbao", lig: "LA LIGA", curAge: 22, curVal: 70, pastSeason: "2023", pastAge: 21, pastVal: 30, pastMac: 31, stat: "5 Gol / 11 Asist" },
        { name: "Heung-min Son", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 32, curVal: 45, pastSeason: "2021", pastAge: 29, pastVal: 80, pastMac: 35, stat: "23 Gol / 7 Asist" },
        { name: "Jack Grealish", club: "Man City", lig: "PREMIER LEAGUE", curAge: 29, curVal: 55, pastSeason: "2021", pastAge: 26, pastVal: 100, pastMac: 26, stat: "3 Gol / 3 Asist" },
        { name: "Jeremy Doku", club: "Man City", lig: "PREMIER LEAGUE", curAge: 22, curVal: 65, pastSeason: "2023", pastAge: 21, pastVal: 28, pastMac: 29, stat: "3 Gol / 8 Asist" },
        { name: "Anthony Gordon", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 23, curVal: 60, pastSeason: "2023", pastAge: 22, pastVal: 35, pastMac: 35, stat: "11 Gol / 10 Asist" },
        { name: "Karim Adeyemi", club: "Dortmund", lig: "BUNDESLIGA", curAge: 22, curVal: 35, pastSeason: "2022", pastAge: 20, pastVal: 35, pastMac: 24, stat: "6 Gol / 5 Asist" },
        { name: "Donyell Malen", club: "Dortmund", lig: "BUNDESLIGA", curAge: 25, curVal: 40, pastSeason: "2023", pastAge: 24, pastVal: 28, pastMac: 27, stat: "13 Gol / 1 Asist" },
        { name: "Bradley Barcola", club: "PSG", lig: "LIGUE 1", curAge: 22, curVal: 65, pastSeason: "2023", pastAge: 21, pastVal: 18, pastMac: 25, stat: "4 Gol / 7 Asist" },
        { name: "Kaoru Mitoma", club: "Brighton", lig: "PREMIER LEAGUE", curAge: 27, curVal: 45, pastSeason: "2023", pastAge: 26, pastVal: 22, pastMac: 33, stat: "7 Gol / 5 Asist" },
        { name: "Harvey Barnes", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 26, curVal: 35, pastSeason: "2022", pastAge: 24, pastVal: 35, pastMac: 34, stat: "13 Gol / 1 Asist" },
        { name: "Raheem Sterling", club: "Arsenal", lig: "PREMIER LEAGUE", curAge: 29, curVal: 35, pastSeason: "2021", pastAge: 26, pastVal: 90, pastMac: 30, stat: "13 Gol / 5 Asist" },
        { name: "Marcus Rashford", club: "Man United", lig: "PREMIER LEAGUE", curAge: 26, curVal: 60, pastSeason: "2022", pastAge: 24, pastVal: 80, pastMac: 35, stat: "17 Gol / 5 Asist" },
        { name: "Mattia Zaccagni", club: "Lazio", lig: "SERIE A", curAge: 29, curVal: 20, pastSeason: "2023", pastAge: 28, pastVal: 30, pastMac: 35, stat: "10 Gol / 6 Asist" },
        { name: "Stephan El Shaarawy", club: "Roma", lig: "SERIE A", curAge: 31, curVal: 5, pastSeason: "2022", pastAge: 29, pastVal: 8, pastMac: 29, stat: "7 Gol / 1 Asist" },
        { name: "Ademola Lookman", club: "Atalanta", lig: "SERIE A", curAge: 26, curVal: 40, pastSeason: "2023", pastAge: 25, pastVal: 20, pastMac: 31, stat: "13 Gol / 6 Asist" },
        { name: "Antonio Nusa", club: "Leipzig", lig: "BUNDESLIGA", curAge: 19, curVal: 22, pastSeason: "2023", pastAge: 18, pastVal: 4, pastMac: 30, stat: "3 Gol / 3 Asist" },
        { name: "Ansu Fati", club: "Barcelona", lig: "LA LIGA", curAge: 21, curVal: 15, pastSeason: "2021", pastAge: 18, pastVal: 80, pastMac: 10, stat: "4 Gol / 0 Asist" },
        { name: "Ferran Torres", club: "Barcelona", lig: "LA LIGA", curAge: 24, curVal: 30, pastSeason: "2022", pastAge: 22, pastVal: 45, pastMac: 33, stat: "4 Gol / 2 Asist" },
        { name: "Cody Gakpo", club: "Liverpool", lig: "PREMIER LEAGUE", curAge: 25, curVal: 55, pastSeason: "2022", pastAge: 23, pastVal: 45, pastMac: 21, stat: "7 Gol / 2 Asist" },
        { name: "Jamie Gittens", club: "Dortmund", lig: "BUNDESLIGA", curAge: 20, curVal: 35, pastSeason: "2023", pastAge: 19, pastVal: 14, pastMac: 25, stat: "1 Gol / 4 Asist" },
        { name: "Martin Terrier", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 27, curVal: 20, pastSeason: "2022", pastAge: 25, pastVal: 35, pastMac: 37, stat: "21 Gol / 4 Asist" },
        { name: "Moses Simon", club: "Nantes", lig: "LIGUE 1", curAge: 29, curVal: 12, pastSeason: "2022", pastAge: 27, pastVal: 10, pastMac: 34, stat: "5 Gol / 4 Asist" },
        { name: "Yannick Carrasco", club: "Al-Shabab", lig: "SAUDI PRO LEAGUE", curAge: 31, curVal: 14, pastSeason: "2021", pastAge: 28, pastVal: 40, pastMac: 34, stat: "6 Gol / 6 Asist" }
    ],
    "Santrafor": [
        { name: "Erling Haaland", club: "Man City", lig: "PREMIER LEAGUE", curAge: 24, curVal: 200, pastSeason: "2022", pastAge: 22, pastVal: 150, pastMac: 35, stat: "36 Gol / 8 Asist" },
        { name: "Kylian Mbappé", club: "Real Madrid", lig: "LA LIGA", curAge: 25, curVal: 180, pastSeason: "2022", pastAge: 23, pastVal: 160, pastMac: 34, stat: "29 Gol / 5 Asist" },
        { name: "Harry Kane", club: "Bayern Munich", lig: "BUNDESLIGA", curAge: 31, curVal: 100, pastSeason: "2023", pastAge: 30, pastVal: 90, pastMac: 32, stat: "36 Gol / 8 Asist" },
        { name: "Lautaro Martínez", club: "Inter", lig: "SERIE A", curAge: 27, curVal: 110, pastSeason: "2022", pastAge: 25, pastVal: 75, pastMac: 38, stat: "21 Gol / 6 Asist" },
        { name: "Robert Lewandowski", club: "Barcelona", lig: "LA LIGA", curAge: 36, curVal: 15, pastSeason: "2021", pastAge: 33, pastVal: 50, pastMac: 34, stat: "35 Gol / 3 Asist" },
        { name: "Victor Osimhen", club: "Napoli", lig: "SERIE A", curAge: 25, curVal: 75, pastSeason: "2022", pastAge: 23, pastVal: 65, pastMac: 32, stat: "26 Gol / 4 Asist" },
        { name: "Alexander Isak", club: "Newcastle", lig: "PREMIER LEAGUE", curAge: 25, curVal: 75, pastSeason: "2022", pastAge: 23, pastVal: 50, pastMac: 22, stat: "10 Gol / 1 Asist" },
        { name: "Ollie Watkins", club: "Aston Villa", lig: "PREMIER LEAGUE", curAge: 28, curVal: 90, pastSeason: "2023", pastAge: 27, pastVal: 32, pastMac: 37, stat: "19 Gol / 13 Asist" },
        { name: "Cristiano Ronaldo", club: "Al-Nassr", lig: "SAUDI PRO LEAGUE", curAge: 39, curVal: 15, pastSeason: "2021", pastAge: 36, pastVal: 45, pastMac: 30, stat: "18 Gol / 3 Asist" },
        { name: "Karim Benzema", club: "Al-Ittihad", lig: "SAUDI PRO LEAGUE", curAge: 36, curVal: 10, pastSeason: "2022", pastAge: 34, pastVal: 35, pastMac: 24, stat: "19 Gol / 3 Asist" },
        { name: "Victor Boniface", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 23, curVal: 45, pastSeason: "2023", pastAge: 22, pastVal: 12, pastMac: 23, stat: "14 Gol / 8 Asist" },
        { name: "Serhou Guirassy", club: "Dortmund", lig: "BUNDESLIGA", curAge: 28, curVal: 40, pastSeason: "2023", pastAge: 27, pastVal: 14, pastMac: 28, stat: "28 Gol / 2 Asist" },
        { name: "Benjamin Sesko", club: "Leipzig", lig: "BUNDESLIGA", curAge: 21, curVal: 50, pastSeason: "2023", pastAge: 20, pastVal: 24, pastMac: 31, stat: "14 Gol / 2 Asist" },
        { name: "Dusan Vlahovic", club: "Juventus", lig: "SERIE A", curAge: 24, curVal: 65, pastSeason: "2021", pastAge: 21, pastVal: 70, pastMac: 36, stat: "24 Gol / 3 Asist" },
        { name: "Julian Alvarez", club: "Atletico Madrid", lig: "LA LIGA", curAge: 24, curVal: 90, pastSeason: "2022", pastAge: 22, pastVal: 23, pastMac: 31, stat: "9 Gol / 0 Asist" },
        { name: "Alvaro Morata", club: "Milan", lig: "SERIE A", curAge: 31, curVal: 16, pastSeason: "2022", pastAge: 29, pastVal: 25, pastMac: 36, stat: "13 Gol / 2 Asist" },
        { name: "Viktor Gyökeres", club: "Sporting", lig: "LIGA PORTUGAL", curAge: 26, curVal: 70, pastSeason: "2023", pastAge: 25, pastVal: 13, pastMac: 33, stat: "29 Gol / 9 Asist" },
        { name: "Omar Marmoush", club: "Frankfurt", lig: "BUNDESLIGA", curAge: 25, curVal: 40, pastSeason: "2023", pastAge: 24, pastVal: 6, pastMac: 29, stat: "12 Gol / 6 Asist" },
        { name: "Dominic Solanke", club: "Tottenham", lig: "PREMIER LEAGUE", curAge: 27, curVal: 45, pastSeason: "2023", pastAge: 26, pastVal: 20, pastMac: 38, stat: "19 Gol / 3 Asist" },
        { name: "Marcus Thuram", club: "Inter", lig: "SERIE A", curAge: 27, curVal: 65, pastSeason: "2023", pastAge: 26, pastVal: 32, pastMac: 35, stat: "13 Gol / 7 Asist" },
        { name: "Nicolas Jackson", club: "Chelsea", lig: "PREMIER LEAGUE", curAge: 23, curVal: 40, pastSeason: "2023", pastAge: 22, pastVal: 30, pastMac: 35, stat: "14 Gol / 5 Asist" },
        { name: "Lois Openda", club: "Leipzig", lig: "BUNDESLIGA", curAge: 24, curVal: 60, pastSeason: "2023", pastAge: 23, pastVal: 35, pastMac: 34, stat: "24 Gol / 7 Asist" },
        { name: "Artem Dovbyk", club: "Roma", lig: "SERIE A", curAge: 27, curVal: 35, pastSeason: "2023", pastAge: 26, pastVal: 15, pastMac: 36, stat: "24 Gol / 8 Asist" },
        { name: "Evan Ferguson", club: "Brighton", lig: "PREMIER LEAGUE", curAge: 20, curVal: 45, pastSeason: "2023", pastAge: 19, pastVal: 30, pastMac: 27, stat: "6 Gol / 0 Asist" },
        { name: "Jonathan David", club: "Lille", lig: "LIGUE 1", curAge: 24, curVal: 45, pastSeason: "2022", pastAge: 22, pastVal: 45, pastMac: 37, stat: "24 Gol / 4 Asist" },
        { name: "Santiago Gimenez", club: "Feyenoord", lig: "EREDIVISIE", curAge: 23, curVal: 40, pastSeason: "2023", pastAge: 22, pastVal: 9, pastMac: 30, stat: "23 Gol / 6 Asist" },
        { name: "Mateo Retegui", club: "Atalanta", lig: "SERIE A", curAge: 25, curVal: 28, pastSeason: "2023", pastAge: 24, pastVal: 16, pastMac: 29, stat: "7 Gol / 2 Asist" },
        { name: "Jean-Philippe Mateta", club: "Crystal Palace", lig: "PREMIER LEAGUE", curAge: 27, curVal: 20, pastSeason: "2023", pastAge: 26, pastVal: 7, pastMac: 35, stat: "16 Gol / 5 Asist" },
        { name: "Niclas Fullkrug", club: "West Ham", lig: "PREMIER LEAGUE", curAge: 31, curVal: 15, pastSeason: "2022", pastAge: 29, pastVal: 5, pastMac: 28, stat: "16 Gol / 5 Asist" },
        { name: "Patrik Schick", club: "Leverkusen", lig: "BUNDESLIGA", curAge: 28, curVal: 22, pastSeason: "2021", pastAge: 25, pastVal: 40, pastMac: 27, stat: "24 Gol / 3 Asist" }
    ]
};

// Wikipedia adı override listesi
const OVERRIDES = {
    "Ederson": "Ederson_(footballer,_born_1993)",
    "Kim Min-jae": "Kim_Min-jae_(footballer)",
    "Gabriel Magalhães": "Gabriel_Magalh%C3%A3es",
    "Vinicius Junior": "Vin%C3%ADcius_J%C3%BAnior",
    "Rodri": "Rodri_(footballer)",
    "Alex Meret": "Alex_Meret",
    "Inaki Pena": "I%C3%B1aki_Pe%C3%B1a",
    "Vanja Milinkovic-Savic": "Vanja_Milinkovi%C4%87-Savi%C4%87",
    "Giorgi Mamardashvili": "Giorgi_Mamardashvili",
    "Pedro Porro": "Pedro_Porro",
    "Kylian Mbappé": "Kylian_Mbapp%C3%A9",
    "Cristiano Ronaldo": "Cristiano_Ronaldo",
    "Lionel Messi": "Lionel_Messi"
};

function fetchThumbnail(name) {
    return new Promise(resolve => {
        const query = OVERRIDES[name] || encodeURIComponent(name.replace(/ /g, '_'));
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
            if (res.statusCode !== 200) return resolve(null);
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try {
                    const j = JSON.parse(d);
                    resolve(j.thumbnail ? j.thumbnail.source : null);
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function main() {
    console.log('310 Elit Oyuncu Veriseti Hazırlanıyor...');
    const result = {};
    let idCounter = 1;
    let totalPlayers = 0;
    let photosFound = 0;

    for (const pos in RAW_ROSTER) {
        result[pos] = [];
        const isGK = pos === "Kaleci";

        for (const item of RAW_ROSTER[pos]) {
            totalPlayers++;
            idCounter++;

            const thumb = await fetchThumbnail(item.name);
            const photoUrl = thumb || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=0f172a&color=ffd700&size=256&bold=true`;
            if (thumb) photosFound++;

            result[pos].push({
                id: idCounter,
                gercek_isim: item.name,
                sezon: item.pastSeason,
                gecmis: {
                    deger: item.pastVal,
                    yas: item.pastAge,
                    lig: item.lig,
                    mac: item.pastMac,
                    stat_etiket: isGK ? "Y. GOL" : "GOL / ASİST",
                    stat_deger: item.stat
                },
                guncel: {
                    yas: item.curAge,
                    deger: item.curVal
                },
                foto_url: photoUrl
            });

            // Rate limit önlemi
            await new Promise(r => setTimeout(r, 45));
        }
        console.log(`✓ ${pos} mevkisi tamamlandı (${result[pos].length} oyuncu).`);
    }

    fs.writeFileSync(path.join(__dirname, 'oyuncular.json'), JSON.stringify(result, null, 2), 'utf8');
    console.log(`====================================================`);
    console.log(`TAMAMLANDI! Toplam ${totalPlayers} oyuncu eklendi.`);
    console.log(`Çalışan gerçek Wikipedia fotoğrafı bağlanan: ${photosFound}/${totalPlayers}`);
    console.log(`====================================================`);
}

main();
