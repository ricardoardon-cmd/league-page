<script>

    import LinearProgress from '@smui/linear-progress';

    import {
        getNflState,
        leagueName,
        getAwards,
        getLeagueTeamManagers,
        homepageText,
        managers,
        gotoManager,
        enableBlog,
        waitForAll
    } from '$lib/utils/helper';

    import { Transactions, PowerRankings, HomePost } from '$lib/components';

    import {
        getAvatarFromTeamManagers,
        getTeamFromTeamManagers
    } from '$lib/utils/helperFunctions/universalFunctions';

    import { dues, dynasty } from '$lib/utils/leagueInfo';

    const nflState = getNflState();
    const podiumsData = getAwards();
    const leagueTeamManagersData = getLeagueTeamManagers();

    const navigation = [
        {
            title: 'Standings',
            description: 'League rankings, records and playoff position.',
            icon: '🏆',
            href: '/standings'
        },
        {
            title: 'Matchups',
            description: 'Weekly matchups, scores and results.',
            icon: '🏈',
            href: '/matchups'
        },
        {
            title: 'Teams',
            description: 'Managers, rosters and team information.',
            icon: '👥',
            href: '/managers'
        },
        {
            title: 'Rosters',
            description: 'Browse every roster in the league.',
            icon: '📋',
            href: '/rosters'
        },
        {
            title: 'Transactions',
            description: 'Trades, waivers, adds and drops.',
            icon: '🔄',
            href: '/transactions'
        },
        {
            title: 'Drafts',
            description: 'Draft history and selections.',
            icon: '🎯',
            href: '/drafts'
        },
        {
            title: 'Records',
            description: 'League records and historical achievements.',
            icon: '📊',
            href: '/records'
        },
        {
            title: 'Rivalries',
            description: 'Head-to-head history and rivalries.',
            icon: '⚔️',
            href: '/rivalry'
        }
    ];
</script>

<style>
    #home {
        min-height: 100vh;
        background: var(--f3f3f3);
    }

    .dashboard {
        width: 100%;
        max-width: 1250px;
        margin: 0 auto;
        padding: 35px 25px 60px;
        box-sizing: border-box;
    }

    /* HERO */

    .hero {
        background: linear-gradient(
            135deg,
            var(--blueOne),
            #182b49
        );
        color: white;
        border-radius: 18px;
        padding: 35px;
        margin-bottom: 25px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .heroTop {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }

    .hero h1 {
        margin: 0;
        font-size: 2.7rem;
        font-weight: 800;
        letter-spacing: -1px;
    }

    .hero p {
        margin: 8px 0 0;
        opacity: 0.85;
        font-size: 1.05rem;
    }

    .status {
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 12px 18px;
        border-radius: 12px;
        text-align: center;
        min-width: 130px;
    }

    .statusLabel {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        opacity: 0.7;
        letter-spacing: 1px;
    }

    .statusValue {
        display: block;
        font-size: 1.1rem;
        font-weight: 700;
        margin-top: 3px;
    }

    /* STAT CARDS */

    .stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 30px;
    }

    .statCard {
        background:  var(--f3f3f3);
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e5e5;
    }
.leagueBadge {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 50%;
    display: block;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
    .statIcon {
        font-size: 1.5rem;
    }
leagueBadge {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 50%;
    display: block;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
    .statLabel {
        color: #777;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-top: 10px;
    }

    .statValue {
        font-size: 1.4rem;
        font-weight: 750;
        margin-top: 4px;
    }

    /* INTRO */

    .intro {
        background:  var(--f3f3f3);
        border-radius: 14px;
        padding: 25px;
        margin-bottom: 30px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
    }

    .introTitle {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 12px;
    }

    /* NAVIGATION */

    .sectionTitle {
        font-size: 1.6rem;
        font-weight: 750;
        margin: 35px 0 15px;
    }

    .navigation {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
    }

    .navCard {
        display: block;
        text-decoration: none;
        color: inherit;
        background:  var(--f3f3f3);
        border-radius: 14px;
        padding: 22px;
        border: 1px solid #e5e5e5;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .navCard:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .navIcon {
        font-size: 1.8rem;
        margin-bottom: 10px;
    }

    .navTitle {
        font-weight: 700;
        font-size: 1.05rem;
    }

    .navDescription {
        color: #777;
        font-size: 0.85rem;
        line-height: 1.4;
        margin-top: 5px;
    }

    /* MAIN CONTENT */

    .contentGrid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: 25px;
        align-items: start;
    }

    .panel {
        background:  var(--f3f3f3);
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
        margin-bottom: 25px;
    }

    .panelTitle {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 15px;
    }

    /* NFL */

    .nflBanner {
        background: var(--blueOne);
        color: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin-bottom: 25px;
    }

    .nflLabel {
        font-size: 0.75rem;
        text-transform: uppercase;
        opacity: 0.75;
        letter-spacing: 1px;
    }

    .nflWeek {
        font-size: 1.7rem;
        font-weight: 750;
        margin-top: 4px;
    }

    /* CHAMPION */

    #currentChamp {
        padding: 25px;
        background:  var(--f3f3f3);
        border-radius: 14px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
        margin-bottom: 25px;
        text-align: center;
    }

    #champ {
        position: relative;
        width: 150px;
        height: 150px;
        margin: 15px auto;
        cursor: pointer;
    }

    .first {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        border-radius: 100%;
        border: 1px solid #ccc;
        left: 50%;
        top: 43%;
    }

    .laurel {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 135px;
        height: auto;
        left: 50%;
        top: 50%;
    }

    .champTitle {
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 5px;
    }

    .champTeam {
        display: inline-block;
        font-size: 1.4rem;
        font-weight: 700;
        cursor: pointer;
    }

    .champYear {
        color: #777;
        font-size: 0.9rem;
    }

    /* MOBILE */

    @media (max-width: 1000px) {
        .stats {
            grid-template-columns: repeat(2, 1fr);
        }

        .navigation {
            grid-template-columns: repeat(2, 1fr);
        }

        .contentGrid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 650px) {
        .dashboard {
            padding: 20px 12px 40px;
        }

        .hero {
            padding: 25px 20px;
            border-radius: 14px;
        }

        .heroTop {
            flex-direction: column;
            align-items: flex-start;
        }

        .hero h1 {
            font-size: 2rem;
        }

        .status {
            width: 100%;
            box-sizing: border-box;
        }

        .stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .statCard {
            padding: 15px;
        }

        .navigation {
            grid-template-columns: 1fr;
        }

        .navCard {
            padding: 18px;
        }
    }
.welcomeText {
    color: inherit;
    line-height: 1.6;
}

.welcomeText :global(p),
.welcomeText :global(div),
.welcomeText :global(span),
.welcomeText :global(li),
.welcomeText :global(strong),
.welcomeText :global(b) {
    color: inherit;
}

.welcomeText :global(a) {
    color: var(--blueOne);
}
/* =========================================================
   GGL DASHBOARD - LIGHT / DARK MODE SUPPORT
   Uses the existing League Page theme
   ========================================================= */

/* Cards and dashboard sections */
.statCard,
.intro,
.navCard,
.panel,
#currentChamp {
    background-color: var(--f3f3f3);
    color: inherit;
}

/* Dashboard text */
.statCard,
.intro,
.navCard,
.panel,
#currentChamp,
.sectionTitle {
    color: inherit;
}

/* Welcome section */
.welcomeText {
    color: inherit;
    line-height: 1.6;
}

.welcomeText p,
.welcomeText div,
.welcomeText span,
.welcomeText li,
.welcomeText strong,
.welcomeText b {
    color: inherit;
}

/* Links */
.welcomeText a,
.navCard {
    color: inherit;
}

/* Card descriptions */
.navDescription {
    color: inherit;
    opacity: 0.75;
}

/* Stat labels */
.statLabel {
    color: inherit;
    opacity: 0.7;
}

/* Main dashboard background */
#home {
    background-color: var(--f3f3f3);
    color: inherit;
}

/* Make headings follow the current theme */
.sectionTitle,
.panelTitle,
.introTitle,
.statValue,
.navTitle,
.champTitle,
.champTeam,
.champYear {
    color: inherit;
}

/* Keep the league banner readable */
.nflBanner {
    background-color: var(--blueOne);
    color: #fff;
}

/* Make links visible in both themes */
a {
    color: inherit;
}

</style>

<div id="home">
    <main class="dashboard">

        <!-- HERO -->
        <section class="hero">
            <div class="heroTop">

                <div>
                    <h1>{leagueName}</h1>
                    <p>Fantasy Football League Hub</p>
                </div>

                <div class="status">
                    <span class="statusLabel">League Format</span>
                    <span class="statusValue">
                        {dynasty ? 'Dynasty' : 'Redraft'}
                    </span>
                </div>

            </div>
        </section>

        <!-- QUICK STATS -->
<section class="stats">

    <div class="statCard">
        <div class="statIcon">👥</div>
        <div class="statLabel">Teams</div>
        <div class="statValue">{managers.length || '—'}</div>
    </div>

    <div class="statCard">
        <div class="statIcon">💰</div>
        <div class="statLabel">League Dues</div>
        <div class="statValue">${dues}</div>
    </div>

    <div class="statCard">
        <div class="statIcon">🏈</div>
        <div class="statLabel">NFL Status</div>

        <div class="statValue">
            {#await nflState}
                ...
            {:then state}
                {state.season_type === 'regular'
                    ? `Week ${state.week}`
                    : state.season_type === 'pre'
                        ? 'Preseason'
                        : 'Postseason'}
            {:catch}
                —
            {/await}
        </div>
    </div>

    <div class="statCard">
    <div class="statIcon">🏆</div>
    <div class="statLabel">League</div>
    <div class="statValue">GGL</div>
</div>

</section>

        <!-- INTRODUCTION -->
        <section class="intro">
            <div class="introTitle">Welcome to {leagueName}</div>

            <div class="welcomeText">
    {@html homepageText}
</div>
        </section>

        <!-- NFL STATUS -->
        <section class="nflBanner">

            <div class="nflLabel">NFL Status</div>

            {#await nflState}
                <div class="nflWeek">Retrieving NFL state...</div>
                <LinearProgress indeterminate />

            {:then nflStateData}

                <div class="nflWeek">

                    NFL {nflStateData.season}

                    {#if nflStateData.season_type == 'pre'}
                        — Preseason

                    {:else if nflStateData.season_type == 'post'}
                        — Postseason

                    {:else}
                        — Week {nflStateData.week}
                    {/if}

                </div>

            {:catch error}

                <div class="nflWeek">
                    Unable to retrieve NFL status
                </div>

            {/await}

        </section>

        <!-- NAVIGATION -->
        <h2 class="sectionTitle">League Center</h2>

        <section class="navigation">

            {#each navigation as item}

                <a class="navCard" href={item.href}>

                    <div class="navIcon">{item.icon}</div>

                    <div class="navTitle">
                        {item.title}
                    </div>

                    <div class="navDescription">
                        {item.description}
                    </div>

                </a>

            {/each}

        </section>

        <!-- MAIN CONTENT -->
        <h2 class="sectionTitle">League Highlights</h2>

        <section class="contentGrid">

            <div>

                <!-- POWER RANKINGS -->
                <div class="panel">

                    <div class="panelTitle">
                        🔥 Power Rankings
                    </div>

                    <PowerRankings />

                </div>

                <!-- TRANSACTIONS -->
                <div class="panel">

                    <div class="panelTitle">
                        🔄 Recent Transactions
                    </div>

                    <Transactions />

                </div>

            </div>

            <!-- SIDEBAR -->
            <aside>

                <!-- CURRENT CHAMPION -->
                <div id="currentChamp">

                    {#await waitForAll(
                        podiumsData,
                        leagueTeamManagersData
                    )}

                        <p>Retrieving league history...</p>

                        <LinearProgress indeterminate />

                    {:then [podiums, leagueTeamManagers]}

                        {#if podiums[0]}

                            <div class="champTitle">
                                🏆 Defending Champion
                            </div>

                            <div class="champYear">
                                {podiums[0].year} Champion
                            </div>

                            <div
                                id="champ"
                                onclick={() => {
                                    if (managers.length) {
                                        gotoManager({
                                            year: podiums[0].year,
                                            leagueTeamManagers,
                                            rosterID: parseInt(podiums[0].champion)
                                        });
                                    }
                                }}
                            >

                                <img
                                    src={getAvatarFromTeamManagers(
                                        leagueTeamManagers,
                                        podiums[0].champion,
                                        podiums[0].year
                                    )}
                                    class="first"
                                    alt="champion"
                                />

                                <img
                                    src="/laurel.png"
                                    class="laurel"
                                    alt="champion laurel"
                                />

                            </div>

                            <div
                                class="champTeam"
                                onclick={() =>
                                    gotoManager({
                                        year: podiums[0].year,
                                        leagueTeamManagers,
                                        rosterID: parseInt(podiums[0].champion)
                                    })
                                }
                            >

                                {getTeamFromTeamManagers(
                                    leagueTeamManagers,
                                    podiums[0].champion,
                                    podiums[0].year
                                ).name}

                            </div>

                        {:else}

                            <p>No former champions.</p>

                        {/if}

                    {:catch error}

                        <p>
                            Unable to retrieve championship history.
                        </p>

                    {/await}

                </div>

            </aside>

        </section>

    </main>
</div>
