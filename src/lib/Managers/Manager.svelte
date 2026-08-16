<script>
    import Button, { Group, Label } from '@smui/button';
	import LinearProgress from '@smui/linear-progress';
    import {loadPlayers, getLeagueTransactions} from '$lib/utils/helper';
	import Roster from '../Rosters/Roster.svelte';
	import TransactionsPage from '../Transactions/TransactionsPage.svelte';
    import { goto } from '$app/navigation';
    import ManagerFantasyInfo from './ManagerFantasyInfo.svelte';
    import ManagerAwards from './ManagerAwards.svelte';
    import ManagerCareerStats from './ManagerCareerStats.svelte';
    import { onMount } from 'svelte';
	import { getDatesActive, getRosterIDFromManagerID, getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let manager, managers, rostersData, leagueTeamManagers, rosterPositions, transactionsData, awards, records;

    let transactions = transactionsData.transactions;

    $: viewManager = managers[manager];

    $: datesActive = getDatesActive(leagueTeamManagers, viewManager.managerID);

    const startersAndReserve = rostersData.startersAndReserve;
    let rosters = rostersData.rosters;

    $: ({rosterID, year} = viewManager.managerID ? getRosterIDFromManagerID(leagueTeamManagers, viewManager.managerID) : {rosterID: viewManager.roster, year: null});

    $: teamTransactions = transactions.filter(t => t.rosters.includes(parseInt(rosterID)));

    $: roster = rosters[rosterID];

    $: coOwners = year && rosterID ? leagueTeamManagers.teamManagersMap[year][rosterID].managers.length > 1 : roster.co_owners;

    $: commissioner = viewManager.managerID ? leagueTeamManagers.users[viewManager.managerID].is_owner : false;

    let players, playersInfo;
    let loading = true;

    const refreshTransactions = async () => {
        const newTransactions = await getLeagueTransactions(false, true);
        transactions = newTransactions.transactions;
    }

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
    })

    const changeManager = (newManager, noscroll = false) => {
        if(!newManager) {
            goto(`/managers`);
        }
        manager = newManager;
        goto(`/manager?manager=${newManager}`, {noscroll});
    }
</script>

<style>
    .managerContainer {
        width: 100%;
        margin: 2em 0 5em;
    }

    .managerConstrained {
        width: 97%;
        max-width: 800px;
        margin: 0 auto 4em;
    }

   .managerPhoto {
    display: block;
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 50%;
    margin: 0 auto;
    border: 5px solid var(--fff);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.profileHero {
    position: relative;
    padding: 35px 25px 30px;
    margin: 20px auto 25px;
    max-width: 800px;
    text-align: center;
    border-radius: 24px;
    background: var(--fff);
    border: 1px solid var(--ccc);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.profileStatus {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 18px;
    padding: 6px 13px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid var(--ccc);
    background: var(--f3f3f3);
}

.statusDot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2e9d50;
}

.profileName {
    margin: 18px 0 0;
    font-size: 2.5em;
    font-weight: 800;
    line-height: 1.05;
}

.teamSub {
    margin-top: 10px;
    font-size: 1.05em;
    line-height: 1.4em;
    opacity: 0.65;
}

.teamSub i {
    display: block;
    margin-top: 3px;
    font-size: 1.35em;
    font-weight: 800;
    font-style: normal;
    opacity: 1;
}

.profileMeta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
}

.metaItem {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 10px;
    font-size: 0.78rem;
    background: var(--f3f3f3);
    border: 1px solid var(--ccc);
}

.metaTeam {
    height: 25px;
    width: 25px;
}

.profileNav {
    margin: 20px auto 30px;
    text-align: center;
}

    h2 {
        text-align: center;
        font-size: 2.8em;
        margin: 1em 0 0em;
        line-height: 1em;
    }

    h3 {
        text-align: center;
        font-size: 1.5em;
        margin: 1.5em 0 0.5em;
        font-weight: 200;
    }

    .basicInfo {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        height: 24px;
        margin: 2em 0;
    }

    .basicInfo span {
        color: #888;
        font-size: 0.9em;
    }

    .infoChild {
        font-style: italic;
    }

    .infoContact {
        height: 20px;
        vertical-align: middle;
        padding-left: 1em;
    }

    .infoTeam {
        height: 48px;
    }

    .bio {
        margin: 2em 1.5em 2em;
        text-indent: 4em;
    }

    .philosophy {
        margin: 2em 1.5em 2em;
        text-indent: 4em;
    }

    .loading {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
    }

    .teamSub {
        font-size: 0.4em;
        line-height: 1em;
        color: #666;
    }

    .managerNav {
        margin: 4em 0 2em;
        text-align: center;
    }

    .upper {
        margin-top: 0;
    }

    .commissionerBadge {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 25px;
        width: 25px;
        font-weight: 600;
        border-radius: 15px;
        background-color: var(--blueTwo);
        border: 1px solid var(--blueOne);
    }

    .commissionerBadge span {
        font-style: normal;
        color: #fff;
    }

    @media (max-width: 505px) {
        :global(.selectionButtons span) {
            font-size: 0.8em;
        }
    }

    @media (max-width: 435px) {
        :global(.selectionButtons span) {
            line-height: 1.2em;
            font-size: 0.8em;
        }
    }

	@media (max-width: 450px) {
        .basicInfo {
            height: 20px;
        }

        .basicInfo span {
            font-size: 0.75em;
        }

        .infoTeam {
            height: 30px;
        }
	}

    @media (max-width: 370px) {
        .basicInfo {
            height: 18px;
        }

        .basicInfo span {
            font-size: 0.6em;
        }

        .infoTeam {
            height: 24px;
        }
    }
</style>

<div class="managerContainer">
    <div class="managerConstrained">
       <div class="profileHero">

    <img
        class="managerPhoto"
        src="{viewManager.photo}"
        alt="{viewManager.name}"
    />

    <div class="profileStatus">
        <span class="statusDot"></span>
        2026 · Pre-Draft
    </div>

    <h2 class="profileName">
        {viewManager.name}

        {#if commissioner}
            <span class="commissionerBadge">
                <span>C</span>
            </span>
        {/if}
    </h2>

    <div class="teamSub">
        {coOwners ? 'Co-' : ''}Manager of
        <i>
            {getTeamNameFromTeamManagers(
                leagueTeamManagers,
                rosterID,
                year
            )}
        </i>
    </div>

    <div class="profileMeta">
        {#if viewManager.location}
            <div class="metaItem">
                📍 {viewManager.location}
            </div>
        {/if}

        {#if viewManager.managerID && datesActive.start}
            <div class="metaItem">
                🗓️ Since '{datesActive.start.toString().substr(2)}
            </div>
        {:else if viewManager.fantasyStart}
            <div class="metaItem">
                🏈 Fantasy since '{viewManager.fantasyStart.toString().substr(2)}
            </div>
        {/if}

        {#if viewManager.preferredContact}
            <div class="metaItem">
                <img
                    class="infoContact"
                    src="/{viewManager.preferredContact}.png"
                    alt="{viewManager.preferredContact}"
                />
                {viewManager.preferredContact}
            </div>
        {/if}

        {#if viewManager.favoriteTeam}
            <div class="metaItem">
                <img
                    class="metaTeam"
                    src="https://sleepercdn.com/images/team_logos/nfl/{viewManager.favoriteTeam}.png"
                    alt="Favorite NFL team"
                />
                Favorite Team
            </div>
        {/if}
    </div>

</div>

<div class="profileNav">
    <Group variant="outlined">
        {#if manager == 0}
            <Button disabled class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1, true)} variant="outlined">
                <Label>← Previous</Label>
            </Button>
        {:else}
            <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1, true)} variant="outlined">
                <Label>← Previous</Label>
            </Button>
        {/if}

        <Button class="selectionButtons" onclick={() => goto('/managers')} variant="outlined">
            <Label>All Teams</Label>
        </Button>

        {#if manager == managers.length - 1}
            <Button disabled class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1, true)} variant="outlined">
                <Label>Next →</Label>
            </Button>
        {:else}
            <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1, true)} variant="outlined">
                <Label>Next →</Label>
            </Button>
        {/if}
    </Group>
</div>

        <p class="bio">{@html viewManager.bio}</p>

        {#if viewManager.philosophy}
            <h3>Team Philosophy</h3>
            <p class="philosophy">{@html viewManager.philosophy}</p>
        {/if}
    </div>

    {#if !loading}
        <ManagerFantasyInfo {viewManager} {players} {changeManager} />
    {/if}

    <ManagerCareerStats
        {leagueTeamManagers}
        {awards}
        {records}
        {rosterID}
        managerID={viewManager.managerID}
        managerName={viewManager.name}
    />

    <ManagerAwards
        {leagueTeamManagers}
        tookOver={viewManager.tookOver}
        {awards}
        {records}
        {rosterID}
        managerID={viewManager.managerID}
        hideCareerStats={true}
    />

    {#if loading}
        <div class="loading">
            <p>Retrieving players...</p>
            <LinearProgress indeterminate />
        </div>
    {:else}
        <Roster division="1" expanded={false} {rosterPositions} {roster} {leagueTeamManagers} {players} {startersAndReserve} />
    {/if}

    <h3>Team Transactions</h3>
    <div class="managerConstrained">
        {#if loading}
            <div class="loading">
                <p>Retrieving players...</p>
                <LinearProgress indeterminate />
            </div>
        {:else}
            <TransactionsPage {playersInfo} transactions={teamTransactions} {leagueTeamManagers} show='both' query='' page={0} perPage={5} />
        {/if}
    </div>

    <div class="managerNav">
        <Group variant="outlined">
            {#if manager == 0}
                <Button disabled class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1)} variant="outlined">
                    <Label>Previous Manager</Label>
                </Button>
            {:else}
                <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) - 1)} variant="outlined">
                    <Label>Previous Manager</Label>
                </Button>
            {/if}
            <Button class="selectionButtons" onclick={() => goto('/managers')} variant="outlined">
                <Label>All Managers</Label>
            </Button>
            {#if manager == managers.length - 1}
                <Button disabled class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1)} variant="outlined">
                    <Label>Next Manager</Label>
                </Button>
            {:else}
                <Button class="selectionButtons" onclick={() => changeManager(parseInt(manager) + 1)} variant="outlined">
                    <Label>Next Manager</Label>
                </Button>
            {/if}
        </Group>
    </div>

</div>
