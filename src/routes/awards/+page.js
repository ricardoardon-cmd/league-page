import { getAwards, getLeagueTeamManagers, getLeagueRecords } from '$lib/utils/helper';

export async function load() {
    const awardsData = getAwards();
    const teamManagersData = getLeagueTeamManagers();
    const recordsData = getLeagueRecords();

    return {
        awardsData,
        teamManagersData,
        recordsData,
    };
}