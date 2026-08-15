<script>
    import {round} from '$lib/utils/helper'
  	import RecordsAndRankings from './RecordsAndRankings.svelte';
    import LeagueScoringHistory from './LeagueScoringHistory.svelte';

    export let key, leagueManagerRecords, leagueRosterRecords, leagueTeamManagers, leagueWeekHighs, leagueWeekLows, allTimeBiggestBlowouts, allTimeClosestMatchups, mostSeasonLongPoints, leastSeasonLongPoints, transactionTotals;

    let winPercentages = [];
    let lineupIQs = [];
    let fptsHistories = [];
    let tradesData = [];
    let waiversData = [];
    let seasonScoringHistory = [];

    let showTies = false;
    
    for(const managerID in transactionTotals.allTime) {
        tradesData.push({
            managerID,
            trades: transactionTotals.allTime[managerID].trade,
        })
        waiversData.push({
            managerID,
            waivers: transactionTotals.allTime[managerID].waiver,
        })
    }

    const setSeasonScoringHistory = (lRR) => {
        const seasons = {};

        for (const rosterID in lRR || {}) {
            const rosterRecord = lRR[rosterID];

            for (const season of rosterRecord?.years || []) {
                const seasonYear = Number(season.year);
                const ppg = Number(season.fptsPerGame);

                if (!Number.isFinite(seasonYear) || !Number.isFinite(ppg)) {
                    continue;
                }

                if (!seasons[seasonYear]) {
                    seasons[seasonYear] = {
                        totalPPG: 0,
                        teams: 0
                    };
                }

                seasons[seasonYear].totalPPG += ppg;
                seasons[seasonYear].teams++;
            }
        }

        seasonScoringHistory = Object.entries(seasons)
            .map(([year, values]) => ({
                year: Number(year),
                averagePPG: round(values.totalPPG / values.teams),
                teams: values.teams
            }))
            .sort((a, b) => a.year - b.year);
    };

    const setRankingsData = (lRR) => {
        winPercentages = [];
        lineupIQs = [];
        fptsHistories = [];
        tradesData = [];
        waiversData = [];
        showTies = false;

        for(const key in lRR) {
            const leagueManagerRecord = lRR[key];
            const denominator = (leagueManagerRecord.wins + leagueManagerRecord.ties + leagueManagerRecord.losses) > 0 ? (leagueManagerRecord.wins + leagueManagerRecord.ties + leagueManagerRecord.losses) : 1;
            winPercentages.push({
                managerID: key,
                percentage: round((leagueManagerRecord.wins + leagueManagerRecord.ties / 2) / denominator * 100),
                wins: leagueManagerRecord.wins,
                ties: leagueManagerRecord.ties,
                losses: leagueManagerRecord.losses,
            })

            let lineupIQ = {
                managerID: key,
                fpts: round(leagueManagerRecord.fptsFor),
            }

            if(leagueManagerRecord.potentialPoints) {
                lineupIQ.iq = round(leagueManagerRecord.fptsFor / leagueManagerRecord.potentialPoints * 100);
                lineupIQ.potentialPoints = round(leagueManagerRecord.potentialPoints);
            }

            lineupIQs.push(lineupIQ)
        
            fptsHistories.push({
                managerID: key,
                fptsFor: round(leagueManagerRecord.fptsFor),
                fptsAgainst: round(leagueManagerRecord.fptsAgainst),
                fptsPerGame: round(leagueManagerRecord.fptsFor / denominator),
            })
        
            if(leagueManagerRecord.ties > 0) showTies = true;
        }

        for(const managerID in transactionTotals.allTime) {
            tradesData.push({
                managerID,
                trades: transactionTotals.allTime[managerID].trade,
            })
            waiversData.push({
                managerID,
                waivers: transactionTotals.allTime[managerID].waiver,
            })
        }

        winPercentages.sort((a, b) => b.percentage - a.percentage);
        lineupIQs.sort((a, b) => b.iq - a.iq);
        fptsHistories.sort((a, b) => b.fptsFor - a.fptsFor);
        tradesData.sort((a, b) => b.trades - a.trades);
        waiversData.sort((a, b) => b.waivers - a.waivers);
    }

    $:setRankingsData(leagueManagerRecords)
    $:setSeasonScoringHistory(leagueRosterRecords)
</script>

{#if key == "regularSeasonData" && seasonScoringHistory?.length > 1}
    <LeagueScoringHistory data={seasonScoringHistory} />
{/if}

<RecordsAndRankings
    blowouts={allTimeBiggestBlowouts}
    closestMatchups={allTimeClosestMatchups}
    weekRecords={leagueWeekHighs}
    weekLows={leagueWeekLows}
    seasonLongRecords={mostSeasonLongPoints}
    seasonLongLows={leastSeasonLongPoints}
    {showTies}
    {winPercentages}
    {fptsHistories}
    {lineupIQs}
    {tradesData}
    {waiversData}
    prefix="All-Time"
    allTime={true}
    {leagueTeamManagers}
    {key}
/>
