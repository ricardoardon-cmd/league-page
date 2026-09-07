<script>
    import { goto } from "$app/navigation";
    import {
        getDatesActive,
        getRosterIDFromManagerID,
        getTeamNameFromTeamManagers
    } from "$lib/utils/helperFunctions/universalFunctions";

    export let manager, leagueTeamManagers, key, nflStateData;

    let retired = false;
    let rosterID = manager.roster;
    let year = null;

    if (manager.managerID) {
        const dates = getDatesActive(leagueTeamManagers, manager.managerID);
        if (dates.end) retired = true;
        ({ rosterID, year } = getRosterIDFromManagerID(leagueTeamManagers, manager.managerID) || { rosterID, year });
    }

    const commissioner = manager.managerID
        ? leagueTeamManagers.users?.[manager.managerID]?.is_owner
        : false;

    const teamName = getTeamNameFromTeamManagers(leagueTeamManagers, rosterID, year);
    const rivalName = manager.rival?.name || null;
    const tradeInterest = manager.tradingScale ? `${manager.tradingScale}/10` : null;

    const seasonPhase = (state) => {
        if (!state) return 'Season';
        if (state.season_type === 'regular') return `Week ${state.week}`;
        if (state.season_type === 'post') return 'Postseason';
        if (state.season_type === 'pre') return 'Preseason';
        return 'Season';
    };
</script>

<style>
    .manager { position:relative; display:flex; flex-direction:column; min-width:0; padding:20px; background:var(--fff); border:1px solid var(--ccc); border-radius:16px; box-shadow:0 3px 12px rgba(0,0,0,.08); cursor:pointer; transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease; overflow:hidden; }
    .manager:hover { transform:translateY(-3px); box-shadow:0 7px 20px rgba(0,0,0,.13); border-color:var(--blueOne); }
    .retired { opacity:.75; }
    .topRow { display:flex; align-items:center; gap:14px; }
    .avatarHolder { display:inline-flex; position:relative; flex-shrink:0; }
    .photo { height:68px; width:68px; border-radius:50%; object-fit:cover; box-shadow:0 1px 5px rgba(0,0,0,.2); border:2px solid var(--fff); }
    .commissionerBadge { display:flex; justify-content:center; align-items:center; position:absolute; bottom:-4px; right:-4px; height:24px; width:24px; font-size:.75rem; font-weight:800; border-radius:50%; background:var(--blueTwo); border:2px solid var(--fff); color:#fff; }
    .managerInfo { min-width:0; flex:1; }
    .name { font-size:1.08rem; font-weight:800; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .team { margin-top:4px; font-size:.92rem; line-height:1.2; font-weight:650; opacity:.68; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .arrow { font-size:1.45rem; opacity:.42; flex-shrink:0; }
    .seasonStatus { display:inline-flex; align-items:center; width:fit-content; margin-top:14px; padding:5px 9px; border-radius:999px; background:var(--f3f3f3); border:1px solid var(--ccc); font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.4px; }
    .statusDot { width:7px; height:7px; border-radius:50%; margin-right:6px; background:#2e9d50; }
    .retiredStatus .statusDot { background:#999; }
    .quickFacts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:15px; padding-top:14px; border-top:1px solid var(--ccc); }
    .fact { min-width:0; padding:9px 8px; border-radius:11px; background:var(--f3f3f3); border:1px solid var(--ccc); }
    .factLabel { display:block; margin-bottom:5px; font-size:.54rem; font-weight:850; text-transform:uppercase; letter-spacing:.45px; opacity:.5; white-space:nowrap; }
    .factValue { display:flex; align-items:center; gap:6px; min-width:0; font-size:.73rem; font-weight:800; line-height:1.15; }
    .factText { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .nflLogo { width:22px; height:22px; object-fit:contain; flex-shrink:0; }
    .rivalPhoto { width:22px; height:22px; border-radius:50%; object-fit:cover; flex-shrink:0; }
    .factIcon { width:22px; height:22px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1rem; }
    .unknown { opacity:.5; }
    .retiredBanner { position:absolute; top:12px; right:-28px; padding:4px 30px; transform:rotate(35deg); background:var(--ddd); font-size:.65rem; font-weight:800; opacity:.75; }

    @media (max-width:500px) {
        .manager { padding:15px; border-radius:14px; }
        .photo { height:58px; width:58px; }
        .name { font-size:1rem; }
        .team { font-size:.82rem; }
        .seasonStatus { margin-top:11px; }
        .quickFacts { margin-top:12px; padding-top:12px; gap:6px; }
        .fact { padding:8px 6px; }
        .factLabel { font-size:.49rem; letter-spacing:.25px; }
        .factValue { font-size:.68rem; gap:5px; }
        .nflLogo,.rivalPhoto,.factIcon { width:20px; height:20px; }
    }

    @media (max-width:370px) {
        .quickFacts { grid-template-columns:1fr 1fr; }
        .tradeFact { grid-column:1 / -1; }
    }
</style>

<div class:retired class="manager" onclick={() => goto(`/manager?manager=${key}`)}>
    {#if retired}<div class="retiredBanner">RETIRED</div>{/if}

    <div class="topRow">
        <div class="avatarHolder">
            <img class="photo" src={manager.photo} alt={manager.name} />
            {#if commissioner}<div class="commissionerBadge">C</div>{/if}
        </div>
        <div class="managerInfo">
            <div class="name">{manager.name}</div>
            <div class="team">{teamName || 'Team name coming after draft'}</div>
        </div>
        <div class="arrow">›</div>
    </div>

    <div class:retiredStatus={retired} class="seasonStatus">
        <span class="statusDot"></span>
        {#if retired}
            Former Manager
        {:else}
            {#await nflStateData}
                Active
            {:then state}
                Active · {seasonPhase(state)}
            {:catch}
                Active
            {/await}
        {/if}
    </div>

    <div class="quickFacts">
        <div class="fact">
            <span class="factLabel">Favorite Team</span>
            <div class="factValue">
                {#if manager.favoriteTeam}
                    <img class="nflLogo" src="https://sleepercdn.com/images/team_logos/nfl/{manager.favoriteTeam}.png" alt="Favorite NFL team" />
                    <span class="factText">{manager.favoriteTeam}</span>
                {:else}
                    <span class="factIcon unknown">?</span><span class="factText unknown">Unknown</span>
                {/if}
            </div>
        </div>

        <div class="fact">
            <span class="factLabel">Rival</span>
            <div class="factValue">
                {#if rivalName}
                    {#if manager.rival?.image}<img class="rivalPhoto" src={manager.rival.image} alt="" />{:else}<span class="factIcon">⚔️</span>{/if}
                    <span class="factText">{rivalName}</span>
                {:else}
                    <span class="factIcon unknown">?</span><span class="factText unknown">Unknown</span>
                {/if}
            </div>
        </div>

        <div class="fact tradeFact">
            <span class="factLabel">Trade Interest</span>
            <div class="factValue">
                <span class="factIcon">🤝</span>
                <span class="factText">{tradeInterest || '—'}</span>
            </div>
        </div>
    </div>
</div>
