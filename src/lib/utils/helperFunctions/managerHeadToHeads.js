import { getLeagueData } from './leagueData';
import { leagueID } from '$lib/utils/leagueInfo';
import { getLeagueTeamManagers } from './leagueTeamManagers';
import { waitForAll } from './multiPromise';

let matrixPromise;

const scoreForMatchup = (matchup) => {
    if(Number.isFinite(Number(matchup?.points))) {
        return Number(matchup.points);
    }

    return (matchup?.starters_points || []).reduce(
        (total, score) => total + Number(score || 0),
        0
    );
};

const ensurePair = (matrix, managerOne, managerTwo) => {
    if(!matrix[managerOne]) matrix[managerOne] = {};
    if(!matrix[managerOne][managerTwo]) {
        matrix[managerOne][managerTwo] = {
            wins: 0,
            losses: 0,
            ties: 0,
            games: 0
        };
    }

    return matrix[managerOne][managerTwo];
};

const addManagerResult = (matrix, managerOne, managerTwo, result) => {
    if(!managerOne || !managerTwo || managerOne === managerTwo) return;

    const one = ensurePair(matrix, managerOne, managerTwo);
    const two = ensurePair(matrix, managerTwo, managerOne);

    one.games++;
    two.games++;

    if(result === 'one') {
        one.wins++;
        two.losses++;
    } else if(result === 'two') {
        one.losses++;
        two.wins++;
    } else {
        one.ties++;
        two.ties++;
    }
};

const managersForRoster = (teamManagers, year, rosterID) =>
    teamManagers?.teamManagersMap?.[year]?.[rosterID]?.managers || [];

const processWeek = ({matrix, matchups, teamManagers, year, allowedPairs = null}) => {
    if(!Array.isArray(matchups) || !matchups.length) return;

    const grouped = {};

    for(const matchup of matchups) {
        if(matchup?.matchup_id == null) continue;
        if(!grouped[matchup.matchup_id]) grouped[matchup.matchup_id] = [];
        grouped[matchup.matchup_id].push(matchup);
    }

    for(const key in grouped) {
        const pair = grouped[key];
        if(pair.length !== 2) continue;

        const first = pair[0];
        const second = pair[1];
        const rosterOne = Number(first.roster_id);
        const rosterTwo = Number(second.roster_id);

        if(allowedPairs) {
            const pairKey = [rosterOne, rosterTwo].sort((a, b) => a - b).join(':');
            if(!allowedPairs.has(pairKey)) continue;
        }

        const scoreOne = scoreForMatchup(first);
        const scoreTwo = scoreForMatchup(second);
        const result = scoreOne > scoreTwo ? 'one' : scoreOne < scoreTwo ? 'two' : 'tie';

        const managersOne = managersForRoster(teamManagers, year, rosterOne);
        const managersTwo = managersForRoster(teamManagers, year, rosterTwo);

        for(const managerOne of managersOne) {
            for(const managerTwo of managersTwo) {
                addManagerResult(matrix, managerOne, managerTwo, result);
            }
        }
    }
};

const getWinnersBracketPairsByRound = (bracket) => {
    const byRound = {};

    for(const matchup of bracket || []) {
        const round = Number(matchup?.r);
        if(!Number.isFinite(round)) continue;

        const participants = [matchup.t1, matchup.t2, matchup.w, matchup.l]
            .map(Number)
            .filter(Number.isFinite);

        const unique = [...new Set(participants)];
        if(unique.length < 2) continue;

        const pairKey = unique.slice(0, 2).sort((a, b) => a - b).join(':');
        if(!byRound[round]) byRound[round] = new Set();
        byRound[round].add(pairKey);
    }

    return byRound;
};

const buildMatrix = async () => {
    const teamManagers = await getLeagueTeamManagers();
    const matrix = {};
    let curLeagueID = leagueID;

    while(curLeagueID && curLeagueID != 0) {
        const leagueData = await getLeagueData(curLeagueID).catch((err) => {
            console.error(err);
            return null;
        });

        if(!leagueData) break;

        const year = leagueData.season;
        const playoffWeekStart = Number(leagueData?.settings?.playoff_week_start);

        const regularPromises = [];
        if(playoffWeekStart && playoffWeekStart > 1) {
            for(let week = 1; week < playoffWeekStart; week++) {
                regularPromises.push(
                    fetch(`https://api.sleeper.app/v1/league/${curLeagueID}/matchups/${week}`, {compress: true})
                );
            }
        }

        const regularResponses = regularPromises.length
            ? await waitForAll(...regularPromises)
            : [];

        for(const response of regularResponses) {
            if(!response?.ok) continue;
            const matchups = await response.json();
            processWeek({matrix, matchups, teamManagers, year});
        }

        if(playoffWeekStart) {
            try {
                const bracketResponse = await fetch(
                    `https://api.sleeper.app/v1/league/${curLeagueID}/winners_bracket`,
                    {compress: true}
                );

                if(bracketResponse.ok) {
                    const bracket = await bracketResponse.json();
                    const pairsByRound = getWinnersBracketPairsByRound(bracket);
                    const rounds = Object.keys(pairsByRound).map(Number).sort((a, b) => a - b);

                    const playoffResponses = rounds.length
                        ? await waitForAll(...rounds.map((round) =>
                            fetch(
                                `https://api.sleeper.app/v1/league/${curLeagueID}/matchups/${playoffWeekStart + round - 1}`,
                                {compress: true}
                            )
                        ))
                        : [];

                    for(let i = 0; i < playoffResponses.length; i++) {
                        const response = playoffResponses[i];
                        if(!response?.ok) continue;

                        const matchups = await response.json();
                        processWeek({
                            matrix,
                            matchups,
                            teamManagers,
                            year,
                            allowedPairs: pairsByRound[rounds[i]]
                        });
                    }
                }
            } catch(err) {
                console.error('Unable to build manager playoff head-to-head matrix', err);
            }
        }

        curLeagueID = leagueData.previous_league_id;
    }

    return matrix;
};

export const getManagerHeadToHeadMatrix = () => {
    if(!matrixPromise) {
        matrixPromise = buildMatrix().catch((err) => {
            matrixPromise = null;
            throw err;
        });
    }

    return matrixPromise;
};
