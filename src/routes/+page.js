import {
    getLeagueRosters,
    getLeagueTeamManagers,
    loadPlayers,
    waitForAll
} from '$lib/utils/helper';

export async function load({ fetch }) {

    const playersInfo = waitForAll(
        getLeagueRosters(),
        getLeagueTeamManagers(),
        loadPlayers(fetch)
    );

    return {
        playersInfo
    };
}
