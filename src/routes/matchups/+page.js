import { getBrackets, getLeagueMatchups, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ url, fetch }) {
    const queryWeek = url?.searchParams?.get('week');
    const queryYear = url?.searchParams?.get('year');

    return {
        queryWeek: queryWeek && !isNaN(queryWeek) ? queryWeek : null,
        queryYear: queryYear && !isNaN(queryYear) ? queryYear : null,
        matchupsData: getLeagueMatchups(),
        bracketsData: getBrackets(),
        leagueTeamManagersData: getLeagueTeamManagers(),
        playersData: loadPlayers(fetch),
    };
}