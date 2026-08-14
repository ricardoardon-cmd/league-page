<script>
    import { gotoManager } from '$lib/utils/helper';
    import {
        getAvatarFromTeamManagers,
        getNestedTeamNamesFromTeamManagers
    } from '$lib/utils/helperFunctions/universalFunctions';

    export let podium, leagueTeamManagers;

    const {
        year,
        champion,
        second,
        third,
        divisions,
        toilet
    } = podium;
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

    .podiumGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
    }

    .placeCard {
        position: relative;
        padding: 22px 16px;
        border-radius: 16px;
        text-align: center;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        cursor: pointer;
        transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease;
    }

    .placeCard:hover {
        transform: translateY(-3px);
        border-color: var(--blueOne);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    .placeCardChampion {
        border: 2px solid #d4af37;
    }

    .placeIcon {
        font-size: 1.4rem;
        margin-bottom: 10px;
    }

    .placeAvatar {
        width: 92px;
        height: 92px;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid var(--ccc);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    }

    .placeTitle {
        margin-top: 14px;
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

    .divisionSection {
        margin-top: 28px;
        padding-top: 22px;
        border-top: 1px solid var(--ccc);
    }

    .divisionTitle {
        text-align: center;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 14px;
    }

    .divisions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
    }

    .divisionCard {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 220px;
        padding: 12px 14px;
        border-radius: 12px;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
        cursor: pointer;
    }

    .divisionAvatar {
        width: 42px;
        height: 42px;
        object-fit: cover;
        border-radius: 50%;
    }

    .divisionInfo {
        min-width: 0;
    }

    .divisionName {
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .divisionTeam {
        margin-top: 3px;
        font-size: 0.9rem;
        font-weight: 700;
    }

    .toiletSection {
        margin-top: 28px;
        padding: 24px 18px;
        border-radius: 16px;
        text-align: center;
        background: var(--f3f3f3);
        border: 1px solid var(--ccc);
    }

    .toiletTitle {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .toiletHeading {
        margin-top: 4px;
        font-size: 1.35rem;
        font-weight: 800;
    }

    .toiletBowl {
        position: relative;
        width: 180px;
        height: 165px;
        margin: 12px auto 6px;
    }

    .toiletWinner {
        position: absolute;
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 50%;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
        border: 2px solid var(--ccc);
        cursor: pointer;
    }

    .toilet {
        position: absolute;
        width: 100%;
        height: auto;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
    }

    .toiletTeam {
        display: inline-block;
        margin-top: 4px;
        padding: 7px 14px;
        border-radius: 999px;
        border: 1px solid var(--ccc);
        background: var(--fff);
        font-weight: 800;
        cursor: pointer;
    }

    @media (max-width: 700px) {
        .seasonAwards {
            padding: 16px 12px;
        }

        .podiumGrid {
            grid-template-columns: 1fr;
        }

        .placeCard {
            display: grid;
            grid-template-columns: 55px 70px 1fr;
            align-items: center;
            text-align: left;
            gap: 10px;
        }

        .placeIcon {
            margin: 0;
            text-align: center;
        }

        .placeAvatar {
            width: 60px;
            height: 60px;
        }

        .placeTitle,
        .placeName {
            margin-top: 0;
        }
    }
</style>

<div class="seasonAwards">

    <div class="seasonHeader">
        <div class="seasonYear">{year}</div>
        <div class="seasonLabel">Season Results</div>
    </div>

    <div class="podiumGrid">

        <div
            class="placeCard placeCardChampion"
            onclick={() =>
                gotoManager({
                    year,
                    leagueTeamManagers,
                    rosterID: champion
                })
            }
        >
            <div class="placeIcon">🥇</div>

            <img
                class="placeAvatar"
                src={getAvatarFromTeamManagers(
                    leagueTeamManagers,
                    champion,
                    year
                )}
                alt="Champion"
            />

            <div>
                <div class="placeTitle">Champion</div>

                <div class="placeName">
                    {@html getNestedTeamNamesFromTeamManagers(
                        leagueTeamManagers,
                        year,
                        champion
                    )}
                </div>
            </div>
        </div>

        <div
            class="placeCard"
            onclick={() =>
                gotoManager({
                    year,
                    leagueTeamManagers,
                    rosterID: second
                })
            }
        >
            <div class="placeIcon">🥈</div>

            <img
                class="placeAvatar"
                src={getAvatarFromTeamManagers(
                    leagueTeamManagers,
                    second,
                    year
                )}
                alt="Runner-Up"
            />

            <div>
                <div class="placeTitle">Runner-Up</div>

                <div class="placeName">
                    {@html getNestedTeamNamesFromTeamManagers(
                        leagueTeamManagers,
                        year,
                        second
                    )}
                </div>
            </div>
        </div>

        <div
            class="placeCard"
            onclick={() =>
                gotoManager({
                    year,
                    leagueTeamManagers,
                    rosterID: third
                })
            }
        >
            <div class="placeIcon">🥉</div>

            <img
                class="placeAvatar"
                src={getAvatarFromTeamManagers(
                    leagueTeamManagers,
                    third,
                    year
                )}
                alt="Third Place"
            />

            <div>
                <div class="placeTitle">Third Place</div>

                <div class="placeName">
                    {@html getNestedTeamNamesFromTeamManagers(
                        leagueTeamManagers,
                        year,
                        third
                    )}
                </div>
            </div>
        </div>

    </div>

    {#if divisions?.length}
        <div class="divisionSection">

            <div class="divisionTitle">
                Regular Season Honors
            </div>

            <div class="divisions">

                {#each divisions as division}

                    {#if division.rosterID}

                        <div
                            class="divisionCard"
                            onclick={() =>
                                gotoManager({
                                    year,
                                    leagueTeamManagers,
                                    rosterID: division.rosterID
                                })
                            }
                        >

                            <img
                                class="divisionAvatar"
                                src={getAvatarFromTeamManagers(
                                    leagueTeamManagers,
                                    division.rosterID,
                                    year
                                )}
                                alt="Division winner"
                            />

                            <div class="divisionInfo">

                                <div class="divisionName">
                                    {division.name
                                        ? `${division.name} Division`
                                        : 'Regular Season Champion'}
                                </div>

                                <div class="divisionTeam">
                                    {@html getNestedTeamNamesFromTeamManagers(
                                        leagueTeamManagers,
                                        year,
                                        division.rosterID
                                    )}
                                </div>

                            </div>

                        </div>

                    {/if}

                {/each}

            </div>

        </div>
    {/if}

    {#if toilet}

        <div class="toiletSection">

            <div class="toiletTitle">
                Last Place
            </div>

            <div class="toiletHeading">
                🚽 Toilet Bowl
            </div>

            <div class="toiletBowl">

                <img
                    class="toiletWinner"
                    src={getAvatarFromTeamManagers(
                        leagueTeamManagers,
                        toilet,
                        year
                    )}
                    onclick={() =>
                        gotoManager({
                            year,
                            leagueTeamManagers,
                            rosterID: toilet
                        })
                    }
                    alt="Toilet Bowl"
                />

                <img
                    class="toilet"
                    src="/toilet-bowl-2.png"
                    alt="Toilet Bowl"
                />

            </div>

            <div
                class="toiletTeam"
                onclick={() =>
                    gotoManager({
                        year,
                        leagueTeamManagers,
                        rosterID: toilet
                    })
                }
            >
                {@html getNestedTeamNamesFromTeamManagers(
                    leagueTeamManagers,
                    year,
                    toilet
                )}
            </div>

        </div>

    {/if}

</div>
