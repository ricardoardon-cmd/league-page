import { getLeagueStandings, getLeagueTeamManagers } from '$lib/utils/helper';
import { leagueID } from '$lib/utils/leagueInfo';

export async function load({ fetch }) {

    const standingsData = getLeagueStandings();
    const leagueTeamManagersData = getLeagueTeamManagers();

    const playoffBracketData = fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/winners_bracket`
    )
        .then((response) => response.ok ? response.json() : [])
        .catch(() => []);

    return {
        standingsData,
        leagueTeamManagersData,
        playoffBracketData
    };
}
