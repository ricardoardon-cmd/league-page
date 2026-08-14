<script>
    import {
        getTeamNameFromTeamManagers
    } from '$lib/utils/helperFunctions/universalFunctions';
    import { Row, Cell } from '@smui/data-table';

    export let draftRow;
    export let draftType;
    export let row;
    export let reversalRound;
    export let previous = false;
    export let players;
    export let year;
    export let leagueTeamManagers;

    const getPlayer = (draftCol) => {
        if (!draftCol?.player) return null;
        return players?.[draftCol.player] || null;
    };

    const getPlayerAvatar = (draftCol) => {
        const player = getPlayer(draftCol);

        if (!draftCol?.player || !player) {
            return 'background-image: url(https://sleepercdn.com/images/v2/icons/player_default.webp)';
        }

        if (player.pos === 'DEF') {
            return `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${draftCol.player.toLowerCase()}.png)`;
        }

        return `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${draftCol.player}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
    };

    const getPlayerName = (draftCol) => {
        const player = getPlayer(draftCol);

        if (!player) return 'Unknown Player';

        const name = `${player.fn || ''} ${player.ln || ''}`.trim();

        if (player.pos === 'DEF') {
            return name || draftCol.player;
        }

        return player.t
            ? `${name || 'Unknown Player'} (${player.t})`
            : (name || 'Unknown Player');
    };

    const getPosition = (draftCol) => {
        return getPlayer(draftCol)?.pos || '';
    };

    const getPickLabel = (draftCol, col) => {
        if (draftType === 'auction' && previous) {
            return `$${draftCol?.amount ?? 0}`;
        }

        let pick;

        if (draftType === 'snake' && !reversalRound) {
            pick = `${row}.${row % 2 === 0 ? draftRow.length - col : col + 1}`;
        } else if (draftType === 'snake' && reversalRound) {
            if (
                (row < reversalRound && row % 2 === 0) ||
                (row >= reversalRound && row % 2 === 1)
            ) {
                pick = `${row}.${draftRow.length - col}`;
            } else {
                pick = `${row}.${col + 1}`;
            }
        } else {
            if (!reversalRound || row < reversalRound) {
                pick = `${row}.${col + 1}`;
            } else {
                pick = `${row}.${draftRow.length - col}`;
            }
        }

        if (draftCol?.newOwner) {
            return `${pick} · ${getTeamNameFromTeamManagers(
                leagueTeamManagers,
                draftCol.newOwner,
                year
            )}`;
        }

        return pick;
    };
</script>

<style>
    :global(.draftCell) {
        position: relative;
        overflow: hidden;
        background: var(--fff);
        transition:
            transform 0.12s ease,
            box-shadow 0.12s ease;
    }

    :global(.draftCell:hover) {
        z-index: 2;
        box-shadow: inset 0 0 0 2px var(--blueOne);
    }

    :global(.changedHands) {
        background-color: var(--draftSwapped);
    }

    .draftPos {
        position: absolute;
        top: 7px;
        left: 7px;
        z-index: 2;
        max-width: calc(100% - 14px);
        padding: 3px 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);
        color: rgba(0, 0, 0, 0.65);
        font-size: 0.67rem;
        font-weight: 800;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .draftPosPrev {
        position: absolute;
        top: 7px;
        left: 7px;
        z-index: 2;
        max-width: calc(100% - 14px);
        padding: 3px 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);
        color: rgba(0, 0, 0, 0.65);
        font-size: 0.67rem;
        font-weight: 800;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .newOwner {
        display: flex;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        align-items: center;
        justify-content: center;
        padding: 28px 8px 8px;
        text-align: center;
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1.2;
    }

    :global(.prevQB) {
        background-color: var(--QBfade);
    }

    :global(.prevWR) {
        background-color: var(--WRfade);
    }

    :global(.prevRB) {
        background-color: var(--RBfade);
    }

    :global(.prevTE) {
        background-color: var(--TEfade);
    }

    :global(.prevK) {
        background-color: var(--Kfade);
    }

    :global(.prevDEF) {
        background-color: var(--DEfadeFfade);
    }

    :global(.prevCB) {
        background-color: var(--CBfade);
    }

    :global(.prevSS) {
        background-color: var(--SSfade);
    }

    :global(.prevFS) {
        background-color: var(--FSfade);
    }

    :global(.prevDE) {
        background-color: var(--DEfade);
    }

    :global(.prevDL) {
        background-color: var(--DLfade);
    }

    :global(.prevLB) {
        background-color: var(--LBfade);
    }

    .playerCard {
        display: flex;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 25px 6px 7px;
    }

    .playerAvatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 34px;
        background-color: rgba(255, 255, 255, 0.55);
        border: 1px solid rgba(0, 0, 0, 0.18);
        flex-shrink: 0;
    }

    .position {
        margin-top: 5px;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.68);
        color: rgba(0, 0, 0, 0.65);
        font-size: 0.58rem;
        font-weight: 850;
        line-height: 1;
    }

    .name {
        width: 100%;
        margin-top: 5px;
        text-align: center;
        color: rgba(0, 0, 0, 0.82);
        font-size: 0.68rem;
        font-weight: 750;
        line-height: 1.12;
        white-space: normal;
        overflow-wrap: anywhere;
    }

    @media (max-width: 800px) {
        .draftPos,
        .draftPosPrev {
            top: 5px;
            left: 5px;
            font-size: 0.61rem;
            padding: 3px 5px;
        }

        .playerCard {
            padding-top: 23px;
        }

        .playerAvatar {
            width: 30px;
            height: 30px;
            background-size: auto 30px;
        }

        .name {
            font-size: 0.62rem;
        }

        .newOwner {
            font-size: 0.66rem;
        }
    }
</style>

<Row>

    {#each draftRow as draftCol, col}

        {#if !previous || draftCol}

            <Cell
                class="draftCell{draftCol ? ' changedHands' : ''}{previous && draftCol ? ` prev${getPosition(draftCol)}` : ''}"
            >

                <span class={previous ? 'draftPosPrev' : 'draftPos'}>
                    {getPickLabel(draftCol, col)}
                </span>

                {#if draftCol && !previous}

                    <div class="newOwner">
                        {getTeamNameFromTeamManagers(
                            leagueTeamManagers,
                            draftCol,
                            year
                        )}
                    </div>

                {/if}

                {#if previous && draftCol}

                    <div class="playerCard">

                        <div
                            class="playerAvatar"
                            style={getPlayerAvatar(draftCol)}
                        ></div>

                        {#if getPosition(draftCol)}
                            <div class="position">
                                {getPosition(draftCol)}
                            </div>
                        {/if}

                        <div class="name">
                            {getPlayerName(draftCol)}
                        </div>

                    </div>

                {/if}

            </Cell>

        {/if}

    {/each}

</Row>
