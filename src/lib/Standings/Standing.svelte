<script>
    import { gotoManager } from '$lib/utils/helper';

    export let standing;
    export let team;
    export let leagueTeamManagers;
    export let rank;
    export let preseason = false;
</script>

<style>
    .row {
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
        padding: 15px 16px;
        margin-bottom: 8px;
        border-radius: 12px;
        background: var(--f8f8f8);

        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
    }

    .row:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }

    .rank {
        font-size: 1.1rem;
        font-weight: 800;
        text-align: center;
    }

    .preseasonRank {
        opacity: 0.4;
    }

    .team {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        min-width: 0;
    }

    .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #777;
        flex-shrink: 0;
    }

    .teamInfo {
        min-width: 0;
    }

    .teamName {
        font-size: 1rem;
        font-weight: 750;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .manager {
        font-size: 0.78rem;
        opacity: 0.65;
        margin-top: 2px;
    }

    .record {
        font-size: 1.05rem;
        font-weight: 750;
        text-align: center;
    }

    .stat {
        font-family: "Roboto Mono", monospace;
        font-size: 0.9rem;
        text-align: center;
    }

    .streak {
        font-weight: 750;
        text-align: center;
    }

    .rankOne {
        border-left: 5px solid #d4af37;
    }

    .rankTwo {
        border-left: 5px solid #aaa;
    }

    .rankThree {
        border-left: 5px solid #cd7f32;
    }

    @media (max-width: 800px) {
        .row {
            display: grid;
            grid-template-columns: 42px 1fr auto;
            grid-template-areas:
                "rank team record"
                "rank team streak";

            padding: 14px;
        }

        .rank {
            grid-area: rank;
        }

        .team {
            grid-area: team;
        }

        .record {
            grid-area: record;
            text-align: right;
        }

        .streak {
            grid-area: streak;
            text-align: right;
            font-size: 0.8rem;
            opacity: 0.7;
        }

        .stat {
            display: none;
        }

        .avatar {
            width: 42px;
            height: 42px;
        }

        .teamName {
            font-size: 0.95rem;
        }
    }
</style>

<div
    class:rankOne={!preseason && rank === 1}
    class:rankTwo={!preseason && rank === 2}
    class:rankThree={!preseason && rank === 3}
    class="row"
>
    <div class:preseasonRank={preseason} class="rank">

        {#if preseason}
            —
        {:else if rank === 1}
            🥇
        {:else if rank === 2}
            🥈
        {:else if rank === 3}
            🥉
        {:else}
            {rank}
        {/if}

    </div>

    <div
        class="team"
        onclick={() =>
            gotoManager({
                leagueTeamManagers,
                rosterID: standing.rosterID
            })
        }
    >

        {#if team?.avatar}
            <img
                class="avatar"
                src={team.avatar}
                alt="Team avatar"
            />
        {/if}

        <div class="teamInfo">

            <div class="teamName">
                {team?.name ?? 'Unknown Team'}
            </div>

            {#if team?.manager}
                <div class="manager">
                    {team.manager}
                </div>
            {/if}

        </div>

    </div>

    <div class="record">
        {standing.wins ?? 0}-{standing.losses ?? 0}

        {#if Number(standing.ties ?? 0) > 0}
            -{standing.ties}
        {/if}
    </div>

    <div class="stat">
        {Number(standing.fpts ?? 0).toFixed(1)}
    </div>

    <div class="stat">
        {Number(standing.fptsAgainst ?? 0).toFixed(1)}
    </div>

    <div class="streak">
        {standing.streak ?? '—'}
    </div>
</div>
