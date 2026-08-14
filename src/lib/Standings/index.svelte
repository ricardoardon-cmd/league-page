<script>
    import { leagueName } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import LinearProgress from '@smui/linear-progress';
    import { onMount } from 'svelte';

    import Standing from './Standing.svelte';

    export let standingsData;
    export let leagueTeamManagersData;

    // Existing league tiebreaker order.
    const sortOrder = [
        "fptsAgainst",
        "divisionTies",
        "divisionWins",
        "fpts",
        "ties",
        "wins"
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

        let finalStandings = Object.keys(standingsInfo)
            .map((key) => standingsInfo[key]);

        // Preserve the league's existing tiebreaker logic.
        for (const sortType of sortOrder) {

            if (
                finalStandings.length === 0 ||
                (!finalStandings[0][sortType] &&
                finalStandings[0][sortType] !== 0)
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
        max-width: 1250px;
        margin: 0 auto;
        padding: 30px 20px 60px;
        box-sizing: border-box;
    }

    .header {
        margin-bottom: 25px;
    }

    .header h1 {
        font-size: 2.4rem;
        margin: 0;
        font-weight: 800;
    }

    .header p {
        margin-top: 6px;
        opacity: 0.7;
    }

    .standingsCard {
        background: var(--f3f3f3);
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.08);
    }

    .standingsHeader {
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

        padding: 12px 16px;

        font-size: 0.75rem;
        font-weight: 700;

        text-transform: uppercase;
        letter-spacing: 0.7px;

        opacity: 0.65;
    }

    .loading {
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
        text-align: center;
    }

    .empty {
        text-align: center;
        padding: 60px 20px;
        opacity: 0.7;
    }

    @media (max-width: 800px) {

        .standingsPage {
            padding: 20px 10px 40px;
        }

        .header h1 {
            font-size: 2rem;
        }

        .standingsCard {
            padding: 10px;
        }

        .standingsHeader {
            display: none;
        }

    }

</style>


<div class="standingsPage">

    <div class="header">

        <h1>
            🏆 {year ?? ''} {leagueName} Standings
        </h1>

        <p>
            Current league standings and team performance
        </p>

    </div>


    {#if loading}

        <div class="loading">

            <p>
                Loading league standings...
            </p>

            <LinearProgress indeterminate />

        </div>


    {:else if preseason}

        <div class="standingsCard">

            <div class="empty">

                <h2>
                    🏈 Preseason
                </h2>

                <p>
                    Standings will appear once the regular season begins.
                </p>

            </div>

        </div>


    {:else}

        <div class="standingsCard">

            <div class="standingsHeader">

                <div>
                    #
                </div>

                <div>
                    Team
                </div>

                <div>
                    Record
                </div>

                <div>
                    PF
                </div>

                <div>
                    PA
                </div>

                <div>
                    Streak
                </div>

            </div>


            {#each standings as standing, index}

                <Standing
                    {standing}
                    {leagueTeamManagers}
                    team={getTeamFromTeamManagers(
                        leagueTeamManagers,
                        standing.rosterID
                    )}
                    rank={index + 1}
                />

            {/each}

        </div>

    {/if}

</div>
