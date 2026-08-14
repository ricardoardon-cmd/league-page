<script>
    import Matchup from "$lib/Matchups/Matchup.svelte";
    import TradeTransaction from "$lib/Transactions/TradeTransaction.svelte";
    import {
        getLeagueRecords,
        getLeagueTransactions,
        getRivalryMatchups,
        loadPlayers,
        round
    } from "$lib/utils/helper";
   import {
    getRosterIDFromManagerIDAndYear,
    getTeamData
} from "$lib/utils/helperFunctions/universalFunctions";    import LinearProgress from '@smui/linear-progress';
    import { onMount } from "svelte";

    import ComparissonBar from "./ComparissonBar.svelte";
    import ManagerSelectors from "./ManagerSelectors.svelte";
    import RivalryControls from "./RivalryControls.svelte";

    export let leagueTeamManagers,
        playersInfo,
        transactionsInfo,
        recordsInfo,
        playerOne,
        playerTwo;

    // Refresh stale data
    onMount(async () => {
        if (transactionsInfo.stale) {
            transactionsInfo = await getLeagueTransactions(false, true);
        }

        if (playersInfo.stale) {
            playersInfo = await loadPlayers(null, true);
        }

        if (recordsInfo.stale) {
            recordsInfo = await getLeagueRecords(true);
        }
    });

    let rivalry = null;
    let loading = true;

    const analyzeRivalry = async (p1, p2) => {
        loading = true;
        matchup = null;

        if (p1 && p2) {
            rivalry = await getRivalryMatchups(p1, p2);
            loading = false;
        }
    };

    $: analyzeRivalry(playerOne, playerTwo);

    let selected = 0;

    $: matchup = rivalry?.matchups[selected]?.matchup;
    $: displayWeek = rivalry?.matchups[selected]?.week;
    $: year = rivalry?.matchups[selected]?.year;

    const setTradeHistory = (p1, p2) => {
        if (!p1 || !p2) {
            return [];
        }

        const trades = transactionsInfo.transactions.filter((transaction) => {
            if (transaction.type !== "trade") {
                return false;
            }

            const rosterIDOne = parseInt(
                getRosterIDFromManagerIDAndYear(
                    leagueTeamManagers,
                    playerOne,
                    transaction.season
                )
            );

            const rosterIDTwo = parseInt(
                getRosterIDFromManagerIDAndYear(
                    leagueTeamManagers,
                    playerTwo,
                    transaction.season
                )
            );

            if (rosterIDOne == rosterIDTwo) {
                return false;
            }

            return (
                transaction.rosters.includes(rosterIDOne) &&
                transaction.rosters.includes(rosterIDTwo)
            );
        });

        const move = (arr, from, to) => {
            arr.splice(to, 0, arr.splice(from, 1)[0]);
        };

        // Reorganize trades to match left-right rivalry alignment
        return trades.map((t) => {
            const rosterIDOne = parseInt(
                getRosterIDFromManagerIDAndYear(
                    leagueTeamManagers,
                    playerOne,
                    t.season
                )
            );

            const rosterIDTwo = parseInt(
                getRosterIDFromManagerIDAndYear(
                    leagueTeamManagers,
                    playerTwo,
                    t.season
                )
            );

            const rosterOneStartLocation = t.rosters.indexOf(rosterIDOne);

            if (rosterOneStartLocation > 0) {
                move(t.rosters, rosterOneStartLocation, 0);

                for (const tradeMove of t.moves) {
                    move(tradeMove, rosterOneStartLocation, 0);
                }
            }

            const rosterTwoStartLocation = t.rosters.indexOf(rosterIDTwo);
            const last = t.rosters.length - 1;

            if (rosterTwoStartLocation < last) {
                move(t.rosters, rosterTwoStartLocation, last);

                for (const tradeMove of t.moves) {
                    move(tradeMove, rosterTwoStartLocation, last);
                }
            }

            return t;
        });
    };

    $: tradeHistory = setTradeHistory(playerOne, playerTwo);

    const performanceOrderOne = [
        { field: "wins", label: "Wins", unit: "wins" },
        { field: "losses", label: "Losses", unit: "losses" },
        { field: "ties", label: "Ties", unit: "ties" }
    ];

    const performanceOrderTwo = [
        { field: "fptsFor", label: "Fantasy Points For", unit: "fpts" },
        {
            field: "fptsAgainst",
            label: "Fantasy Points Against",
            unit: "fpts against"
        }
    ];

    $: playerOneRecords =
        recordsInfo?.regularSeasonData?.leagueManagerRecords
            ? recordsInfo.regularSeasonData.leagueManagerRecords[playerOne]
            : null;

    $: playerTwoRecords =
        recordsInfo?.regularSeasonData?.leagueManagerRecords
            ? recordsInfo.regularSeasonData.leagueManagerRecords[playerTwo]
            : null;
$: playerOneData = playerOne
    ? getTeamData(leagueTeamManagers.users, playerOne)
    : null;

$: playerTwoData = playerTwo
    ? getTeamData(leagueTeamManagers.users, playerTwo)
    : null;

$: playerOneManagerName = playerOne
    ? leagueTeamManagers.users[playerOne]?.display_name
    : '';

$: playerTwoManagerName = playerTwo
    ? leagueTeamManagers.users[playerTwo]?.display_name
    : '';

$: seriesLeader =
    rivalry && playerOne && playerTwo
        ? rivalry.wins.one > rivalry.wins.two
            ? playerOneData?.name
            : rivalry.wins.two > rivalry.wins.one
                ? playerTwoData?.name
                : 'Series Tied'
        : '';
</script>

<style>
    .rivalryHeader {
        width: 95%;
        max-width: 1000px;
        margin: 30px auto 20px;
        text-align: center;
    }

    .rivalryEyebrow {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1.4px;
        opacity: 0.55;
        margin-bottom: 6px;
    }

    .rivalryHeader h2 {
        margin: 0;
        font-size: 2.7rem;
        font-weight: 800;
        line-height: 1.1;
    }

    .rivalryHeader p {
        margin: 10px 0 0;
        opacity: 0.65;
    }

    .rivalrySelectorCard {
        width: 95%;
        max-width: 1000px;
        margin: 20px auto 30px;
        padding: 22px;
        box-sizing: border-box;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .selectorTitle {
        text-align: center;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.6;
        margin-bottom: 16px;
    }

    .scoreBoard {
        width: 95%;
        max-width: 1000px;
        margin: 22px auto;
        padding: 24px;
        box-sizing: border-box;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    h3 {
        text-align: center;
        font-size: 1.9em;
        margin: 20px 0 16px;
    }

    .trades {
        width: 95%;
        max-width: 750px;
        margin: 2em auto;
    }

    .loading {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
    }

    .center {
        text-align: center;
    }

    .helmets {
        width: 80%;
        max-width: 800px;
        margin: 0 auto 2em;
    }

    @media (max-width: 650px) {
        .rivalryHeader h2 {
            font-size: 2rem;
        }

        .rivalrySelectorCard {
            padding: 16px 12px;
        }

        .scoreBoard {
            padding: 16px 10px;
        }

        h3 {
            font-size: 1.6em;
        }
    }

    @media (max-width: 400px) {
        h3 {
            font-size: 1.3em;
        }
    }
.vsCard {
    width: 95%;
    max-width: 1000px;
    margin: 22px auto;
    padding: 28px 24px;
    box-sizing: border-box;
    border-radius: 20px;
    background: var(--fff);
    border: 1px solid var(--ccc);
    box-shadow: 0 5px 18px rgba(0, 0, 0, 0.08);
}

.vsLabel {
    text-align: center;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    opacity: 0.55;
    margin-bottom: 24px;
}

.vsMatchup {
    display: grid;
    grid-template-columns: 1fr 110px 1fr;
    align-items: center;
    gap: 20px;
}

.vsTeam {
    text-align: center;
    min-width: 0;
}

.vsAvatar {
    width: 105px;
    height: 105px;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid var(--ccc);
    box-shadow: 0 4px 13px rgba(0, 0, 0, 0.15);
}

.vsTeamName {
    margin-top: 12px;
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1.15;
}

.vsManagerName {
    margin-top: 5px;
    font-size: 0.82rem;
    opacity: 0.6;
}

.vsWins {
    margin-top: 12px;
    font-size: 1.35rem;
    font-weight: 800;
}

.vsWinsLabel {
    margin-left: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.6px;
    opacity: 0.55;
}

.vsMiddle {
    text-align: center;
}

.vsText {
    font-size: 1.5rem;
    font-weight: 900;
    opacity: 0.35;
    margin-bottom: 9px;
}

.seriesScore {
    font-size: 1.8rem;
    font-weight: 900;
    white-space: nowrap;
}

.seriesLeader {
    margin-top: 25px;
    padding-top: 18px;
    text-align: center;
    border-top: 1px solid var(--ccc);
}

.seriesLeaderLabel {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    opacity: 0.5;
}

.seriesLeaderName {
    margin-top: 5px;
    font-size: 1rem;
    font-weight: 800;
}

@media (max-width: 600px) {
    .vsCard {
        padding: 22px 12px;
    }

    .vsMatchup {
        grid-template-columns: 1fr 60px 1fr;
        gap: 5px;
    }

    .vsAvatar {
        width: 70px;
        height: 70px;
    }

    .vsTeamName {
        font-size: 0.9rem;
    }

    .vsManagerName {
        font-size: 0.7rem;
    }

    .vsWins {
        font-size: 1.1rem;
    }

    .vsText {
        font-size: 1rem;
    }

    .seriesScore {
        font-size: 1.25rem;
    }
}
</style>

<div class="rivalryHeader">
    <div class="rivalryEyebrow">
        GGL HEAD-TO-HEAD
    </div>

    <h2>
        ⚔️ Rivalry Center
    </h2>

    <p>
        Compare two managers across league history
    </p>
</div>

<div class="rivalrySelectorCard">
    <div class="selectorTitle">
        Choose Two Managers
    </div>

    <div class="rivalrySelection">
        <ManagerSelectors
            bind:playerOne
            bind:playerTwo
            {leagueTeamManagers}
        />
    </div>
</div>
{#if !loading && playerOne && playerTwo && rivalry}

    <div class="vsCard">

        <div class="vsLabel">
            All-Time Head-to-Head
        </div>

        <div class="vsMatchup">

            <!-- Manager One -->
            <div class="vsTeam">

                {#if playerOneData?.avatar}
                    <img
                        class="vsAvatar"
                        src={playerOneData.avatar}
                        alt={playerOneData.name}
                    />
                {/if}

                <div class="vsTeamName">
                    {playerOneData?.name}
                </div>

                <div class="vsManagerName">
                    {playerOneManagerName}
                </div>

                <div class="vsWins">
                    {rivalry.wins.one}
                    <span class="vsWinsLabel">
                        WINS
                    </span>
                </div>

            </div>

            <!-- Center Score -->
            <div class="vsMiddle">

                <div class="vsText">
                    VS
                </div>

                <div class="seriesScore">
                    {rivalry.wins.one} – {rivalry.wins.two}
                </div>

            </div>

            <!-- Manager Two -->
            <div class="vsTeam">

                {#if playerTwoData?.avatar}
                    <img
                        class="vsAvatar"
                        src={playerTwoData.avatar}
                        alt={playerTwoData.name}
                    />
                {/if}

                <div class="vsTeamName">
                    {playerTwoData?.name}
                </div>

                <div class="vsManagerName">
                    {playerTwoManagerName}
                </div>

                <div class="vsWins">
                    {rivalry.wins.two}
                    <span class="vsWinsLabel">
                        WINS
                    </span>
                </div>

            </div>

        </div>

        <div class="seriesLeader">

            <div class="seriesLeaderLabel">
                All-Time Series
            </div>

            <div class="seriesLeaderName">
                {#if rivalry.wins.one === rivalry.wins.two}
                    🤝 Series Tied
                {:else}
                    👑 {seriesLeader} Leads
                {/if}
            </div>

        </div>

    </div>

{/if}

{#if loading}
{#if loading}
    {#if playerOne && playerTwo}
        <div class="loading">
            <p>Analyzing rivalry...</p>
            <br />
            <LinearProgress indeterminate />
        </div>
    {:else}
        <div class="center">
            <img
                class="helmets"
                src="/helmets.png"
                alt="placeholder of helmets clashing"
            />
        </div>
    {/if}

{:else}

    {#if rivalry?.matchups.length > 0}
        <div class="scoreBoard">

            <h3>Head to Head</h3>

            <ComparissonBar
                sideOne={rivalry.wins.one}
                sideTwo={rivalry.wins.two}
                label="Wins"
                unit="wins"
            />

            <ComparissonBar
                sideOne={parseFloat(round(rivalry.points.one))}
                sideTwo={parseFloat(round(rivalry.points.two))}
                label="Points"
                unit="pts"
            />

            <h3>Matchups</h3>

            <RivalryControls
                bind:selected
                {year}
                {displayWeek}
                length={rivalry.matchups.length}
            />

            <Matchup
                key={`${playerOne}-${playerTwo}`}
                ix={selected}
                active={selected}
                {year}
                {matchup}
                players={playersInfo.players}
                {displayWeek}
                expandOverride={true}
                {leagueTeamManagers}
            />

        </div>
    {/if}

    <div class="scoreBoard">

        {#if playerOne && playerTwo}

            <h3>Trade History</h3>

            <div class="trades">

                {#each tradeHistory as transaction}

                    <TradeTransaction
                        players={playersInfo.players}
                        {transaction}
                        {leagueTeamManagers}
                    />

                {:else}

                    No trades yet...

                {/each}

            </div>

        {/if}

    </div>

    {#if playerOne && playerTwo && playerOneRecords && playerTwoRecords}

        <div class="scoreBoard">

            <h3>Performance Comparison</h3>

            <ComparissonBar
                sideOne={parseFloat(
                    round(
                        playerOneRecords.wins /
                        (
                            playerOneRecords.wins +
                            playerOneRecords.ties +
                            playerOneRecords.losses
                        ) *
                        100
                    )
                )}
                sideTwo={parseFloat(
                    round(
                        playerTwoRecords.wins /
                        (
                            playerTwoRecords.wins +
                            playerTwoRecords.ties +
                            playerTwoRecords.losses
                        ) *
                        100
                    )
                )}
                label="Win Percentage"
                unit="%"
            />

            {#each performanceOrderOne as stat}

                <ComparissonBar
                    sideOne={parseFloat(round(playerOneRecords[stat.field]))}
                    sideTwo={parseFloat(round(playerTwoRecords[stat.field]))}
                    label={stat.label}
                    unit={stat.unit}
                />

            {/each}

            <ComparissonBar
                sideOne={parseFloat(
                    round(
                        playerOneRecords.fptsFor /
                        (
                            playerOneRecords.wins +
                            playerOneRecords.ties +
                            playerOneRecords.losses
                        )
                    )
                )}
                sideTwo={parseFloat(
                    round(
                        playerTwoRecords.fptsFor /
                        (
                            playerTwoRecords.wins +
                            playerTwoRecords.ties +
                            playerTwoRecords.losses
                        )
                    )
                )}
                label="Fantasy Points per Game"
                unit="fpts/game"
            />

            {#each performanceOrderTwo as stat}

                <ComparissonBar
                    sideOne={parseFloat(round(playerOneRecords[stat.field]))}
                    sideTwo={parseFloat(round(playerTwoRecords[stat.field]))}
                    label={stat.label}
                    unit={stat.unit}
                />

            {/each}

            <ComparissonBar
                sideOne={parseFloat(
                    round(
                        playerOneRecords.fptsFor /
                        playerOneRecords.potentialPoints *
                        100
                    )
                )}
                sideTwo={parseFloat(
                    round(
                        playerTwoRecords.fptsFor /
                        playerTwoRecords.potentialPoints *
                        100
                    )
                )}
                label="Lineup IQ"
                unit="%"
            />

        </div>

    {/if}

{/if}
