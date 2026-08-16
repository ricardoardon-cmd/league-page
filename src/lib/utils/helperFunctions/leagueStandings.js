import { leagueID } from '$lib/utils/leagueInfo';
import { getNflState } from './nflState';
import { getLeagueData } from './leagueData';
import { getLeagueRosters } from './leagueRosters';
import { waitForAll } from './multiPromise';
import { get } from 'svelte/store';
import { standingsStore } from '$lib/stores';
import { round } from './universalFunctions';

const buildStandingsFromRosters = (rosters, divisions) => {
    const standings = {};

    for(const rosterID in rosters) {
        const roster = rosters[rosterID];
        standings[rosterID] = {
            rosterID,
            wins: roster.settings?.wins || 0,
            losses: roster.settings?.losses || 0,
            ties: roster.settings?.ties || 0,
            fpts: round((roster.settings?.fpts || 0) + ((roster.settings?.fpts_decimal || 0) / 100)),
            fptsAgainst: round((roster.settings?.fpts_against || 0) + ((roster.settings?.fpts_against_decimal || 0) / 100)),
            streak: roster.metadata?.streak || 0,
            divisionWins: divisions ? 0 : null,
            divisionLosses: divisions ? 0 : null,
            divisionTies: divisions ? 0 : null,
        };
    }

    return standings;
};

const processStandings = (matchup, standingsData, rosters) => {
    const matchups = {};

    for(const match of matchup || []) {
        if(match.matchup_id == null) continue;
        if(!matchups[match.matchup_id]) matchups[match.matchup_id] = [];

        const rosterID = match.roster_id;
        matchups[match.matchup_id].push({
            rosterID,
            division: rosters[rosterID]?.settings?.division,
            points: Number(match.points || 0),
        });
    }

    for(const matchupKey in matchups) {
        const pair = matchups[matchupKey];
        if(pair.length !== 2) continue;

        const teamA = pair[0];
        const teamB = pair[1];
        const divisionMatchup = teamA.division && teamB.division && teamA.division == teamB.division;

        if(!divisionMatchup) continue;

        if(teamA.points > teamB.points) {
            standingsData[teamA.rosterID].divisionWins++;
            standingsData[teamB.rosterID].divisionLosses++;
        } else if(teamB.points > teamA.points) {
            standingsData[teamB.rosterID].divisionWins++;
            standingsData[teamA.rosterID].divisionLosses++;
        } else {
            standingsData[teamA.rosterID].divisionTies++;
            standingsData[teamB.rosterID].divisionTies++;
        }
    }

    return standingsData;
};

const addDivisionRecords = async (standings, rosters, queryLeagueID, weeksToLoad) => {
    if(weeksToLoad < 1) return standings;

    const matchupResponses = await waitForAll(
        ...Array.from({length: weeksToLoad}, (_, ix) =>
            fetch(`https://api.sleeper.app/v1/league/${queryLeagueID}/matchups/${ix + 1}`, {compress: true})
        )
    );

    const matchupData = await waitForAll(
        ...matchupResponses.map(async (response) => response.ok ? response.json() : [])
    );

    for(const week of matchupData) {
        standings = processStandings(week, standings, rosters);
    }

    return standings;
};

export const getLeagueStandings = async (queryLeagueID = leagueID) => {
    const cached = get(standingsStore);
    if(cached?.[queryLeagueID]?.standingsInfo) return cached[queryLeagueID];

    // Backward compatibility with the original single-season cache shape.
    if(queryLeagueID === leagueID && cached?.standingsInfo) return cached;

    const leagueData = await getLeagueData(queryLeagueID);
    const rostersData = await getLeagueRosters(queryLeagueID);
    const rosters = rostersData.rosters;
    const yearData = leagueData.season;
    const regularSeasonLength = Math.max(0, Number(leagueData.settings?.playoff_week_start || 1) - 1);
    const divisions = Number(leagueData.settings?.divisions || 0) > 1;
    const isCurrentLeague = String(queryLeagueID) === String(leagueID);

    let nflState = null;
    if(isCurrentLeague) {
        nflState = await getNflState().catch(() => null);

        if(
            (leagueData.status !== 'in_season' && leagueData.status !== 'post_season' && leagueData.status !== 'complete') ||
            Number(nflState?.week || 0) < 1
        ) {
            return null;
        }
    }

    let standings = buildStandingsFromRosters(rosters, divisions);

    if(divisions) {
        let weeksToLoad = regularSeasonLength;

        if(isCurrentLeague && leagueData.status === 'in_season') {
            const displayWeek = Number(nflState?.display_week || nflState?.week || 0);
            weeksToLoad = Math.max(0, Math.min(regularSeasonLength, displayWeek - 1));
        }

        standings = await addDivisionRecords(
            standings,
            rosters,
            queryLeagueID,
            weeksToLoad
        ).catch((err) => {
            console.error(err);
            return standings;
        });
    }

    const response = {
        standingsInfo: standings,
        yearData,
        leagueID: queryLeagueID,
    };

    standingsStore.update((store) => ({
        ...(store?.standingsInfo && !store[leagueID] ? {[leagueID]: store} : store),
        [queryLeagueID]: response
    }));

    return response;
};
