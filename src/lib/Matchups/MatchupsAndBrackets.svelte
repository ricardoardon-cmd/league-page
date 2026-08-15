<script>
    import LinearProgress from '@smui/linear-progress';
    import MatchupWeeks from './MatchupWeeks.svelte';
    import Brackets from './Brackets.svelte';
    import Button, { Group, Label } from '@smui/button';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getLeagueData, loadPlayers } from '$lib/utils/helper';
    import { leagueID } from '$lib/utils/leagueInfo';

    export let queryWeek;
    export let queryYear;
    export let leagueTeamManagersData;
    export let matchupsData;
    export let bracketsData;
    export let playersData;

    const MAX_MATCHUP_WEEK = 18;

    let players;
    let matchupWeeks = [];
    let year;
    let week;
    let regularSeasonLength;
    let playoffTeams = 0;
    let brackets;
    let leagueTeamManagers;

    let loading = true;
    let seasonLoading = false;
    let seasonOptions = [];
    let selectedYear;
    let currentSeason;
    let currentMatchupsInfo;

    const groupMatchups = (rawMatchups = []) => {
        const grouped = {};

        for (const match of rawMatchups || []) {
            if (match?.matchup_id == null) continue;

            if (!grouped[match.matchup_id]) {
                grouped[match.matchup_id] = [];
            }

            grouped[match.matchup_id].push({
                roster_id: match.roster_id,
                starters: match.starters || [],
                points: match.starters_points || []
            });
        }

        return grouped;
    };

    const buildSeasonOptions = async () => {
        const options = [];
        let currentLeagueID = leagueID;

        while (currentLeagueID && currentLeagueID != 0) {
            const data = await getLeagueData(currentLeagueID);

            options.push({
                year: Number(data.season),
                leagueID: currentLeagueID,
                regularSeasonLength: Number(data.settings?.playoff_week_start || 1) - 1,
                playoffTeams: Number(data.settings?.playoff_teams || 0)
            });

            currentLeagueID = data.previous_league_id;
        }

        return options.sort((a, b) => b.year - a.year);
    };

    const loadSeasonMatchups = async (season) => {
        const requests = [];

        // Sleeper's matchup endpoint contains every head-to-head game for a week,
        // including championship bracket and consolation / toilet-bowl games.
        for (let matchupWeek = 1; matchupWeek <= MAX_MATCHUP_WEEK; matchupWeek++) {
            requests.push(
                fetch(
                    `https://api.sleeper.app/v1/league/${season.leagueID}/matchups/${matchupWeek}`
                ).then(async (response) => {
                    if (!response.ok) return [];
                    return response.json();
                }).catch(() => [])
            );
        }

        const rawWeeks = await Promise.all(requests);

        return rawWeeks
            .map((rawWeek, index) => ({
                matchups: groupMatchups(rawWeek),
                week: index + 1
            }))
            .filter((item) => Object.keys(item.matchups).length);
    };

    const getAvailableWeeks = () =>
        matchupWeeks
            .map((item) => Number(item.week))
            .filter(Number.isFinite)
            .sort((a, b) => a - b);

    const getBestWeek = (requestedWeek, isCurrentSeason) => {
        const availableWeeks = getAvailableWeeks();
        if (!availableWeeks.length) return 1;

        const requested = Number(requestedWeek);
        if (availableWeeks.includes(requested)) {
            return requested;
        }

        if (isCurrentSeason) {
            const current = Number(currentMatchupsInfo?.week || 1);

            if (availableWeeks.includes(current)) {
                return current;
            }

            const completedOrCurrent = availableWeeks.filter(
                (availableWeek) => availableWeek <= current
            );

            if (completedOrCurrent.length) {
                return completedOrCurrent[completedOrCurrent.length - 1];
            }
        }

        return availableWeeks[0];
    };

    const applySeason = async (targetYear, requestedWeek = null, updateUrl = true) => {
        const season = seasonOptions.find(
            (item) => Number(item.year) === Number(targetYear)
        );

        if (!season) return;

        seasonLoading = true;
        selection = 'regular';
        selectedYear = season.year;
        year = season.year;
        regularSeasonLength = season.regularSeasonLength;
        playoffTeams = season.playoffTeams;

        matchupWeeks = await loadSeasonMatchups(season);

        const isCurrentSeason = Number(season.year) === Number(currentSeason);

        if (isCurrentSeason) {
            week = Number(currentMatchupsInfo?.week || 1);
        } else {
            const availableWeeks = getAvailableWeeks();
            // Historical seasons are fully complete, so every available week
            // should render as a recap rather than a preview.
            week = (availableWeeks[availableWeeks.length - 1] || regularSeasonLength) + 1;
        }

        queryWeek = getBestWeek(requestedWeek, isCurrentSeason);

        if (updateUrl) {
            goto(`/matchups?year=${selectedYear}&week=${queryWeek}`, {
                noscroll: true
            });
        }

        seasonLoading = false;
    };

    onMount(async () => {
        brackets = await bracketsData;
        currentMatchupsInfo = await matchupsData;
        leagueTeamManagers = await leagueTeamManagersData;

        currentSeason = Number(
            currentMatchupsInfo?.year || leagueTeamManagers?.currentSeason
        );

        seasonOptions = await buildSeasonOptions();

        const playersInfo = await playersData;
        players = playersInfo.players;

        const requestedYear = Number(queryYear);
        const initialYear = seasonOptions.some(
            (item) => Number(item.year) === requestedYear
        )
            ? requestedYear
            : currentSeason;

        await applySeason(initialYear, queryWeek, false);

        loading = false;

        if (playersInfo.stale) {
            const newPlayersInfo = await loadPlayers(null, true);
            players = newPlayersInfo.players;
        }
    });

    const changeSelection = (s) => {
        if (s == 'regular') {
            const availableWeeks = getAvailableWeeks();
            const current = Number(currentMatchupsInfo?.week || 1);
            const bestCurrentWeek = availableWeeks.includes(current)
                ? current
                : availableWeeks[0] || 1;

            queryWeek = bestCurrentWeek;

            goto(`/matchups?year=${selectedYear}&week=${queryWeek}`, {
                noscroll: true
            });
        } else if (s == 'champions') {
            queryWeek = 99;

            goto(`/matchups?year=${selectedYear}&week=99`, {
                noscroll: true
            });
        }

        selection = s;
    };

    const changeSeason = async (event) => {
        const newYear = Number(event.currentTarget.value);
        await applySeason(newYear, 1, true);
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
        margin-bottom: 22px;
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

    .yearFilter {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        width: fit-content;
        margin: 0 auto 18px;
        padding: 9px 12px;
        border-radius: 14px;
        background: var(--f3f3f3);
        box-shadow: 0 3px 14px rgba(0,0,0,0.07);
    }

    .yearFilter label {
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.65;
    }

    .yearSelect {
        min-width: 100px;
        padding: 8px 30px 8px 10px;
        border: 1px solid var(--ccc);
        border-radius: 9px;
        background: var(--fff);
        color: inherit;
        font: inherit;
        font-weight: 750;
        cursor: pointer;
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
        margin: 50px auto 80px;
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

        .yearFilter {
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

        {#if seasonOptions.length > 1}
            <div class="yearFilter">
                <label for="matchup-year">Season</label>
                <select
                    id="matchup-year"
                    class="yearSelect"
                    value={selectedYear}
                    onchange={changeSeason}
                    disabled={seasonLoading}
                >
                    {#each seasonOptions as season}
                        <option value={season.year}>{season.year}</option>
                    {/each}
                </select>
            </div>
        {/if}

        {#if seasonLoading}
            <div class="message">
                <div class="emptyTitle">Loading {selectedYear}</div>
                <p class="emptyText">Retrieving all matchup weeks...</p>
                <LinearProgress indeterminate />
            </div>

        {:else if matchupWeeks.length}
            <div class="seasonControls">
                {#if Number(selectedYear) === Number(currentSeason)}
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
                                    Weekly Matchups
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
                                    Playoff Brackets
                                </Label>
                            </Button>
                        </Group>
                    </div>
                {/if}

                {#if Number(selectedYear) === Number(currentSeason) &&
                    (selection == 'champions' || selection == 'losers')}
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
                {#key year}
                    <MatchupWeeks
                        {players}
                        {queryWeek}
                        {matchupWeeks}
                        {regularSeasonLength}
                        {playoffTeams}
                        {year}
                        {week}
                        bind:selection
                        {leagueTeamManagers}
                    />
                {/key}
            {/if}

        {:else}
            <div class="message">
                <div class="emptyTitle">
                    🏈 No Matchups Yet
                </div>

                <p class="emptyText">
                    No matchup data is available for {year}.
                </p>
            </div>
        {/if}

        {#if Number(selectedYear) === Number(currentSeason) &&
            brackets?.champs?.bracket?.[0]?.[0]?.[0]?.points &&
            (selection == 'champions' || selection == 'losers')}
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
