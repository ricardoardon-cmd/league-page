<script>
    import LinearProgress from '@smui/linear-progress';
    import MatchupWeeks from './MatchupWeeks.svelte';
    import Brackets from './Brackets.svelte';
    import Button, { Group, Label } from '@smui/button';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { loadPlayers } from '$lib/utils/helper';

    export let queryWeek;
    export let leagueTeamManagersData;
    export let matchupsData;
    export let bracketsData;
    export let playersData;

    let players;
    let matchupWeeks;
    let year;
    let week;
    let regularSeasonLength;
    let brackets;
    let leagueTeamManagers;

    let loading = true;

    onMount(async () => {

        brackets = await bracketsData;

        const matchupsInfo = await matchupsData;

        leagueTeamManagers = await leagueTeamManagersData;

        matchupWeeks = matchupsInfo.matchupWeeks;
        year = matchupsInfo.year;
        week = matchupsInfo.week;
        regularSeasonLength = matchupsInfo.regularSeasonLength;

        const playersInfo = await playersData;

        players = playersInfo.players;

        loading = false;

        if (playersInfo.stale) {

            const newPlayersInfo = await loadPlayers(null, true);

            players = newPlayersInfo.players;

        }

    });

    const changeSelection = (s) => {

        if (s == 'regular') {

            queryWeek = 1;

            goto('/matchups?week=1', {
                noscroll: true
            });

        } else if (s == 'champions') {

            queryWeek = 99;

            goto('/matchups?week=99', {
                noscroll: true
            });

        }

        selection = s;

    };

    let selection = 'regular';

</script>


<style>

    .matchupCenter {

        width: 100%;

        max-width: 1250px;

        margin: 0 auto;

        padding: 30px 20px 70px;

        box-sizing: border-box;

    }


    .pageHeader {

        text-align: center;

        margin-bottom: 30px;

    }


    .pageHeader h1 {

        margin: 0;

        font-size: 2.5rem;

        font-weight: 800;

        letter-spacing: -0.5px;

    }


    .pageHeader p {

        margin: 8px 0 0;

        opacity: 0.7;

        font-size: 1rem;

    }


    .seasonControls {

        display: flex;

        flex-direction: column;

        align-items: center;

        gap: 12px;

        margin-bottom: 20px;

    }


    .controlCard {

        display: flex;

        justify-content: center;

        align-items: center;

        flex-wrap: wrap;

        gap: 10px;

        padding: 10px;

        border-radius: 14px;

        background: var(--f3f3f3);

        box-shadow: 0 3px 14px rgba(0,0,0,0.07);

    }


    .bracketControls {

        display: flex;

        justify-content: center;

        flex-wrap: wrap;

        gap: 8px;

    }


    .message {

        display: block;

        width: 85%;

        max-width: 500px;

        margin: 80px auto;

        text-align: center;

        padding: 25px;

        border-radius: 14px;

        background: var(--f3f3f3);

    }


    .emptyTitle {

        font-size: 1.5rem;

        font-weight: 750;

        margin-bottom: 8px;

    }


    .emptyText {

        opacity: 0.7;

    }


    @media (max-width: 600px) {

        .matchupCenter {

            padding: 20px 10px 50px;

        }


        .pageHeader h1 {

            font-size: 2rem;

        }


        .controlCard {

            width: 100%;

            box-sizing: border-box;

        }

    }

</style>


<div class="matchupCenter">


    {#if loading}


        <div class="message">

            <div class="emptyTitle">
                🏈 Matchup Center
            </div>

            <p class="emptyText">
                Loading league matchups...
            </p>

            <LinearProgress indeterminate />

        </div>


    {:else}


        <div class="pageHeader">

            <h1>
                🏈 Matchup Center
            </h1>

            <p>
                {year} GGL Fantasy Football
            </p>

        </div>


        {#if matchupWeeks.length}


            <div class="seasonControls">


                <div class="controlCard">

                    <Group variant="outlined">

                        <Button
                            class="selectionButtons"
                            onclick={() => changeSelection('regular')}
                            variant={selection == 'regular'
                                ? 'raised'
                                : 'outlined'}
                        >

                            <Label>
                                Regular Season
                            </Label>

                        </Button>


                        <Button
                            class="selectionButtons"
                            onclick={() => changeSelection('champions')}
                            variant={selection == 'champions' ||
                            selection == 'losers'
                                ? 'raised'
                                : 'outlined'}
                        >

                            <Label>
                                Playoffs
                            </Label>

                        </Button>

                    </Group>

                </div>


                {#if selection == 'champions' ||
                    selection == 'losers'}


                    <div class="controlCard bracketControls">

                        <Group variant="outlined">

                            <Button
                                class="selectionButtons"
                                onclick={() =>
                                    changeSelection('champions')}
                                variant={selection == 'champions'
                                    ? 'raised'
                                    : 'outlined'}
                            >

                                <Label>
                                    Championship Bracket
                                </Label>

                            </Button>


                            <Button
                                class="selectionButtons"
                                onclick={() =>
                                    changeSelection('losers')}
                                variant={selection == 'losers'
                                    ? 'raised'
                                    : 'outlined'}
                            >

                                <Label>
                                    Losers Bracket
                                </Label>

                            </Button>

                        </Group>

                    </div>

                {/if}


            </div>


            {#if selection == 'regular'}


                <MatchupWeeks
                    {players}
                    {queryWeek}
                    {matchupWeeks}
                    {regularSeasonLength}
                    {year}
                    {week}
                    bind:selection
                    {leagueTeamManagers}
                />


            {/if}


        {:else}


            <div class="message">

                <div class="emptyTitle">
                    🏈 No Matchups Yet
                </div>

                <p class="emptyText">
                    Matchups will appear here when the season begins.
                </p>

            </div>


        {/if}


        {#if brackets?.champs?.bracket?.[0]?.[0]?.[0]?.points &&
            (selection == 'champions' ||
            selection == 'losers')}


            <Brackets
                {queryWeek}
                {leagueTeamManagers}
                {players}
                {brackets}
                bind:selection
            />


        {/if}


    {/if}


</div>
