<script>
    import LinearProgress from '@smui/linear-progress';
    import { onMount } from 'svelte';
    import { gotoManager } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let playersInfo;

    const FILTER_POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

    let loading = true;
    let loadError = '';

    let rosters = [];
    let leagueTeamManagers;
    let players = {};
    let previousDrafts = [];

    let ownershipMap = {};
    let playerList = [];

    let search = '';
    let positionFilter = 'ALL';
    let availabilityFilter = 'ALL';

    let selectedPlayer = null;
    let visibleCount = 60;

    const buildOwnershipMap = (leagueRosters) => {
        const map = {};

        const rosterMap =
            leagueRosters?.rosters || {};

        const rosterList =
            Object.values(rosterMap);

        for (const roster of rosterList) {
            const rosterPlayers =
                roster?.players || [];

            for (const playerID of rosterPlayers) {
                map[String(playerID)] =
                    Number(roster.roster_id);
            }
        }

        return map;
    };

    const playerName = (player) => {
        if (!player) return 'Unknown Player';

        const fullName = `${player.fn || ''} ${player.ln || ''}`.trim();

        if (fullName) return fullName;

        if (player.pos === 'DEF') {
            return player.t || 'Defense';
        }

        return 'Unknown Player';
    };

    const playerAvatar = (player) => {
        if (!player) {
            return 'background-image: url(https://sleepercdn.com/images/v2/icons/player_default.webp)';
        }

        if (player.pos === 'DEF') {
            const teamCode = String(player.t || player.id || '').toLowerCase();

            return `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${teamCode}.png), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
        }

        return `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
    };

    const getOwnerInfo = (playerID) => {
        const rosterID = ownershipMap[String(playerID)];

        if (!rosterID || !leagueTeamManagers) {
            return null;
        }

        try {
            return {
                rosterID,
                team: getTeamFromTeamManagers(
                    leagueTeamManagers,
                    rosterID,
                    leagueTeamManagers.currentSeason
                )
            };
        } catch (error) {
            return {
                rosterID,
                team: null
            };
        }
    };

    const buildPlayerList = () => {
        const supportedPositions = new Set(
            FILTER_POSITIONS.filter((position) => position !== 'ALL')
        );

        playerList = Object.entries(players || {})
            .map(([id, player]) => ({
                id: String(id),
                ...player
            }))
            .filter((player) => {
                if (!player?.pos) return false;

                const isOwned = Boolean(ownershipMap[player.id]);
                const isSupported = supportedPositions.has(player.pos);

                if (!isSupported && !isOwned) return false;

                // Keep all rostered players. For free agents, keep players
                // attached to an NFL team plus team defenses.
                return (
                    isOwned ||
                    Boolean(player.t) ||
                    player.pos === 'DEF'
                );
            })
            .sort((a, b) =>
                playerName(a).localeCompare(playerName(b))
            );
    };

    const getDraftPickLabel = (
        draftData,
        draftCol,
        rowIndex,
        colIndex
    ) => {
        const row = rowIndex + 1;
        const draftRow =
            draftData?.draft?.[rowIndex] || [];
        const draftType =
            draftData?.draftType;
        const reversalRound =
            draftData?.reversalRound;

        if (
            draftType === 'auction'
        ) {
            return `$${draftCol?.amount ?? 0}`;
        }

        if (
            draftType === 'snake' &&
            !reversalRound
        ) {
            return `${row}.${
                row % 2 === 0
                    ? draftRow.length - colIndex
                    : colIndex + 1
            }`;
        }

        if (
            draftType === 'snake' &&
            reversalRound
        ) {
            if (
                (
                    row < reversalRound &&
                    row % 2 === 0
                ) ||
                (
                    row >= reversalRound &&
                    row % 2 === 1
                )
            ) {
                return `${row}.${draftRow.length - colIndex}`;
            }

            return `${row}.${colIndex + 1}`;
        }

        if (
            !reversalRound ||
            row < reversalRound
        ) {
            return `${row}.${colIndex + 1}`;
        }

        return `${row}.${draftRow.length - colIndex}`;
    };


    const getDraftHistory = (playerID) => {
        const history = [];

        for (const draftData of previousDrafts || []) {
            const draftRows =
                draftData?.draft || [];

            draftRows.forEach(
                (draftRow, rowIndex) => {

                    (draftRow || []).forEach(
                        (draftCol, colIndex) => {

                            if (
                                !draftCol?.player ||
                                String(draftCol.player) !==
                                    String(playerID)
                            ) {
                                return;
                            }

                            const originalRosterID =
                                draftData?.draftOrder?.[
                                    colIndex
                                ];

                            const rosterID =
                                draftCol?.newOwner ||
                                originalRosterID ||
                                null;

                            let team = null;

                            if (
                                rosterID &&
                                leagueTeamManagers
                            ) {
                                try {
                                    team =
                                        getTeamFromTeamManagers(
                                            leagueTeamManagers,
                                            Number(rosterID),
                                            draftData.year
                                        );
                                } catch (error) {
                                    team = null;
                                }
                            }

                            history.push({
                                year: draftData.year,
                                rosterID:
                                    rosterID
                                        ? Number(rosterID)
                                        : null,
                                team,
                                pick:
                                    getDraftPickLabel(
                                        draftData,
                                        draftCol,
                                        rowIndex,
                                        colIndex
                                    ),
                                round:
                                    rowIndex + 1,
                                tradedPick:
                                    Boolean(
                                        draftCol?.newOwner
                                    )
                            });
                        }
                    );
                }
            );
        }

        return history.sort(
            (a, b) =>
                Number(b.year || 0) -
                Number(a.year || 0)
        );
    };


    const openPlayer = (player) => {
        selectedPlayer = player;
    };

    const closePlayer = () => {
        selectedPlayer = null;
    };

    const openOwner = (ownerInfo) => {
        if (!ownerInfo?.rosterID) return;

        gotoManager({
            leagueTeamManagers,
            rosterID: ownerInfo.rosterID,
            year: leagueTeamManagers?.currentSeason
        });
    };

    const resetVisible = () => {
        visibleCount = 60;
    };

    $: normalizedSearch = search.trim().toLowerCase();

    $: filteredPlayers = playerList.filter((player) => {
        const ownerInfo = getOwnerInfo(player.id);
        const isOwned = Boolean(ownerInfo);

        if (
            positionFilter !== 'ALL' &&
            player.pos !== positionFilter
        ) {
            return false;
        }

        if (
            availabilityFilter === 'ROSTERED' &&
            !isOwned
        ) {
            return false;
        }

        if (
            availabilityFilter === 'AVAILABLE' &&
            isOwned
        ) {
            return false;
        }

        if (!normalizedSearch) {
            return true;
        }

        const ownerName =
            ownerInfo?.team?.name || '';

        const haystack = [
            playerName(player),
            player.pos,
            player.t,
            ownerName
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedSearch);
    });

    $: displayedPlayers =
        filteredPlayers.slice(0, visibleCount);

    $: rosteredCount =
        playerList.filter((player) =>
            Boolean(ownershipMap[player.id])
        ).length;

    $: availableCount =
        Math.max(playerList.length - rosteredCount, 0);

    onMount(async () => {
        try {
            const [
                leagueRosters,
                teamManagers,
                playerData,
                previousDraftData
            ] = await playersInfo;

            rosters = leagueRosters || [];
            leagueTeamManagers = teamManagers;
            players = playerData?.players || {};
            previousDrafts =
                previousDraftData || [];

            ownershipMap = buildOwnershipMap(rosters);
            buildPlayerList();
        } catch (error) {
            console.error(error);
            loadError =
                error?.message ||
                'Unable to load the player directory.';
        } finally {
            loading = false;
        }
    });
</script>

<style>
    .playersPage {
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
        padding: 30px 18px 70px;
        box-sizing: border-box;
    }

    .pageHeader {
        text-align: center;
        margin-bottom: 26px;
    }

    .eyebrow {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1.3px;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 6px;
    }

    .pageHeader h1 {
        margin: 0;
        font-size: 2.6rem;
        font-weight: 850;
        line-height: 1.1;
    }

    .pageHeader p {
        margin: 10px 0 0;
        opacity: 0.65;
    }

    .summaryGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
    }

    .summaryCard {
        padding: 16px;
        border-radius: 16px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        text-align: center;
    }

    .summaryValue {
        font-size: 1.35rem;
        font-weight: 850;
    }

    .summaryLabel {
        margin-top: 3px;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.5;
    }

    .filters {
        padding: 14px;
        margin-bottom: 18px;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
    }

    .searchInput {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--ccc);
        background: var(--f3f3f3);
        color: inherit;
        font: inherit;
        outline: none;
    }

    .searchInput:focus {
        border-color: var(--blueOne);
    }

    .filterRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }

    .filterButton {
        border: 1px solid var(--ccc);
        border-radius: 999px;
        padding: 7px 11px;
        background: var(--f3f3f3);
        color: inherit;
        font: inherit;
        font-size: 0.72rem;
        font-weight: 800;
        cursor: pointer;
    }

    .filterButtonActive {
        background: var(--blueOne);
        color: white;
        border-color: var(--blueOne);
    }

    .filterDivider {
        width: 1px;
        background: var(--ccc);
        margin: 2px 4px;
    }

    .resultMeta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin: 0 2px 12px;
        font-size: 0.72rem;
        opacity: 0.6;
    }

    .playerGrid {
        display: grid;
        grid-template-columns:
            repeat(3, minmax(0, 1fr));
        gap: 12px;
    }

    .playerCard {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        padding: 14px;
        border: 1px solid var(--ccc);
        border-radius: 16px;
        background: var(--fff);
        color: inherit;
        text-align: left;
        font: inherit;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);

        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease;
    }

    .playerCard:hover {
        transform: translateY(-2px);
        border-color: var(--blueOne);
        box-shadow: 0 7px 18px rgba(0, 0, 0, 0.08);
    }

    .avatar {
        width: 52px;
        height: 52px;
        flex-shrink: 0;
        border-radius: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 52px;
        background-color: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .playerInfo {
        min-width: 0;
        flex: 1;
    }

    .playerName {
        font-size: 0.92rem;
        font-weight: 850;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .playerMeta {
        margin-top: 3px;
        font-size: 0.7rem;
        font-weight: 700;
        opacity: 0.58;
    }

    .owner {
        margin-top: 6px;
        font-size: 0.7rem;
        font-weight: 750;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .available {
        color: #2e9d50;
    }

    .positionBadge {
        flex-shrink: 0;
        padding: 5px 7px;
        border-radius: 999px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        font-size: 0.62rem;
        font-weight: 850;
    }

    .loadMore {
        display: block;
        margin: 22px auto 0;
        padding: 9px 16px;
        border: 1px solid var(--ccc);
        border-radius: 999px;
        background: var(--fff);
        color: inherit;
        font: inherit;
        font-size: 0.74rem;
        font-weight: 800;
        cursor: pointer;
    }

    .emptyState,
    .loadingCard,
    .errorCard {
        padding: 36px 20px;
        border-radius: 18px;
        border: 1px solid var(--ccc);
        background: var(--fff);
        text-align: center;
    }

    .loadingBar {
        width: 85%;
        max-width: 450px;
        margin: 16px auto 0;
    }

    .errorCard {
        border-color: #d66565;
    }

    .modalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.58);
    }

    .playerModal {
        width: 100%;
        max-width: 520px;
        max-height: calc(100vh - 36px);
        overflow-y: auto;
        border-radius: 22px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
    }

    .modalTop {
        position: relative;
        padding: 28px 24px 22px;
        text-align: center;
        border-bottom: 1px solid var(--ccc);
        background: var(--f3f3f3);
    }

    .modalClose {
        position: absolute;
        top: 12px;
        right: 12px;
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
        width: 92px;
        height: 92px;
        margin: 0 auto 12px;
        border-radius: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 92px;
        background-color: var(--fff);
        border: 2px solid var(--ccc);
    }

    .modalName {
        font-size: 1.5rem;
        font-weight: 900;
    }

    .modalMeta {
        margin-top: 5px;
        font-size: 0.78rem;
        font-weight: 750;
        opacity: 0.6;
    }

    .modalBody {
        padding: 18px;
    }

    .detailGrid {
        display: grid;
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
        gap: 10px;
    }

    .detailCard {
        padding: 13px;
        border-radius: 13px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .detailLabel {
        font-size: 0.62rem;
        font-weight: 850;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        opacity: 0.48;
    }

    .detailValue {
        margin-top: 4px;
        font-size: 0.88rem;
        font-weight: 850;
    }

    .ownerCard {
        margin-top: 12px;
        padding: 15px;
        border-radius: 14px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .ownerTitle {
        font-size: 0.65rem;
        font-weight: 850;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.5;
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

    .historySection {
        margin-top: 14px;
    }

    .historyHeading {
        margin-bottom: 8px;
        font-size: 0.68rem;
        font-weight: 850;
        letter-spacing: 0.65px;
        text-transform: uppercase;
        opacity: 0.5;
    }

    .historyList {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .historyItem {
        display: grid;
        grid-template-columns:
            58px
            72px
            minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        padding: 11px 12px;
        border-radius: 12px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
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

    .historyMeta {
        margin-top: 2px;
        font-size: 0.62rem;
        font-weight: 650;
        opacity: 0.52;
    }

    .historyEmpty {
        padding: 12px;
        border-radius: 12px;
        border: 1px dashed var(--ccc);
        text-align: center;
        font-size: 0.72rem;
        line-height: 1.45;
        opacity: 0.58;
    }

    @media (max-width: 900px) {
        .playerGrid {
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 620px) {
        .playersPage {
            padding: 20px 10px 50px;
        }

        .pageHeader h1 {
            font-size: 2rem;
        }

        .summaryGrid {
            gap: 7px;
        }

        .summaryCard {
            padding: 12px 6px;
        }

        .summaryValue {
            font-size: 1.05rem;
        }

        .summaryLabel {
            font-size: 0.55rem;
        }

        .playerGrid {
            grid-template-columns: 1fr;
        }

        .filterDivider {
            display: none;
        }

        .detailGrid {
            grid-template-columns: 1fr;
        }
    }
</style>

<div class="playersPage">

    <div class="pageHeader">
        <div class="eyebrow">GGL PLAYER DIRECTORY</div>
        <h1>🏈 Players</h1>
        <p>Search the NFL player pool and see who owns each player in GGL</p>
    </div>


    {#if loading}

        <div class="loadingCard">
            <strong>Loading players...</strong>

            <div class="loadingBar">
                <LinearProgress indeterminate />
            </div>
        </div>

    {:else if loadError}

        <div class="errorCard">
            {loadError}
        </div>

    {:else}

        <div class="summaryGrid">

            <div class="summaryCard">
                <div class="summaryValue">
                    {playerList.length}
                </div>
                <div class="summaryLabel">
                    Players
                </div>
            </div>

            <div class="summaryCard">
                <div class="summaryValue">
                    {rosteredCount}
                </div>
                <div class="summaryLabel">
                    Rostered
                </div>
            </div>

            <div class="summaryCard">
                <div class="summaryValue">
                    {availableCount}
                </div>
                <div class="summaryLabel">
                    Available
                </div>
            </div>

        </div>


        <div class="filters">

            <input
                class="searchInput"
                type="search"
                bind:value={search}
                oninput={resetVisible}
                placeholder="Search player, NFL team, or GGL team..."
            />

            <div class="filterRow">

                {#each FILTER_POSITIONS as position}

                    <button
                        type="button"
                        class:filterButtonActive={
                            positionFilter === position
                        }
                        class="filterButton"
                        onclick={() => {
                            positionFilter = position;
                            resetVisible();
                        }}
                    >
                        {position}
                    </button>

                {/each}

                <span class="filterDivider"></span>

                {#each [
                    ['ALL', 'All'],
                    ['ROSTERED', 'Rostered'],
                    ['AVAILABLE', 'Available']
                ] as option}

                    <button
                        type="button"
                        class:filterButtonActive={
                            availabilityFilter === option[0]
                        }
                        class="filterButton"
                        onclick={() => {
                            availabilityFilter = option[0];
                            resetVisible();
                        }}
                    >
                        {option[1]}
                    </button>

                {/each}

            </div>

        </div>


        <div class="resultMeta">
            <span>
                {filteredPlayers.length} matching players
            </span>

            {#if filteredPlayers.length > displayedPlayers.length}
                <span>
                    Showing {displayedPlayers.length}
                </span>
            {/if}
        </div>


        {#if displayedPlayers.length}

            <div class="playerGrid">

                {#each displayedPlayers as player}

                    {@const ownerInfo =
                        getOwnerInfo(player.id)}

                    <button
                        type="button"
                        class="playerCard"
                        onclick={() => openPlayer(player)}
                    >

                        <div
                            class="avatar"
                            style={playerAvatar(player)}
                        ></div>

                        <div class="playerInfo">

                            <div class="playerName">
                                {playerName(player)}
                            </div>

                            <div class="playerMeta">
                                {player.pos}
                                {player.t ? ` · ${player.t}` : ''}
                            </div>

                            {#if ownerInfo?.team}

                                <div class="owner">
                                    {ownerInfo.team.name}
                                </div>

                            {:else}

                                <div class="owner available">
                                    Available
                                </div>

                            {/if}

                        </div>

                        <div class="positionBadge">
                            {player.pos}
                        </div>

                    </button>

                {/each}

            </div>


            {#if displayedPlayers.length < filteredPlayers.length}

                <button
                    type="button"
                    class="loadMore"
                    onclick={() => visibleCount += 60}
                >
                    Load more players
                </button>

            {/if}


        {:else}

            <div class="emptyState">
                No players match those filters.
            </div>

        {/if}

    {/if}

</div>


{#if selectedPlayer}

    {@const selectedOwner =
        getOwnerInfo(selectedPlayer.id)}

    {@const selectedDraftHistory =
        getDraftHistory(selectedPlayer.id)}

    <div
        class="modalBackdrop"
        role="presentation"
        onclick={(event) => {
            if (event.currentTarget === event.target) {
                closePlayer();
            }
        }}
    >

        <div
            class="playerModal"
            role="dialog"
            aria-modal="true"
            aria-label={`${playerName(selectedPlayer)} details`}
        >

            <div class="modalTop">

                <button
                    type="button"
                    class="modalClose"
                    onclick={closePlayer}
                    aria-label="Close player details"
                >
                    ×
                </button>

                <div
                    class="modalAvatar"
                    style={playerAvatar(selectedPlayer)}
                ></div>

                <div class="modalName">
                    {playerName(selectedPlayer)}
                </div>

                <div class="modalMeta">
                    {selectedPlayer.pos}
                    {selectedPlayer.t
                        ? ` · ${selectedPlayer.t}`
                        : ''}
                </div>

            </div>


            <div class="modalBody">

                <div class="detailGrid">

                    <div class="detailCard">
                        <div class="detailLabel">
                            Position
                        </div>
                        <div class="detailValue">
                            {selectedPlayer.pos || '—'}
                        </div>
                    </div>

                    <div class="detailCard">
                        <div class="detailLabel">
                            NFL Team
                        </div>
                        <div class="detailValue">
                            {selectedPlayer.t || 'Free Agent'}
                        </div>
                    </div>

                    <div class="detailCard">
                        <div class="detailLabel">
                            GGL Status
                        </div>
                        <div
                            class:available={!selectedOwner}
                            class="detailValue"
                        >
                            {selectedOwner
                                ? 'Rostered'
                                : 'Available'}
                        </div>
                    </div>

                    <div class="detailCard">
                        <div class="detailLabel">
                            GGL Drafts
                        </div>
                        <div class="detailValue">
                            {selectedDraftHistory.length}
                        </div>
                    </div>

                </div>


                <div class="ownerCard">

                    <div class="ownerTitle">
                        Current GGL Team
                    </div>

                    {#if selectedOwner?.team}

                        <button
                            type="button"
                            class="ownerButton"
                            onclick={() =>
                                openOwner(selectedOwner)
                            }
                        >
                            {selectedOwner.team.name}
                        </button>

                    {:else}

                        <div class="ownerButton available">
                            Available
                        </div>

                    {/if}

                </div>


                <div class="historySection">

                    <div class="historyHeading">
                        GGL Draft History
                    </div>

                    {#if selectedDraftHistory.length}

                        <div class="historyList">

                            {#each selectedDraftHistory as draftEvent}

                                <div class="historyItem">

                                    <div class="historyYear">
                                        {draftEvent.year}
                                    </div>

                                    <div class="historyPick">
                                        {draftEvent.pick}
                                    </div>

                                    <div>

                                        <div class="historyTeam">
                                            {draftEvent.team?.name ||
                                                'Unknown GGL Team'}
                                        </div>

                                        <div class="historyMeta">
                                            Round {draftEvent.round}
                                            {draftEvent.tradedPick
                                                ? ' · Traded pick'
                                                : ''}
                                        </div>

                                    </div>

                                </div>

                            {/each}

                        </div>

                    {:else}

                        <div class="historyEmpty">
                            No GGL draft selection found for this player.
                        </div>

                    {/if}

                </div>

            </div>

        </div>

    </div>

{/if}
