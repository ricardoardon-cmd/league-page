<script>
    import { waitForAll } from '$lib/utils/helper';
    import LinearProgress from '@smui/linear-progress';
    import Draft from './Draft.svelte';

    export let upcomingDraftData;
    export let previousDraftsData;
    export let leagueTeamManagersData;
    export let playersData;
</script>

<style>
    .draftsPage {
        width: 100%;
        max-width: 1250px;
        margin: 0 auto;
        padding: 30px 18px 70px;
        box-sizing: border-box;
    }

    .pageHeader {
        text-align: center;
        margin-bottom: 28px;
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

    .section {
        margin-top: 28px;
    }

    .sectionHeader {
        width: 95%;
        max-width: 1100px;
        margin: 0 auto 14px;
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 12px;
    }

    .sectionEyebrow {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.5;
    }

    .sectionTitle {
        margin: 3px 0 0;
        font-size: 1.35rem;
        font-weight: 850;
    }

    .loadingCard,
    .errorCard,
    .emptyCard {
        width: 95%;
        max-width: 760px;
        margin: 25px auto;
        padding: 32px 24px;
        box-sizing: border-box;
        text-align: center;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .loadingBar {
        width: 85%;
        max-width: 460px;
        margin: 18px auto 0;
    }

    .errorCard {
        border-color: #d66565;
    }

    .emptyIcon {
        font-size: 2.6rem;
        margin-bottom: 10px;
    }

    .emptyCard h3 {
        margin: 0;
        font-size: 1.25rem;
    }

    .emptyCard p {
        margin: 8px auto 0;
        max-width: 520px;
        line-height: 1.55;
        opacity: 0.65;
    }

    .historyList {
        display: flex;
        flex-direction: column;
        gap: 34px;
    }

    .historyYear {
        width: 95%;
        max-width: 1100px;
        margin: 0 auto 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .historyYearLine {
        flex: 1;
        height: 1px;
        background: var(--ccc);
    }

    .historyYearLabel {
        font-size: 0.78rem;
        font-weight: 850;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.6;
        white-space: nowrap;
    }

    @media (max-width: 700px) {
        .draftsPage {
            padding: 20px 8px 50px;
        }

        .pageHeader h1 {
            font-size: 2rem;
        }

        .sectionHeader {
            width: 97%;
        }

        .loadingCard,
        .errorCard,
        .emptyCard {
            width: 97%;
            padding: 26px 16px;
        }
    }
</style>

<div class="draftsPage">

    <div class="pageHeader">
        <div class="eyebrow">GGL DRAFT ROOM</div>
        <h1>🎯 Draft Center</h1>
        <p>Upcoming draft order and complete GGL draft history</p>
    </div>

    <section class="section">

        <div class="sectionHeader">
            <div>
                <div class="sectionEyebrow">On the clock next</div>
                <div class="sectionTitle">Upcoming Draft</div>
            </div>
        </div>

        {#await waitForAll(upcomingDraftData, leagueTeamManagersData, playersData)}

            <div class="loadingCard">
                <strong>Retrieving upcoming draft...</strong>
                <div class="loadingBar">
                    <LinearProgress indeterminate />
                </div>
            </div>

        {:then [upcomingDraft, leagueTeamManagers, { players }]}

            {#if upcomingDraft}
                <Draft
                    draftData={upcomingDraft}
                    {leagueTeamManagers}
                    year={upcomingDraft.year}
                    {players}
                />
            {:else}
                <div class="emptyCard">
                    <div class="emptyIcon">🕒</div>
                    <h3>Upcoming draft not available yet</h3>
                    <p>
                        Once Sleeper creates the next GGL draft, the order will appear here automatically.
                    </p>
                </div>
            {/if}

        {:catch error}

            <div class="errorCard">
                Something went wrong loading the upcoming draft: {error.message}
            </div>

        {/await}

    </section>


    <section class="section">

        <div class="sectionHeader">
            <div>
                <div class="sectionEyebrow">League archive</div>
                <div class="sectionTitle">Previous Drafts</div>
            </div>
        </div>

        {#await waitForAll(previousDraftsData, leagueTeamManagersData, playersData)}

            <div class="loadingCard">
                <strong>Retrieving previous drafts...</strong>
                <div class="loadingBar">
                    <LinearProgress indeterminate />
                </div>
            </div>

        {:then [previousDrafts, leagueTeamManagers, { players }]}

            {#if previousDrafts?.length}

                <div class="historyList">

                    {#each previousDrafts as previousDraft}

                        <div>

                            <div class="historyYear">
                                <div class="historyYearLine"></div>
                                <div class="historyYearLabel">
                                    {previousDraft.year} Draft
                                </div>
                                <div class="historyYearLine"></div>
                            </div>

                            <Draft
                                draftData={previousDraft}
                                previous={true}
                                {leagueTeamManagers}
                                year={previousDraft.year}
                                {players}
                            />

                        </div>

                    {/each}

                </div>

            {:else}

                <div class="emptyCard">
                    <div class="emptyIcon">📚</div>
                    <h3>No previous drafts found</h3>
                </div>

            {/if}

        {:catch error}

            <div class="errorCard">
                Something went wrong loading previous drafts: {error.message}
            </div>

        {/await}

    </section>

</div>
