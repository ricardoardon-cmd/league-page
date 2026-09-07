<script>
    import { onMount } from 'svelte';
    import { gotoManager, getLeagueTransactions } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let player;
    export let rosterID = null;
    export let leagueTeamManagers;
    export let previousDrafts = [];
    export let onClose = () => {};

    let leagueTransactions = [];
    let transactionsLoaded = false;
    let transactionsLoading = false;
    let transactionsError = '';

    const playerName = (selectedPlayer) => {
        if (!selectedPlayer) return 'Unknown Player';
        const fullName = `${selectedPlayer.fn || ''} ${selectedPlayer.ln || ''}`.trim();
        if (fullName) return fullName;
        if (selectedPlayer.pos === 'DEF') return selectedPlayer.t || 'Defense';
        return 'Unknown Player';
    };

    const playerAvatar = (selectedPlayer) => {
        if (!selectedPlayer) {
            return 'background-image: url(https://sleepercdn.com/images/v2/icons/player_default.webp)';
        }

        if (selectedPlayer.pos === 'DEF') {
            const teamCode = String(selectedPlayer.t || selectedPlayer.id || '').toLowerCase();
            return `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${teamCode}.png), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
        }

        return `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${selectedPlayer.id}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
    };

    const safeTeam = (id, season) => {
        if (id == null || !leagueTeamManagers) return null;

        try {
            return getTeamFromTeamManagers(
                leagueTeamManagers,
                Number(id),
                season
            );
        } catch (error) {
            return null;
        }
    };

    const getDraftPickLabel = (draftData, draftCol, rowIndex, colIndex) => {
        const row = rowIndex + 1;
        const draftRow = draftData?.draft?.[rowIndex] || [];
        const draftType = draftData?.draftType;
        const reversalRound = draftData?.reversalRound;

        if (draftType === 'auction') {
            return `$${draftCol?.amount ?? 0}`;
        }

        if (draftType === 'snake' && !reversalRound) {
            return `${row}.${row % 2 === 0 ? draftRow.length - colIndex : colIndex + 1}`;
        }

        if (draftType === 'snake' && reversalRound) {
            if (
                (row < reversalRound && row % 2 === 0) ||
                (row >= reversalRound && row % 2 === 1)
            ) {
                return `${row}.${draftRow.length - colIndex}`;
            }
            return `${row}.${colIndex + 1}`;
        }

        if (!reversalRound || row < reversalRound) {
            return `${row}.${colIndex + 1}`;
        }

        return `${row}.${draftRow.length - colIndex}`;
    };

    const getDraftHistory = (playerID) => {
        const history = [];

        for (const draftData of previousDrafts || []) {
            const draftRows = draftData?.draft || [];

            draftRows.forEach((draftRow, rowIndex) => {
                (draftRow || []).forEach((draftCol, colIndex) => {
                    if (!draftCol?.player || String(draftCol.player) !== String(playerID)) return;

                    const originalRosterID = draftData?.draftOrder?.[colIndex];
                    const draftedRosterID = draftCol?.newOwner || originalRosterID || null;

                    history.push({
                        year: draftData.year,
                        team: draftedRosterID ? safeTeam(draftedRosterID, draftData.year) : null,
                        pick: getDraftPickLabel(draftData, draftCol, rowIndex, colIndex),
                        round: rowIndex + 1,
                        tradedPick: Boolean(draftCol?.newOwner)
                    });
                });
            });
        }

        return history.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
    };

    const ensureTransactionsLoaded = async () => {
        if (transactionsLoaded || transactionsLoading) return;

        transactionsLoading = true;
        transactionsError = '';

        try {
            const transactionPackage = await getLeagueTransactions(false);
            leagueTransactions = Array.isArray(transactionPackage?.transactions)
                ? transactionPackage.transactions
                : [];
            transactionsLoaded = true;
        } catch (error) {
            console.error(error);
            transactionsError = 'Transaction history could not be loaded right now.';
        } finally {
            transactionsLoading = false;
        }
    };

    const getPlayerTransactionHistory = (playerID) => {
        const history = [];
        const targetPlayerID = String(playerID);

        for (const transaction of leagueTransactions || []) {
            const transactionType = String(transaction?.type || '').toLowerCase();
            const transactionRosters = transaction?.rosters || [];
            const moves = transaction?.moves || [];

            if (transactionType === 'trade') {
                for (const move of moves) {
                    if (!Array.isArray(move)) continue;

                    const destinationIndex = move.findIndex(
                        (cell) => cell?.player && String(cell.player) === targetPlayerID
                    );
                    if (destinationIndex < 0) continue;

                    const originIndex = move.findIndex((cell) => cell === 'origin');
                    const fromRosterID = originIndex >= 0 ? transactionRosters[originIndex] : null;
                    const toRosterID = transactionRosters[destinationIndex] ?? null;

                    history.push({
                        kind: 'trade',
                        action: 'Traded',
                        season: transaction.season,
                        date: transaction.date,
                        fromTeam: safeTeam(fromRosterID, transaction.season),
                        toTeam: safeTeam(toRosterID, transaction.season)
                    });
                }
                continue;
            }

            for (const move of moves) {
                if (!Array.isArray(move)) continue;

                for (let ix = 0; ix < move.length; ix++) {
                    const cell = move[ix];
                    if (!cell?.player || String(cell.player) !== targetPlayerID) continue;

                    const transactionRosterID = transactionRosters[ix] ?? transactionRosters[0] ?? null;
                    const action = String(cell.type || 'Transaction');

                    history.push({
                        kind: action.toLowerCase() === 'dropped' ? 'drop' : 'add',
                        action,
                        season: transaction.season,
                        date: transaction.date,
                        team: safeTeam(transactionRosterID, transaction.season),
                        bid: cell.bid ?? null
                    });
                }
            }
        }

        return history;
    };

    const openOwner = () => {
        if (!rosterID) return;

        gotoManager({
            leagueTeamManagers,
            rosterID: Number(rosterID),
            year: leagueTeamManagers?.currentSeason
        });
    };

    $: ownerTeam = safeTeam(rosterID, leagueTeamManagers?.currentSeason);
    $: draftHistory = getDraftHistory(player?.id);
    $: transactionHistory = getPlayerTransactionHistory(player?.id);
    $: positionClass = player?.pos ? `pos-${player.pos}` : '';

    onMount(() => {
        ensureTransactionsLoaded();
    });
</script>

<style>
    .modalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.64);
    }

    .playerModal {
        width: 100%;
        max-width: 520px;
        max-height: calc(100vh - 20px);
        overflow-y: auto;
        border-radius: 20px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
    }

    .pos-QB { --pos-color: #ef4444; }
    .pos-RB { --pos-color: #22c55e; }
    .pos-WR { --pos-color: #3b82f6; }
    .pos-TE { --pos-color: #f59e0b; }
    .pos-K { --pos-color: #a855f7; }
    .pos-DEF { --pos-color: #64748b; }

    .modalTop {
        position: relative;
        padding: 24px 18px 18px;
        text-align: center;
        border-top: 4px solid var(--pos-color, var(--blueOne));
        border-bottom: 1px solid var(--ccc);
        background: linear-gradient(180deg, color-mix(in srgb, var(--pos-color, var(--blueOne)) 10%, transparent), transparent 75%), var(--f3f3f3);
    }

    .modalClose {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 34px;
        height: 34px;
        border: 1px solid var(--ccc);
        border-radius: 50%;
        background: var(--fff);
        color: inherit;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
    }

    .modalAvatar {
        width: 126px;
        height: 126px;
        margin: 0 auto 12px;
        border-radius: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 126px;
        background-color: var(--fff);
        border: 3px solid var(--pos-color, var(--ccc));
    }

    .modalName {
        font-size: 1.55rem;
        font-weight: 900;
    }

    .modalMeta {
        margin-top: 5px;
        font-size: 0.78rem;
        font-weight: 800;
        color: var(--pos-color, inherit);
    }

    .modalBody {
        padding: 14px;
    }

    .ownerCard,
    .historyItem,
    .transactionItem {
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .ownerCard {
        padding: 14px;
        border-radius: 14px;
    }

    .ownerTitle,
    .historyHeading {
        font-weight: 850;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.5;
    }

    .ownerTitle {
        font-size: 0.65rem;
    }

    .ownerButton {
        width: 100%;
        margin-top: 7px;
        padding: 11px;
        border: 1px solid var(--ccc);
        border-radius: 12px;
        background: var(--fff);
        color: inherit;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
    }

    .historySection,
    .transactionSection {
        margin-top: 14px;
    }

    .historyHeading {
        margin-bottom: 8px;
        font-size: 0.68rem;
    }

    .historyList {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .historyItem {
        display: grid;
        grid-template-columns: 52px 66px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
    }

    .historyYear {
        font-size: 0.78rem;
        font-weight: 850;
    }

    .historyPick {
        padding: 4px 7px;
        border-radius: 999px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        text-align: center;
        font-size: 0.67rem;
        font-weight: 850;
    }

    .historyTeam {
        min-width: 0;
        font-size: 0.77rem;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .historyMeta,
    .transactionMeta {
        margin-top: 2px;
        font-size: 0.62rem;
        font-weight: 650;
        opacity: 0.52;
    }

    .historyEmpty,
    .transactionStatus {
        padding: 12px;
        border-radius: 12px;
        border: 1px dashed var(--ccc);
        text-align: center;
        font-size: 0.72rem;
        line-height: 1.45;
        opacity: 0.62;
    }

    .transactionItem {
        display: grid;
        grid-template-columns: 68px minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
    }

    .transactionItem + .transactionItem {
        margin-top: 8px;
    }

    .transactionAction {
        font-size: 0.67rem;
        font-weight: 900;
        letter-spacing: 0.45px;
        text-transform: uppercase;
    }

    .transactionTrade { color: var(--blueOne); }
    .transactionAdd { color: #00a995; }
    .transactionDrop { color: #ff2a6d; }
    .transactionMain { min-width: 0; }
    .transactionTeams { font-size: 0.77rem; font-weight: 800; line-height: 1.25; }

    .transactionBid {
        padding: 4px 7px;
        border-radius: 999px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        font-size: 0.64rem;
        font-weight: 850;
        white-space: nowrap;
    }

    @media (max-width: 620px) {
        .modalBackdrop {
            padding: 6px;
        }

        .playerModal {
            max-height: calc(100vh - 12px);
            border-radius: 16px;
        }

        .modalTop {
            padding: 18px 12px 14px;
        }

        .modalAvatar {
            width: 116px;
            height: 116px;
            background-size: auto 116px;
        }

        .modalName {
            font-size: 1.35rem;
        }

        .modalBody {
            padding: 10px;
        }

        .historyItem {
            grid-template-columns: 48px 60px minmax(0, 1fr);
            gap: 7px;
            padding: 9px;
        }

        .transactionItem {
            grid-template-columns: 58px minmax(0, 1fr);
        }

        .transactionBid {
            grid-column: 2;
            justify-self: start;
        }
    }
</style>

<div
    class="modalBackdrop"
    role="presentation"
    onclick={(event) => {
        if (event.currentTarget === event.target) onClose();
    }}
>
    <div
        class="playerModal {positionClass}"
        role="dialog"
        aria-modal="true"
        aria-label={`${playerName(player)} details`}
    >
        <div class="modalTop">
            <button type="button" class="modalClose" onclick={onClose} aria-label="Close player details">×</button>
            <div class="modalAvatar" style={playerAvatar(player)}></div>
            <div class="modalName">{playerName(player)}</div>
            <div class="modalMeta">
                {player.pos}{player.t ? ` · ${player.t}` : ''}
            </div>
        </div>

        <div class="modalBody">
            <div class="ownerCard">
                <div class="ownerTitle">Current GGL Team</div>
                {#if ownerTeam}
                    <button type="button" class="ownerButton" onclick={openOwner}>
                        {ownerTeam.name}
                    </button>
                {:else}
                    <div class="ownerButton">Unknown GGL Team</div>
                {/if}
            </div>

            <div class="historySection">
                <div class="historyHeading">GGL Draft History</div>
                {#if draftHistory.length}
                    <div class="historyList">
                        {#each draftHistory as draftEvent}
                            <div class="historyItem">
                                <div class="historyYear">{draftEvent.year}</div>
                                <div class="historyPick">{draftEvent.pick}</div>
                                <div>
                                    <div class="historyTeam">{draftEvent.team?.name || 'Unknown GGL Team'}</div>
                                    <div class="historyMeta">
                                        Round {draftEvent.round}{draftEvent.tradedPick ? ' · Traded pick' : ''}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="historyEmpty">No GGL draft selection found for this player.</div>
                {/if}
            </div>

            <div class="transactionSection">
                <div class="historyHeading">GGL Transaction History</div>
                {#if transactionsLoading}
                    <div class="transactionStatus">Loading trades, waivers and free-agent moves...</div>
                {:else if transactionsError}
                    <div class="transactionStatus">{transactionsError}</div>
                {:else if transactionHistory.length}
                    {#each transactionHistory as event}
                        <div class="transactionItem">
                            <div
                                class:transactionTrade={event.kind === 'trade'}
                                class:transactionAdd={event.kind === 'add'}
                                class:transactionDrop={event.kind === 'drop'}
                                class="transactionAction"
                            >
                                {event.action}
                            </div>
                            <div class="transactionMain">
                                <div class="transactionTeams">
                                    {#if event.kind === 'trade'}
                                        {event.fromTeam?.name || 'Unknown Team'} → {event.toTeam?.name || 'Unknown Team'}
                                    {:else}
                                        {event.team?.name || 'Unknown GGL Team'}
                                    {/if}
                                </div>
                                <div class="transactionMeta">
                                    {event.season || ''}{event.date ? ` · ${event.date}` : ''}
                                </div>
                            </div>
                            {#if event.bid != null}
                                <div class="transactionBid">${event.bid} FAAB</div>
                            {/if}
                        </div>
                    {/each}
                {:else if transactionsLoaded}
                    <div class="transactionStatus">No GGL trade, waiver, or free-agent history found for this player.</div>
                {/if}
            </div>
        </div>
    </div>
</div>