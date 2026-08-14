<script>
    import { gotoManager } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let transaction, players, leagueTeamManagers;

    const owner = transaction.rosters[0];

    const getAvatar = (pos, player) => {
        if (pos == 'DEF') {
            return `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${player.toLowerCase()}.png)`;
        }

        return `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${player}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
    };

    const historicalTeam =
        getTeamFromTeamManagers(
            leagueTeamManagers,
            owner,
            transaction.season
        );

    const currentTeam =
        getTeamFromTeamManagers(
            leagueTeamManagers,
            owner
        );
</script>

<style>
    .waiverTransaction {
        width: 100%;
        margin-bottom: 18px;
        border-radius: 18px;
        overflow: hidden;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease;
    }

    .waiverTransaction:hover {
        transform: translateY(-2px);
        border-color: var(--blueOne);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
    }

    .waiverHeader {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 18px;
        background: var(--f3f3f3);
        border-bottom: 1px solid var(--ccc);
    }

    .avatar {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid var(--blueTwo);
        background: var(--fff);
        flex-shrink: 0;
    }

    .teamInfo {
        min-width: 0;
        flex: 1;
    }

    .ownerName {
        font-size: 0.95rem;
        font-weight: 800;
        line-height: 1.2;
    }

    .currentOwner {
        display: block;
        margin-top: 3px;
        font-size: 0.7rem;
        font-style: italic;
        opacity: 0.55;
    }

    .waiverType {
        margin-top: 5px;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.5;
    }

    .bid {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        font-size: 0.72rem;
        font-weight: 800;
        white-space: nowrap;
    }

    .moves {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        padding: 18px;
    }

    .player {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 14px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .playerAvatar {
        position: relative;
        flex-shrink: 0;
        width: 54px;
        height: 54px;
        border: 2px solid;
        border-radius: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 54px;
    }

    .indicator {
        position: absolute;
        right: -6px;
        bottom: -6px;
        font-size: 1.2rem;
        background: var(--fff);
        border-radius: 50%;
    }

    .add {
        color: #00ceb8;
    }

    .drop {
        color: #ff2a6d;
    }

    .playerText {
        min-width: 0;
    }

    .playerAction {
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        margin-bottom: 3px;
    }

    .playerActionAdd {
        color: #00a995;
    }

    .playerActionDrop {
        color: #ff2a6d;
    }

    .playerName {
        font-size: 0.9rem;
        font-weight: 800;
        line-height: 1.2;
    }

    .playerInfo {
        margin-top: 3px;
        font-size: 0.7rem;
        opacity: 0.6;
    }

    .waiverFooter {
        display: flex;
        justify-content: center;
        padding: 10px 14px 12px;
        border-top: 1px solid var(--ccc);
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
        .waiverTransaction {
            border-radius: 14px;
        }

        .waiverHeader {
            padding: 14px 12px;
        }

        .avatar {
            width: 44px;
            height: 44px;
        }

        .ownerName {
            font-size: 0.85rem;
        }

        .moves {
            grid-template-columns: 1fr;
            padding: 12px;
        }

        .player {
            padding: 10px;
        }

        .playerAvatar {
            width: 48px;
            height: 48px;
            background-size: auto 48px;
        }
    }
</style>

<div
    class="waiverTransaction"
    onclick={() =>
        gotoManager({
            year: transaction.season,
            leagueTeamManagers,
            rosterID: owner
        })
    }
>

    <div class="waiverHeader">

        <img
            class="avatar"
            src={historicalTeam.avatar}
            alt={`${historicalTeam.name} avatar`}
        />

        <div class="teamInfo">

            <div class="ownerName">
                {historicalTeam.name}

                {#if historicalTeam.name != currentTeam.name}
                    <span class="currentOwner">
                        Current: {currentTeam.name}
                    </span>
                {/if}
            </div>

            <div class="waiverType">
                Waiver / Free Agent Move
            </div>

        </div>

        {#if transaction.moves?.[0]?.[0]?.bid}
            <div class="bid">
                💰 ${transaction.moves[0][0].bid}
            </div>
        {/if}

    </div>

    <div class="moves">

        {#each transaction.moves as move}

            {@const moveData = move[0]}
            {@const player = players[moveData.player]}

            <div class="player">

                <div
                    class="playerAvatar"
                    style={`border-color: var(--${player.pos}); background-color: var(--${moveData.type == "Added" ? "waiverAdd" : "waiverDrop"}); ${getAvatar(player.pos, moveData.player)}`}
                >

                    {#if moveData.type == "Added"}
                        <i
                            class="add indicator material-icons"
                            aria-hidden="true"
                        >
                            add_circle
                        </i>

                    {:else if moveData.type == "Dropped"}

                        <i
                            class="drop indicator material-icons"
                            aria-hidden="true"
                        >
                            do_not_disturb_on
                        </i>

                    {/if}

                </div>

                <div class="playerText">

                    <div
                        class:playerActionAdd={moveData.type == "Added"}
                        class:playerActionDrop={moveData.type == "Dropped"}
                        class="playerAction"
                    >
                        {moveData.type}
                    </div>

                    <div class="playerName">
                        {player.fn} {player.ln}
                    </div>

                    <div class="playerInfo">
                        {player.pos}

                        {#if player.t}
                            · {player.t}
                        {/if}
                    </div>

                </div>

            </div>

        {/each}

    </div>

    <div class="waiverFooter">
        <span class="date">
            ➕ {transaction.date}
        </span>
    </div>

</div>
