<script>
    import Button, { Group, Label } from '@smui/button';
    import { getLeagueRecords, getLeagueTransactions } from '$lib/utils/helper';
    import AllTimeRecords from './AllTimeRecords.svelte';
    import PerSeasonRecords from './PerSeasonRecords.svelte';

    let {leagueData, totals, stale, leagueTeamManagers} = $props();;

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        totals = newTransactions.totals;
    }

    let leagueManagerRecords = $state();
    let leagueRosterRecords = $state();
    let leagueWeekHighs = $state();
    let leagueWeekLows = $state();
    let allTimeClosestMatchups = $state();
    let allTimeBiggestBlowouts = $state();
    let mostSeasonLongPoints = $state();
    let leastSeasonLongPoints = $state();
    let seasonWeekRecords = $state();
    let currentYear = $state();
    let lastYear = $state();

    const refreshRecords = async () => {
        const newRecords = await getLeagueRecords(true);
        leagueData = newRecords;
    }

    let key = $state("regularSeasonData");

    $effect(() => {
        if(!leagueData || !leagueData[key]) return;

        const selectedLeagueData = leagueData[key];

        leagueManagerRecords = selectedLeagueData.leagueManagerRecords;
        leagueRosterRecords = selectedLeagueData.leagueRosterRecords;
        leagueWeekHighs = selectedLeagueData.leagueWeekHighs;
        leagueWeekLows = selectedLeagueData.leagueWeekLows;
        allTimeClosestMatchups = selectedLeagueData.allTimeClosestMatchups;
        allTimeBiggestBlowouts = selectedLeagueData.allTimeBiggestBlowouts;
        mostSeasonLongPoints = selectedLeagueData.mostSeasonLongPoints;
        leastSeasonLongPoints = selectedLeagueData.leastSeasonLongPoints;
        seasonWeekRecords = selectedLeagueData.seasonWeekRecords;
        currentYear = selectedLeagueData.currentYear;
        lastYear = selectedLeagueData.lastYear;
    });

    if(stale) refreshTransactions();
    if(leagueData.stale) refreshRecords();

    let display = $state("allTime");
    let mobileCategory = $state('scoring');

    const setDisplay = (value) => {
        display = value;
        mobileCategory = value === 'allTime' ? 'scoring' : 'all';
    };
</script>

<style>
    .rankingsWrapper {
        margin: 0 auto;
        width: 100%;
        max-width: 1200px;
    }

    .empty {
        margin: 10em 0 4em;
        text-align: center;
    }

    .buttonHolder {
        text-align: center;
        margin: 2em 0 0;
    }

    .mobileRecordNav { display: none; }

    @media (max-width: 700px) {
        .buttonHolder { margin: 1.1em 0 0; }

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

        .mobileRecordNav::-webkit-scrollbar { display: none; }

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

        /* Mobile category filtering keeps every record available without one giant page. */
        .category-scoring :global(.seasonHighTable),
        .category-scoring :global(.seasonLowTable),
        .category-scoring :global(.blowoutAnchor),
        .category-scoring :global(.closestAnchor),
        .category-scoring :global(.rankingHolder),
        .category-scoring :global(.rankingTableWrapper),
        .category-scoring :global(.buttonHolder) {
            display: none !important;
        }

        .category-season :global(.scoringHighAnchor),
        .category-season :global(.scoringLowAnchor),
        .category-season :global(.blowoutAnchor),
        .category-season :global(.closestAnchor),
        .category-season :global(.rankingHolder),
        .category-season :global(.rankingTableWrapper),
        .category-season :global(.buttonHolder) {
            display: none !important;
        }

        .category-matchups :global(.scoringHighAnchor),
        .category-matchups :global(.scoringLowAnchor),
        .category-matchups :global(.seasonHighTable),
        .category-matchups :global(.seasonLowTable),
        .category-matchups :global(.rankingHolder),
        .category-matchups :global(.rankingTableWrapper),
        .category-matchups :global(.buttonHolder) {
            display: none !important;
        }

        .category-rankings :global(.fullFlex),
        .category-rankings :global(.recordQuickLinks) {
            display: none !important;
        }

        .recordsContent :global(.recordsHeader) { margin-top: 18px; }
        .recordsContent :global(.recordQuickLinks) { margin-bottom: 16px; }
        .recordsContent :global(.fullFlex) { margin-bottom: 28px; }
    }

    @media (max-width: 540px) {
        :global(.buttonHolder .selectionButtons) { font-size: 0.6em; }
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

<div class="rankingsWrapper">
    <div class="buttonHolder">
        <Group variant="outlined">
            <Button class="selectionButtons" onclick={() => key = "regularSeasonData"} variant="{key == "regularSeasonData" ? "raised" : "outlined"}">
                <Label>Regular Season</Label>
            </Button>
            <Button class="selectionButtons" onclick={() => key = "playoffData"} variant="{key == "playoffData" ? "raised" : "outlined"}">
                <Label>Playoffs</Label>
            </Button>
        </Group>
        <br />
        <Group variant="outlined">
            <Button class="selectionButtons" onclick={() => setDisplay("allTime")} variant="{display == "allTime" ? "raised" : "outlined"}">
                <Label>All-Time Records</Label>
            </Button>
            <Button class="selectionButtons" onclick={() => setDisplay("season")} variant="{display == "season" ? "raised" : "outlined"}">
                <Label>Season Records</Label>
            </Button>
        </Group>
    </div>

    {#if display == "allTime"}
        <nav class="mobileRecordNav" aria-label="Record categories">
            <button class:active={mobileCategory === 'scoring'} class="categoryButton" onclick={() => mobileCategory = 'scoring'}>🔥 Scoring</button>
            <button class:active={mobileCategory === 'season'} class="categoryButton" onclick={() => mobileCategory = 'season'}>📅 Seasons</button>
            <button class:active={mobileCategory === 'matchups'} class="categoryButton" onclick={() => mobileCategory = 'matchups'}>⚔️ Matchups</button>
            <button class:active={mobileCategory === 'rankings'} class="categoryButton" onclick={() => mobileCategory = 'rankings'}>📊 Rankings</button>
            <button class:active={mobileCategory === 'all'} class="categoryButton" onclick={() => mobileCategory = 'all'}>All</button>
        </nav>
    {/if}

    <div class="recordsContent category-{mobileCategory}">
        {#if display == "allTime"}
            {#if leagueWeekHighs?.length}
                <AllTimeRecords transactionTotals={totals} {allTimeClosestMatchups} {allTimeBiggestBlowouts} {leagueManagerRecords} {leagueRosterRecords} {leagueWeekHighs} {leagueWeekLows} {leagueTeamManagers} {mostSeasonLongPoints} {leastSeasonLongPoints} {key} />
            {:else}
                <p class="empty">No records <i>yet</i>...</p>
            {/if}
        {:else}
            <PerSeasonRecords transactionTotals={totals} {leagueRosterRecords} {seasonWeekRecords} {leagueTeamManagers} {currentYear} {lastYear} {key} />
        {/if}
    </div>
</div>