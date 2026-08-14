<script>
import { getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { Awards } from '$lib/components';
    import { waitForAll, leagueName } from '$lib/utils/helper';
    import LinearProgress from '@smui/linear-progress';

    export let data;

    const { awardsData, teamManagersData } = data;

    const getChampionshipCounts = (podiums) => {
    const counts = {};

    for (const podium of podiums || []) {
        if (!podium?.champion) continue;

        const rosterID = String(podium.champion);

        if (!counts[rosterID]) {
            counts[rosterID] = {
                rosterID,
                championships: 0,
                latestYear: podium.year
            };
        }

        counts[rosterID].championships++;

        if (
            !counts[rosterID].latestYear ||
            Number(podium.year) > Number(counts[rosterID].latestYear)
        ) {
            counts[rosterID].latestYear = podium.year;
        }
    }

    return Object.values(counts)
        .sort((a, b) => b.championships - a.championships);
};
</script>

<style>
    .historyPage {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 30px 20px 70px;
        box-sizing: border-box;
    }

    .historyHeader {
        text-align: center;
        margin-bottom: 30px;
    }

    .historyEyebrow {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1.4px;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 6px;
    }

    .historyHeader h1 {
        margin: 0;
        font-size: 2.7rem;
        font-weight: 800;
        line-height: 1.1;
    }

    .historyHeader p {
        margin: 10px 0 0;
        opacity: 0.65;
    }

    .summaryGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin: 0 auto 30px;
        max-width: 900px;
    }

    .summaryCard {
        background: var(--fff);
        border: 1px solid var(--ccc);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    .summaryIcon {
        font-size: 1.5rem;
        margin-bottom: 8px;
    }

    .summaryValue {
        font-size: 1.7rem;
        font-weight: 800;
    }

    .summaryLabel {
        margin-top: 5px;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .sectionCard {
        width: 100%;
        margin: 0 auto 26px;
        padding: 24px;
        box-sizing: border-box;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .sectionTitle {
        margin: 0 0 18px;
        text-align: center;
        font-size: 1.8rem;
        font-weight: 800;
    }

    .championLeaderboard {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 650px;
        margin: 0 auto;
    }

    .championRow {
        display: grid;
        grid-template-columns: 50px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 12px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .rank {
        text-align: center;
        font-weight: 800;
    }

    .championRoster {
        font-weight: 700;
    }

    .championshipCount {
        font-weight: 800;
        white-space: nowrap;
    }

    .awards {
        display: block;
        width: 100%;
        position: relative;
        z-index: 1;
        overflow-y: hidden;
    }

    .loading {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
        text-align: center;
    }

    .nothingYet {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
        text-align: center;
    }

    @media (max-width: 700px) {
        .historyPage {
            padding: 20px 10px 50px;
        }

        .historyHeader h1 {
            font-size: 2rem;
        }

        .summaryGrid {
            grid-template-columns: 1fr;
        }

        .sectionCard {
            padding: 16px 10px;
        }

        .sectionTitle {
            font-size: 1.45rem;
        }
    }
</style>

<div class="historyPage">

    <div class="historyHeader">
        <div class="historyEyebrow">
            GGL LEAGUE ARCHIVE
        </div>

        <h1>
            🏆 {leagueName} History
        </h1>

        <p>
            Champions, podium finishes and season-by-season league history
        </p>
    </div>

    {#await waitForAll(awardsData, teamManagersData)}

        <div class="loading">
            <p>Retrieving league history...</p>
            <LinearProgress indeterminate />
        </div>

    {:then [podiums, leagueTeamManagers]}

        {#if podiums.length}

            {@const championshipCounts = getChampionshipCounts(podiums)}

            <div class="summaryGrid">

                <div class="summaryCard">
                    <div class="summaryIcon">📅</div>
                    <div class="summaryValue">
                        {podiums.length}
                    </div>
                    <div class="summaryLabel">
                        Completed Seasons
                    </div>
                </div>

                <div class="summaryCard">
                    <div class="summaryIcon">🏆</div>
                    <div class="summaryValue">
                        {championshipCounts.length}
                    </div>
                    <div class="summaryLabel">
                        Different Champions
                    </div>
                </div>

                <div class="summaryCard">
                    <div class="summaryIcon">👑</div>
                    <div class="summaryValue">
                        {championshipCounts[0]?.championships || 0}
                    </div>
                    <div class="summaryLabel">
                        Most Championships
                    </div>
                </div>

            </div>

            <div class="sectionCard">

                <h2 class="sectionTitle">
                    👑 Championship Leaders
                </h2>

                <div class="championLeaderboard">

                    {#each championshipCounts as champion, index}

                        <div class="championRow">

                            <div class="rank">
                                {#if index === 0}
                                    🥇
                                {:else if index === 1}
                                    🥈
                                {:else if index === 2}
                                    🥉
                                {:else}
                                    {index + 1}
                                {/if}
                            </div>

                            <div class="championRoster">
    {getTeamNameFromTeamManagers(
        leagueTeamManagers,
        champion.rosterID,
        champion.latestYear
    )}
</div>

                            <div class="championshipCount">
                                {champion.championships}
                                {champion.championships === 1
                                    ? ' title'
                                    : ' titles'}
                            </div>

                        </div>

                    {/each}

                </div>

            </div>

            <div class="sectionCard">

                <h2 class="sectionTitle">
                    📜 Season-by-Season History
                </h2>

                <div class="awards">

                    {#each podiums as podium}
                        <Awards
                            {podium}
                            {leagueTeamManagers}
                        />
                    {/each}

                </div>

            </div>

        {:else}

            <p class="nothingYet">
                No seasons have been completed yet, so no league history is available.
            </p>

        {/if}

    {:catch error}

        <p class="nothingYet">
            Something went wrong: {error.message}
        </p>

    {/await}

</div>
