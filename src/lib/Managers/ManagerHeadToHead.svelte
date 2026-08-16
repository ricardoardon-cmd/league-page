<script>
    import { onMount } from 'svelte';
    import LinearProgress from '@smui/linear-progress';
    import { getManagerHeadToHeadMatrix } from '$lib/utils/helperFunctions/managerHeadToHeads';

    export let managerID;
    export let managers = [];

    let matrix = {};
    let loading = true;
    let failed = false;

    $: opponents = managerID
        ? managers
            .filter((opponent) => opponent.managerID && opponent.managerID !== managerID)
            .map((opponent) => ({
                name: opponent.name,
                ...(
                    matrix?.[managerID]?.[opponent.managerID] ||
                    {wins: 0, losses: 0, ties: 0, games: 0}
                )
            }))
            .filter((opponent) => opponent.games > 0)
            .sort((a, b) => b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name))
        : [];

    $: maxWins = Math.max(1, ...opponents.map((opponent) => opponent.wins));

    onMount(async () => {
        if(!managerID) {
            loading = false;
            return;
        }

        try {
            matrix = await getManagerHeadToHeadMatrix();
        } catch(err) {
            console.error('Unable to load manager head-to-head chart', err);
            failed = true;
        } finally {
            loading = false;
        }
    });
</script>

<style>
    .headToHeadCard {
        width: 97%;
        max-width: 800px;
        box-sizing: border-box;
        margin: 2em auto 4em;
        padding: 24px;
        border: 1px solid var(--ccc);
        border-radius: 24px;
        background: var(--fff);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }

    .chartTitle {
        margin: 0;
        text-align: left;
        font-size: 1.55rem;
        font-weight: 800;
    }

    .chartSub {
        margin: 5px 0 24px;
        color: var(--g999);
        font-size: 0.82rem;
    }

    .row {
        display: grid;
        grid-template-columns: 105px minmax(0, 1fr) 64px;
        align-items: center;
        gap: 12px;
        margin: 14px 0;
    }

    .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.85rem;
        font-weight: 700;
    }

    .track {
        height: 22px;
        overflow: hidden;
        border-radius: 7px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .bar {
        min-width: 4px;
        height: 100%;
        border-radius: 6px;
        background: var(--blueOne);
    }

    .record {
        text-align: right;
        font-size: 0.8rem;
        font-weight: 800;
        white-space: nowrap;
    }

    .record small {
        display: block;
        margin-top: 1px;
        color: var(--g999);
        font-size: 0.62rem;
        font-weight: 600;
    }

    .loading,
    .empty {
        padding: 20px 0 5px;
        text-align: center;
        color: var(--g999);
        font-size: 0.85rem;
    }

    .loading :global(.mdc-linear-progress) {
        margin-top: 12px;
    }

    @media (max-width: 505px) {
        .headToHeadCard {
            padding: 20px 16px;
        }

        .row {
            grid-template-columns: 78px minmax(0, 1fr) 58px;
            gap: 8px;
        }

        .name {
            font-size: 0.78rem;
        }

        .record {
            font-size: 0.74rem;
        }
    }
</style>

<div class="headToHeadCard">
    <h3 class="chartTitle">🆚 Head-to-Head Wins</h3>
    <p class="chartSub">Sleeper-era record against each manager</p>

    {#if loading}
        <div class="loading">
            Calculating matchup history...
            <LinearProgress indeterminate />
        </div>
    {:else if failed}
        <div class="empty">Head-to-head history is unavailable right now.</div>
    {:else if opponents.length === 0}
        <div class="empty">No completed Sleeper head-to-head matchups yet.</div>
    {:else}
        {#each opponents as opponent}
            <div class="row">
                <div class="name" title={opponent.name}>{opponent.name}</div>
                <div class="track" aria-label={`${opponent.wins} wins against ${opponent.name}`}>
                    <div
                        class="bar"
                        style={`width: ${Math.max(3, (opponent.wins / maxWins) * 100)}%`}
                    ></div>
                </div>
                <div class="record">
                    {opponent.wins}-{opponent.losses}{opponent.ties ? `-${opponent.ties}` : ''}
                    <small>{opponent.wins} wins</small>
                </div>
            </div>
        {/each}
    {/if}
</div>
