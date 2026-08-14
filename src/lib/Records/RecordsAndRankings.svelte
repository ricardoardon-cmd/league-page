<script>
    import Button, { Group, Label } from '@smui/button';
    import {
        generateGraph,
        gotoManager,
        round,
        getLeagueData,
        loadPlayers
    } from '$lib/utils/helper';
    import { leagueID } from '$lib/utils/leagueInfo';

  	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
	import RecordTeam from './RecordTeam.svelte';
	import BarChart from '$lib/BarChart.svelte';

    export let key, tradesData, waiversData, weekRecords, weekLows, seasonLongRecords, seasonLongLows, showTies, winPercentages, fptsHistories, lineupIQs, prefix, blowouts, closestMatchups, allTime=false, leagueTeamManagers;

    let graphs = [];
    let curTable = 0;
    let curGraph = 0;

    let iqOffset = 0;
    let tables = [
        "Win Percentages",
        "Points",
        "Transactions",
    ]

    const year = allTime ? null : prefix;

    const changeTable = (newGraph) => {
        switch (newGraph) {
            case 0 - iqOffset:
            case (4 + (99 * iqOffset)):
                curTable = 0;
                break;
            case 1 - iqOffset:
            case 2 - iqOffset:
                curTable = 1 - iqOffset;
                break;
            case 3 - iqOffset:
                curTable = 2 - iqOffset;
                break;
            case 5 - (2 * iqOffset):
            case 6 - (2 * iqOffset):
                curTable = 3 - iqOffset;
                break;
            default:
                curTable = 0;
                break;
        }
    }

    const changeGraph = (newTable) => {
        switch (newTable) {
            case 0 - iqOffset:
                if(curGraph == 0 || curGraph == 4) {
                    break;
                }
                curGraph = 0;
                break;
            case 1 - iqOffset:
                if(curGraph == 1 - iqOffset || curGraph == 2 - iqOffset) {
                    break;
                }
                curGraph = 1 - iqOffset;
                break;
            case 2 - iqOffset:
                curGraph = 3 - iqOffset;
                break;
            case 3 - iqOffset:
                if(curGraph == 5 - (2 * iqOffset) || curGraph == 6 - (2 * iqOffset)) {
                    break;
                }
                curGraph = 5 - (2 * iqOffset);
                break;
            default:
                curGraph = 0;
                break;
        }
    }

    const setGraphs = (wD) => {
        const lineupIQGraph = {
            stats: lineupIQs,
            x: "Lineup IQ",
            stat: "%",
            header: "Manager Lineup IQ",
            field: "iq",
            short: "Lineup IQ"
        }

        const potentialPointsGraph = {
            stats: lineupIQs,
            x: "Points",
            stat: "",
            header: "Potential Points vs Points",
            field: "potentialPoints",
            secondField: "fpts",
            short: "Potential Points"
        }

        const winsGraph = {
            stats: winPercentages,
            x: "Wins",
            stat: "",
            header: "Team Wins",
            field: "wins",
            short: "Wins"
        }

        const winPercentagesGraph = {
            stats: winPercentages,
            x: "Win Percentage",
            stat: "%",
            header: "Team Win Percentages",
            field: "percentage",
            short: "Win Percentage"
        }

        const fptsHistoriesGraph = {
            stats: fptsHistories,
            x: "Fantasy Points",
            stat: "",
            header: "Team Fantasy Points",
            field: "fptsFor",
            short: "Fantasy Points"
        }

        const tradesGraph = {
            stats: tradesData,
            x: "# of trades",
            stat: "",
            header: "Number of Trades Managers Have Made",
            field: "trades",
            short: "Trades"
        }

        const waiversGraph = {
            stats: wD,
            x: "# of Waiver Moves",
            stat: "",
            header: "Waivers Moves Managers Have Made",
            field: "waivers",
            short: "Waivers"
        }
        const gs = [];

        if(lineupIQs[0]?.potentialPoints) {
            gs.push(generateGraph(lineupIQGraph, year));
        }
        gs.push(generateGraph(winsGraph, year, 5));
        gs.push(generateGraph(winPercentagesGraph, year));
        gs.push(generateGraph(fptsHistoriesGraph, year));
        if(lineupIQs[0]?.potentialPoints) {
            gs.push(generateGraph(potentialPointsGraph, year, 10, 0));
        }
        if(key == "regularSeasonData") {
            gs.push(generateGraph(tradesGraph, year));
            gs.push(generateGraph(waiversGraph, year));
        }

        curGraph = 0;
        graphs = gs;
    }

    const setTransactionsAndGraphs = (wD) => {
        if(wD[0].rosterID) {
            for(let i = 1; i <= waiversData.length; i++) {
                if(!tradesData.find(t => t.rosterID == i)) {
                    tradesData.push({
                        rosterID: i,
                        trades: 0,
                    })
                }
            }
        }
        if(wD[0].managerID) {
            for(const userID in leagueTeamManagers.users) {
                if(!tradesData.find(t => t.managerID == userID)) {
                    tradesData.push({
                        managerID: userID,
                        trades: 0,
                    })
                }
            }
        }
        const transactions = [];

        for(const w of wD) {
            let trades = 0;
            if(tradesData[0].managerID) {
                trades = tradesData.find(t => t.managerID == w.managerID)?.trades || 0;
            } else if(tradesData[0].rosterID) {
                trades = tradesData.find(t => t.rosterID == w.rosterID)?.trades || 0;
            }
            const waivers = w.waivers;
            transactions.push({
                rosterID: w.rosterID,
                managerID: w.managerID,
                trades,
                waivers,
            })
        }

        setGraphs(wD)
        return transactions;
    }

    const setTables = (lIQs) => {
        const t = [
            "Win Percentages",
            "Points",
        ]
        if(key == "regularSeasonData") {
            t.push("Transactions")
        }
        if(!lIQs[0]?.potentialPoints) {
            iqOffset = 1;
        } else {
            t.unshift('Lineup IQs');
        }
        tables = t
    }

    $: transactions =  setTransactionsAndGraphs(waiversData)
    $: changeTable(curGraph);
    $: changeGraph(curTable);
    $: setTables(lineupIQs)
    
    let innerWidth;

    let expandedRecordKey = null;
    let expandedMatchup = null;
    let expandedYear = null;
    let expandedWeek = null;
    let matchupLoading = false;
    let matchupError = '';
    let playersInfo = null;
    let MatchupComponent = null;

    const getLeagueIDForYear = async (targetYear) => {
        let currentLeagueID = leagueID;

        while (currentLeagueID && currentLeagueID != 0) {
            const leagueData = await getLeagueData(currentLeagueID);

            if (String(leagueData.season) === String(targetYear)) {
                return currentLeagueID;
            }

            currentLeagueID = leagueData.previous_league_id;
        }

        return null;
    };

    const buildMatchup = (weekData, homeRosterID, awayRosterID) => {
        if (!Array.isArray(weekData)) return null;

        const homeRaw = weekData.find(
            (entry) => Number(entry.roster_id) === Number(homeRosterID)
        );

        const awayRaw = weekData.find(
            (entry) => Number(entry.roster_id) === Number(awayRosterID)
        );

        if (!homeRaw || !awayRaw) return null;

        if (
            homeRaw.matchup_id == null ||
            awayRaw.matchup_id == null ||
            homeRaw.matchup_id !== awayRaw.matchup_id
        ) {
            return null;
        }

        return [homeRaw, awayRaw].map((entry) => ({
            roster_id: entry.roster_id,
            starters: entry.starters || [],
            points: entry.starters_points || []
        }));
    };

    const buildSingleTeamMatchup = (weekData, rosterID) => {
        if (!Array.isArray(weekData)) return null;

        const teamRaw = weekData.find(
            (entry) => Number(entry.roster_id) === Number(rosterID)
        );

        if (!teamRaw || teamRaw.matchup_id == null) return null;

        const opponentRaw = weekData.find(
            (entry) =>
                Number(entry.roster_id) !== Number(rosterID) &&
                entry.matchup_id === teamRaw.matchup_id
        );

        if (!opponentRaw) return null;

        return [teamRaw, opponentRaw].map((entry) => ({
            roster_id: entry.roster_id,
            starters: entry.starters || [],
            points: entry.starters_points || []
        }));
    };

    const toggleRecordMatchup = async (record, type, index) => {
        const targetYear = record.year || prefix;
        const targetWeek = Number(record.week);
        const recordKey = `${type}-${targetYear}-${record.week}-${index}`;

        if (expandedRecordKey === recordKey) {
            expandedRecordKey = null;
            expandedMatchup = null;
            matchupError = '';
            return;
        }

        expandedRecordKey = recordKey;
        expandedMatchup = null;
        matchupError = '';

        if (!Number.isFinite(targetWeek)) {
            matchupError = 'Full lineup details are not available from this record row.';
            return;
        }

        matchupLoading = true;

        try {
            if (!playersInfo) {
                playersInfo = await loadPlayers();
            }

            if (!MatchupComponent) {
                const matchupModule = await import('$lib/Matchups/Matchup.svelte');
                MatchupComponent = matchupModule.default;
            }

            const historicalLeagueID = await getLeagueIDForYear(targetYear);

            if (!historicalLeagueID) {
                throw new Error(`Could not find the ${targetYear} Sleeper league.`);
            }

            const response = await fetch(
                `https://api.sleeper.app/v1/league/${historicalLeagueID}/matchups/${targetWeek}`
            );

            if (!response.ok) {
                throw new Error(`Sleeper matchup request failed (${response.status}).`);
            }

            const weekData = await response.json();

            if (record.home?.rosterID && record.away?.rosterID) {
                expandedMatchup = buildMatchup(
                    weekData,
                    record.home.rosterID,
                    record.away.rosterID
                );
            } else if (record.rosterID) {
                expandedMatchup = buildSingleTeamMatchup(
                    weekData,
                    record.rosterID
                );
            }

            if (!expandedMatchup) {
                throw new Error('Could not find the historical matchup for this record.');
            }

            expandedYear = targetYear;
            expandedWeek = targetWeek;
        } catch (error) {
            console.error(error);
            matchupError = error?.message || 'Unable to load this historical matchup.';
            expandedMatchup = null;
        } finally {
            matchupLoading = false;
        }
    };

</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
.recordsHeader {
    width: 95%;
    max-width: 1000px;
    margin: 30px auto 20px;
    text-align: center;
}

.recordsEyebrow {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    opacity: 0.55;
}

.recordsHeader h2 {
    margin: 6px 0 0;
    font-size: 2.6rem;
    font-weight: 800;
}

.recordsHeader p {
    margin: 10px 0 0;
    opacity: 0.65;
}

.recordQuickLinks {
    width: 95%;
    max-width: 1000px;
    margin: 0 auto 30px;

    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.recordQuickCard {
    display: block;
    padding: 18px 10px;

    text-align: center;
    text-decoration: none;
    color: inherit;

    border-radius: 16px;
    background: var(--fff);
    border: 1px solid var(--ccc);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);

    transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        border-color 0.15s ease;
}

.recordQuickCard:hover {
    transform: translateY(-2px);
    border-color: var(--blueOne);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.09);
}

.quickIcon {
    font-size: 1.4rem;
}

.quickTitle {
    margin-top: 7px;
    font-size: 0.78rem;
    font-weight: 800;
}

@media (max-width: 700px) {
    .recordsHeader h2 {
        font-size: 2rem;
    }

    .recordQuickLinks {
        grid-template-columns: repeat(2, 1fr);
    }
}
    .recordAnchor {
        scroll-margin-top: 130px;
    }

    :global(.headerPrimary) {
        background-color: var(--headerPrimary);
        text-align: center;
    }

    .italic {
        display: block;
        font-style: italic;
        font-size: 0.9em;
        color: var(--g999);
    }

    :global(.recordTable) {
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em;
    }

    :global(.rankingTable) {
        display: table;
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em auto 0.5em;
    }

    .fullFlex {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        margin: 3em auto 5em;
    }

    .rankingHolder {
        display: block;
        width: 100%;
        overflow-x: hidden;
    }

    .subTitle {
        font-style: italic;
        font-size: 0.7em;
        color: #888;
        line-height: 1.2em;
    }

    h4 {
        text-align: center;
        margin: 2em 0 1em;
    }

    .rankingTableWrapper {
        width: 25%;
    }

    .rankingInner {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        width: 400%;
		transition: margin-left 0.8s;
    }

    .buttonHolder {
        text-align: center;
        margin: 2em 0 4em;
    }

    :global(.cellName) {
        cursor: pointer;
        line-height: 1.2em;
        padding-left: 8px;
    }

    :global(.differentialName) {
        padding: 0.7em 0;
    }

    :global(.rank) {
        padding-right: 0;
    }

    .vs {
        padding-left: 0.6em;
        margin: 0.5em 0;
    }

    :global(.mdc-data-table__cell, .mdc-data-table__header-cell) {
        border-bottom-color: var(--borderOverride);
    }

    /* Start button resizing */

    @media (max-width: 540px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.6em;
        }
    }

    @media (max-width: 415px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
            height: 30px;
        }
    }

    @media (max-width: 315px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.45em;
            padding: 0 3px;
        }
    }

    @media (max-width: 265px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.4em;
            padding: 0 2px;
            height: 24px;
            min-width: 40px;
        }
    }

    /* End button resizing */

    /* Start record table resizing */

    @media (max-width: 510px) {
        :global(.recordTable th) {
            font-size: 0.8em;
            padding: 1px 12px;
        }
        :global(.recordTable td) {
            font-size: 0.8em;
            padding: 1px 12px;
        }

        .vsRecord {
            margin: .6em 0;
        }
    }

    @media (max-width: 480px) {
        :global(.rank) {
            padding: 1px 0 1px 5px !important;
        }
        :global(.rank) {
            padding: 1px 0 1px 5px !important;
        }
    }

    @media (max-width: 460px) {
        :global(.recordTable th) {
            font-size: 0.6em;
            padding: 1px 12px;
        }
        :global(.recordTable td) {
            font-size: 0.6em;
            padding: 1px 12px;
        }
    }

    @media (max-width: 365px) {
        :global(.recordTable th) {
            font-size: 0.5em;
            padding: 1px 8px;
        }
        :global(.recordTable td) {
            font-size: 0.5em;
            padding: 1px 8px;
        }
    }

    @media (max-width: 265px) {
        :global(.recordTable th) {
            font-size: 0.4em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.4em;
            padding: 1px 5px;
        }
    }

    /* END record table resizing */

    /* Start ranking table resizing */

    @media (max-width: 570px) {
        :global(.rankingTable th) {
            font-size: 0.8em;
            max-width: 110px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
        :global(.rankingTable td) {
            font-size: 0.8em;
            max-width: 110px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
    }

    @media (max-width: 410px) {
        :global(.rankingTable th) {
            font-size: 0.6em;
            max-width: 90px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
        :global(.rankingTable td) {
            font-size: 0.6em;
            max-width: 90px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
    }

    @media (max-width: 340px) {
        :global(.rankingTable th) {
            font-size: 0.55em;
            max-width: 80px;
            white-space: break-spaces;
            padding: 1px 6px;
        }
        :global(.rankingTable td) {
            font-size: 0.55em;
            max-width: 80px;
            white-space: break-spaces;
            padding: 1px 6px;
        }
    }

    /* END ranking table resizing */

    .recordMatchupRow {
        cursor: pointer;
    }

    .recordMatchupRow:hover {
        background: var(--f3f3f3);
    }

    .recordMatchupHint {
        display: block;
        margin-top: 4px;
        font-size: 0.65em;
        font-style: italic;
        opacity: 0.55;
    }

   :global(.recordDetailCell) {
    padding: 0 !important;
    border-bottom: 1px solid var(--borderOverride);
    overflow: visible !important;
}

.recordDetail {
    width: 760px;
    max-width: calc(100vw - 50px);
    box-sizing: border-box;

    padding: 18px;
    background: var(--fff);
    border-top: 3px solid var(--blueOne);

    overflow-x: auto;
}
@media (max-width: 700px) {
    .recordDetail {
        width: 100%;
        max-width: 100%;
        padding: 10px 4px 14px;
    }
}
    .recordDetailHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
    }

    .recordDetailTitle {
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.65;
    }

    .recordClose {
        border: 1px solid var(--ccc);
        background: var(--f3f3f3);
        color: inherit;
        border-radius: 999px;
        padding: 6px 11px;
        font: inherit;
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;
    }

    .recordLoading,
    .recordError {
        padding: 18px 8px;
        text-align: center;
        opacity: 0.7;
    }

    @media (max-width: 600px) {
        .recordDetail {
            padding: 12px 6px 16px;
        }

        .recordDetailHeader {
            padding: 0 6px;
        }
    }

</style>

<div class="recordsHeader">

    <div class="recordsEyebrow">
        GGL RECORD BOOK
    </div>

    <h2>
        🏅 {prefix} Records
    </h2>

    <p>
        Historic league highs, lows and unforgettable performances
    </p>

</div>

<div class="recordQuickLinks">

    {#if weekRecords?.length}
        <a class="recordQuickCard" href="#scoring-highs">
            <div class="quickIcon">🔥</div>
            <div class="quickTitle">Scoring Highs</div>
        </a>
    {/if}

    {#if weekLows?.length}
        <a class="recordQuickCard" href="#scoring-lows">
            <div class="quickIcon">🧊</div>
            <div class="quickTitle">Scoring Lows</div>
        </a>
    {/if}

    {#if blowouts?.length}
        <a class="recordQuickCard" href="#blowouts">
            <div class="quickIcon">💥</div>
            <div class="quickTitle">Largest Blowouts</div>
        </a>
    {/if}

    {#if closestMatchups?.length}
        <a class="recordQuickCard" href="#closest-wins">
            <div class="quickIcon">🤏</div>
            <div class="quickTitle">Closest Wins</div>
        </a>
    {/if}

</div>

<div class="fullFlex">
    {#if weekRecords && weekRecords.length}
        <div id="scoring-highs" class="recordAnchor">
            <DataTable class="recordTable">
            <Head>
                <Row class="rTableHeader">
                    <Cell class="header headerPrimary" colspan=4>{prefix} {key == "playoffData" ? "Playoff " : ""}Single Week Scoring Records</Cell>
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <Cell class="header">Team</Cell>
                    <Cell class="header">Week</Cell>
                    <Cell class="header">Total Points</Cell>
                </Row>
            </Head>
            <Body>
                {#each weekRecords as leagueWeekRecord, ix}
                    {@const scoringHighKey = `scoring-high-${leagueWeekRecord.year || prefix}-${leagueWeekRecord.week}-${ix}`}

                    <Row
                        class="recordMatchupRow"
                        onclick={() => toggleRecordMatchup(leagueWeekRecord, 'scoring-high', ix)}
                    >
                        <Cell class="rank">{ix + 1}</Cell>
                        <Cell class="cellName">
                            <RecordTeam
                                {leagueTeamManagers}
                                rosterID={leagueWeekRecord.rosterID}
                                year={allTime ? leagueWeekRecord.year : prefix}
                            />
                            <span class="recordMatchupHint">Click to view full matchup</span>
                        </Cell>
                        <Cell>
                            {allTime ? leagueWeekRecord.year + " " : ""}
                            {key == "regularSeasonData" ? "Week " : ""}
                            {leagueWeekRecord.week}
                        </Cell>
                        <Cell>{round(leagueWeekRecord.fpts)}</Cell>
                    </Row>

                    {#if expandedRecordKey === scoringHighKey}
                        <Row>
                            <Cell class="recordDetailCell" colspan=4>
                                <div class="recordDetail">
                                    <div class="recordDetailHeader">
                                        <div class="recordDetailTitle">
                                            {leagueWeekRecord.year || prefix} Week {leagueWeekRecord.week} · Full Matchup
                                        </div>
                                        <button
                                            class="recordClose"
                                            type="button"
                                            onclick={(event) => {
                                                event.stopPropagation();
                                                expandedRecordKey = null;
                                                expandedMatchup = null;
                                                matchupError = '';
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>

                                    {#if matchupLoading}
                                        <div class="recordLoading">Loading historical lineup...</div>
                                    {:else if matchupError}
                                        <div class="recordError">{matchupError}</div>
                                    {:else if expandedMatchup && playersInfo?.players && MatchupComponent}
                                        <svelte:component
                                            this={MatchupComponent}
                                            key={`record-scoring-high-${expandedYear}-${expandedWeek}-${ix}`}
                                            ix={ix}
                                            active={ix}
                                            year={expandedYear}
                                            matchup={expandedMatchup}
                                            players={playersInfo.players}
                                            displayWeek={expandedWeek}
                                            expandOverride={true}
                                            {leagueTeamManagers}
                                        />
                                    {/if}
                                </div>
                            </Cell>
                        </Row>
                    {/if}
                {/each}
            </Body>
            </DataTable>
        </div>
    {/if}

    {#if weekLows && weekLows.length}
        <div id="scoring-lows" class="recordAnchor">
            <DataTable class="recordTable">
            <Head>
                <Row>
                    <Cell class="header headerPrimary" colspan=4>{prefix} {key == "playoffData" ? "Playoff " : ""}Single Week Scoring Lows</Cell>
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <Cell class="header">Team</Cell>
                    <Cell class="header">Week</Cell>
                    <Cell class="header">Total Points</Cell>
                </Row>
            </Head>
            <Body>
                {#each weekLows as leagueWeekLow, ix}
                    {@const scoringLowKey = `scoring-low-${leagueWeekLow.year || prefix}-${leagueWeekLow.week}-${ix}`}

                    <Row
                        class="recordMatchupRow"
                        onclick={() => toggleRecordMatchup(leagueWeekLow, 'scoring-low', ix)}
                    >
                        <Cell class="rank">{ix + 1}</Cell>
                        <Cell class="cellName">
                            <RecordTeam
                                {leagueTeamManagers}
                                rosterID={leagueWeekLow.rosterID}
                                year={allTime ? leagueWeekLow.year : prefix}
                            />
                            <span class="recordMatchupHint">Click to view full matchup</span>
                        </Cell>
                        <Cell>
                            {allTime ? leagueWeekLow.year + " " : ""}
                            {key == "regularSeasonData" ? "Week " : ""}
                            {leagueWeekLow.week}
                        </Cell>
                        <Cell>{round(leagueWeekLow.fpts)}</Cell>
                    </Row>

                    {#if expandedRecordKey === scoringLowKey}
                        <Row>
                            <Cell class="recordDetailCell" colspan=4>
                                <div class="recordDetail">
                                    <div class="recordDetailHeader">
                                        <div class="recordDetailTitle">
                                            {leagueWeekLow.year || prefix} Week {leagueWeekLow.week} · Full Matchup
                                        </div>
                                        <button
                                            class="recordClose"
                                            type="button"
                                            onclick={(event) => {
                                                event.stopPropagation();
                                                expandedRecordKey = null;
                                                expandedMatchup = null;
                                                matchupError = '';
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>

                                    {#if matchupLoading}
                                        <div class="recordLoading">Loading historical lineup...</div>
                                    {:else if matchupError}
                                        <div class="recordError">{matchupError}</div>
                                    {:else if expandedMatchup && playersInfo?.players && MatchupComponent}
                                        <svelte:component
                                            this={MatchupComponent}
                                            key={`record-scoring-low-${expandedYear}-${expandedWeek}-${ix}`}
                                            ix={ix}
                                            active={ix}
                                            year={expandedYear}
                                            matchup={expandedMatchup}
                                            players={playersInfo.players}
                                            displayWeek={expandedWeek}
                                            expandOverride={true}
                                            {leagueTeamManagers}
                                        />
                                    {/if}
                                </div>
                            </Cell>
                        </Row>
                    {/if}
                {/each}
            </Body>
            </DataTable>
        </div>
    {/if}

    {#if allTime && key == "regularSeasonData"}
        <DataTable class="recordTable">
            <Head>
                <Row>
                    <Cell class="header headerPrimary" colspan=5>All-Time Highest Season Points<span class="italic">Ranked by PPG</span></Cell>
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <Cell class="header">Manager</Cell>
                    <Cell class="header">Year</Cell>
                    <Cell class="header">Total Points</Cell>
                    <Cell class="header">PPG</Cell>
                </Row>
            </Head>
            <Body>
                {#each seasonLongRecords as mostSeasonLongPoint, ix}
                    <Row>
                        <Cell class="rank">{ix + 1}</Cell>
                        <Cell class="cellName" onclick={() => gotoManager({year: mostSeasonLongPoint.year, leagueTeamManagers, rosterID: mostSeasonLongPoint.rosterID})}>
                            <RecordTeam {leagueTeamManagers} rosterID={mostSeasonLongPoint.rosterID} year={mostSeasonLongPoint.year} />
                        </Cell>
                        <Cell>{mostSeasonLongPoint.year}</Cell>
                        <Cell>{round(mostSeasonLongPoint.fpts)}</Cell>
                        <Cell>{mostSeasonLongPoint.fptsPerGame}</Cell>
                    </Row>
                {/each}
            </Body>
        </DataTable>
    {/if}
    
    {#if allTime && key == "regularSeasonData"}
        <DataTable class="recordTable">
            <Head>
                <Row>
                    <Cell class="header headerPrimary" colspan=5>All-Time Lowest Season Points<span class="italic">Ranked by PPG</span></Cell>
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <Cell class="header">Manager</Cell>
                    <Cell class="header">Year</Cell>
                    <Cell class="header">Total Points</Cell>
                    <Cell class="header">PPG</Cell>
                </Row>
            </Head>
            <Body>
                {#each seasonLongLows as leastSeasonLongPoint, ix}
                    <Row>
                        <Cell class="rank">{ix + 1}</Cell>
                        <Cell class="cellName" onclick={() => gotoManager({year: leastSeasonLongPoint.year, leagueTeamManagers, rosterID: leastSeasonLongPoint.rosterID})}>
                            <RecordTeam {leagueTeamManagers} rosterID={leastSeasonLongPoint.rosterID} year={leastSeasonLongPoint.year} />
                        </Cell>
                        <Cell>{leastSeasonLongPoint.year}</Cell>
                        <Cell>{round(leastSeasonLongPoint.fpts)}</Cell>
                        <Cell>{leastSeasonLongPoint.fptsPerGame}</Cell>
                    </Row>
                {/each}
            </Body>
        </DataTable>
    {/if}

    {#if blowouts && blowouts.length}
        <div id="blowouts" class="recordAnchor">
            <DataTable class="recordTable">
            <Head>
                <Row>
                    <Cell class="header headerPrimary" colspan=4>{prefix} Largest {key == "playoffData" ? "Playoff " : ""}Blowouts</Cell>
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <Cell class="header">Matchup</Cell>
                    <Cell class="header">Week</Cell>
                    <Cell class="header">Differential</Cell>
                </Row>
            </Head>
            <Body>
                {#each blowouts as blowout, ix}
                    {@const blowoutKey = `blowout-${blowout.year || prefix}-${blowout.week}-${ix}`}

                    <Row
                        class="recordMatchupRow"
                        onclick={() => toggleRecordMatchup(blowout, 'blowout', ix)}
                    >
                        <Cell class="rank">{ix + 1}</Cell>
                        <Cell class="cellName differentialName">
                            <div class="vsRecord">
                                <div>
                                    <RecordTeam {leagueTeamManagers} rosterID={blowout.home.rosterID} year={allTime ? blowout.year : prefix} compressed={true} points={round(blowout.home.fpts)} />
                                </div>
                                <p class="vs">vs</p>
                                <div>
                                    <RecordTeam {leagueTeamManagers} rosterID={blowout.away.rosterID} year={allTime ? blowout.year : prefix} compressed={true} points={round(blowout.away.fpts)} />
                                </div>
                            </div>
                            <span class="recordMatchupHint">Click to view full matchup</span>
                        </Cell>
                        <Cell>{allTime ? blowout.year + " " : "" }{key == "regularSeasonData" ? "Week " : ""}{blowout.week}</Cell>
                        <Cell>{round(blowout.differential)}</Cell>
                    </Row>

                    {#if expandedRecordKey === blowoutKey}
                        <Row>
                            <Cell class="recordDetailCell" colspan=4>
                                <div class="recordDetail">
                                    <div class="recordDetailHeader">
                                        <div class="recordDetailTitle">
                                            {blowout.year || prefix} Week {blowout.week} · Full Matchup
                                        </div>
                                        <button
                                            class="recordClose"
                                            type="button"
                                            onclick={(event) => {
                                                event.stopPropagation();
                                                expandedRecordKey = null;
                                                expandedMatchup = null;
                                                matchupError = '';
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>

                                    {#if matchupLoading}
                                        <div class="recordLoading">Loading historical lineup...</div>
                                    {:else if matchupError}
                                        <div class="recordError">{matchupError}</div>
                                    {:else if expandedMatchup && playersInfo?.players && MatchupComponent}
                                        <svelte:component
                                            this={MatchupComponent}
                                            key={`record-blowout-${expandedYear}-${expandedWeek}-${ix}`}
                                            ix={ix}
                                            active={ix}
                                            year={expandedYear}
                                            matchup={expandedMatchup}
                                            players={playersInfo.players}
                                            displayWeek={expandedWeek}
                                            expandOverride={true}
                                            {leagueTeamManagers}
                                        />
                                    {/if}
                                </div>
                            </Cell>
                        </Row>
                    {/if}
                {/each}
            </Body>
            </DataTable>
        </div>
    {/if}

    {#if closestMatchups && closestMatchups.length}
        <div id="closest-wins" class="recordAnchor">
            <DataTable class="recordTable">
            <Head>
                <Row>
                    <Cell class="header headerPrimary" colspan=4>{prefix} Narrowest {key == "playoffData" ? "Playoff " : ""}Wins</Cell>
                </Row>
                <Row>
                    <Cell class="header rank"></Cell>
                    <Cell class="header">Matchup</Cell>
                    <Cell class="header">Week</Cell>
                    <Cell class="header">Differential</Cell>
                </Row>
            </Head>
            <Body>
                {#each closestMatchups as closestMatchup, ix}
                    {@const closestKey = `closest-${closestMatchup.year || prefix}-${closestMatchup.week}-${ix}`}

                    <Row
                        class="recordMatchupRow"
                        onclick={() => toggleRecordMatchup(closestMatchup, 'closest', ix)}
                    >
                        <Cell class="rank">{ix + 1}</Cell>
                        <Cell class="cellName differentialName">
                            <div class="vsRecord">
                                <div>
                                    <RecordTeam {leagueTeamManagers} rosterID={closestMatchup.home.rosterID} year={allTime ? closestMatchup.year : prefix} compressed={true} points={round(closestMatchup.home.fpts)} />
                                </div>
                                <p class="vs">vs</p>
                                <div>
                                    <RecordTeam {leagueTeamManagers} rosterID={closestMatchup.away.rosterID} year={allTime ? closestMatchup.year : prefix} compressed={true} points={round(closestMatchup.away.fpts)} />
                                </div>
                            </div>
                            <span class="recordMatchupHint">Click to view full matchup</span>
                        </Cell>
                        <Cell>{allTime ? closestMatchup.year + " " : "" }{key == "regularSeasonData" ? "Week " : ""}{closestMatchup.week}</Cell>
                        <Cell>{round(closestMatchup.differential)}</Cell>
                    </Row>

                    {#if expandedRecordKey === closestKey}
                        <Row>
                            <Cell class="recordDetailCell" colspan=4>
                                <div class="recordDetail">
                                    <div class="recordDetailHeader">
                                        <div class="recordDetailTitle">
                                            {closestMatchup.year || prefix} Week {closestMatchup.week} · Full Matchup
                                        </div>
                                        <button
                                            class="recordClose"
                                            type="button"
                                            onclick={(event) => {
                                                event.stopPropagation();
                                                expandedRecordKey = null;
                                                expandedMatchup = null;
                                                matchupError = '';
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>

                                    {#if matchupLoading}
                                        <div class="recordLoading">Loading historical lineup...</div>
                                    {:else if matchupError}
                                        <div class="recordError">{matchupError}</div>
                                    {:else if expandedMatchup && playersInfo?.players && MatchupComponent}
                                        <svelte:component
                                            this={MatchupComponent}
                                            key={`record-closest-${expandedYear}-${expandedWeek}-${ix}`}
                                            ix={ix}
                                            active={ix}
                                            year={expandedYear}
                                            matchup={expandedMatchup}
                                            players={playersInfo.players}
                                            displayWeek={expandedWeek}
                                            expandOverride={true}
                                            {leagueTeamManagers}
                                        />
                                    {/if}
                                </div>
                            </Cell>
                        </Row>
                    {/if}
                {/each}
            </Body>
            </DataTable>
        </div>
    {/if}
</div>

<h4>{prefix} {key == "playoffData" ? "Playoff " : ""}Rankings</h4>

{#if graphs.length}
    <BarChart {graphs} bind:curGraph={curGraph} {leagueTeamManagers} />
{/if}

<div class="rankingHolder">
    <div class="rankingInner" style="margin-left: -{100 * curTable}%;">
        {#if lineupIQs[0]?.potentialPoints}
            <div class="rankingTableWrapper">
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header headerPrimary" colspan=5>
                                {prefix} {key == "playoffData" ? "Playoff " : ""}Lineup IQ Rankings
                                <div class="subTitle">
                                    The percentage of potential points each manager has captured
                                </div>
                            </Cell>
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                            <Cell class="header">Lineup IQ</Cell>
                            <Cell class="header">Points</Cell>
                            <Cell class="header">Potential Points</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each lineupIQs as lineupIQ, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" onclick={() => gotoManager({year: lineupIQ.year || prefix, leagueTeamManagers, managerID: lineupIQ.managerID, rosterID: lineupIQ.rosterID})}>
                                    <RecordTeam {leagueTeamManagers} managerID={lineupIQ.managerID} rosterID={lineupIQ.rosterID} year={allTime ? lineupIQ.year : prefix} />
                                </Cell>
                                <Cell>{lineupIQ.iq}%</Cell>
                                <Cell>{round(lineupIQ.fpts)}</Cell>
                                <Cell>{round(lineupIQ.potentialPoints)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            </div>
        {/if}

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header headerPrimary" colspan=6>{prefix} {key == "playoffData" ? "Playoff " : ""}Win Percentages Rankings</Cell>
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">Win %</Cell>
                        <Cell class="header">Wins</Cell>
                        {#if showTies}
                            <Cell class="header">Ties</Cell>
                        {/if}
                        <Cell class="header">Losses</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each winPercentages as winPercentage, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" onclick={() => gotoManager({year: winPercentage.year || prefix, leagueTeamManagers, rosterID: winPercentage.rosterID, managerID: winPercentage.managerID})}>
                                <RecordTeam {leagueTeamManagers} managerID={winPercentage.managerID} rosterID={winPercentage.rosterID} year={allTime ? winPercentage.year : prefix} />
                            </Cell>
                            <Cell>{winPercentage.percentage}%</Cell>
                            <Cell>{winPercentage.wins}</Cell>
                            {#if showTies}
                                <Cell>{winPercentage.ties}</Cell>
                            {/if}
                            <Cell>{winPercentage.losses}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header headerPrimary" colspan=5>
                            {prefix} {key == "playoffData" ? "Playoff " : ""}Fantasy Points Rankings
                        </Cell>
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">Points For</Cell>
                        <Cell class="header">Points Against</Cell>
                        <Cell class="header">Points Per Game</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each fptsHistories as fptsHistory, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" onclick={() => gotoManager({year: fptsHistory.year || prefix, leagueTeamManagers, rosterID: fptsHistory.rosterID, managerID: fptsHistory.managerID})}>
                                <RecordTeam {leagueTeamManagers} managerID={fptsHistory.managerID} rosterID={fptsHistory.rosterID} year={allTime ? fptsHistory.year : prefix} />
                            </Cell>
                            <Cell>{round(fptsHistory.fptsFor)}</Cell>
                            <Cell>{round(fptsHistory.fptsAgainst)}</Cell>
                            <Cell>{round(fptsHistory.fptsPerGame)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header headerPrimary" colspan=4>
                            {prefix} Transaction Totals
                        </Cell>
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">Trades</Cell>
                        <Cell class="header">Waivers</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each transactions as transaction, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" onclick={() => gotoManager({year: transaction.year || prefix, leagueTeamManagers, rosterID: transaction.rosterID, managerID: transaction.managerID})}>
                                <RecordTeam {leagueTeamManagers} managerID={transaction.managerID} rosterID={transaction.rosterID} year={allTime ? transaction.year : prefix} />
                            </Cell>
                            <Cell>{transaction.trades}</Cell>
                            <Cell>{transaction.waivers}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

    </div>
</div>

<div class="buttonHolder">
    <Group variant="outlined">
        {#each tables as table, ix}
            <Button class="selectionButtons" onclick={() => curTable = ix} variant="{curTable == ix ? "raised" : "outlined"}">
                <Label>{table}</Label>
            </Button>
        {/each}
    </Group>
</div>
