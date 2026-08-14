<script>
    import { leagueName } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import LinearProgress from '@smui/linear-progress';
    import { onMount } from 'svelte';
    import Standing from './Standing.svelte';

    export let standingsData, leagueTeamManagersData;

    // Least important -> most important.
    // The final sort field has the highest tiebreak priority.
    const sortOrder = [
        'fptsAgainst',
        'divisionTies',
        'divisionWins',
        'fpts',
        'ties',
        'wins'
    ];

    let loading = true;
    let preseason = false;
    let standings = [];
    let year;
    let leagueTeamManagers;

    const buildPreseasonStandings = (teamManagers) => {
        const currentSeason = teamManagers?.currentSeason;
        const currentTeams =
            teamManagers?.teamManagersMap?.[currentSeason] || {};

        return Object.keys(currentTeams)
            .map((rosterID) => ({
                rosterID: Number(rosterID),
                wins: 0,
                losses: 0,
                ties: 0,
                divisionWins: 0,
                divisionLosses: 0,
                divisionTies: 0,
                fpts: 0,
                fptsAgainst: 0,
                streak: '—'
            }))
            .sort((a, b) => {
                const teamA =
                    getTeamFromTeamManagers(
                        teamManagers,
                        a.rosterID,
                        currentSeason
                    )?.name || '';

                const teamB =
                    getTeamFromTeamManagers(
                        teamManagers,
                        b.rosterID,
                        currentSeason
                    )?.name || '';

                return teamA.localeCompare(teamB);
            });
    };

    onMount(async () => {
        leagueTeamManagers = await leagueTeamManagersData;
        year = leagueTeamManagers?.currentSeason;

        const asyncStandingsData = await standingsData;

        if (!asyncStandingsData?.standingsInfo) {
            standings = buildPreseasonStandings(leagueTeamManagers);
            preseason = true;
            loading = false;
            return;
        }

        const { standingsInfo, yearData } = asyncStandingsData;

        year = yearData || year;

        let finalStandings = Object.values(standingsInfo || {});

        if (!finalStandings.length) {
            standings = buildPreseasonStandings(leagueTeamManagers);
            preseason = true;
            loading = false;
            return;
        }

        const gamesHaveStarted = finalStandings.some((standing) => {
            const gamesPlayed =
                Number(standing.wins || 0) +
                Number(standing.losses || 0) +
                Number(standing.ties || 0);

            return gamesPlayed > 0 || Number(standing.fpts || 0) > 0;
        });

        if (!gamesHaveStarted) {
            // Sleeper may already return roster rows before Week 1.
            // Use our zeroed list so every current team still appears.
            standings = buildPreseasonStandings(leagueTeamManagers);
            preseason = true;
            loading = false;
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
                (a, b) => Number(b[sortType] || 0) - Number(a[sortType] || 0)
            );
        }

        standings = finalStandings;
        preseason = false;
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

    .loadingCard {
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

    .preseasonMessage {
        width: 100%;
        box-sizing: border-box;
        margin: 0 0 14px;
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        text-align: center;
        font-size: 0.82rem;
        font-weight: 650;
        opacity: 0.8;
    }

    .standingsCard {
        width: 100%;
        box-sizing: border-box;
        padding: 16px;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
        overflow: hidden;
    }

    .columns {
        display: grid;
        grid-template-columns:
            60px
            minmax(240px, 1fr)
            120px
            110px
            110px
            100px;
        align-items: center;
        gap: 10px;
        padding: 0 16px 10px;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.55px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .center {
        text-align: center;
    }

    .list {
        width: 100%;
    }

    @media (max-width: 800px) {
        .standingsPage {
            padding: 20px 10px 50px;
        }

        .standingsHeader h1 {
            font-size: 2rem;
        }

        .standingsCard {
            padding: 10px;
        }

        .columns {
            grid-template-columns: 42px 1fr auto;
            grid-template-areas: 'rank team record';
            padding: 0 14px 9px;
        }

        .columnRank {
            grid-area: rank;
        }

        .columnTeam {
            grid-area: team;
        }

        .columnRecord {
            grid-area: record;
            text-align: right;
        }

        .columnDesktop {
            display: none;
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

        {#if preseason && !loading}
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

    {:else}

        {#if preseason}
            <div class="preseasonMessage">
                Preseason standings · All teams begin 0-0
            </div>
        {/if}

        <div class="standingsCard">

            <div class="columns">
                <div class="columnRank center">#</div>
                <div class="columnTeam">Team</div>
                <div class="columnRecord center">Record</div>
                <div class="columnDesktop center">PF</div>
                <div class="columnDesktop center">PA</div>
                <div class="columnDesktop center">Streak</div>
            </div>

            <div class="list">

                {#each standings as standing, ix}

                    <Standing
                        {standing}
                        {leagueTeamManagers}
                        preseason={preseason}
                        rank={ix + 1}
                        team={getTeamFromTeamManagers(
                            leagueTeamManagers,
                            standing.rosterID,
                            year
                        )}
                    />

                {/each}

            </div>

        </div>

    {/if}

</div>
