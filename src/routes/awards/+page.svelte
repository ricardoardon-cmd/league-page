<script>
    import { getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { Awards } from '$lib/components';
    import LegacyAwards from '$lib/Awards/LegacyAwards.svelte';
    import AllTimeLeaderboard from '$lib/Awards/AllTimeLeaderboard.svelte';
    import { legacyHistory } from '$lib/utils/legacyHistory';
    import { waitForAll, leagueName } from '$lib/utils/helper';
    import LinearProgress from '@smui/linear-progress';

    export let data;

    const { awardsData, teamManagersData, recordsData } = data;
    let openSeason = null;

    const canonicalManagerName = (manager) => {
        const normalized = String(manager || '').trim().toLowerCase();
        if (normalized === 'pico' || normalized === 'picorico') return 'PicoRico';
        return manager;
    };

    const getChampionshipCounts = (podiums, leagueTeamManagers) => {
        const counts = {};
        const addTitle = (manager, team, year, era) => {
            const canonicalManager = canonicalManagerName(manager || team);
            const key = String(canonicalManager || '').trim().toLowerCase();
            if (!key) return;
            if (!counts[key]) counts[key] = { key, manager: canonicalManager, latestTeam: team || canonicalManager, championships: 0, latestYear: year, eras: new Set() };
            counts[key].championships++;
            counts[key].eras.add(era);
            if (!counts[key].latestYear || Number(year) > Number(counts[key].latestYear)) {
                counts[key].latestYear = year;
                counts[key].latestTeam = team || canonicalManager;
            }
        };

        for (const season of legacyHistory) {
            const championTeam = season.podium?.champion;
            const champion = season.teams.find((team) => team.name === championTeam);
            addTitle(champion?.manager, championTeam, season.year, 'Legacy');
        }

        for (const podium of podiums || []) {
            if (!podium?.champion) continue;
            const rosterID = String(podium.champion);
            const teamName = getTeamNameFromTeamManagers(leagueTeamManagers, rosterID, podium.year);
            const managers = leagueTeamManagers?.teamManagersMap?.[podium.year]?.[rosterID]?.managers || [];
            const managerName = managers.map((id) => leagueTeamManagers?.users?.[id]?.display_name || leagueTeamManagers?.users?.[id]?.name || id).join(' & ');
            addTitle(managerName || teamName, teamName, podium.year, 'Sleeper');
        }

        return Object.values(counts)
            .map((entry) => ({ ...entry, eras: [...entry.eras] }))
            .sort((a, b) => b.championships - a.championships || Number(b.latestYear) - Number(a.latestYear));
    };

    const getCombinedSeasons = (podiums) => [
        ...(podiums || []).map((podium) => ({ year: Number(podium.year), era: 'sleeper', podium })),
        ...legacyHistory.map((season) => ({ year: Number(season.year), era: 'legacy', season }))
    ].sort((a, b) => b.year - a.year);

    const getSleeperTeamName = (leagueTeamManagers, rosterID, year) => {
        if (!rosterID) return '—';
        return getTeamNameFromTeamManagers(leagueTeamManagers, String(rosterID), year) || '—';
    };

    const seasonSummary = (entry, leagueTeamManagers) => {
        if (entry.era === 'legacy') {
            return {
                champion: entry.season?.podium?.champion || '—',
                runnerUp: entry.season?.podium?.runnerUp || '—',
                third: entry.season?.podium?.thirdPlace || '—',
                teams: entry.season?.teamCount || entry.season?.teams?.length || null,
                eraLabel: 'Legacy Era'
            };
        }

        const podium = entry.podium || {};
        const year = entry.year;
        const yearTeams = leagueTeamManagers?.teamManagersMap?.[year] || {};

        return {
            champion: getSleeperTeamName(leagueTeamManagers, podium.champion, year),
            runnerUp: getSleeperTeamName(leagueTeamManagers, podium.second, year),
            third: getSleeperTeamName(leagueTeamManagers, podium.third, year),
            teams: Object.keys(yearTeams).length || null,
            eraLabel: 'Sleeper Era'
        };
    };

    const toggleSeason = (year) => {
        openSeason = openSeason === year ? null : year;
    };
</script>

<style>
    .historyPage { width: 100%; max-width: 1200px; margin: 0 auto; padding: 30px 20px 70px; box-sizing: border-box; }
    .historyHeader { text-align: center; margin-bottom: 30px; }
    .historyEyebrow { font-size: 0.75rem; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; opacity: 0.55; margin-bottom: 6px; }
    .historyHeader h1 { margin: 0; font-size: 2.7rem; font-weight: 800; line-height: 1.1; }
    .historyHeader p { margin: 10px 0 0; opacity: 0.65; }
    .summaryGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 0 auto 30px; max-width: 900px; }
    .summaryCard { background: var(--fff); border: 1px solid var(--ccc); border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06); }
    .summaryIcon { font-size: 1.5rem; margin-bottom: 8px; }
    .summaryValue { font-size: 1.7rem; font-weight: 800; }
    .summaryLabel { margin-top: 5px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; opacity: 0.55; }
    .sectionCard { width: 100%; margin: 0 auto 26px; padding: 24px; box-sizing: border-box; border-radius: 18px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07); }
    .sectionTitle { margin: 0 0 18px; text-align: center; font-size: 1.8rem; font-weight: 800; }
    .sectionSub { margin: -10px auto 18px; max-width: 680px; text-align: center; font-size: 0.82rem; opacity: 0.62; }
    .awards { display: block; width: 100%; position: relative; z-index: 1; }
    .loading { display: block; width: 85%; max-width: 500px; margin: 80px auto; text-align: center; }
    .nothingYet { display: block; width: 85%; max-width: 500px; margin: 80px auto; text-align: center; }

    .seasonList { display: grid; gap: 12px; }
    .seasonCard { border: 1px solid var(--ccc); border-radius: 16px; background: var(--fff); overflow: hidden; }
    .seasonToggle { width: 100%; display: grid; grid-template-columns: minmax(115px, .7fr) minmax(0, 1.8fr) auto; gap: 16px; align-items: center; padding: 16px 18px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .seasonToggle:hover { background: var(--f3f3f3); }
    .seasonYear { font-size: 1.15rem; font-weight: 900; }
    .seasonEra { display: block; margin-top: 3px; font-size: .62rem; font-weight: 800; text-transform: uppercase; letter-spacing: .55px; opacity: .52; }
    .championLine { min-width: 0; }
    .championLabel { display: block; font-size: .58rem; font-weight: 800; text-transform: uppercase; letter-spacing: .55px; opacity: .5; }
    .championName { display: block; margin-top: 3px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .seasonMeta { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
    .teamCount { padding: 5px 8px; border: 1px solid var(--ccc); border-radius: 999px; background: var(--f3f3f3); font-size: .66rem; font-weight: 800; }
    .chevron { width: 24px; text-align: center; font-size: 1.25rem; opacity: .5; transition: transform .18s ease; }
    .chevron.open { transform: rotate(90deg); }
    .seasonPodium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 0 18px 14px; }
    .podiumMini { min-width: 0; padding: 9px 10px; border-radius: 10px; background: var(--f3f3f3); border: 1px solid var(--ccc); text-align: center; }
    .podiumPlace { display: block; font-size: .58rem; font-weight: 800; text-transform: uppercase; opacity: .52; }
    .podiumTeam { display: block; margin-top: 3px; font-size: .76rem; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .seasonDetails { border-top: 1px solid var(--ccc); background: color-mix(in srgb, var(--f3f3f3) 32%, var(--fff)); padding: 4px 0 14px; }

    @media (max-width: 700px) {
        .historyPage { padding: 20px 10px 50px; }
        .historyHeader h1 { font-size: 2rem; }
        .summaryGrid { grid-template-columns: 1fr; }
        .sectionCard { padding: 16px 10px; }
        .sectionTitle { font-size: 1.45rem; }
        .sectionSub { padding: 0 6px; line-height: 1.4; }
        .seasonList { gap: 10px; }
        .seasonToggle { grid-template-columns: 80px minmax(0, 1fr) auto; gap: 10px; padding: 13px 12px; }
        .seasonYear { font-size: 1rem; }
        .seasonEra { font-size: .54rem; }
        .championName { font-size: .86rem; }
        .teamCount { font-size: .58rem; padding: 4px 7px; }
        .seasonPodium { grid-template-columns: 1fr; gap: 6px; padding: 0 12px 12px; }
        .podiumMini { display: grid; grid-template-columns: 68px minmax(0, 1fr); align-items: center; text-align: left; padding: 8px 9px; }
        .podiumTeam { margin-top: 0; }
        .seasonDetails { padding-top: 0; overflow-x: hidden; }
    }

    @media (max-width: 380px) {
        .seasonToggle { grid-template-columns: 70px minmax(0, 1fr) auto; gap: 7px; padding: 12px 9px; }
        .teamCount { display: none; }
        .seasonMeta { gap: 2px; }
    }
</style>

<div class="historyPage">
    <div class="historyHeader">
        <div class="historyEyebrow">GGL LEAGUE ARCHIVE</div>
        <h1>🏆 {leagueName} History</h1>
        <p>Champions, podium finishes and season-by-season league history · Legacy + Sleeper eras</p>
    </div>

    {#await waitForAll(awardsData, teamManagersData, recordsData)}
        <div class="loading"><p>Retrieving league history...</p><LinearProgress indeterminate /></div>
    {:then [podiums, leagueTeamManagers, records]}
        {@const combinedSeasons = getCombinedSeasons(podiums)}
        {@const championshipCounts = getChampionshipCounts(podiums, leagueTeamManagers)}

        {#if combinedSeasons.length}
            <div class="summaryGrid">
                <div class="summaryCard"><div class="summaryIcon">📅</div><div class="summaryValue">{combinedSeasons.length}</div><div class="summaryLabel">Completed Seasons</div></div>
                <div class="summaryCard"><div class="summaryIcon">🏆</div><div class="summaryValue">{championshipCounts.length}</div><div class="summaryLabel">Different Champions</div></div>
                <div class="summaryCard"><div class="summaryIcon">👑</div><div class="summaryValue">{championshipCounts[0]?.championships || 0}</div><div class="summaryLabel">Most Championships</div></div>
            </div>

            <div class="sectionCard">
                <h2 class="sectionTitle">🏅 All-Time Manager Leaderboard</h2>
                <p class="sectionSub">Rankings prioritize championships, then playoff appearances, wins and win percentage. Toggle between the full league archive and Sleeper-only results.</p>
                <AllTimeLeaderboard awards={podiums} {records} {leagueTeamManagers} />
            </div>

            <div class="sectionCard">
                <h2 class="sectionTitle">📜 Season-by-Season History</h2>
                <p class="sectionSub">Tap any season for the complete awards and results from that year.</p>

                <div class="awards seasonList">
                    {#each combinedSeasons as entry}
                        {@const summary = seasonSummary(entry, leagueTeamManagers)}
                        <div class="seasonCard">
                            <button
                                type="button"
                                class="seasonToggle"
                                onclick={() => toggleSeason(entry.year)}
                                aria-expanded={openSeason === entry.year}
                            >
                                <div>
                                    <div class="seasonYear">🏆 {entry.year}</div>
                                    <span class="seasonEra">{summary.eraLabel}</span>
                                </div>

                                <div class="championLine">
                                    <span class="championLabel">Champion</span>
                                    <span class="championName">{summary.champion}</span>
                                </div>

                                <div class="seasonMeta">
                                    {#if summary.teams}<span class="teamCount">{summary.teams} Teams</span>{/if}
                                    <span class:open={openSeason === entry.year} class="chevron">›</span>
                                </div>
                            </button>

                            <div class="seasonPodium">
                                <div class="podiumMini"><span class="podiumPlace">🥇 Champion</span><span class="podiumTeam">{summary.champion}</span></div>
                                <div class="podiumMini"><span class="podiumPlace">🥈 Runner-up</span><span class="podiumTeam">{summary.runnerUp}</span></div>
                                <div class="podiumMini"><span class="podiumPlace">🥉 Third</span><span class="podiumTeam">{summary.third}</span></div>
                            </div>

                            {#if openSeason === entry.year}
                                <div class="seasonDetails">
                                    {#if entry.era === 'legacy'}
                                        <LegacyAwards season={entry.season} />
                                    {:else}
                                        <Awards podium={entry.podium} {leagueTeamManagers} />
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <p class="nothingYet">No seasons have been completed yet, so no league history is available.</p>
        {/if}
    {:catch error}
        <p class="nothingYet">Something went wrong: {error.message}</p>
    {/await}
</div>
