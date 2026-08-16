<script>
    import Button, { Group, Label } from '@smui/button';
    import {round} from '$lib/utils/helper'
  	import RecordsAndRankings from './RecordsAndRankings.svelte';

    export let leagueRosterRecords, seasonWeekRecords, leagueTeamManagers, currentYear, lastYear, transactionTotals, key;

    let yearsObj = {};
    let years = [];

    const setData = (lRR) => {
        yearsObj = {};
        years = [];

        let loopYear = currentYear;
        while(loopYear >= lastYear) {
            yearsObj[loopYear] = {
                seasonLongRecords: [],
                winPercentages: [],
                lineupIQs: [],
                fptsHistories: [],
                tradesData: [],
                waiversData: [],
                blowouts: [],
                closestMatchups: [],
                showTies: false,
                year: loopYear
            }
            loopYear--;
        }

        for(const seasonWeekRecord of seasonWeekRecords) {
            yearsObj[seasonWeekRecord.year].weekRecords = seasonWeekRecord.seasonPointsHighs;
            yearsObj[seasonWeekRecord.year].weekLows = seasonWeekRecord.seasonPointsLows;
            yearsObj[seasonWeekRecord.year].blowouts = seasonWeekRecord.biggestBlowouts;
            yearsObj[seasonWeekRecord.year].closestMatchups = seasonWeekRecord.closestMatchups;
        }
        
        for(const season in transactionTotals.seasons) {
            if(!yearsObj[season]) continue;
            for(const rosterID in transactionTotals.seasons[season]) {
                yearsObj[season].tradesData.push({
                    rosterID,
                    trades: transactionTotals.seasons[season][rosterID].trade,
                })
                yearsObj[season].waiversData.push({
                    rosterID,
                    waivers: transactionTotals.seasons[season][rosterID].waiver,
                })
            }
        }
        for(const rosterID in lRR) {
            const leagueManagerRecord = lRR[rosterID];
            for(const season of leagueManagerRecord.years) {
                if(season.ties > 0) {
                    yearsObj[season.year].showTies = true;
                }

                const fpts = round(season.fpts);
                const fptsPerGame = round(season.fptsPerGame);

                yearsObj[season.year].seasonLongRecords.push({
                    rosterID,
                    fpts,
                    fptsPerGame,
                    year: null,
                })

                yearsObj[season.year].winPercentages.push({
                    rosterID,
                    percentage: round((season.wins + season.ties / 2) / (season.wins + season.ties + season.losses) * 100),
                    wins: season.wins,
                    ties: season.ties,
                    losses: season.losses,
                })

                let lineupIQ = {
                    rosterID,
                    fpts: round(season.fpts),
                }
                if(season.potentialPoints) {
                    lineupIQ.iq = round(season.fpts / season.potentialPoints * 100);
                    lineupIQ.potentialPoints = round(season.potentialPoints);
                }

                yearsObj[season.year].lineupIQs.push(lineupIQ)

                yearsObj[season.year].fptsHistories.push({
                    rosterID,
                    fptsFor: round(season.fpts),
                    fptsAgainst: round(season.fptsAgainst),
                    fptsPerGame: round(season.fptsPerGame),
                })
            }
        }

        for(const key in yearsObj) {
            yearsObj[key].seasonLongLows = yearsObj[key].seasonLongRecords.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10);
            yearsObj[key].seasonLongRecords = yearsObj[key].seasonLongRecords.sort((a, b) => b.fpts - a.fpts).slice(0, 10);
            yearsObj[key].winPercentages.sort((a, b) => b.percentage - a.percentage);
            yearsObj[key].lineupIQs.sort((a, b) => b.iq - a.iq);
            yearsObj[key].fptsHistories.sort((a, b) => b.fptsFor - a.fptsFor);
            yearsObj[key].tradesData.sort((a, b) => b.trades - a.trades);
            yearsObj[key].waiversData.sort((a, b) => b.waivers - a.waivers);
            years.push(yearsObj[key]);
        }

        years.sort((a, b) => b.year - a.year);
    }

    let display = 0;
    let mobileCategory = 'all';

    const selectYear = (ix) => {
        display = ix;
        mobileCategory = 'all';
    };

    const jumpToRecord = (category, id) => {
        mobileCategory = category;
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    };

    $: setData(leagueRosterRecords);
</script>

<style>
    .buttonHolder {
        text-align: center;
        margin: 0;
    }

    .mobileRecordNav,
    .mobileRecordSubnav {
        display: none;
    }

    @media (max-width: 700px) {
        .mobileRecordNav {
            display: flex;
            gap: 7px;
            width: calc(100% - 20px);
            margin: 14px auto 2px;
            padding: 4px;
            box-sizing: border-box;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .mobileRecordNav::-webkit-scrollbar,
        .mobileRecordSubnav::-webkit-scrollbar {
            display: none;
        }

        .categoryButton {
            flex: 0 0 auto;
            min-height: 38px;
            padding: 7px 12px;
            border: 1px solid var(--ccc);
            border-radius: 999px;
            background: var(--f3f3f3);
            color: inherit;
            font: inherit;
            font-size: .68rem;
            font-weight: 850;
            white-space: nowrap;
            cursor: pointer;
        }

        .categoryButton.active {
            background: var(--blueTwo);
            border-color: var(--blueOne);
            color: #fff;
        }

        .mobileRecordSubnav {
            display: flex;
            gap: 7px;
            width: calc(100% - 28px);
            margin: 2px auto 8px;
            padding: 2px 0;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .quickJumpButton {
            flex: 0 0 auto;
            min-height: 30px;
            padding: 5px 10px;
            border: 1px solid var(--ccc);
            border-radius: 999px;
            background: transparent;
            color: inherit;
            font: inherit;
            font-size: .62rem;
            font-weight: 750;
            white-space: nowrap;
            cursor: pointer;
            opacity: .82;
        }

        .quickJumpButton:active { transform: scale(.98); }

        .category-scoring :global(.seasonHighTable),
        .category-scoring :global(.seasonLowTable),
        .category-scoring :global(.blowoutAnchor),
        .category-scoring :global(.closestAnchor),
        .category-scoring :global(.rankingHolder),
        .category-scoring :global(.rankingTableWrapper),
        .category-scoring :global(.buttonHolder),
        .category-scoring :global(h4) { display: none !important; }

        .category-season :global(.scoringHighAnchor),
        .category-season :global(.scoringLowAnchor),
        .category-season :global(.blowoutAnchor),
        .category-season :global(.closestAnchor),
        .category-season :global(.rankingHolder),
        .category-season :global(.rankingTableWrapper),
        .category-season :global(.buttonHolder),
        .category-season :global(h4) { display: none !important; }

        .category-matchups :global(.scoringHighAnchor),
        .category-matchups :global(.scoringLowAnchor),
        .category-matchups :global(.seasonHighTable),
        .category-matchups :global(.seasonLowTable),
        .category-matchups :global(.rankingHolder),
        .category-matchups :global(.rankingTableWrapper),
        .category-matchups :global(.buttonHolder),
        .category-matchups :global(h4) { display: none !important; }

        .category-rankings :global(.fullFlex),
        .category-rankings :global(.recordQuickLinks) { display: none !important; }

        .seasonRecordsContent :global(.recordQuickLinks) { display: none !important; }
    }

    @media (max-width: 540px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.6em;
        }
    }

    @media (max-width: 415px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
        }
    }

    @media (max-width: 315px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.45em;
            padding: 0 3px;
        }
    }
</style>

<div class="buttonHolder">
    <Group variant="outlined">
        {#each years as {year}, ix}
            <Button class="selectionButtons" onclick={() => selectYear(ix)} variant="{display == ix ? "raised" : "outlined"}">
                <Label>{year}</Label>
            </Button>
        {/each}
    </Group>
</div>

<nav class="mobileRecordNav" aria-label="Season record categories">
    <button class:active={mobileCategory === 'all'} class="categoryButton" onclick={() => mobileCategory = 'all'}>All</button>
    <button class:active={mobileCategory === 'scoring'} class="categoryButton" onclick={() => mobileCategory = 'scoring'}>🔥 Scoring</button>
    <button class:active={mobileCategory === 'season'} class="categoryButton" onclick={() => mobileCategory = 'season'}>📅 Seasons</button>
    <button class:active={mobileCategory === 'matchups'} class="categoryButton" onclick={() => mobileCategory = 'matchups'}>⚔️ Matchups</button>
    <button class:active={mobileCategory === 'rankings'} class="categoryButton" onclick={() => mobileCategory = 'rankings'}>📊 Rankings</button>
</nav>

{#if mobileCategory === 'all' || mobileCategory === 'scoring' || mobileCategory === 'matchups'}
    <nav class="mobileRecordSubnav" aria-label="Season record quick links">
        {#if mobileCategory === 'all' || mobileCategory === 'scoring'}
            <button class="quickJumpButton" onclick={() => jumpToRecord('scoring', 'scoring-highs')}>🔥 Scoring Highs</button>
            <button class="quickJumpButton" onclick={() => jumpToRecord('scoring', 'scoring-lows')}>🧊 Scoring Lows</button>
        {/if}
        {#if mobileCategory === 'all' || mobileCategory === 'matchups'}
            <button class="quickJumpButton" onclick={() => jumpToRecord('matchups', 'blowouts')}>💥 Largest Blowouts</button>
            <button class="quickJumpButton" onclick={() => jumpToRecord('matchups', 'closest-wins')}>🤏 Closest Wins</button>
        {/if}
    </nav>
{/if}

<div class="seasonRecordsContent category-{mobileCategory}">
    <RecordsAndRankings
        waiversData={years[display].waiversData}
        tradesData={years[display].tradesData}
        weekRecords={years[display].weekRecords}
        weekLows={years[display].weekLows}
        seasonLongLows={years[display].seasonLongLows}
        seasonLongRecords={years[display].seasonLongRecords}
        showTies={years[display].showTies}
        winPercentages={years[display].winPercentages}
        fptsHistories={years[display].fptsHistories}
        lineupIQs={years[display].lineupIQs}
        blowouts={years[display].blowouts}
        closestMatchups={years[display].closestMatchups}
        prefix={years[display].year}
        {leagueTeamManagers}
        {key}
    />
</div>
