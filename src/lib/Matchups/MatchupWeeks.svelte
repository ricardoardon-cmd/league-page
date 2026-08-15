<script>
	import { Icon } from '@smui/tab';
    import Matchup from './Matchup.svelte'
    import WeeklyMatchupAnalysis from './WeeklyMatchupAnalysis.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let queryWeek, players, matchupWeeks, year, week, regularSeasonLength, playoffTeams=0, selection, leagueTeamManagers;

    let displayWeek = queryWeek * 1 || 1;

    const availableWeeks = () =>
        (matchupWeeks || [])
            .map((item) => Number(item?.week))
            .filter(Number.isFinite)
            .sort((a, b) => a - b);

    const getWeekLabel = (weekNumber) => {
        if (Number(weekNumber) <= Number(regularSeasonLength)) {
            return `Week ${weekNumber}`;
        }

        const playoffRound = Number(weekNumber) - Number(regularSeasonLength);
        return `Week ${weekNumber} · Postseason ${playoffRound}`;
    };

    onMount(() => {
        const weeks = availableWeeks();

        if(!queryWeek || !weeks.includes(Number(queryWeek))) {
            const currentWeek = Number(week);
            displayWeek = weeks.includes(currentWeek)
                ? currentWeek
                : weeks[0] || 1;
            queryWeek = displayWeek;
            goto(`/matchups?year=${year}&week=${queryWeek}`, {noscroll: true});
        } else {
            displayWeek = Number(queryWeek);
        }

        processDisplayMatchup(displayWeek)
    })

    let matchupArray = [];

    // rand is used as a hacky way to make sure that the each block re-renders when the matchupArray changes
    // the new arrays are too similar to the old ones for Svelte to pick up the difference
    let rand;

    const processDisplayMatchup = (newWeek) => {
        const matchup = matchupWeeks.find(
            (item) => Number(item?.week) === Number(newWeek)
        );

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
        const numericWeek = Number(newWeek);
        if (!availableWeeks().includes(numericWeek)) return;

        displayWeek = numericWeek;
        processDisplayMatchup(displayWeek);
        active = null;
        goto(`/matchups?year=${year}&week=${displayWeek}`, {noscroll: true});
    }

    const changeWeekSelect = (event) => {
        changeWeek(event.currentTarget.value);
    };

    const previousWeek = () => {
        const weeks = availableWeeks();
        const index = weeks.indexOf(Number(displayWeek));
        return index > 0 ? weeks[index - 1] : null;
    };

    const nextWeek = () => {
        const weeks = availableWeeks();
        const index = weeks.indexOf(Number(displayWeek));
        return index >= 0 && index < weeks.length - 1 ? weeks[index + 1] : null;
    };
</script>

<style>
   .matchups {
    width: 100%;
    max-width: 1050px;
    margin: 25px auto 70px;
}

.weekContainer {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) 42px;
    width: 100%;
    max-width: 750px;
    margin: 0 auto 25px;
    align-items: center;
    padding: 12px 15px;
    box-sizing: border-box;
    border-radius: 14px;
    background: var(--f3f3f3);
    box-shadow: 0 3px 14px rgba(0,0,0,0.07);
}

.weekCenter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-width: 0;
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
    text-align: center;
    font-size: 1.35em;
    font-weight: 750;
    margin: 0;
    white-space: nowrap;
}

.weekSelect {
    min-width: 150px;
    max-width: 220px;
    padding: 8px 28px 8px 10px;
    border: 1px solid var(--ccc);
    border-radius: 9px;
    background: var(--fff);
    color: inherit;
    font: inherit;
    font-weight: 750;
    cursor: pointer;
}

@media (max-width: 650px) {
    .weekCenter {
        flex-direction: column;
        gap: 7px;
    }

    .weekText {
        font-size: 1.05em;
    }

    .weekSelect {
        min-width: 180px;
        font-size: 0.85rem;
    }
}

@media (max-width: 450px) {
    .weekContainer {
        grid-template-columns: 34px minmax(0, 1fr) 34px;
        padding: 8px 7px;
    }

    .weekText {
        font-size: 0.92em;
    }

    :global(.changeWeek) {
        font-size: 2.1em;
    }

    .spacer {
        width: 34px;
    }
}
</style>

<div class="matchups">
    <div class="weekContainer">
        {#if previousWeek()}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(previousWeek())}>chevron_left</Icon>
        {:else}
            <span class="spacer" />
        {/if}

        <div class="weekCenter">
            <h3 class="weekText">{year} Matchups</h3>
            <select
                class="weekSelect"
                value={displayWeek}
                onchange={changeWeekSelect}
                aria-label="Select matchup week"
            >
                {#each availableWeeks() as weekNumber}
                    <option value={weekNumber}>{getWeekLabel(weekNumber)}</option>
                {/each}
            </select>
        </div>

        {#if nextWeek()}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(nextWeek())}>chevron_right</Icon>
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
            {regularSeasonLength}
            {playoffTeams}
            {leagueTeamManagers}
        />
    {/if}

    {#each matchupArray as matchup, ix (rand * (ix + 1))}
        <Matchup {ix} {matchup} {players} {displayWeek} {year} bind:active={active} {leagueTeamManagers} />
    {/each}
</div>
