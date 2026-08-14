<script>
    import { goto } from "$app/navigation";
    import {
        getDatesActive,
        getRosterIDFromManagerID,
        getTeamNameFromTeamManagers
    } from "$lib/utils/helperFunctions/universalFunctions";
    import { dynasty } from "$lib/utils/leagueInfo";

    export let manager, leagueTeamManagers, key;

    let retired = false;

    let rosterID = manager.roster;
    let year = null;

    if (manager.managerID) {
        const dates = getDatesActive(
            leagueTeamManagers,
            manager.managerID
        );

        if (dates.end) retired = true;

        ({ rosterID, year } =
            getRosterIDFromManagerID(
                leagueTeamManagers,
                manager.managerID
            ) || { rosterID, year });
    }

    const commissioner =
        manager.managerID
            ? leagueTeamManagers.users[manager.managerID].is_owner
            : false;

    const teamName =
        getTeamNameFromTeamManagers(
            leagueTeamManagers,
            rosterID,
            year
        );

</script>

<style>
    .manager {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 22px;
        background-color: var(--fff);
        border: 1px solid var(--ccc);
        border-radius: 16px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease;
        overflow: hidden;
    }

    .manager:hover {
        transform: translateY(-3px);
        box-shadow: 0 7px 20px rgba(0, 0, 0, 0.13);
        border-color: var(--blueOne);
    }

    .retired {
        opacity: 0.75;
    }

    .topRow {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .avatarHolder {
        display: inline-flex;
        position: relative;
        flex-shrink: 0;
    }

    .photo {
        height: 64px;
        width: 64px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
        border: 2px solid var(--fff);
    }

    .commissionerBadge {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        bottom: -4px;
        right: -4px;
        height: 24px;
        width: 24px;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 50%;
        background-color: var(--blueTwo);
        border: 2px solid var(--fff);
        color: #fff;
    }

    .managerInfo {
        min-width: 0;
        flex: 1;
    }

    .name {
        font-size: 1.05rem;
        font-weight: 750;
        line-height: 1.2;
        color: inherit;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .team {
        margin-top: 4px;
        font-size: 0.95rem;
        line-height: 1.2;
        font-weight: 600;
        color: inherit;
        opacity: 0.7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .arrow {
        font-size: 1.4rem;
        opacity: 0.5;
        flex-shrink: 0;
    }

    .seasonStatus {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin-top: 18px;
        padding: 5px 10px;
        border-radius: 12px;
        background-color: var(--f3f3f3);
        border: 1px solid var(--ccc);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    .statusDot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        margin-right: 6px;
        background-color: #2e9d50;
    }

    .retiredStatus .statusDot {
        background-color: #999;
    }

    .info {
        display: flex;
        justify-content: flex-start;
        gap: 12px;
        margin-top: 18px;
        padding-top: 15px;
        border-top: 1px solid var(--ccc);
    }

    .infoSlot {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
    }

    .infoIcon {
        display: inline-flex;
        height: 32px;
        width: 32px;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        border: 1px solid var(--ccc);
        overflow: hidden;
        background-color: var(--fff);
        flex-shrink: 0;
    }

    .infoImg {
        height: 23px;
        width: 23px;
        object-fit: contain;
    }

    .infoAnswer {
        font-size: 0.72rem;
        line-height: 1.1;
        opacity: 0.7;
    }

    .question {
        background-color: var(--fff);
    }

    .retiredBanner {
        position: absolute;
        top: 12px;
        right: -28px;
        padding: 4px 30px;
        transform: rotate(35deg);
        background-color: var(--ddd);
        font-size: 0.65rem;
        font-weight: 800;
        opacity: 0.75;
    }

    @media (max-width: 500px) {
        .manager {
            padding: 17px;
            border-radius: 14px;
        }

        .photo {
            height: 52px;
            width: 52px;
        }

        .name {
            font-size: 0.95rem;
        }

        .team {
            font-size: 0.85rem;
        }

        .info {
            gap: 8px;
        }

        .infoIcon {
            height: 28px;
            width: 28px;
        }

        .infoImg {
            height: 20px;
            width: 20px;
        }
    }

    @media (max-width: 370px) {
        .infoTeam {
            display: none;
        }
    }
</style>

<div
    class:retired
    class="manager"
    onclick={() => goto(`/manager?manager=${key}`)}
>

    {#if retired}
        <div class="retiredBanner">
            RETIRED
        </div>
    {/if}

    <div class="topRow">

        <div class="avatarHolder">

            <img
                class="photo"
                src={manager.photo}
                alt={manager.name}
            />

            {#if commissioner}
                <div class="commissionerBadge">
                    C
                </div>
            {/if}

        </div>

        <div class="managerInfo">

            <div class="name">
                {manager.name}
            </div>

            <div class="team">
                {teamName || 'Team name coming after draft'}
            </div>

        </div>

        <div class="arrow">
            →
        </div>

    </div>

    <div
        class:retiredStatus={retired}
        class="seasonStatus"
    >

        <span class="statusDot"></span>

        {#if retired}
            Former Manager
        {:else}
            Active · Pre-Draft
        {/if}

    </div>

    <div class="info">

        <!-- Favorite NFL Team -->
        <div class="infoSlot infoTeam">

            {#if manager.favoriteTeam}

                <div class="infoIcon">

                    <img
                        class="infoImg"
                        src="https://sleepercdn.com/images/team_logos/nfl/{manager.favoriteTeam}.png"
                        alt="Favorite NFL team"
                    />

                </div>

            {:else}

                <div class="infoIcon question">

                    <img
                        class="infoImg"
                        src="/managers/question.jpg"
                        alt="Favorite NFL team"
                    />

                </div>

            {/if}

        </div>


        <!-- Preferred Contact -->
        <div class="infoSlot">

            {#if manager.preferredContact}

                <div class="infoIcon">

                    <img
                        class="infoImg"
                        src="/{manager.preferredContact}.png"
                        alt="{manager.preferredContact}"
                    />

                </div>

                <div class="infoAnswer">
                    {manager.preferredContact}
                </div>

            {:else}

                <div class="infoIcon question">

                    <img
                        class="infoImg"
                        src="/managers/question.jpg"
                        alt="Preferred contact"
                    />

                </div>

            {/if}

        </div>


        <!-- Dynasty information -->
        {#if dynasty}

            <div class="infoSlot infoRebuild">

                {#if manager.mode}

                    <div class="infoIcon">

                        <img
                            class="infoImg"
                            src="/{manager.mode.replace(' ', '%20')}.png"
                            alt="League strategy"
                        />

                    </div>

                    <div class="infoAnswer">
                        {manager.mode}
                    </div>

                {:else}

                    <div class="infoIcon question">

                        <img
                            class="infoImg"
                            src="/managers/question.jpg"
                            alt="League strategy"
                        />

                    </div>

                {/if}

            </div>

        {/if}

    </div>

</div>
