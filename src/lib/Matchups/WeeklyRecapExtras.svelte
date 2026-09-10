<script>
    import { round } from '$lib/utils/helper';

    export let matchupArray = [];
    export let players = {};
    export let displayWeek;

    const numericRound = (value) => Number(round(Number(value) || 0));

    const playerName = (playerID) => {
        const player = players?.[playerID];
        if (!player) return `Player ${playerID}`;

        if (player.pos === 'DEF') {
            return player.ln || player.fn || String(playerID).toUpperCase();
        }

        return `${player.fn || ''} ${player.ln || ''}`.trim() || `Player ${playerID}`;
    };

    const starterPerformances = () => {
        const performances = [];

        for (const matchup of matchupArray || []) {
            for (const entry of matchup || []) {
                const starters = entry?.starters || [];
                const points = entry?.points || [];

                starters.forEach((playerID, index) => {
                    if (!playerID || playerID == 0) return;

                    const projected = Number(players?.[playerID]?.wi?.[displayWeek]?.p);
                    const actual = Number(points[index] || 0);

                    if (!Number.isFinite(projected)) return;

                    performances.push({
                        playerID,
                        name: playerName(playerID),
                        projected: numericRound(projected),
                        actual: numericRound(actual),
                        difference: numericRound(actual - projected)
                    });
                });
            }
        }

        return performances;
    };

    $: performances = starterPerformances();
    $: overachiever = [...performances].sort((a, b) => b.difference - a.difference)[0] || null;
    $: bust = [...performances].sort((a, b) => a.difference - b.difference)[0] || null;
</script>

<style>
    .extrasCard {
        width: 95%;
        max-width: 900px;
        margin: -12px auto 24px;
        padding: 14px;
        box-sizing: border-box;
        border: 1px solid var(--ccc);
        border-radius: 16px;
        background: var(--fff);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }

    .item {
        padding: 13px;
        border-radius: 12px;
        background: var(--f3f3f3);
        text-align: center;
    }

    .label {
        font-size: 0.68rem;
        font-weight: 850;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        opacity: 0.58;
    }

    .name {
        margin-top: 5px;
        font-size: 0.92rem;
        font-weight: 850;
        line-height: 1.2;
    }

    .detail {
        margin-top: 4px;
        font-size: 0.72rem;
        opacity: 0.68;
        line-height: 1.3;
    }

    .difference {
        margin-top: 3px;
        font-size: 0.76rem;
        font-weight: 800;
    }

    @media (max-width: 600px) {
        .extrasCard {
            width: 100%;
            padding: 12px;
        }

        .name {
            font-size: 0.82rem;
        }

        .detail,
        .difference {
            font-size: 0.68rem;
        }
    }
</style>

{#if overachiever || bust}
    <section class="extrasCard">
        <div class="grid">
            <div class="item">
                <div class="label">🚀 Overachiever of the Week</div>
                {#if overachiever}
                    <div class="name">{overachiever.name}</div>
                    <div class="detail">Projected {overachiever.projected} · Scored {overachiever.actual}</div>
                    <div class="difference">+{overachiever.difference} vs projection</div>
                {:else}
                    <div class="name">—</div>
                {/if}
            </div>

            <div class="item">
                <div class="label">💩 Bust of the Week</div>
                {#if bust}
                    <div class="name">{bust.name}</div>
                    <div class="detail">Projected {bust.projected} · Scored {bust.actual}</div>
                    <div class="difference">{bust.difference} vs projection</div>
                {:else}
                    <div class="name">—</div>
                {/if}
            </div>
        </div>
    </section>
{/if}
