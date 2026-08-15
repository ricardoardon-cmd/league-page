import {
    getLeagueRosters,
    getLeagueTeamManagers,
    getPreviousDrafts,
    getLeagueTransactions,
    loadPlayers,
    waitForAll
} from '$lib/utils/helper';

export async function load({ fetch }) {

    const playersInfo = waitForAll(
        getLeagueRosters(),
        getLeagueTeamManagers(),
        loadPlayers(fetch),
        getPreviousDrafts(),
        getLeagueTransactions(false)
    );

    return {
        playersInfo
    };
}
