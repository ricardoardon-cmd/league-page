<script>
    import { waitForAll } from '$lib/utils/helper';
    import LinearProgress from '@smui/linear-progress';
    import Draft from './Draft.svelte';
    import DraftAnalysis from './DraftAnalysis.svelte';

    export let previousDraftsData;
    export let leagueTeamManagersData;
    export let playersData;

    let activeView = 'boards';

    const draftVideos2026 = [
        { id: '3lW1jlQn6Ro', type: 'short' },
        { id: 'mcVM-MMHISk', type: 'short' },
        { id: 'xUCaAXhql3A', type: 'short' },
        { id: 'G_8b9a_lo4U', type: 'short' },
        { id: 'f9nBIDZNxT0', type: 'video' },
        { id: 'OKn2xf7G73E', type: 'video' },
        { id: 'YmYGgCPmwb8', type: 'video' },
        { id: 'PeCdTDtmQr4', type: 'video' },
        { id: 'u86uYkYKpLk', type: 'video' },
        { id: 'oplcUl5xIkg', type: 'video' },
        { id: 'HDzTPcrx6kk', type: 'video' }
    ];
</script>

<style>
    .draftsPage { width:100%; max-width:1250px; margin:0 auto; padding:30px 18px 70px; box-sizing:border-box; }
    .pageHeader { text-align:center; margin-bottom:18px; }
    .eyebrow { font-size:.75rem; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; opacity:.55; margin-bottom:6px; }
    .pageHeader h1 { margin:0; font-size:2.6rem; font-weight:850; line-height:1.1; }
    .pageHeader p { margin:10px 0 0; opacity:.65; }
    .viewTabs{display:flex;justify-content:center;gap:8px;margin:0 auto 28px;padding:5px;width:max-content;max-width:100%;border:1px solid var(--ccc);border-radius:999px;background:var(--f3f3f3)}
    .viewTabs button{border:0;background:transparent;color:inherit;border-radius:999px;padding:9px 16px;font:inherit;font-size:.76rem;font-weight:850;cursor:pointer;white-space:nowrap}.viewTabs button.active{background:var(--blueOne);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12)}
    .section { margin-top:28px; }
    .sectionHeader { width:95%; max-width:1100px; margin:0 auto 14px; display:flex; justify-content:space-between; align-items:end; gap:12px; }
    .sectionEyebrow { font-size:.68rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; opacity:.5; }
    .sectionTitle { margin:3px 0 0; font-size:1.35rem; font-weight:850; }
    .loadingCard,.errorCard,.emptyCard { width:95%; max-width:760px; margin:25px auto; padding:32px 24px; box-sizing:border-box; text-align:center; border-radius:18px; background:var(--fff); border:1px solid var(--ccc); box-shadow:0 4px 16px rgba(0,0,0,.07); }
    .loadingBar { width:85%; max-width:460px; margin:18px auto 0; }
    .errorCard { border-color:#d66565; }
    .emptyIcon { font-size:2.6rem; margin-bottom:10px; }
    .emptyCard h3 { margin:0; font-size:1.25rem; }
    .historyList { display:flex; flex-direction:column; gap:34px; }
    .historyYear { width:95%; max-width:1100px; margin:0 auto 10px; display:flex; align-items:center; gap:10px; }
    .historyYearLine { flex:1; height:1px; background:var(--ccc); }
    .historyYearLabel { font-size:.78rem; font-weight:850; letter-spacing:.8px; text-transform:uppercase; opacity:.6; white-space:nowrap; }
    .videoArchive { width:95%; max-width:1100px; margin:18px auto 0; }
    .videoArchiveHeader { margin-bottom:12px; }
    .videoArchiveTitle { margin:3px 0 0; font-size:1.05rem; font-weight:850; }
    .videoGrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .videoCard { overflow:hidden; border:1px solid var(--ccc); border-radius:14px; background:var(--fff); box-shadow:0 3px 12px rgba(0,0,0,.08); }
    .videoFrame { display:block; width:100%; aspect-ratio:16/9; border:0; background:#000; }
    .videoLabel { padding:9px 12px; font-size:.72rem; font-weight:800; opacity:.7; }
    @media(max-width:700px){.draftsPage{padding:20px 8px 50px}.pageHeader h1{font-size:2rem}.sectionHeader{width:97%}.loadingCard,.errorCard,.emptyCard{width:97%;padding:26px 16px}.viewTabs{margin-bottom:20px}.viewTabs button{padding:8px 13px;font-size:.7rem}.videoArchive{width:97%}.videoGrid{grid-template-columns:1fr;gap:12px}}
</style>

<div class="draftsPage">
    <div class="pageHeader">
        <div class="eyebrow">GGL DRAFT ROOM</div>
        <h1>🎯 Draft Center</h1>
        <p>Draft boards, league history and GGL 2-QB analysis</p>
    </div>

    <div class="viewTabs" aria-label="Draft Center view">
        <button class:active={activeView === 'boards'} onclick={() => activeView = 'boards'}>Draft Boards</button>
        <button class:active={activeView === 'analysis'} onclick={() => activeView = 'analysis'}>Draft Analysis</button>
    </div>

    {#if activeView === 'analysis'}
        {#await waitForAll(previousDraftsData, leagueTeamManagersData, playersData)}
            <div class="loadingCard"><strong>Building GGL draft analysis...</strong><div class="loadingBar"><LinearProgress indeterminate /></div></div>
        {:then [previousDrafts, leagueTeamManagers, { players }]}
            <DraftAnalysis {previousDrafts} {leagueTeamManagers} {players} />
        {:catch error}
            <div class="errorCard">Something went wrong building the draft analysis: {error.message}</div>
        {/await}
    {:else}
        <section class="section">
            <div class="sectionHeader"><div><div class="sectionEyebrow">Most recent</div><div class="sectionTitle">Latest Draft</div></div></div>
            {#await waitForAll(previousDraftsData, leagueTeamManagersData, playersData)}
                <div class="loadingCard"><strong>Retrieving draft history...</strong><div class="loadingBar"><LinearProgress indeterminate /></div></div>
            {:then [previousDrafts, leagueTeamManagers, { players }]}
                {#if previousDrafts?.length}
                    <div class="historyList">
                        {#each previousDrafts as previousDraft, index}
                            <div>
                                {#if index > 0}
                                    <div class="historyYear"><div class="historyYearLine"></div><div class="historyYearLabel">{previousDraft.year} Draft</div><div class="historyYearLine"></div></div>
                                {/if}
                                <Draft draftData={previousDraft} previous={true} {leagueTeamManagers} year={previousDraft.year} {players} />
                                {#if Number(previousDraft.year) === 2026}
                                    <div class="videoArchive">
                                        <div class="videoArchiveHeader">
                                            <div class="sectionEyebrow">Draft day archive</div>
                                            <div class="videoArchiveTitle">🎥 2026 Draft Videos</div>
                                        </div>
                                        <div class="videoGrid">
                                            {#each draftVideos2026 as video, videoIndex}
                                                <div class="videoCard">
                                                    <iframe class="videoFrame" src={`https://www.youtube.com/embed/${video.id}`} title={`2026 GGL Draft video ${videoIndex + 1}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                                                    <div class="videoLabel">{video.type === 'short' ? 'Draft Short' : 'Draft Video'} #{videoIndex + 1}</div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="emptyCard"><div class="emptyIcon">📚</div><h3>No completed drafts found</h3></div>
                {/if}
            {:catch error}
                <div class="errorCard">Something went wrong loading draft history: {error.message}</div>
            {/await}
        </section>
    {/if}
</div>
