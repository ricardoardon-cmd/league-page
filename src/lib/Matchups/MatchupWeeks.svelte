<script>
	import { Icon } from '@smui/tab';
    import Matchup from './Matchup.svelte'
    import WeeklyMatchupAnalysis from './WeeklyMatchupAnalysis.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let queryWeek, players, matchupWeeks, year, week, regularSeasonLength, selection, leagueTeamManagers;

    let displayWeek = queryWeek * 1 || 1;

    onMount(() => {
        if(!queryWeek || queryWeek < 1) {
            queryWeek = week;
            displayWeek = queryWeek * 1;
            goto(`/matchups?year=${year}&week=${queryWeek}`, {noscroll: true});
            if(queryWeek > regularSeasonLength) {
                selection = 'champions';
                return;
            }
            processDisplayMatchup(queryWeek)
            return;
        }
        if(queryWeek > regularSeasonLength) {
            selection = 'champions';
            return;
        }
        processDisplayMatchup(displayWeek)
    })

    let matchupArray = [];

    // rand is used as a hacky way to make sure that the each block re-renders when the matchupArray changes
    // the new arrays are too similar to the old ones for Svelte to pick up the difference
    let rand;

    const processDisplayMatchup = (newWeek) => {
        const matchup = matchupWeeks[newWeek-1];
        if(!matchup?.matchups) {
            matchupArray = [];
            return;
        }
        const allMatchups = matchup.matchups;
        matchupArray = [];
        for (const key in allMatchups) {
            matchupArray.push(allMatchups[key]);
        }
        rand = Math.random();
    }

    let active;
    
    const changeWeek = (newWeek) => {
        displayWeek = newWeek;
        processDisplayMatchup(displayWeek);
        active = null;
        goto(`/matchups?year=${year}&week=${displayWeek}`, {noscroll: true});
    }
</script>

<style>
   .matchups {

    width: 100%;

    max-width: 1050px;

    margin: 25px auto 70px;

}


.weekContainer {

    display: flex;

    width: 100%;

    max-width: 750px;

    margin: 0 auto 25px;

    align-items: center;

    justify-content: center;

    padding: 12px 15px;

    box-sizing: border-box;

    border-radius: 14px;

    background: var(--f3f3f3);

    box-shadow: 0 3px 14px rgba(0,0,0,0.07);

}


:global(.changeWeek) {

    font-size: 2.7em;

    cursor: pointer;

    color: inherit;

    opacity: 0.65;

    transition:
        opacity 0.15s ease,
        transform 0.15s ease;

}


:global(.changeWeek:hover) {

    opacity: 1;

    color: var(--blueOne);

    transform: scale(1.08);

}


.spacer {

    width: 42px;

}


.weekText {

    flex-grow: 1;

    text-align: center;

    font-size: 1.7em;

    font-weight: 750;

    margin: 0;

}


@media (max-width: 800px) {

    .weekText {

        font-size: 1.35em;

    }

}


@media (max-width: 450px) {

    .weekContainer {

        padding: 8px 10px;

    }


    .weekText {

        font-size: 1.05em;

    }


    :global(.changeWeek) {

        font-size: 2.1em;

    }

}
</style>

<div class="matchups">
    <div class="weekContainer">
        {#if displayWeek > 1}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(displayWeek - 1)}>chevron_left</Icon>
        {:else}
            <span class="spacer" />
        {/if}
        <h3 class="weekText">{year} Week {displayWeek} Matchups</h3>
        {#if displayWeek < matchupWeeks.length}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(displayWeek + 1)}>chevron_right</Icon>
        {:else}
            <span class="spacer" />
        {/if}
    </div>

    {#if matchupArray.length}
        <WeeklyMatchupAnalysis
            {matchupArray}
            {matchupWeeks}
            {displayWeek}
            currentWeek={week}
            {players}
            {year}
            {leagueTeamManagers}
        />
    {/if}

    {#each matchupArray as matchup, ix (rand * (ix + 1))}
        <Matchup {ix} {matchup} {players} {displayWeek} {year} bind:active={active} {leagueTeamManagers} />
    {/each}
</div>
