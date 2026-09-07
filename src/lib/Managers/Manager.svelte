<script>
    import Button, { Group, Label } from '@smui/button';
    import LinearProgress from '@smui/linear-progress';
    import {loadPlayers, getLeagueTransactions, getNflState} from '$lib/utils/helper';
    import Roster from '../Rosters/Roster.svelte';
    import TransactionsPage from '../Transactions/TransactionsPage.svelte';
    import { goto } from '$app/navigation';
    import ManagerAwards from './ManagerAwards.svelte';
    import ManagerCareerStats from './ManagerCareerStats.svelte';
    import ManagerHeadToHead from './ManagerHeadToHead.svelte';
    import { onMount } from 'svelte';
    import { getDatesActive, getRosterIDFromManagerID, getTeamNameFromTeamManagers, getAvatarFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let manager, managers, rostersData, leagueTeamManagers, rosterPositions, transactionsData, awards, records;

    const nflState = getNflState();
    let transactions = transactionsData.transactions;

    $: viewManager = managers[manager];
    $: datesActive = getDatesActive(leagueTeamManagers, viewManager.managerID);

    const startersAndReserve = rostersData.startersAndReserve;
    let rosters = rostersData.rosters;

    $: ({rosterID, year} = viewManager.managerID
        ? getRosterIDFromManagerID(leagueTeamManagers, viewManager.managerID)
        : {rosterID: viewManager.roster, year: null});

    $: currentTeamName = getTeamNameFromTeamManagers(leagueTeamManagers, rosterID, year);
    $: currentTeamLogo = getAvatarFromTeamManagers(leagueTeamManagers, rosterID, year);
    $: teamTransactions = transactions.filter(t => t.rosters.includes(parseInt(rosterID)));
    $: roster = rosters[rosterID];
    $: coOwners = year && rosterID
        ? leagueTeamManagers.teamManagersMap[year][rosterID].managers.length > 1
        : roster.co_owners;
    $: commissioner = viewManager.managerID
        ? leagueTeamManagers.users[viewManager.managerID].is_owner
        : false;

    let players, playersInfo;
    let loading = true;

    const seasonPhase = (state) => {
        if (!state) return 'Season';
        if (state.season_type === 'regular') return `Week ${state.week}`;
        if (state.season_type === 'post') return 'Postseason';
        if (state.season_type === 'pre') return 'Preseason';
        return 'Season';
    };

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        transactions = newTransactions.transactions;
    };

    onMount(async () => {
        if(transactionsData.stale) {
            refreshTransactions();
        }

        const playerData = await loadPlayers(null);
        playersInfo = playerData;
        players = playerData.players;
        loading = false;

        if(playerData.stale) {
            const newPlayerData = await loadPlayers(null, true);
            playersInfo = newPlayerData;
            players = newPlayerData.players;
        }
    });

    const changeManager = (newManager, noscroll = false) => {
        if(newManager === null || newManager === undefined || newManager === '') {
            goto('/managers');
            return;
        }

        manager = newManager;
        goto(`/manager?manager=${newManager}`, {noscroll});
    };

    const selectManager = (event) => {
        changeManager(parseInt(event.currentTarget.value), true);
    };

    const goToRival = () => {
        if(!viewManager.rival) return;

        const rivalName = String(viewManager.rival.name || '').trim().toLowerCase();
        const rivalIndex = managers.findIndex((managerOption) =>
            String(managerOption.name || '').trim().toLowerCase() === rivalName
        );

        if(rivalIndex >= 0) {
            changeManager(rivalIndex, true);
            return;
        }

        const rivalLink = Number(viewManager.rival.link);
        if(Number.isInteger(rivalLink) && rivalLink >= 0 && rivalLink < managers.length) {
            changeManager(rivalLink, true);
        }
    };
</script>

<style>
    .managerContainer { width: 100%; margin: 2em 0 5em; }
    .managerConstrained { width: 97%; max-width: 800px; margin: 0 auto 4em; }
    .managerPhoto { display: block; width: 150px; height: 150px; object-fit: cover; border-radius: 50%; margin: 0 auto; border: 5px solid var(--fff); box-shadow: 0 6px 20px rgba(0,0,0,.18); }
    .profileHero { position: relative; padding: 35px 25px 30px; margin: 0 auto 25px; max-width: 800px; text-align: center; border-radius: 24px; background: var(--fff); border: 1px solid var(--ccc); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
    .profileStatus { display: inline-flex; align-items: center; gap: 7px; margin-top: 18px; padding: 6px 13px; border-radius: 20px; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; border: 1px solid var(--ccc); background: var(--f3f3f3); }
    .statusDot { width: 8px; height: 8px; border-radius: 50%; background: #2e9d50; }
    .profileName { margin: 18px 0 0; font-size: 2.5em; font-weight: 800; line-height: 1.05; }
    .managerRole { margin-top: 8px; font-size: .72rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; opacity: .42; }
    .profileMeta { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; }
    .metaItem { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px; font-size: .78rem; background: var(--f3f3f3); border: 1px solid var(--ccc); }
    .metaRival { cursor: pointer; color: inherit; font-family: inherit; }
    .metaRival:hover { border-color: var(--aaa); box-shadow: 0 0 5px 1px var(--ccc); }
    .metaTeam, .metaRivalImage { height: 25px; width: 25px; object-fit: cover; border-radius: 50%; }
    .tradeValue { color: var(--blueOne); font-weight: 800; }
    .teamIdentity { margin: 28px auto 0; padding-top: 22px; max-width: 620px; border-top: 1px solid var(--ccc); display:flex; flex-direction:column; align-items:center; gap:10px; }
    .teamLogo { width:84px; height:84px; border-radius:18px; object-fit:cover; border:1px solid var(--ccc); background:var(--f3f3f3); box-shadow:0 4px 14px rgba(0,0,0,.12); }
    .teamIdentityLabel { font-size:.66rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; opacity:.45; }
    .teamIdentityName { font-size:1.45rem; font-weight:850; line-height:1.15; }
    .managerControls { width: 100%; max-width: 800px; margin: 0 auto 18px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .profileNav { margin: 0; text-align: center; }
    .managerSelectWrap { width: 100%; max-width: 390px; position: relative; }
    .managerSelectLabel { display: block; margin: 0 0 6px 4px; font-size: .68rem; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; color: var(--g999); }
    .managerSelect { width: 100%; min-height: 44px; padding: 0 42px 0 14px; border-radius: 12px; border: 1px solid var(--ccc); background: var(--fff); color: inherit; font: inherit; font-size: .9rem; font-weight: 700; cursor: pointer; appearance: auto; }
    .managerSelect:focus { outline: 2px solid var(--blueOne); outline-offset: 2px; }
    h2 { text-align: center; font-size: 2.8em; margin: 1em 0 0; line-height: 1em; }
    h3 { text-align: center; font-size: 1.5em; margin: 1.5em 0 .5em; font-weight: 200; }
    .infoContact { height: 20px; vertical-align: middle; }
    .loading { display: block; width: 85%; max-width: 500px; margin: 80px auto; }
    .managerNav { margin: 4em 0 2em; text-align: center; }
    .commissionerBadge { display: inline-flex; justify-content: center; align-items: center; height: 25px; width: 25px; margin-left: 6px; font-weight: 600; border-radius: 15px; background-color: var(--blueTwo); border: 1px solid var(--blueOne); vertical-align: middle; }
    .commissionerBadge span { color: #fff; }
    @media (max-width: 505px) {
        :global(.selectionButtons span) { font-size: .8em; }
        .managerControls { width: 97%; }
        .managerSelectWrap { max-width: 330px; }
        .teamIdentityName { font-size:1.25rem; }
        .teamLogo { width:72px; height:72px; }
    }
    @media (max-width: 435px) { :global(.selectionButtons span) { line-height: 1.2em; font-size: .8em; } }
</style>

<div class="managerContainer">
    <div class="managerConstrained">
        <div class="managerControls">
            <div class="profileNav">
                <Group variant="outlined">
                    {#if manager == 0}
                        <Button disabled class="selectionButtons" variant="outlined"><Label>← Previous</Label></Button>
                    {:else}
                        <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1, true)} variant="outlined"><Label>← Previous</Label></Button>
                    {/if}
                    <Button class="selectionButtons" onclick={() => goto('/managers')} variant="outlined"><Label>All Teams</Label></Button>
                    {#if manager == managers.length - 1}
                        <Button disabled class="selectionButtons" variant="outlined"><Label>Next →</Label></Button>
                    {:else}
                        <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1, true)} variant="outlined"><Label>Next →</Label></Button>
                    {/if}
                </Group>
            </div>
            <div class="managerSelectWrap">
                <label class="managerSelectLabel" for="manager-select">Jump to manager</label>
                <select id="manager-select" class="managerSelect" value={manager} onchange={selectManager}>
                    {#each managers as managerOption, index}<option value={index}>{managerOption.name}</option>{/each}
                </select>
            </div>
        </div>

        <div class="profileHero">
            <img class="managerPhoto" src={viewManager.photo} alt={viewManager.name} />
            <div class="profileStatus"><span class="statusDot"></span>{#await nflState}2026{:then state}{state.season} · {seasonPhase(state)}{:catch}2026 · Season{/await}</div>
            <h2 class="profileName">
                {viewManager.name}
                {#if commissioner}<span class="commissionerBadge"><span>C</span></span>{/if}
            </h2>
            <div class="managerRole">{coOwners ? 'Co-Manager' : 'Manager'}</div>
            <div class="profileMeta">
                {#if viewManager.location}<div class="metaItem">📍 {viewManager.location}</div>{/if}
                {#if viewManager.managerID && datesActive.start}
                    <div class="metaItem">🏈 Fantasy since '{datesActive.start.toString().substr(2)}</div>
                {:else if viewManager.fantasyStart}
                    <div class="metaItem">🏈 Fantasy since '{viewManager.fantasyStart.toString().substr(2)}</div>
                {/if}
                {#if viewManager.preferredContact}
                    <div class="metaItem"><img class="infoContact" src="/{viewManager.preferredContact}.png" alt={viewManager.preferredContact} />{viewManager.preferredContact}</div>
                {/if}
                {#if viewManager.favoriteTeam}
                    <div class="metaItem"><img class="metaTeam" src="https://sleepercdn.com/images/team_logos/nfl/{viewManager.favoriteTeam}.png" alt="Favorite NFL team" />Favorite Team</div>
                {/if}
                {#if viewManager.tradingScale}<div class="metaItem">🔄 Desire to Trade <span class="tradeValue">{viewManager.tradingScale}/10</span></div>{/if}
                {#if viewManager.rival}
                    <button type="button" class="metaItem metaRival" onclick={goToRival}>
                        <img class="metaRivalImage" src={viewManager.rival.image} alt="{viewManager.rival.name} rival" />Rival: {viewManager.rival.name}
                    </button>
                {/if}
            </div>
            <div class="teamIdentity">
                {#if currentTeamLogo}<img class="teamLogo" src={currentTeamLogo} alt={`${currentTeamName} logo`} />{/if}
                <div class="teamIdentityLabel">Current Team</div>
                <div class="teamIdentityName">{currentTeamName}</div>
            </div>
        </div>
    </div>

    <ManagerCareerStats {leagueTeamManagers} {awards} {records} {rosterID} managerID={viewManager.managerID} managerName={viewManager.name} />

    <ManagerHeadToHead
        managerID={viewManager.managerID}
        {rosterID}
        {managers}
        {leagueTeamManagers}
        {transactions}
    />

    <ManagerAwards {leagueTeamManagers} tookOver={viewManager.tookOver} {awards} {records} {rosterID} managerID={viewManager.managerID} managerName={viewManager.name} hideCareerStats={true} />

    {#if loading}
        <div class="loading"><p>Retrieving players...</p><LinearProgress indeterminate /></div>
    {:else}
        <Roster division="1" expanded={false} {rosterPositions} {roster} {leagueTeamManagers} {players} {startersAndReserve} />
    {/if}

    <h3>Team Transactions</h3>
    <div class="managerConstrained">
        {#if loading}
            <div class="loading"><p>Retrieving players...</p><LinearProgress indeterminate /></div>
        {:else}
            <TransactionsPage {playersInfo} transactions={teamTransactions} {leagueTeamManagers} show="both" query="" page={0} perPage={5} />
        {/if}
    </div>

    <div class="managerNav">
        <Group variant="outlined">
            {#if manager == 0}
                <Button disabled class="selectionButtons" variant="outlined"><Label>Previous Manager</Label></Button>
            {:else}
                <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1)} variant="outlined"><Label>Previous Manager</Label></Button>
            {/if}
            <Button class="selectionButtons" onclick={() => goto('/managers')} variant="outlined"><Label>All Managers</Label></Button>
            {#if manager == managers.length - 1}
                <Button disabled class="selectionButtons" variant="outlined"><Label>Next Manager</Label></Button>
            {:else}
                <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1)} variant="outlined"><Label>Next Manager</Label></Button>
            {/if}
        </Group>
    </div>
</div>