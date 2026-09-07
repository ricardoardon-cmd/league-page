import { getLeagueData, getLeagueRosters, getLeagueTeamManagers, getPreviousDrafts, loadPlayers, waitForAll } from '$lib/utils/helper';

export async function load({fetch}) {
    const rostersInfo = waitForAll(
        getLeagueData(),
        getLeagueRosters(),
        getLeagueTeamManagers(),
        loadPlayers(fetch),
        getPreviousDrafts()
    )

    return {
        rostersInfo
    };
}