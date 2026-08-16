<script>
    import { leagueName } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import LinearProgress from '@smui/linear-progress';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Standing from './Standing.svelte';

    export let standingsData;
    export let leagueTeamManagersData;
    export let playoffBracketData;
    export let availableSeasons = [];
    export let selectedSeason;

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
    let activeView = 'standings';
    let playoffBracket = [];
    let bracketRounds = [];

    const buildPreseasonStandings = (teamManagers, season) => {
        const seasonTeams = teamManagers?.teamManagersMap?.[season] || {};
        return Object.keys(seasonTeams)
            .map((rosterID) => ({
                rosterID: Number(rosterID), wins: 0, losses: 0, ties: 0,
                divisionWins: 0, divisionLosses: 0, divisionTies: 0,
                fpts: 0, fptsAgainst: 0, streak: '—'
            }))
            .sort((a, b) => {
                const teamA = getTeamFromTeamManagers(teamManagers, a.rosterID, season)?.name || '';
                const teamB = getTeamFromTeamManagers(teamManagers, b.rosterID, season)?.name || '';
                return teamA.localeCompare(teamB);
            });
    };

    const buildBracketRounds = (bracket) => {
        if (!Array.isArray(bracket) || !bracket.length) return [];
        const rounds = [...new Set(bracket.map((matchup) => Number(matchup.r)).filter(Number.isFinite))].sort((a, b) => a - b);
        return rounds.map((round) => ({ round, matchups: bracket.filter((matchup) => Number(matchup.r) === round) }));
    };

    const getRoundLabel = (round) => {
        const maxRound = bracketRounds.length ? Math.max(...bracketRounds.map((item) => item.round)) : round;
        if (round === maxRound) return 'Championship';
        if (round === maxRound - 1) return 'Semifinals';
        return `Round ${round}`;
    };

    const getMatchupLabel = (matchup) => {
        if (Number(matchup?.p) === 1) return 'GGL Championship';
        if (Number(matchup?.p) === 3) return 'Third Place';
        if (Number(matchup?.p) === 5) return 'Fifth Place';
        return `Match ${matchup?.m ?? ''}`;
    };

    const normalizeRosterID = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
        return null;
    };

    const getSourceLabel = (source) => {
        if (!source) return 'TBD';
        if (source.w != null) return `Winner of Match ${source.w}`;
        if (source.l != null) return `Loser of Match ${source.l}`;
        return 'TBD';
    };

    const getBracketSlot = (matchup, slotNumber) => {
        const slotKey = slotNumber === 1 ? 't1' : 't2';
        const sourceKey = slotNumber === 1 ? 't1_from' : 't2_from';
        const rosterID = normalizeRosterID(matchup?.[slotKey]);
        if (!rosterID) return { rosterID: null, team: null, label: getSourceLabel(matchup?.[sourceKey]), winner: false, loser: false };
        return {
            rosterID,
            team: getTeamFromTeamManagers(leagueTeamManagers, rosterID, year),
            label: null,
            winner: Number(matchup?.w) === rosterID,
            loser: Number(matchup?.l) === rosterID
        };
    };

    const getChampion = () => {
        if (!playoffBracket?.length) return null;
        const championship = playoffBracket.find((matchup) => Number(matchup.p) === 1) || [...playoffBracket].sort((a, b) => Number(b.r || 0) - Number(a.r || 0))[0];
        const championRosterID = normalizeRosterID(championship?.w);
        if (!championRosterID) return null;
        return getTeamFromTeamManagers(leagueTeamManagers, championRosterID, year);
    };

    const changeSeason = (event) => {
        const season = Number(event.currentTarget.value);
        if (!Number.isFinite(season) || season === Number(selectedSeason)) return;
        goto(`/standings?season=${season}`);
    };

    onMount(async () => {
        leagueTeamManagers = await leagueTeamManagersData;
        year = Number(selectedSeason) || leagueTeamManagers?.currentSeason;
        playoffBracket = (await playoffBracketData) || [];
        bracketRounds = buildBracketRounds(playoffBracket);
        const asyncStandingsData = await standingsData;

        if (!asyncStandingsData?.standingsInfo) {
            standings = buildPreseasonStandings(leagueTeamManagers, year);
            preseason = true;
            loading = false;
            return;
        }

        const { standingsInfo, yearData } = asyncStandingsData;
        year = Number(yearData || year);
        let finalStandings = Object.values(standingsInfo || {});

        if (!finalStandings.length) {
            standings = buildPreseasonStandings(leagueTeamManagers, year);
            preseason = true;
            loading = false;
            return;
        }

        const gamesHaveStarted = finalStandings.some((standing) => {
            const gamesPlayed = Number(standing.wins || 0) + Number(standing.losses || 0) + Number(standing.ties || 0);
            return gamesPlayed > 0 || Number(standing.fpts || 0) > 0;
        });

        if (!gamesHaveStarted) {
            standings = buildPreseasonStandings(leagueTeamManagers, year);
            preseason = true;
            loading = false;
            return;
        }

        for (const sortType of sortOrder) {
            if (finalStandings[0][sortType] === undefined || finalStandings[0][sortType] === null) continue;
            finalStandings = [...finalStandings].sort((a, b) => Number(b[sortType] || 0) - Number(a[sortType] || 0));
        }

        standings = finalStandings;
        preseason = false;
        loading = false;
    });
</script>

<style>
    .standingsPage { width: 100%; max-width: 1150px; margin: 0 auto; padding: 30px 20px 70px; box-sizing: border-box; }
    .standingsHeader { text-align: center; margin-bottom: 22px; }
    .eyebrow { font-size: 0.75rem; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; opacity: 0.55; margin-bottom: 6px; }
    .standingsHeader h1 { margin: 0; font-size: 2.6rem; font-weight: 800; line-height: 1.1; }
    .standingsHeader p { margin: 10px 0 0; opacity: 0.65; }
    .seasonControls { display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    .seasonSelect { appearance: auto; min-width: 105px; padding: 7px 11px; border-radius: 999px; border: 1px solid var(--ccc); background: var(--fff); color: inherit; font: inherit; font-size: 0.78rem; font-weight: 800; cursor: pointer; }
    .seasonStatus { display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 999px; background: var(--f3f3f3); border: 1px solid var(--ccc); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; }
    .statusDot { width: 8px; height: 8px; border-radius: 50%; background: #2e9d50; }
    .statusDotPreseason { background: #d6a029; }
    .statusDotComplete { background: #777; }
    .viewToggle { width: fit-content; max-width: 100%; margin: 0 auto 28px; padding: 4px; display: flex; gap: 4px; border: 1px solid var(--ccc); border-radius: 999px; background: var(--f3f3f3); }
    .viewButton { border: 0; border-radius: 999px; padding: 9px 18px; background: transparent; color: inherit; font: inherit; font-size: 0.78rem; font-weight: 800; cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; }
    .viewButtonActive { background: var(--fff); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .loadingCard { width: 95%; max-width: 700px; margin: 35px auto; padding: 38px 28px; box-sizing: border-box; text-align: center; border-radius: 20px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    .loadingBar { width: 85%; max-width: 450px; margin: 18px auto 0; }
    .preseasonMessage { width: 100%; box-sizing: border-box; margin: 0 0 14px; padding: 12px 16px; border-radius: 12px; background: var(--f3f3f3); border: 1px solid var(--ccc); text-align: center; font-size: 0.82rem; font-weight: 650; opacity: 0.8; }
    .standingsCard { width: 100%; box-sizing: border-box; padding: 16px; border-radius: 18px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 4px 16px rgba(0,0,0,0.07); overflow: hidden; }
    .columns { display: grid; grid-template-columns: 60px minmax(240px,1fr) 120px 110px 110px 100px; align-items: center; gap: 10px; padding: 0 16px 10px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.55px; text-transform: uppercase; opacity: 0.55; }
    .center { text-align: center; }
    .list { width: 100%; }
    .bracketEmpty { width: 95%; max-width: 700px; margin: 20px auto 0; padding: 42px 28px; box-sizing: border-box; text-align: center; border-radius: 20px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    .bracketEmptyIcon { font-size: 3rem; line-height: 1; margin-bottom: 14px; }
    .bracketEmpty h2 { margin: 0; font-size: 1.55rem; font-weight: 800; }
    .bracketEmpty p { max-width: 500px; margin: 10px auto 0; line-height: 1.55; opacity: 0.65; }
    .bracketShell { width: 100%; overflow-x: auto; padding: 4px 2px 18px; box-sizing: border-box; }
    .championBanner { max-width: 620px; margin: 0 auto 22px; padding: 16px 20px; border-radius: 16px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 4px 16px rgba(0,0,0,0.07); text-align: center; }
    .championEyebrow { font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; opacity: 0.55; }
    .championName { margin-top: 5px; font-size: 1.25rem; font-weight: 850; }
    .bracket { min-width: 900px; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(260px,1fr); gap: 22px; align-items: start; }
    .roundColumn { min-width: 0; }
    .roundTitle { margin-bottom: 12px; text-align: center; font-size: 0.76rem; font-weight: 850; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.6; }
    .roundMatchups { display: flex; flex-direction: column; gap: 16px; }
    .bracketMatchup { padding: 12px; border-radius: 16px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
    .matchupLabel { margin-bottom: 9px; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.55px; text-transform: uppercase; opacity: 0.5; }
    .bracketTeam { display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 8px 10px; border-radius: 11px; background: var(--f3f3f3); border: 1px solid transparent; }
    .bracketTeam + .bracketTeam { margin-top: 7px; }
    .bracketWinner { border-color: #d4af37; font-weight: 800; }
    .bracketLoser { opacity: 0.55; }
    .bracketAvatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .bracketTeamInfo { min-width: 0; text-align: left; }
    .bracketTeamName { font-size: 0.82rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bracketManager { margin-top: 2px; font-size: 0.68rem; opacity: 0.55; }
    .bracketTbd { font-size: 0.75rem; font-weight: 700; opacity: 0.55; }
    .winnerMark { margin-left: auto; font-size: 0.9rem; }
    @media (max-width: 800px) {
        .standingsPage { padding: 20px 10px 50px; }
        .standingsHeader h1 { font-size: 2rem; }
        .standingsCard { padding: 10px; }
        .columns { grid-template-columns: 42px 1fr auto; grid-template-areas: 'rank team record'; padding: 0 14px 9px; }
        .columnRank { grid-area: rank; }
        .columnTeam { grid-area: team; }
        .columnRecord { grid-area: record; text-align: right; }
        .columnDesktop { display: none; }
        .viewButton { padding: 8px 14px; font-size: 0.72rem; }
        .bracketEmpty { padding: 32px 18px; }
        .bracket { min-width: 820px; grid-auto-columns: 240px; gap: 16px; }
    }
</style>

<div class="standingsPage">
    <div class="standingsHeader">
        <div class="eyebrow">GGL SEASON RACE</div>
        <h1>🏈 {year ? `${year} ` : ''}{leagueName}</h1>
        <p>Standings and the road to the GGL Championship</p>

        {#if !loading}
            <div class="seasonControls">
                {#if availableSeasons.length > 1}
                    <select class="seasonSelect" aria-label="Select season" value={selectedSeason} onchange={changeSeason}>
                        {#each availableSeasons as season}
                            <option value={season}>{season}</option>
                        {/each}
                    </select>
                {/if}

                {#if preseason}
                    <div class="seasonStatus"><span class="statusDot statusDotPreseason"></span>Preseason</div>
                {:else if Number(year) === Number(leagueTeamManagers?.currentSeason)}
                    <div class="seasonStatus"><span class="statusDot"></span>Season Active</div>
                {:else}
                    <div class="seasonStatus"><span class="statusDot statusDotComplete"></span>Final</div>
                {/if}
            </div>
        {/if}
    </div>

    {#if !loading}
        <div class="viewToggle">
            <button type="button" class:viewButtonActive={activeView === 'standings'} class="viewButton" onclick={() => activeView = 'standings'}>Standings</button>
            <button type="button" class:viewButtonActive={activeView === 'playoffs'} class="viewButton" onclick={() => activeView = 'playoffs'}>Playoff Bracket</button>
        </div>
    {/if}

    {#if loading}
        <div class="loadingCard"><strong>Loading Standings...</strong><div class="loadingBar"><LinearProgress indeterminate /></div></div>
    {:else if activeView === 'standings'}
        {#if preseason}<div class="preseasonMessage">Preseason standings · All teams begin 0-0</div>{/if}
        <div class="standingsCard">
            <div class="columns">
                <div class="columnRank center">#</div><div class="columnTeam">Team</div><div class="columnRecord center">Record</div>
                <div class="columnDesktop center">PF</div><div class="columnDesktop center">PA</div><div class="columnDesktop center">Streak</div>
            </div>
            <div class="list">
                {#each standings as standing, ix}
                    <Standing {standing} {leagueTeamManagers} preseason={preseason} rank={ix + 1} team={getTeamFromTeamManagers(leagueTeamManagers, standing.rosterID, year)} />
                {/each}
            </div>
        </div>
    {:else}
        {#if !playoffBracket.length}
            <div class="bracketEmpty">
                <div class="bracketEmptyIcon">🏆</div>
                <h2>Playoff bracket coming soon</h2>
                <p>Sleeper has not seeded the {year || ''} playoff field yet. Once the bracket is created, the teams and advancement paths will appear here automatically.</p>
            </div>
        {:else}
            {@const champion = getChampion()}
            {#if champion}<div class="championBanner"><div class="championEyebrow">🏆 GGL Champion</div><div class="championName">{champion.name || 'Champion'}</div></div>{/if}
            <div class="bracketShell"><div class="bracket">
                {#each bracketRounds as bracketRound}
                    <section class="roundColumn">
                        <div class="roundTitle">{getRoundLabel(bracketRound.round)}</div>
                        <div class="roundMatchups">
                            {#each bracketRound.matchups as matchup}
                                {@const teamOne = getBracketSlot(matchup, 1)}
                                {@const teamTwo = getBracketSlot(matchup, 2)}
                                <div class="bracketMatchup">
                                    <div class="matchupLabel">{getMatchupLabel(matchup)}</div>
                                    <div class:bracketWinner={teamOne.winner} class:bracketLoser={teamOne.loser} class="bracketTeam">
                                        {#if teamOne.team}
                                            {#if teamOne.team.avatar}<img class="bracketAvatar" src={teamOne.team.avatar} alt="" />{/if}
                                            <div class="bracketTeamInfo"><div class="bracketTeamName">{teamOne.team.name || 'Unknown Team'}</div>{#if teamOne.team.manager}<div class="bracketManager">{teamOne.team.manager}</div>{/if}</div>
                                            {#if teamOne.winner}<span class="winnerMark">✓</span>{/if}
                                        {:else}<div class="bracketTbd">{teamOne.label}</div>{/if}
                                    </div>
                                    <div class:bracketWinner={teamTwo.winner} class:bracketLoser={teamTwo.loser} class="bracketTeam">
                                        {#if teamTwo.team}
                                            {#if teamTwo.team.avatar}<img class="bracketAvatar" src={teamTwo.team.avatar} alt="" />{/if}
                                            <div class="bracketTeamInfo"><div class="bracketTeamName">{teamTwo.team.name || 'Unknown Team'}</div>{#if teamTwo.team.manager}<div class="bracketManager">{teamTwo.team.manager}</div>{/if}</div>
                                            {#if teamTwo.winner}<span class="winnerMark">✓</span>{/if}
                                        {:else}<div class="bracketTbd">{teamTwo.label}</div>{/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/each}
            </div></div>
        {/if}
    {/if}
</div>
