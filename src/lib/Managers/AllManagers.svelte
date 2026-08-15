<script>
    import { leagueName } from '$lib/utils/helper';
    import ManagerRow from './ManagerRow.svelte';

    export let managers, leagueTeamManagers;

    let innerWidth;
</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    .teamsPage {
        width: 100%;
        max-width: 1250px;
        margin: 0 auto;
        padding: 25px 20px 70px;
        box-sizing: border-box;
    }

    .pageHeader {
        text-align: center;
        margin: 20px 0 30px;
    }

    .pageHeader h1 {
        margin: 0;
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1.15;
    }

    .pageHeader p {
        margin: 8px 0 0;
        opacity: 0.7;
        font-size: 1rem;
    }

    .leagueStatus {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 15px;
        padding: 7px 14px;
        border-radius: 20px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        font-size: 0.8rem;
        font-weight: 700;
    }

    .statusDot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2e9d50;
    }

    .managerConstrained {
        width: 100%;
        max-width: 1050px;
        margin: 0 auto;
    }

    .teamGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
    }

    @media (max-width: 750px) {
        .teamsPage {
            padding: 15px 10px 50px;
        }

        .pageHeader {
            margin: 15px 0 25px;
        }

        .pageHeader h1 {
            font-size: 2.1rem;
        }

        .teamGrid {
            grid-template-columns: 1fr;
            gap: 12px;
        }
    }

    @media (max-width: 400px) {
        .pageHeader h1 {
            font-size: 1.8rem;
        }

        .pageHeader p {
            font-size: 0.9rem;
        }
    }
</style>

<div class="teamsPage">

    <div class="pageHeader">

        <h1>
            🏈 {leagueName} Teams
        </h1>

        <p>
            Meet the managers competing in the league
        </p>

        <div class="leagueStatus">
            <span class="statusDot"></span>
            2026 Season · Pre-Draft
        </div>

    </div>

    <div class="managerConstrained">

        <div class="teamGrid">

            {#each managers as manager, key}
                <ManagerRow
                    {manager}
                    {leagueTeamManagers}
                    {key}
                />
            {/each}

        </div>

    </div>

</div>
