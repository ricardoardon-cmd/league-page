<script>
    import { onDestroy } from 'svelte';

    export let player;
    export let year;
    export let week;
    export let onClose = () => {};

    let loading = true;
    let errorMessage = '';
    let stats = null;
    let controller;

    const statValue = (key) => {
        const value = Number(stats?.[key]);
        return Number.isFinite(value) ? value : null;
    };

    const firstStat = (...keys) => {
        for (const key of keys) {
            const value = statValue(key);
            if (value !== null) return value;
        }
        return null;
    };

    const addStat = (items, label, value, suffix = '') => {
        if (value === null || value === undefined) return;
        items.push({ label, value: `${value}${suffix}` });
    };

    const buildRows = () => {
        const rows = [];
        const position = player?.pos;

        if (position === 'QB') {
            addStat(rows, 'Completions', firstStat('pass_cmp'));
            addStat(rows, 'Attempts', firstStat('pass_att'));
            addStat(rows, 'Passing Yards', firstStat('pass_yd'));
            addStat(rows, 'Passing TD', firstStat('pass_td'));
            addStat(rows, 'Interceptions', firstStat('pass_int'));
            addStat(rows, 'Carries', firstStat('rush_att'));
            addStat(rows, 'Rushing Yards', firstStat('rush_yd'));
            addStat(rows, 'Rushing TD', firstStat('rush_td'));
            addStat(rows, 'Fumbles Lost', firstStat('fum_lost'));
        } else if (position === 'RB') {
            addStat(rows, 'Carries', firstStat('rush_att'));
            addStat(rows, 'Rushing Yards', firstStat('rush_yd'));
            addStat(rows, 'Rushing TD', firstStat('rush_td'));
            addStat(rows, 'Targets', firstStat('rec_tgt', 'targets'));
            addStat(rows, 'Receptions', firstStat('rec'));
            addStat(rows, 'Receiving Yards', firstStat('rec_yd'));
            addStat(rows, 'Receiving TD', firstStat('rec_td'));
            addStat(rows, 'Fumbles Lost', firstStat('fum_lost'));
        } else if (position === 'WR' || position === 'TE') {
            addStat(rows, 'Targets', firstStat('rec_tgt', 'targets'));
            addStat(rows, 'Receptions', firstStat('rec'));
            addStat(rows, 'Receiving Yards', firstStat('rec_yd'));
            addStat(rows, 'Receiving TD', firstStat('rec_td'));
            addStat(rows, 'Carries', firstStat('rush_att'));
            addStat(rows, 'Rushing Yards', firstStat('rush_yd'));
            addStat(rows, 'Rushing TD', firstStat('rush_td'));
            addStat(rows, 'Fumbles Lost', firstStat('fum_lost'));
        } else if (position === 'K') {
            addStat(rows, 'FG Made', firstStat('fgm'));
            addStat(rows, 'FG Attempts', firstStat('fga'));
            addStat(rows, 'FG 0-19', firstStat('fgm_0_19'));
            addStat(rows, 'FG 20-29', firstStat('fgm_20_29'));
            addStat(rows, 'FG 30-39', firstStat('fgm_30_39'));
            addStat(rows, 'FG 40-49', firstStat('fgm_40_49'));
            addStat(rows, 'FG 50+', firstStat('fgm_50p', 'fgm_50_59', 'fgm_60p'));
            addStat(rows, 'XP Made', firstStat('xpm'));
            addStat(rows, 'XP Attempts', firstStat('xpa'));
        } else if (position === 'DEF') {
            addStat(rows, 'Sacks', firstStat('sack'));
            addStat(rows, 'Interceptions', firstStat('int'));
            addStat(rows, 'Fumble Recoveries', firstStat('fum_rec'));
            addStat(rows, 'Defensive TD', firstStat('def_td'));
            addStat(rows, 'Safeties', firstStat('safe'));
            addStat(rows, 'Blocked Kicks', firstStat('blk_kick'));
            addStat(rows, 'Points Allowed', firstStat('pts_allow'));
            addStat(rows, 'Yards Allowed', firstStat('yds_allow'));
        } else {
            addStat(rows, 'Solo Tackles', firstStat('tkl_solo'));
            addStat(rows, 'Assisted Tackles', firstStat('tkl_ast'));
            addStat(rows, 'Sacks', firstStat('sack'));
            addStat(rows, 'Interceptions', firstStat('int'));
            addStat(rows, 'Forced Fumbles', firstStat('fum_force'));
            addStat(rows, 'Fumble Recoveries', firstStat('fum_rec'));
            addStat(rows, 'Defensive TD', firstStat('def_td'));
        }

        return rows;
    };

    $: statRows = buildRows();

    const loadStats = async () => {
        if (!player?.playerID || !year || !week) {
            loading = false;
            errorMessage = 'No game stats are available for this player.';
            return;
        }

        controller?.abort();
        controller = new AbortController();
        loading = true;
        errorMessage = '';
        stats = null;

        try {
            const response = await fetch(
                `/api/player_week_stats?player_id=${encodeURIComponent(player.playerID)}&season=${encodeURIComponent(year)}&week=${encodeURIComponent(week)}&position=${encodeURIComponent(player.pos || '')}`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                throw new Error('Unable to load game stats.');
            }

            const data = await response.json();
            stats = data?.stats || null;

            if (!stats) {
                errorMessage = 'Detailed stats are not available for this game.';
            }
        } catch (error) {
            if (error?.name !== 'AbortError') {
                errorMessage = 'Unable to load game stats.';
            }
        } finally {
            loading = false;
        }
    };

    $: if (player?.playerID && year && week) {
        loadStats();
    }

    const closeOnBackdrop = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const closeOnKey = (event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    onDestroy(() => controller?.abort());
</script>

<svelte:window onkeydown={closeOnKey} />

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(0, 0, 0, 0.58);
        box-sizing: border-box;
    }

    .modal {
        width: min(560px, 100%);
        max-height: min(720px, 88vh);
        overflow-y: auto;
        border-radius: 18px;
        border: 1px solid var(--ccc);
        background: var(--fff);
        color: inherit;
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.3);
    }

    .header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px;
        border-bottom: 1px solid var(--ddd);
    }

    .avatar {
        flex: 0 0 auto;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        border: 2px solid var(--blueOne);
        background-color: var(--eee);
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 58px;
    }

    .identity {
        min-width: 0;
        flex-grow: 1;
    }

    .name {
        font-size: 1.15rem;
        font-weight: 800;
        line-height: 1.15;
    }

    .meta {
        margin-top: 5px;
        font-size: 0.78rem;
        opacity: 0.65;
    }

    .fantasyPoints {
        margin-top: 8px;
        font-size: 0.88rem;
        font-weight: 750;
    }

    .closeButton {
        flex: 0 0 auto;
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 1.7rem;
        cursor: pointer;
        opacity: 0.65;
        line-height: 1;
    }

    .closeButton:hover {
        opacity: 1;
    }

    .body {
        padding: 18px;
    }

    .message {
        padding: 24px 8px;
        text-align: center;
        opacity: 0.68;
    }

    .statsGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }

    .stat {
        padding: 12px;
        border-radius: 12px;
        background: var(--f3f3f3);
        text-align: center;
    }

    .statLabel {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.35px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .statValue {
        margin-top: 4px;
        font-size: 1.05rem;
        font-weight: 800;
    }

    @media (max-width: 480px) {
        .backdrop {
            padding: 10px;
            align-items: flex-end;
        }

        .modal {
            max-height: 86vh;
            border-radius: 18px 18px 10px 10px;
        }

        .header {
            padding: 15px 13px;
        }

        .avatar {
            width: 50px;
            height: 50px;
            background-size: auto 50px;
        }

        .statsGrid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .stat {
            padding: 10px 7px;
        }
    }
</style>

<div
    class="backdrop"
    role="presentation"
    onclick={closeOnBackdrop}
>
    <section class="modal" role="dialog" aria-modal="true" aria-label={`${player?.name || 'Player'} game stats`}>
        <div class="header">
            {#if player?.avatar}
                <div class="avatar" style={player.avatar}></div>
            {/if}

            <div class="identity">
                <div class="name">{player?.fullName || player?.name}</div>
                <div class="meta">
                    {player?.pos}{player?.team ? ` · ${player.team}` : ''} · {year} Week {week}
                    {#if player?.opponent}
                        · vs {player.opponent}
                    {/if}
                </div>
                <div class="fantasyPoints">Fantasy Points: {Number(player?.points || 0).toFixed(2)}</div>
            </div>

            <button class="closeButton" type="button" aria-label="Close player stats" onclick={onClose}>×</button>
        </div>

        <div class="body">
            {#if loading}
                <div class="message">Loading game stats...</div>
            {:else if errorMessage}
                <div class="message">{errorMessage}</div>
            {:else if statRows.length}
                <div class="statsGrid">
                    {#each statRows as stat}
                        <div class="stat">
                            <div class="statLabel">{stat.label}</div>
                            <div class="statValue">{stat.value}</div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="message">No detailed box-score stats were returned for this game.</div>
            {/if}
        </div>
    </section>
</div>
