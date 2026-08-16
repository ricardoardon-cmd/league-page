<script>
    export let season;

    const managerForTeam = (teamName) =>
        season.teams.find((team) => team.name === teamName)?.manager || '';

    const regularSeasonLeader = season.teams.find((team) => team.finish === 1);
</script>

<style>
    .seasonAwards {
        width: 100%;
        max-width: 900px;
        margin: 28px auto 42px;
        padding: 24px;
        box-sizing: border-box;
        border-radius: 20px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 5px 18px rgba(0, 0, 0, 0.08);
    }

    .seasonHeader {
        text-align: center;
        margin-bottom: 22px;
    }

    .seasonYear {
        font-size: 2rem;
        font-weight: 800;
    }

    .seasonLabel {
        margin-top: 4px;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .legacyBadge {
        display: inline-block;
        margin-top: 8px;
        padding: 3px 8px;
        border: 1px solid var(--ccc);
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0.7;
    }

    .podiumGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
    }

    .placeCard {
        padding: 22px 16px;
        border-radius: 16px;
        text-align: center;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .placeCardChampion {
        border: 2px solid #d4af37;
    }

    .placeIcon {
        font-size: 2rem;
        margin-bottom: 10px;
    }

    .placeTitle {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .placeName {
        margin-top: 6px;
        font-size: 1rem;
        font-weight: 800;
        line-height: 1.25;
    }

    .managerName {
        margin-top: 5px;
        font-size: 0.78rem;
        opacity: 0.62;
    }

    .honors {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--ccc);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }

    .honorCard {
        padding: 12px;
        border-radius: 12px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        text-align: center;
    }

    .honorLabel {
        font-size: 0.63rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        opacity: 0.55;
    }

    .honorValue {
        margin-top: 5px;
        font-weight: 800;
        line-height: 1.25;
    }

    .honorSub {
        margin-top: 3px;
        font-size: 0.72rem;
        opacity: 0.6;
    }

    .standings {
        margin-top: 18px;
    }

    details {
        border-top: 1px solid var(--ccc);
        padding-top: 14px;
    }

    summary {
        cursor: pointer;
        text-align: center;
        font-weight: 800;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        opacity: 0.7;
    }

    .standingRow {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        padding: 9px 4px;
        border-bottom: 1px solid var(--ccc);
    }

    .standingTeam {
        min-width: 0;
        font-weight: 700;
    }

    .standingManager {
        display: block;
        margin-top: 2px;
        font-size: 0.72rem;
        font-weight: 400;
        opacity: 0.58;
    }

    .record {
        font-weight: 800;
        white-space: nowrap;
    }

    .notes {
        margin-top: 14px;
        text-align: center;
        font-size: 0.78rem;
        font-style: italic;
        opacity: 0.65;
    }

    @media (max-width: 700px) {
        .seasonAwards {
            padding: 16px 12px;
        }

        .podiumGrid,
        .honors {
            grid-template-columns: 1fr;
        }
    }
</style>

<div class="seasonAwards">
    <div class="seasonHeader">
        <div class="seasonYear">{season.year}</div>
        <div class="seasonLabel">Season Results</div>
        <div class="legacyBadge">NFL Fantasy · Legacy Era</div>
    </div>

    <div class="podiumGrid">
        <div class="placeCard placeCardChampion">
            <div class="placeIcon">🥇</div>
            <div class="placeTitle">Champion</div>
            <div class="placeName">{season.podium.champion}</div>
            <div class="managerName">{managerForTeam(season.podium.champion)}</div>
        </div>

        <div class="placeCard">
            <div class="placeIcon">🥈</div>
            <div class="placeTitle">Runner-Up</div>
            <div class="placeName">{season.podium.runnerUp}</div>
            <div class="managerName">{managerForTeam(season.podium.runnerUp)}</div>
        </div>

        <div class="placeCard">
            <div class="placeIcon">🥉</div>
            <div class="placeTitle">Third Place</div>
            <div class="placeName">{season.podium.thirdPlace}</div>
            <div class="managerName">{managerForTeam(season.podium.thirdPlace)}</div>
        </div>
    </div>

    <div class="honors">
        {#if regularSeasonLeader}
            <div class="honorCard">
                <div class="honorLabel">Regular Season #1</div>
                <div class="honorValue">{regularSeasonLeader.name}</div>
                <div class="honorSub">{regularSeasonLeader.manager} · {regularSeasonLeader.wins}-{regularSeasonLeader.losses}{regularSeasonLeader.ties ? `-${regularSeasonLeader.ties}` : ''}</div>
            </div>
        {/if}

        {#if season.mostPoints}
            <div class="honorCard">
                <div class="honorLabel">Most Points</div>
                <div class="honorValue">{season.mostPoints.team}</div>
                <div class="honorSub">{season.mostPoints.manager}{season.mostPoints.points != null ? ` · ${season.mostPoints.points.toFixed(2)}` : ''}</div>
            </div>
        {/if}

        {#if season.toiletBowlLoser}
            <div class="honorCard">
                <div class="honorLabel">🚽 Toilet Bowl Loser</div>
                <div class="honorValue">{season.toiletBowlLoser.team}</div>
                <div class="honorSub">{season.toiletBowlLoser.manager}</div>
            </div>
        {/if}
    </div>

    <div class="standings">
        <details>
            <summary>Regular Season Standings</summary>
            {#each season.teams as team}
                <div class="standingRow">
                    <div>{team.finish}</div>
                    <div class="standingTeam">
                        {team.name}
                        <span class="standingManager">{team.manager}</span>
                    </div>
                    <div class="record">{team.wins}-{team.losses}{team.ties ? `-${team.ties}` : ''}</div>
                </div>
            {/each}
        </details>
    </div>

    {#if season.notes?.length}
        <div class="notes">{season.notes.join(' · ')}</div>
    {/if}
</div>
