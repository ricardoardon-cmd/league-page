// Legacy GGL history reconstructed from the old NFL Fantasy league screenshots.
//
// This file is intentionally separate from Sleeper data. The legacy era does
// not have weekly matchup detail, so it should never be used for historical
// head-to-head calculations.

export const LEGACY_SOURCE = 'legacy';

const season = (year, teams, podium = {}, notes = []) => ({
    year,
    source: LEGACY_SOURCE,
    platform: 'NFL Fantasy',
    teams,
    podium,
    notes,
});

const team = (name, manager) => ({ name, manager });

export const legacyHistory = [
    season(2012, [
        team('Victorious Secret', 'Pico'),
        team('Sofa King Beast', 'Brandon'),
        team('Rated M for Gore', 'Henry'),
        team('Casper on Deez Niggaz', 'Ghost Team'),
        team('The MacDaddys', 'Dustin'),
        team('Swag Nasty', 'Myron'),
    ], {
        champion: 'The MacDaddys',
        runnerUp: 'Swag Nasty',
        thirdPlace: 'Sofa King Beast',
    }),

    season(2013, [
        team('Div Gobblers', 'Luis'),
        team('Kaeptain Luck My Harbaughs', 'Henry'),
        team('Megatron is the Ansah', 'Brandon'),
        team('The Brotherhood', 'Pico'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Ghost Team', 'Ghost Team'),
    ], {
        champion: 'The Brotherhood',
        runnerUp: 'Kaeptain Luck My Harbaughs',
        thirdPlace: 'Div Gobblers',
    }),

    season(2014, [
        team('Megatron is the Ansah', 'Brandon'),
        team('SuckMyDitka', 'Andreas'),
        team('Majari-Bimbo', 'Ariel'),
        team('Karptain Lick My Harbaughs', 'Henry'),
        team('Purple Swag', 'Andy'),
        team('The Brotherhood', 'Pico'),
        team('Man Gobblers', 'Luis'),
        team('Orange and Blue Balls', 'Jared'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Team Austin', 'Austin'),
    ], {
        champion: 'Purple Swag',
        runnerUp: 'The Brotherhood',
        thirdPlace: 'Megatron is the Ansah',
    }, ['Last 1-QB season']),

    season(2015, [
        team('Jones and Murrays', 'Andy'),
        team('Man Gobblers', 'Luis'),
        team('SuckMyDitka', 'Andreas'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Majari-Bimbo', 'Ariel'),
        team('Megatron is the Ansah', 'Brandon'),
        team('The Injury Bugs', 'Pico'),
        team('Orange and Blue Balls', 'Jared'),
    ], {
        champion: 'Jones and Murrays',
        runnerUp: 'SuckMyDitka',
        thirdPlace: 'Man Gobblers',
    }, ['First 2-QB season']),

    season(2016, [
        team('Player 1', 'Brandon'),
        team('Purple Swag', 'Andy'),
        team('SuckMyDitka', 'Andreas'),
        team('Man Gobblers', 'Luis'),
        team('Majari-Bimbo', 'Ariel'),
        team('Macdaddy the Pimp', 'Dustin'),
        team('Wentz Upon a Time', 'Pico'),
        team('Orange and Blue Balls', 'Jared'),
    ], {
        champion: 'Player 1',
        runnerUp: 'Purple Swag',
        thirdPlace: 'Man Gobblers',
    }),

    season(2017, [
        team('Team 6', 'Igoe'),
        team('Casper the Fantasy Ghost', 'Ghost Team'),
        team('Player 1', 'Brandon'),
        team('Purple Swag', 'Andy'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Orange and Blue Balls', 'Jared'),
        team('Your Butt Ertz from my Johnson', 'Pico'),
        team('I Forte my Revis n Bowles in U', 'Luis'),
    ], {
        champion: 'Team 6',
        runnerUp: 'Player 1',
        thirdPlace: 'Casper the Fantasy Ghost',
    }),

    season(2018, [
        team('Player 1', 'Brandon'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Eddie', 'Eddie'),
        team('Purple Swag', 'Andy'),
        team('Orange and Blue Balls', 'Jared'),
        team('Struggle Bus', 'Pico'),
        team('The Champ', 'Igoe'),
        team('Barry McCokinner', 'Luis'),
    ], {
        champion: 'Purple Swag',
        runnerUp: 'MacDaddy the Pimp',
        thirdPlace: 'Player 1',
    }),

    season(2019, [
        team('Chilling with Mahomes', 'Isai'),
        team('I Wentz to Hyde my Chubb in...', 'Pico'),
        team('Purple Swag', 'Andy'),
        team('Kylermurraysbleachedassho...', 'Ariel'),
        team('Player 1', 'Brandon'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Barry McCokinner', 'Luis'),
        team('Mack N Cheese', 'Igoe'),
        team('Eddie', 'Eddie'),
        team('Orange and Blue Balls', 'Jared'),
    ], {
        champion: 'Chilling with Mahomes',
        runnerUp: 'I Wentz to Hyde my Chubb in...',
        thirdPlace: 'Kylermurraysbleachedassho...',
    }),

    season(2020, [
        team('Ham05', 'Tony'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Kylermurraybleachedasshole', 'Ariel'),
        team('I wentz to clyde my jones in U', 'Pico'),
        team('Eddie', 'Eddie'),
        team('Big Truss', 'Gabe'),
        team('Purple Swag', 'Andy'),
        team('Taco for the win', 'Jared'),
        team('Team IR', 'Igoe'),
        team('The ACL Sprainers', 'Isai'),
    ], {
        champion: 'Ham05',
        runnerUp: 'Big Truss',
        thirdPlace: 'Eddie',
    }),

    season(2021, [
        team("Rollin' with Mahomies", 'Pico'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Bad Juju', 'Igoe'),
        team('Taco for the Win', 'Jared'),
        team('Lights Rodgers Action', 'Eddie'),
        team('DhoponKyler', 'Ariel'),
        team('Sunday Scaries', 'Andy'),
        team('Champ Ham', 'Tony'),
        team('MegaWatt', 'Gabe'),
        team('The Hurts Locker', 'Isai'),
    ], {
        champion: 'MacDaddy the Pimp',
        runnerUp: "Rollin' with Mahomies",
        thirdPlace: 'Taco for the Win',
    }),

    season(2022, [
        team('Breeces is in Pieces', 'Isai'),
        team('I GO', 'Igoe'),
        team('Smokin this Herb', 'Pico'),
        team('Taco for the win', 'Jared'),
        team('BirdGang', 'Gabe'),
        team('Tuacide Squad', 'Andy'),
        team('Get Rich or Die Trying', 'Eddie'),
        team('MacDaddy the Pimp', 'Dustin'),
        team('Picosfatass', 'Ariel'),
        team('Ham', 'Tony'),
    ], {
        champion: 'I GO',
        runnerUp: 'Breeces is in Pieces',
        thirdPlace: 'Smokin this Herb',
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
                champion: normalize(seasonData.podium.champion) === normalize(ownedTeam.name),
                runnerUp: normalize(seasonData.podium.runnerUp) === normalize(ownedTeam.name),
                thirdPlace: normalize(seasonData.podium.thirdPlace) === normalize(ownedTeam.name),
            };
        })
        .filter(Boolean);
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
