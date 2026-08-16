import { getLeagueStandings, getLeagueTeamManagers } from '$lib/utils/helper';
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

    const playoffBracketData = fetch(
        `https://api.sleeper.app/v1/league/${selectedLeagueID}/winners_bracket`
    )
        .then((response) => response.ok ? response.json() : [])
        .catch(() => []);

    return {
        standingsData,
        leagueTeamManagersData,
        playoffBracketData,
        availableSeasons,
        selectedSeason
    };
}
