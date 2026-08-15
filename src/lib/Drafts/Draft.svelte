<script>
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
    import LinearProgress from '@smui/linear-progress';
    import { onMount } from 'svelte';
    import DraftRow from './DraftRow.svelte';
    import { gotoManager } from '$lib/utils/helper';
    import {
        getAvatarFromTeamManagers,
        getTeamNameFromTeamManagers
    } from '$lib/utils/helperFunctions/universalFunctions';

    export let draftData;
    export let leagueTeamManagers;
    export let previous = false;
    export let year;
    export let players;

    const {
        draftOrder,
        draft,
        accuracy,
        reversalRound,
        draftType
    } = draftData;

    let progress = 0;
    let closed = false;

    onMount(loadAccuracy);

    function loadAccuracy() {
        if (!accuracy || accuracy === 1) return;

        let timer;

        progress = 0;
        closed = false;

        clearInterval(timer);

        timer = setInterval(() => {
            progress += 0.02;

            if (progress >= accuracy) {
                clearInterval(timer);

                if (progress >= 1) {
                    progress = 1;
                    closed = true;
                }
            }
        }, 100);
    }

    const getDraftTypeLabel = () => {
        if (draftType === 'auction') return 'Auction Draft';
        if (draftType === 'snake') return reversalRound ? '3rd Round Reversal' : 'Snake Draft';
        return 'Draft Board';
    };
</script>

<style>
    .draftCard {
        width: 95%;
        max-width: 1160px;
        margin: 0 auto 34px;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
        overflow: hidden;
    }

    .draftMeta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--ccc);
        background: var(--f3f3f3);
    }

    .draftMetaLeft {
        min-width: 0;
        text-align: left;
    }

    .draftYear {
        font-size: 0.95rem;
        font-weight: 850;
    }

    .draftType {
        margin-top: 2px;
        font-size: 0.68rem;
        font-weight: 700;
        opacity: 0.55;
    }

    .draftStatus {
        flex-shrink: 0;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.45px;
        text-transform: uppercase;
        opacity: 0.75;
    }

    .accuracy {
        padding: 12px 16px 14px;
        border-bottom: 1px solid var(--ccc);
    }

    .accuracyText {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0.7;
    }

    .accuracyPercent {
        font-weight: 850;
        opacity: 1;
    }

    .disclaimer {
        font-style: normal;
        font-weight: 500;
        opacity: 0.7;
    }

    .boardScroll {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
    }

    :global(.draftBoard) {
        display: block;
        width: 100%;
        margin: 0;
        box-shadow: none !important;
    }

    :global(.draftBoard table) {
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
        width: 100%;
        min-width: 1200px;
        background: var(--fff);
    }

    :global(.draftTeam) {
        height: 82px;
        padding: 8px 6px !important;
        vertical-align: top;
        text-align: center;
        white-space: normal;
        line-height: 1.05em;
        background: var(--f3f3f3);
        border-right: 1px solid var(--ccc);
        border-bottom: 1px solid var(--ccc);
        font-size: 0.73rem;
        font-weight: 750;
    }

    :global(.draftTeam:last-of-type) {
        border-right: none;
    }

    :global(.draftBoard td) {
        height: 105px;
        padding: 0 !important;
        border-right: 1px solid var(--ccc);
        border-bottom: 1px solid var(--ccc);
        font-size: 0.72rem;
        vertical-align: middle;
    }

    :global(.draftBoard tbody tr:last-child td) {
        border-bottom: none;
    }

    :global(.draftBoard td:last-of-type) {
        border-right: none;
    }

    .avatar {
        display: block;
        width: 36px;
        height: 36px;
        margin: 0 auto 6px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #777;
        cursor: pointer;
    }

    .teamName {
        display: block;
        max-width: 110px;
        margin: 0 auto;
        cursor: pointer;
        line-height: 1.1em;
    }

    :global(.curDraftName) {
        display: block;
        margin-top: 3px;
        color: inherit;
        font-size: 0.78em;
        font-style: italic;
        font-weight: 500;
        opacity: 0.55;
    }

    .scrollHint {
        display: none;
        padding: 9px 14px;
        border-top: 1px solid var(--ccc);
        background: var(--f3f3f3);
        text-align: center;
        font-size: 0.68rem;
        font-weight: 700;
        opacity: 0.55;
    }

    @media (max-width: 800px) {
        .draftCard {
            width: 98%;
            border-radius: 14px;
        }

        .draftMeta {
            padding: 11px 12px;
        }

        .accuracy {
            padding: 10px 12px 12px;
        }

        .accuracyText {
            flex-direction: column;
            gap: 3px;
        }

        :global(.draftBoard table) {
            min-width: 1050px;
        }

        :global(.draftTeam) {
            height: 74px;
            font-size: 0.67rem;
        }

        :global(.draftBoard td) {
            height: 94px;
        }

        .avatar {
            width: 31px;
            height: 31px;
        }

        .scrollHint {
            display: block;
        }
    }
</style>

<div class="draftCard">

    <div class="draftMeta">

        <div class="draftMetaLeft">
            <div class="draftYear">{year} Draft Board</div>
            <div class="draftType">{getDraftTypeLabel()}</div>
        </div>

        <div class="draftStatus">
            {previous ? 'Final' : 'Projected Order'}
        </div>

    </div>

    {#if accuracy && accuracy !== 1 && !closed}

        <div class="accuracy">

            <div class="accuracyText">
                <span>
                    Upcoming draft order accuracy
                    <span class="disclaimer">
                        · improves as the regular season progresses
                    </span>
                </span>

                <span class="accuracyPercent">
                    {parseInt(progress * 100)}%
                </span>
            </div>

            <LinearProgress {progress} {closed} />

        </div>

    {/if}

    <div class="boardScroll">

        <DataTable class="draftBoard">

            <Head>
                <Row>

                    {#each draftOrder as draftPosition}

                        {#if draftPosition}

                            {@const historicalName =
                                getTeamNameFromTeamManagers(
                                    leagueTeamManagers,
                                    draftPosition,
                                    year
                                )}

                            {@const currentName =
                                getTeamNameFromTeamManagers(
                                    leagueTeamManagers,
                                    draftPosition
                                )}

                            <Cell class="draftTeam">

                                <img
                                    class="avatar"
                                    onclick={() =>
                                        gotoManager({
                                            year,
                                            leagueTeamManagers,
                                            rosterID: draftPosition
                                        })
                                    }
                                    src={getAvatarFromTeamManagers(
                                        leagueTeamManagers,
                                        draftPosition,
                                        year
                                    )}
                                    alt={`${historicalName} avatar`}
                                />

                                <span
                                    class="teamName"
                                    onclick={() =>
                                        gotoManager({
                                            year,
                                            leagueTeamManagers,
                                            rosterID: draftPosition
                                        })
                                    }
                                >
                                    {historicalName}

                                    {#if historicalName !== currentName}
                                        <span class="curDraftName">
                                            ({currentName})
                                        </span>
                                    {/if}
                                </span>

                            </Cell>

                        {/if}

                    {/each}

                </Row>
            </Head>

            <Body>

                {#each draft as draftRow, row}

                    <DraftRow
                        {draftRow}
                        row={row + 1}
                        {previous}
                        {reversalRound}
                        {draftType}
                        {players}
                        {leagueTeamManagers}
                        {year}
                    />

                {/each}

            </Body>

        </DataTable>

    </div>

    <div class="scrollHint">
        Swipe horizontally to view the full draft board
    </div>

</div>
