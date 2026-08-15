<script>
    import { gotoManager } from '$lib/utils/helper';
    import {
    getTeamFromTeamManagers
} from '$lib/utils/helperFunctions/universalFunctions';
import TransactionMove from './TransactionMove.svelte';

    export let transaction, players, leagueTeamManagers;

const openManager = (rosterID) => {
    const historicalRoster =
        leagueTeamManagers?.teamManagersMap?.[transaction.season]?.[rosterID];

    const managerID = historicalRoster?.managers?.[0];

    if (managerID) {
        gotoManager({
            leagueTeamManagers,
            managerID,
            year: transaction.season
        });
        return;
    }

    gotoManager({
        leagueTeamManagers,
        rosterID,
        year: transaction.season
    });
};
</script>

<style>
    .tradeTransaction {
        width: 100%;
        margin-bottom: 18px;
        border-radius: 18px;
        overflow: hidden;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .tradeHeader {
        display: grid;
        align-items: stretch;
        background: var(--f3f3f3);
        border-bottom: 1px solid var(--ccc);
    }

    .teamHeader {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 18px 12px 14px;
        text-align: center;
        cursor: pointer;
        transition:
            background-color 0.15s ease,
            transform 0.15s ease;
    }

    .teamHeader:hover {
        background: var(--ddd);
    }

    .teamHeader + .teamHeader {
        border-left: 1px solid var(--ccc);
    }

    .avatar {
        width: 54px;
        height: 54px;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid var(--blueOne);
        background: var(--fff);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .ownerName {
        margin-top: 8px;
        font-size: 0.92rem;
        font-weight: 800;
        line-height: 1.2;
        color: inherit;
        word-break: break-word;
    }

    .currentOwner {
        display: block;
        margin-top: 3px;
        font-size: 0.7rem;
        font-weight: 500;
        font-style: italic;
        opacity: 0.55;
    }

    .receivesLabel {
        margin-top: 6px;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.5;
    }

    .tradeBody {
        width: 100%;
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    tbody {
        background: var(--fff);
    }

    .tradeFooter {
        display: flex;
        justify-content: center;
        padding: 10px 14px 12px;
        border-top: 1px solid var(--ccc);
        background: var(--fff);
    }

    .date {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 11px;
        border-radius: 999px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0.65;
    }

    @media (max-width: 600px) {
        .tradeTransaction {
            border-radius: 14px;
        }

        .teamHeader {
            padding: 14px 8px 12px;
        }

        .avatar {
            width: 44px;
            height: 44px;
        }

        .ownerName {
            font-size: 0.8rem;
        }

        .currentOwner {
            font-size: 0.62rem;
        }

        .receivesLabel {
            font-size: 0.56rem;
        }
    }
</style>

<div class="tradeTransaction">

    <div
        class="tradeHeader"
        style={`grid-template-columns: repeat(${transaction.rosters.length}, minmax(0, 1fr));`}
    >
        {#each transaction.rosters as owner}

            {@const historicalTeam =
                getTeamFromTeamManagers(
                    leagueTeamManagers,
                    owner,
                    transaction.season
                )}

            {@const currentTeam =
                getTeamFromTeamManagers(
                    leagueTeamManagers,
                    owner
                )}

            <div
                class="teamHeader"
               onclick={() => openManager(owner)}
            >

                <img
                    class="avatar"
                    src={historicalTeam.avatar}
                    alt={`${historicalTeam.name} avatar`}
                />

                <div class="ownerName">
                    {historicalTeam.name}

                    {#if historicalTeam.name != currentTeam.name}
                        <span class="currentOwner">
                            Current: {currentTeam.name}
                        </span>
                    {/if}
                </div>

                <div class="receivesLabel">
                    Receives
                </div>

            </div>

        {/each}
    </div>

    <div class="tradeBody">

        <table>
            <tbody>

                {#each transaction.moves as move}
                    <TransactionMove
                        {players}
                        {move}
                        type={transaction.type}
                        {leagueTeamManagers}
                        season={transaction.season}
                    />
                {/each}

            </tbody>
        </table>

    </div>

    <div class="tradeFooter">
        <span class="date">
            🤝 {transaction.date}
        </span>
    </div>

</div>
