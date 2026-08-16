// Legacy GGL history reconstructed from the old NFL Fantasy league screenshots.
//
// This file is intentionally separate from Sleeper data. The legacy era does
// not have weekly matchup detail, so it should never be used for historical
// head-to-head calculations.

export const LEGACY_SOURCE = 'legacy';

const team = (finish, name, manager, wins, losses, ties = 0) => ({
    finish,
    name,
    manager,
    wins,
    losses,
    ties,
});

const season = ({
    year,
    teams,
    podium,
    mostPoints = null,
    leastPoints = null,
    toiletBowlLoser = null,
    notes = [],
}) => ({
    year,
    source: LEGACY_SOURCE,
    platform: 'NFL Fantasy',
    teamCount: teams.length,
    teams,
    podium,
    mostPoints,
    leastPoints,
    toiletBowlLoser,
    notes,
});

export const legacyHistory = [
    season({
        year: 2012,
        teams: [
            team(1, 'Victorious Secret', 'Pico', 9, 5),
            team(2, 'Sofa King Beast', 'Brandon', 8, 6),
            team(3, 'Rated M for Gore', 'Henry', 8, 6),
            team(4, 'Casper on Deez Niggaz', 'Ghost Team', 7, 7),
            team(5, 'The MacDaddys', 'Dustin', 6, 8),
            team(6, 'Swag Nasty', 'Myron', 4, 10),
        ],
        podium: {
            champion: 'The MacDaddys',
            runnerUp: 'Swag Nasty',
            thirdPlace: 'Sofa King Beast',
        },
        mostPoints: { team: 'Casper on Deez Niggaz', manager: 'Ghost Team', points: 1543.44 },
        leastPoints: { team: 'Swag Nasty', manager: 'Myron', points: null },
        toiletBowlLoser: { team: 'Rated M for Gore', manager: 'Henry' },
    }),

    season({
        year: 2013,
        teams: [
            team(1, 'Div Gobblers', 'Luis', 11, 4),
            team(2, 'Kaeptain Luck My Harbaughs', 'Henry', 11, 4),
            team(3, 'Megatron is the Ansah', 'Brandon', 8, 7),
            team(4, 'The Brotherhood', 'Pico', 7, 8),
            team(5, 'MacDaddy the Pimp', 'Dustin', 5, 10),
            team(6, 'Ghost Team', 'Ghost Team', 3, 12),
        ],
        podium: {
            champion: 'The Brotherhood',
            runnerUp: 'Kaeptain Luck My Harbaughs',
            thirdPlace: 'Div Gobblers',
        },
        mostPoints: { team: 'Kaeptain Luck My Harbaughs', manager: 'Henry', points: 2121.04 },
        leastPoints: { team: 'Ghost Team', manager: 'Ghost Team', points: 1608.82 },
        toiletBowlLoser: { team: 'Ghost Team', manager: 'Ghost Team' },
    }),

    season({
        year: 2014,
        teams: [
            team(1, 'Megatron is the Ansah', 'Brandon', 9, 5),
            team(2, 'SuckMyDitka', 'Andreas', 8, 6),
            team(3, 'Majari-Bimbo', 'Ariel', 8, 6),
            team(4, 'Karptain Lick My Harbaughs', 'Henry', 8, 6),
            team(5, 'Purple Swag', 'Andy', 7, 7),
            team(6, 'The Brotherhood', 'Pico', 7, 7),
            team(7, 'Man Gobblers', 'Luis', 7, 7),
            team(8, 'Orange and Blue Balls', 'Jared', 7, 7),
            team(9, 'MacDaddy the Pimp', 'Dustin', 5, 9),
            team(10, 'Team Austin', 'Austin', 4, 10),
        ],
        podium: {
            champion: 'Purple Swag',
            runnerUp: 'The Brotherhood',
            thirdPlace: 'Megatron is the Ansah',
        },
        mostPoints: { team: 'The Brotherhood', manager: 'Pico', points: 1619.12 },
        leastPoints: { team: 'Orange and Blue Balls', manager: 'Jared', points: 1228.78 },
        toiletBowlLoser: { team: 'Man Gobblers', manager: 'Luis' },
        notes: ['Last year with 1 QB'],
    }),

    season({
        year: 2015,
        teams: [
            team(1, 'Jones and Murrays', 'Andy', 10, 4),
            team(2, 'Man Gobblers', 'Luis', 9, 5),
            team(3, 'SuckMyDitka', 'Andreas', 9, 5),
            team(4, 'MacDaddy the Pimp', 'Dustin', 7, 7),
            team(5, 'Majari-Bimbo', 'Ariel', 7, 7),
            team(6, 'Megatron is the Ansah', 'Brandon', 6, 8),
            team(7, 'The Injury Bugs', 'Pico', 5, 9),
            team(8, 'Orange and Blue Balls', 'Jared', 3, 11),
        ],
        podium: {
            champion: 'Jones and Murrays',
            runnerUp: 'SuckMyDitka',
            thirdPlace: 'Man Gobblers',
        },
        mostPoints: { team: 'MacDaddy the Pimp', manager: 'Dustin', points: 1934.80 },
        leastPoints: { team: 'Orange and Blue Balls', manager: 'Jared', points: 1523.10 },
        toiletBowlLoser: { team: 'Orange and Blue Balls', manager: 'Jared' },
        notes: ['First year with 2 QBs'],
    }),

    season({
        year: 2016,
        teams: [
            team(1, 'Player 1', 'Brandon', 11, 3),
            team(2, 'Purple Swag', 'Andy', 9, 5),
            team(3, 'SuckMyDitka', 'Andreas', 9, 5),
            team(4, 'Man Gobblers', 'Luis', 8, 6),
            team(5, 'Majari-Bimbo', 'Ariel', 7, 7),
            team(6, 'Macdaddy the Pimp', 'Dustin', 5, 9),
            team(7, 'Wentz Upon a Time', 'Pico', 4, 9, 1),
            team(8, 'Orange and Blue Balls', 'Jared', 2, 11, 1),
        ],
        podium: {
            champion: 'Player 1',
            runnerUp: 'Purple Swag',
            thirdPlace: 'Man Gobblers',
        },
        mostPoints: { team: 'Purple Swag', manager: 'Andy', points: 1962.94 },
        leastPoints: { team: 'Man Gobblers', manager: 'Luis', points: 1544.26 },
        toiletBowlLoser: { team: 'Orange and Blue Balls', manager: 'Jared' },
    }),

    season({
        year: 2017,
        teams: [
            team(1, 'Team 6', 'Igoe', 10, 3),
            team(2, 'Casper the Fantasy Ghost', 'Ghost Team', 8, 5),
            team(3, 'Player 1', 'Brandon', 7, 6),
            team(4, 'Purple Swag', 'Andy', 7, 6),
            team(5, 'MacDaddy the Pimp', 'Dustin', 7, 6),
            team(6, 'Orange and Blue Balls', 'Jared', 5, 8),
            team(7, 'Your Butt Ertz from my Johnson', 'Pico', 4, 9),
            team(8, 'I Forte my Revis n Bowles in U', 'Luis', 4, 9),
        ],
        podium: {
            champion: 'Team 6',
            runnerUp: 'Player 1',
            thirdPlace: 'Casper the Fantasy Ghost',
        },
        mostPoints: { team: 'Team 6', manager: 'Igoe', points: 1792.88 },
        leastPoints: { team: 'I Forte my Revis n Bowles in U', manager: 'Luis', points: null },
        toiletBowlLoser: { team: 'Your Butt Ertz from my Johnson', manager: 'Pico' },
    }),

    season({
        year: 2018,
        teams: [
            team(1, 'Player 1', 'Brandon', 8, 5),
            team(2, 'MacDaddy the Pimp', 'Dustin', 8, 5),
            team(3, 'Eddie', 'Eddie', 8, 5),
            team(4, 'Purple Swag', 'Andy', 6, 7),
            team(5, 'Orange and Blue Balls', 'Jared', 6, 7),
            team(6, 'Struggle Bus', 'Pico', 6, 7),
            team(7, 'The Champ', 'Igoe', 5, 8),
            team(8, 'Barry McCokinner', 'Luis', 5, 8),
        ],
        podium: {
            champion: 'Purple Swag',
            runnerUp: 'MacDaddy the Pimp',
            thirdPlace: 'Player 1',
        },
        mostPoints: { team: 'Player 1', manager: 'Brandon', points: 1883.48 },
        leastPoints: { team: 'Barry McCokinner', manager: 'Luis', points: 1543.84 },
        toiletBowlLoser: { team: 'The Champ', manager: 'Igoe' },
    }),

    season({
        year: 2019,
        teams: [
            team(1, 'Chilling with Mahomes', 'Isai', 11, 2),
            team(2, 'I Wentz to Hyde my Chubb in...', 'Pico', 10, 3),
            team(3, 'Purple Swag', 'Andy', 8, 5),
            team(4, 'Kylermurraysbleachedassho...', 'Ariel', 8, 5),
            team(5, 'Player 1', 'Brandon', 7, 6),
            team(6, 'MacDaddy the Pimp', 'Dustin', 6, 7),
            team(7, 'Barry McCokinner', 'Luis', 5, 8),
            team(8, 'Mack N Cheese', 'Igoe', 4, 9),
            team(9, 'Eddie', 'Eddie', 4, 9),
            team(10, 'Orange and Blue Balls', 'Jared', 2, 11),
        ],
        podium: {
            champion: 'Chilling with Mahomes',
            runnerUp: 'I Wentz to Hyde my Chubb in...',
            thirdPlace: 'Kylermurraysbleachedassho...',
        },
        mostPoints: { team: 'Chilling with Mahomes', manager: 'Isai', points: 1796.66 },
        leastPoints: { team: 'Orange and Blue Balls', manager: 'Jared', points: 1269.06 },
        toiletBowlLoser: { team: 'Barry McCokinner', manager: 'Luis' },
    }),

    season({
        year: 2020,
        teams: [
            team(1, 'Ham05', 'Tony', 10, 3),
            team(2, 'MacDaddy the Pimp', 'Dustin', 9, 4),
            team(3, 'Kylermurraybleachedasshole', 'Ariel', 8, 5),
            team(4, 'I wentz to clyde my jones in U', 'Pico', 7, 6),
            team(5, 'Eddie', 'Eddie', 7, 6),
            team(6, 'Big Truss', 'Gabe', 6, 7),
            team(7, 'Purple Swag', 'Andy', 6, 7),
            team(8, 'Taco for the win', 'Jared', 5, 8),
            team(9, 'Team IR', 'Igoe', 4, 9),
            team(10, 'The ACL Sprainers', 'Isai', 3, 10),
        ],
        podium: {
            champion: 'Ham05',
            runnerUp: 'Big Truss',
            thirdPlace: 'Eddie',
        },
        mostPoints: { team: 'Kylermurraybleachedasshole', manager: 'Ariel', points: 1711.20 },
        leastPoints: { team: 'Purple Swag', manager: 'Andy', points: 1470.18 },
        toiletBowlLoser: { team: 'Purple Swag', manager: 'Andy' },
    }),

    season({
        year: 2021,
        teams: [
            team(1, "Rollin' with Mahomies", 'Pico', 11, 3),
            team(2, 'MacDaddy the Pimp', 'Dustin', 11, 3),
            team(3, 'Bad Juju', 'Igoe', 10, 4),
            team(4, 'Taco for the Win', 'Jared', 8, 6),
            team(5, 'Lights Rodgers Action', 'Eddie', 6, 8),
            team(6, 'DhoponKyler', 'Ariel', 5, 9),
            team(7, 'Sunday Scaries', 'Andy', 5, 9),
            team(8, 'Champ Ham', 'Tony', 5, 9),
            team(9, 'MegaWatt', 'Gabe', 5, 9),
            team(10, 'The Hurts Locker', 'Isai', 4, 10),
        ],
        podium: {
            champion: 'MacDaddy the Pimp',
            runnerUp: "Rollin' with Mahomies",
            thirdPlace: 'Taco for the Win',
        },
        mostPoints: { team: "Rollin' with Mahomies", manager: 'Pico', points: 1901.26 },
        leastPoints: { team: 'MegaWatt', manager: 'Gabe', points: 1517.14 },
        toiletBowlLoser: { team: 'The Hurts Locker', manager: 'Isai' },
    }),

    season({
        year: 2022,
        teams: [
            team(1, 'Breeces is in Pieces', 'Isai', 10, 4),
            team(2, 'I GO', 'Igoe', 10, 4),
            team(3, 'Smokin this Herb', 'Pico', 8, 6),
            team(4, 'Taco for the win', 'Jared', 8, 6),
            team(5, 'BirdGang', 'Gabe', 7, 7),
            team(6, 'Tuacide Squad', 'Andy', 7, 7),
            team(7, 'Get Rich or Die Trying', 'Eddie', 7, 7),
            team(8, 'MacDaddy the Pimp', 'Dustin', 6, 8),
            team(9, 'Picosfatass', 'Ariel', 5, 9),
            team(10, 'Ham', 'Tony', 2, 12),
        ],
        podium: {
            champion: 'I GO',
            runnerUp: 'Breeces is in Pieces',
            thirdPlace: 'Smokin this Herb',
        },
        mostPoints: { team: 'BirdGang', manager: 'Gabe', points: 1786.28 },
        leastPoints: { team: 'Ham', manager: 'Tony', points: 1372.56 },
        toiletBowlLoser: { team: 'Picosfatass', manager: 'Ariel' },
    }),
];

const normalize = (value) => String(value || '').trim().toLowerCase();

export const getLegacySeason = (year) =>
    legacyHistory.find((entry) => Number(entry.year) === Number(year));

export const getLegacyTeamManager = (year, teamName) => {
    const seasonData = getLegacySeason(year);
    if (!seasonData) return null;

    return seasonData.teams.find(
        (entry) => normalize(entry.name) === normalize(teamName)
    )?.manager || null;
};

export const getLegacyManagerSeasons = (managerName) => {
    const managerKey = normalize(managerName);
    if (!managerKey || managerKey === 'ghost team') return [];

    return legacyHistory
        .map((seasonData) => {
            const ownedTeam = seasonData.teams.find(
                (entry) => normalize(entry.manager) === managerKey
            );

            if (!ownedTeam) return null;

            return {
                year: seasonData.year,
                source: seasonData.source,
                platform: seasonData.platform,
                team: ownedTeam.name,
                finish: ownedTeam.finish,
                wins: ownedTeam.wins,
                losses: ownedTeam.losses,
                ties: ownedTeam.ties,
                champion: normalize(seasonData.podium.champion) === normalize(ownedTeam.name),
                runnerUp: normalize(seasonData.podium.runnerUp) === normalize(ownedTeam.name),
                thirdPlace: normalize(seasonData.podium.thirdPlace) === normalize(ownedTeam.name),
                mostPoints: normalize(seasonData.mostPoints?.manager) === managerKey,
                leastPoints: normalize(seasonData.leastPoints?.manager) === managerKey,
                toiletBowlLoser: normalize(seasonData.toiletBowlLoser?.manager) === managerKey,
            };
        })
        .filter(Boolean);
};

export const getLegacyManagerCareer = (managerName) => {
    const seasons = getLegacyManagerSeasons(managerName);

    const career = seasons.reduce(
        (totals, entry) => {
            totals.wins += entry.wins;
            totals.losses += entry.losses;
            totals.ties += entry.ties;
            totals.championships += entry.champion ? 1 : 0;
            totals.runnerUps += entry.runnerUp ? 1 : 0;
            totals.thirdPlaces += entry.thirdPlace ? 1 : 0;
            return totals;
        },
        {
            manager: managerName,
            source: LEGACY_SOURCE,
            wins: 0,
            losses: 0,
            ties: 0,
            championships: 0,
            runnerUps: 0,
            thirdPlaces: 0,
        }
    );

    career.seasons = seasons.length;
    career.games = career.wins + career.losses + career.ties;
    career.winPercentage = career.games > 0
        ? (career.wins + (career.ties * 0.5)) / career.games
        : 0;
    career.seasonHistory = seasons;

    return career;
};

export const getLegacyManagerChampionships = (managerName) =>
    getLegacyManagerSeasons(managerName)
        .filter((entry) => entry.champion)
        .map((entry) => entry.year);

export const getLegacyChampions = () =>
    legacyHistory.map((seasonData) => ({
        year: seasonData.year,
        team: seasonData.podium.champion,
        manager: getLegacyTeamManager(seasonData.year, seasonData.podium.champion),
        source: seasonData.source,
    }));
