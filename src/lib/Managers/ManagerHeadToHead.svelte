<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import LinearProgress from '@smui/linear-progress';
    import { getManagerHeadToHeadMatrix } from '$lib/utils/helperFunctions/managerHeadToHeads';

    export let managerID = null;
    export let rosterID = null;
    export let managers = [];
    export let leagueTeamManagers = null;
    export let transactions = [];

    let matrix = {};
    let loading = true;
    let failed = false;
    let view = 'matchups';

    const resolveManagerID = (managerOption = null, fallbackRosterID = null) => {
        if(managerOption?.managerID) return managerOption.managerID;
        const roster = managerOption?.roster ?? fallbackRosterID;
        if(roster == null || !leagueTeamManagers) return null;

        const seasons = Object.keys(leagueTeamManagers.teamManagersMap || {})
            .map(Number).filter(Number.isFinite).sort((a, b) => b - a);
        for(const season of seasons) {
            const resolved = leagueTeamManagers.teamManagersMap?.[season]?.[roster]?.managers?.[0];
            if(resolved) return resolved;
        }
        return null;
    };

    const managersForRoster = (season, roster) => {
        const direct = leagueTeamManagers?.teamManagersMap?.[season]?.[roster]?.managers;
        if(direct?.length) return direct;

        // Transactions around New Year can be dated one calendar year away from the fantasy season.
        for(const nearby of [Number(season) - 1, Number(season) + 1]) {
            const found = leagueTeamManagers?.teamManagersMap?.[nearby]?.[roster]?.managers;
            if(found?.length) return found;
        }
        return [];
    };

    $: resolvedManagerID = managerID || resolveManagerID(null, rosterID);

    $: opponents = resolvedManagerID
        ? managers
            .map((opponent) => ({ name: opponent.name, managerID: resolveManagerID(opponent, opponent.roster) }))
            .filter((opponent) => opponent.managerID && opponent.managerID !== resolvedManagerID)
            .map((opponent) => ({
                name: opponent.name,
                managerID: opponent.managerID,
                ...(matrix?.[resolvedManagerID]?.[opponent.managerID] || {wins: 0, losses: 0, ties: 0, games: 0})
            }))
            .filter((opponent) => opponent.games > 0)
            .sort((a, b) => b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name))
        : [];

    $: tradeOpponents = resolvedManagerID
        ? managers
            .map((opponent) => ({ name: opponent.name, managerID: resolveManagerID(opponent, opponent.roster) }))
            .filter((opponent) => opponent.managerID && opponent.managerID !== resolvedManagerID)
            .map((opponent) => {
                const sharedTrades = (transactions || []).filter((transaction) => {
                    if(transaction?.type !== 'trade' || !Array.isArray(transaction.rosters)) return false;
                    const involvedManagers = new Set();
                    for(const roster of transaction.rosters) {
                        for(const id of managersForRoster(transaction.season, roster)) involvedManagers.add(id);
                    }
                    return involvedManagers.has(resolvedManagerID) && involvedManagers.has(opponent.managerID);
                });
                return { ...opponent, trades: sharedTrades.length };
            })
            .filter((opponent) => opponent.trades > 0)
            .sort((a, b) => b.trades - a.trades || a.name.localeCompare(b.name))
        : [];

    $: maxWins = Math.max(1, ...opponents.map((opponent) => opponent.wins));
    $: maxTrades = Math.max(1, ...tradeOpponents.map((opponent) => opponent.trades));

    const openRivalry = (opponentManagerID) => {
        if(!resolvedManagerID || !opponentManagerID) return;
        const params = new URLSearchParams({ player_one: resolvedManagerID, player_two: opponentManagerID });
        goto(`/rivalry?${params.toString()}`);
    };

    const handleRowKeydown = (event, opponentManagerID) => {
        if(event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openRivalry(opponentManagerID);
        }
    };

    onMount(async () => {
        try { matrix = await getManagerHeadToHeadMatrix(); }
        catch(err) { console.error('Unable to load manager head-to-head chart', err); failed = true; }
        finally { loading = false; }
    });
</script>

<style>
    .headToHeadCard { width:97%; max-width:800px; box-sizing:border-box; margin:2em auto 4em; padding:24px; border:1px solid var(--ccc); border-radius:24px; background:var(--fff); box-shadow:0 6px 20px rgba(0,0,0,.08); }
    .chartTitle { margin:0; text-align:left; font-size:1.55rem; font-weight:800; }
    .chartSub { margin:5px 0 16px; color:var(--g999); font-size:.82rem; }
    .tabs { display:inline-flex; gap:4px; margin:0 0 16px; padding:4px; border:1px solid var(--ccc); border-radius:12px; background:var(--f3f3f3); }
    .tab { border:0; border-radius:9px; padding:8px 14px; background:transparent; color:inherit; font:inherit; font-size:.75rem; font-weight:800; cursor:pointer; }
    .tab.active { background:var(--blueOne); color:#fff; box-shadow:0 2px 6px rgba(0,0,0,.12); }
    .row { display:grid; grid-template-columns:105px minmax(0,1fr) 64px; align-items:center; gap:12px; margin:8px -8px; padding:6px 8px; border-radius:10px; cursor:pointer; transition:background-color .15s ease,transform .15s ease; }
    .row:hover,.row:focus-visible { background:var(--f3f3f3); outline:none; }.row:active{transform:scale(.995)}
    .name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.85rem; font-weight:700; }
    .track { height:22px; overflow:hidden; border-radius:7px; background:var(--f3f3f3); border:1px solid var(--ccc); }
    .bar { min-width:4px; height:100%; border-radius:6px; background:var(--blueOne); }
    .tradeBar { background:var(--blueTwo); }
    .record { text-align:right; font-size:.8rem; font-weight:800; white-space:nowrap; }.record small{display:block;margin-top:1px;color:var(--g999);font-size:.62rem;font-weight:600}
    .loading,.empty { padding:20px 0 5px; text-align:center; color:var(--g999); font-size:.85rem; }.loading :global(.mdc-linear-progress){margin-top:12px}
    @media(max-width:505px){.headToHeadCard{padding:20px 16px}.row{grid-template-columns:78px minmax(0,1fr) 64px;gap:8px}.name{font-size:.78rem}.record{font-size:.74rem}.tabs{width:100%;box-sizing:border-box}.tab{flex:1;padding:8px 10px}}
</style>

<div class="headToHeadCard">
    <h3 class="chartTitle">{view === 'matchups' ? '🆚 Head-to-Head Wins' : '🤝 Trade History'}</h3>
    <p class="chartSub">{view === 'matchups' ? 'Sleeper-era record against each manager · Tap a matchup to open the rivalry' : 'Completed Sleeper-era trades with each manager'}</p>

    <div class="tabs" role="tablist" aria-label="Manager relationship stats">
        <button class:active={view === 'matchups'} class="tab" role="tab" aria-selected={view === 'matchups'} onclick={() => view = 'matchups'}>⚔️ Matchups</button>
        <button class:active={view === 'trades'} class="tab" role="tab" aria-selected={view === 'trades'} onclick={() => view = 'trades'}>🤝 Trades</button>
    </div>

    {#if view === 'matchups'}
        {#if loading}<div class="loading">Calculating matchup history...<LinearProgress indeterminate /></div>
        {:else if failed}<div class="empty">Head-to-head history is unavailable right now.</div>
        {:else if !resolvedManagerID}<div class="empty">Unable to match this profile to a Sleeper manager.</div>
        {:else if opponents.length === 0}<div class="empty">No completed Sleeper head-to-head matchups yet.</div>
        {:else}
            {#each opponents as opponent}
                <div class="row" role="link" tabindex="0" aria-label={`Open ${opponent.name} rivalry`} onclick={() => openRivalry(opponent.managerID)} onkeydown={(event) => handleRowKeydown(event, opponent.managerID)}>
                    <div class="name" title={opponent.name}>{opponent.name}</div>
                    <div class="track" aria-label={`${opponent.wins} wins against ${opponent.name}`}><div class="bar" style={`width:${Math.max(3,(opponent.wins/maxWins)*100)}%`}></div></div>
                    <div class="record">{opponent.wins}-{opponent.losses}{opponent.ties ? `-${opponent.ties}` : ''}<small>{opponent.wins} wins</small></div>
                </div>
            {/each}
        {/if}
    {:else}
        {#if !resolvedManagerID}<div class="empty">Unable to match this profile to a Sleeper manager.</div>
        {:else if tradeOpponents.length === 0}<div class="empty">No completed Sleeper trades with other current managers yet.</div>
        {:else}
            {#each tradeOpponents as opponent}
                <div class="row" role="link" tabindex="0" aria-label={`Open ${opponent.name} rivalry`} onclick={() => openRivalry(opponent.managerID)} onkeydown={(event) => handleRowKeydown(event, opponent.managerID)}>
                    <div class="name" title={opponent.name}>{opponent.name}</div>
                    <div class="track" aria-label={`${opponent.trades} trades with ${opponent.name}`}><div class="bar tradeBar" style={`width:${Math.max(3,(opponent.trades/maxTrades)*100)}%`}></div></div>
                    <div class="record">{opponent.trades}<small>{opponent.trades === 1 ? 'trade' : 'trades'}</small></div>
                </div>
            {/each}
        {/if}
    {/if}
</div>