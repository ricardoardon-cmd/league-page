<script>
    import { leagueName } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
    import LinearProgress from '@smui/linear-progress';
    import { onMount } from 'svelte';
    import Standing from './Standing.svelte';

    export let standingsData, leagueTeamManagersData;

    // Least important → most important.
    // The final sort field has the highest tiebreak priority.
    const sortOrder = [
        "fptsAgainst",
        "divisionTies",
        "divisionWins",
        "fpts",
        "ties",
        "wins"
    ];

    const columnOrder = [
        { name: "W", field: "wins" },
        { name: "T", field: "ties" },
        { name: "L", field: "losses" },
        { name: "Div W", field: "divisionWins" },
        { name: "Div T", field: "divisionTies" },
        { name: "Div L", field: "divisionLosses" },
        { name: "FPTS", field: "fpts" },
        { name: "FPTS Against", field: "fptsAgainst" },
        { name: "Streak", field: "streak" }
    ];

    let loading = true;
    let preseason = false;
    let standings = [];
    let year;
    let leagueTeamManagers;

    onMount(async () => {
        const asyncStandingsData = await standingsData;

        if (!asyncStandingsData) {
            loading = false;
            preseason = true;
            return;
        }

        const { standingsInfo, yearData } = asyncStandingsData;

        leagueTeamManagers = await leagueTeamManagersData;
        year = yearData;

        let finalStandings = Object.values(standingsInfo || {});

        if (!finalStandings.length) {
            loading = false;
            preseason = true;
            return;
        }

        for (const sortType of sortOrder) {
            if (
                finalStandings[0][sortType] === undefined ||
                finalStandings[0][sortType] === null
            ) {
                continue;
            }

            finalStandings = [...finalStandings].sort(
                (a, b) => b[sortType] - a[sortType]
            );
        }

        standings = finalStandings;
        loading = false;
    });
</script>

<style>
    .standingsPage {
        width: 100%;
        max-width: 1150px;
        margin: 0 auto;
        padding: 30px 20px 70px;
        box-sizing: border-box;
    }

    .standingsHeader {
        text-align: center;
        margin-bottom: 28px;
    }

    .eyebrow {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1.3px;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 6px;
    }

    .standingsHeader h1 {
        margin: 0;
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1.1;
    }

    .standingsHeader p {
        margin: 10px 0 0;
        opacity: 0.65;
    }

    .seasonStatus {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 14px;
        padding: 7px 13px;
        border-radius: 999px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.4px;
        text-transform: uppercase;
    }

    .statusDot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2e9d50;
    }

    .statusDotPreseason {
        background: #d6a029;
    }

    .loadingCard,
    .preseasonCard {
        width: 95%;
        max-width: 700px;
        margin: 35px auto;
        padding: 38px 28px;
        box-sizing: border-box;
        text-align: center;
        border-radius: 20px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .loadingBar {
        width: 85%;
        max-width: 450px;
        margin: 18px auto 0;
    }

    .preseasonIcon {
        font-size: 3rem;
        line-height: 1;
        margin-bottom: 16px;
    }

    .preseasonCard h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 800;
    }

    .preseasonCard p {
        max-width: 500px;
        margin: 10px auto 0;
        line-height: 1.6;
        opacity: 0.65;
    }

    .preseasonNote {
        display: inline-block;
        margin-top: 20px;
        padding: 8px 14px;
        border-radius: 10px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        font-size: 0.75rem;
        font-weight: 700;
        opacity: 0.75;
    }

    .tableCard {
        width: 100%;
        box-sizing: border-box;
        padding: 16px;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .standingsTable {
        width: 100%;
        overflow-x: auto;
    }

    :global(.standingsTable .mdc-data-table) {
        width: 100%;
        box-shadow: none;
    }

    :global(.standingsTable table) {
        width: 100%;
    }

    :global(.standingsTable th) {
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        white-space: nowrap;
    }

    :global(.standingsTable td) {
        vertical-align: middle;
    }

    :global(.center) {
        text-align: center;
    }

    :global(.wrappable) {
        white-space: normal;
        line-height: 1.2em;
    }

    @media (max-width: 700px) {
        .standingsPage {
            padding: 20px 10px 50px;
        }

        .standingsHeader h1 {
            font-size: 2rem;
        }

        .loadingCard,
        .preseasonCard {
            padding: 28px 18px;
        }

        .tableCard {
            padding: 8px;
        }
    }
</style>

<div class="standingsPage">

    <div class="standingsHeader">

        <div class="eyebrow">
            GGL SEASON RACE
        </div>

        <h1>
            🏈 {year ? `${year} ` : ''}{leagueName} Standings
        </h1>

        <p>
            The race for the playoffs starts here
        </p>

        {#if preseason}
            <div class="seasonStatus">
                <span class="statusDot statusDotPreseason"></span>
                Preseason
            </div>
        {:else if !loading}
            <div class="seasonStatus">
                <span class="statusDot"></span>
                Season Active
            </div>
        {/if}

    </div>

    {#if loading}

        <div class="loadingCard">

            <strong>Loading Standings...</strong>

            <div class="loadingBar">
                <LinearProgress indeterminate />
            </div>

        </div>

    {:else if preseason}

        <div class="preseasonCard">

            <div class="preseasonIcon">
                🏈
            </div>

            <h2>
                The standings are waiting for kickoff
            </h2>

            <p>
                No regular-season games have been played yet.
                Once the season begins, team records, points,
                division results and streaks will populate here automatically.
            </p>

            <div class="preseasonNote">
                Standings will update from Sleeper after games begin
            </div>

        </div>

    {:else}

        <div class="tableCard">

            <div class="standingsTable">

                <DataTable table$aria-label="League Standings">

                    <Head>
                        <Row>

                            <Cell class="center">
                                Team
                            </Cell>

                            {#each columnOrder as column}
                                <Cell class="center wrappable">
                                    {column.name}
                                </Cell>
                            {/each}

                        </Row>
                    </Head>

                    <Body>

                        {#each standings as standing}

                            <Standing
                                {columnOrder}
                                {standing}
                                {leagueTeamManagers}
                                team={getTeamFromTeamManagers(
                                    leagueTeamManagers,
                                    standing.rosterID
                                )}
                            />

                        {/each}

                    </Body>

                </DataTable>

            </div>

        </div>

    {/if}

</div>
