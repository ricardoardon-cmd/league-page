import {
    getLeagueStandings,
    getLeagueTeamManagers,
    loadPlayers
} from '$lib/utils/helper';
import { getLeagueData } from '$lib/utils/helperFunctions/leagueData';
import { leagueID } from '$lib/utils/leagueInfo';

export async function load({ fetch, url }) {
    const leagueTeamManagers = await getLeagueTeamManagers();

    const availableSeasons = Object.keys(
        leagueTeamManagers?.leagueIDsBySeason || {}
    )
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => b - a);

    const requestedSeason = Number(url.searchParams.get('season'));
    const selectedSeason = availableSeasons.includes(requestedSeason)
        ? requestedSeason
        : Number(leagueTeamManagers?.currentSeason || availableSeasons[0]);

    const selectedLeagueID =
        leagueTeamManagers?.leagueIDsBySeason?.[selectedSeason] || leagueID;

    const standingsData = getLeagueStandings(selectedLeagueID);
    const leagueTeamManagersData = Promise.resolve(leagueTeamManagers);
    const playersData = loadPlayers(fetch);

    const leagueData = await getLeagueData(selectedLeagueID);
    const playoffWeekStart = Number(
        leagueData?.settings?.playoff_week_start || 0
    );

    const playoffBracketData = fetch(
        `https://api.sleeper.app/v1/league/${selectedLeagueID}/winners_bracket`
    )
        .then((response) => response.ok ? response.json() : [])
        .catch(() => []);

    const playoffMatchupsData = playoffBracketData.then(async (bracket) => {
        if(!playoffWeekStart || !Array.isArray(bracket) || !bracket.length) {
            return { byRound: {}, weeksByRound: {} };
        }

        const rounds = [
            ...new Set(
                bracket
                    .map((matchup) => Number(matchup?.r))
                    .filter(Number.isFinite)
            )
        ].sort((a, b) => a - b);

        const responses = await Promise.all(
            rounds.map(async (round) => {
                const week = playoffWeekStart + round - 1;

                try {
                    const response = await fetch(
                        `https://api.sleeper.app/v1/league/${selectedLeagueID}/matchups/${week}`
                    );

                    return {
                        round,
                        week,
                        matchups: response.ok ? await response.json() : []
                    };
                } catch(err) {
                    console.error(
                        `Unable to load ${selectedSeason} playoff round ${round}`,
                        err
                    );

                    return { round, week, matchups: [] };
                }
            })
        );

        const byRound = {};
        const weeksByRound = {};

        for(const response of responses) {
            byRound[response.round] = response.matchups;
            weeksByRound[response.round] = response.week;
        }

        return { byRound, weeksByRound };
    });

    return {
        standingsData,
        leagueTeamManagersData,
        playoffBracketData,
        playoffMatchupsData,
        playersData,
        availableSeasons,
        selectedSeason
    };
}
