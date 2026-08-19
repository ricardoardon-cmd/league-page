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
        waitForAll
    } from '$lib/utils/helper';
    import { Transactions, PowerRankings } from '$lib/components';
    import {
        getAvatarFromTeamManagers,
        getTeamFromTeamManagers
    } from '$lib/utils/helperFunctions/universalFunctions';
    import { dues } from '$lib/utils/leagueInfo';

    const nflState = getNflState();
    const podiumsData = getAwards();
    const leagueTeamManagersData = getLeagueTeamManagers();

    const navigation = [
        { title: 'Standings', description: 'League rankings, records and playoff position.', icon: '🏆', href: '/standings' },
        { title: 'Matchups', description: 'Weekly matchups, scores and results.', icon: '🏈', href: '/matchups' },
        { title: 'Teams', description: 'Managers, rosters and team information.', icon: '👥', href: '/managers' },
        { title: 'Rosters', description: 'Browse every roster in the league.', icon: '📋', href: '/rosters' },
        { title: 'Transactions', description: 'Trades, waivers, adds and drops.', icon: '🔄', href: '/transactions' },
        { title: 'Drafts', description: 'Draft history and selections.', icon: '🎯', href: '/drafts' },
        { title: 'Records', description: 'League records and historical achievements.', icon: '📊', href: '/records' },
        { title: 'Rivalries', description: 'Head-to-head history and rivalries.', icon: '⚔️', href: '/rivalry' },
        { title: 'Season Archives', description: 'Photos, videos and memories from every season.', icon: '🗃️', href: '/archive' },
        { title: 'Sleeper', description: 'Open the GGL league on Sleeper.', icon: '💤', href: 'https://sleeper.com/leagues/1352122466314489856' }
    ];
</script>

<style>
    #home {
        min-height: 100vh;
        background: var(--f3f3f3);
        color: inherit;
    }

    .dashboard {
        width: 100%;
        max-width: 1250px;
        margin: 0 auto;
        padding: 35px 25px 60px;
        box-sizing: border-box;
    }

    .hero {
        position: relative;
        min-height: 310px;
        padding: 35px;
        margin-bottom: 25px;
        border-radius: 18px;
        overflow: hidden;
        color: #fff;
        background:
            linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.20) 55%, rgba(0,0,0,.10) 100%),
            url('/league-photo.jpg');
        background-size: cover;
        background-position: center 22%;
        box-shadow: 0 8px 25px rgba(0,0,0,.18);
    }

    .heroTop {
        min-height: 240px;
        display: flex;
        justify-content: flex-start;
        align-items: flex-end;
        position: relative;
        width: 100%;
    }

    .heroBrand {
        width: 100%;
        font-size: 1.45rem;
        font-weight: 700;
        letter-spacing: .01em;
        white-space: nowrap;
        text-shadow: 0 2px 10px rgba(0,0,0,.8);
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 30px;
    }

    .statCard,
    .intro,
    .navCard,
    .panel,
    #currentChamp {
        background: var(--f3f3f3);
        color: inherit;
    }

    .statCard {
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 3px 12px rgba(0,0,0,.08);
        border: 1px solid var(--ccc);
    }

    .statIcon { font-size: 1.5rem; }

    .statLabel {
        margin-top: 10px;
        font-size: .8rem;
        text-transform: uppercase;
        letter-spacing: .8px;
        opacity: .7;
    }

    .statValue {
        margin-top: 4px;
        font-size: 1.4rem;
        font-weight: 750;
    }

    .intro {
        border-radius: 14px;
        padding: 25px;
        margin-bottom: 30px;
        box-shadow: 0 3px 12px rgba(0,0,0,.06);
        border: 1px solid var(--ccc);
    }

    .introTitle {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 12px;
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
    .welcomeText :global(b) { color: inherit; }

    .welcomeText :global(a) { color: var(--blueOne); }

    .nflBanner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 62px;
        box-sizing: border-box;
        padding: 12px 18px;
        margin-bottom: 25px;
        border-radius: 12px;
        background: var(--blueOne);
        color: #fff;
        text-align: center;
    }

    .nflLabel {
        font-size: .72rem;
        text-transform: uppercase;
        opacity: .75;
        letter-spacing: 1px;
    }

    .nflWeek {
        font-size: 1.15rem;
        font-weight: 750;
    }

    .sectionTitle {
        margin: 35px 0 15px;
        font-size: 1.6rem;
        font-weight: 750;
        color: inherit;
    }

    .navigation {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
    }

    .navCard {
        display: block;
        min-width: 0;
        padding: 22px;
        border-radius: 14px;
        border: 1px solid var(--ccc);
        text-decoration: none;
        transition: transform .15s ease, box-shadow .15s ease;
    }

    .navCard:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0,0,0,.1);
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
        margin-top: 5px;
        font-size: .85rem;
        line-height: 1.4;
        opacity: .75;
    }

    .contentGrid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 380px;
        gap: 25px;
        align-items: start;
    }

    .panel {
        padding: 20px;
        margin-bottom: 25px;
        border-radius: 14px;
        border: 1px solid var(--ccc);
        box-shadow: 0 3px 12px rgba(0,0,0,.06);
    }

    .panelTitle {
        margin-bottom: 15px;
        font-size: 1.3rem;
        font-weight: 700;
    }

    #currentChamp {
        padding: 25px;
        margin-bottom: 25px;
        border-radius: 14px;
        border: 1px solid var(--ccc);
        box-shadow: 0 3px 12px rgba(0,0,0,.06);
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
        left: 50%;
        top: 43%;
        width: 80px;
        height: 80px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        border: 1px solid #ccc;
        object-fit: cover;
    }

    .laurel {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 135px;
        height: auto;
        transform: translate(-50%, -50%);
    }

    .champTitle {
        margin-bottom: 5px;
        font-size: 1.4rem;
        font-weight: 700;
    }

    .champTeam {
        display: inline-block;
        font-size: 1.4rem;
        font-weight: 700;
        cursor: pointer;
    }

    .champYear {
        font-size: .9rem;
        opacity: .68;
    }

    a { color: inherit; }

    @media (max-width: 1000px) {
        .stats { grid-template-columns: repeat(2, 1fr); }
        .navigation { grid-template-columns: repeat(2, 1fr); }
        .contentGrid { grid-template-columns: 1fr; }
    }

    @media (max-width: 650px) {
        .dashboard { padding: 14px 10px 34px; }

        .hero {
            min-height: 185px;
            padding: 16px;
            margin-bottom: 12px;
            border-radius: 14px;
            background-position: center 28%;
        }

        .heroTop {
            min-height: 155px;
            justify-content: flex-end;
            align-items: flex-end;
        }

        .heroBrand {
            font-size: clamp(.76rem, 3.9vw, 1rem);
            font-weight: 700;
            white-space: nowrap;
        }

        .stats {
            grid-template-columns: repeat(4, minmax(0,1fr));
            gap: 6px;
            margin-bottom: 12px;
        }

        .statCard {
            min-width: 0;
            padding: 10px 5px;
            border-radius: 11px;
            text-align: center;
        }

        .statIcon { font-size: 1.1rem; }
        .statLabel {
            margin-top: 5px;
            font-size: .48rem;
            letter-spacing: .25px;
            white-space: nowrap;
        }
        .statValue {
            margin-top: 2px;
            font-size: .82rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .intro {
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 12px;
        }

        .introTitle { font-size: 1.05rem; margin-bottom: 8px; }
        .welcomeText { font-size: .84rem; line-height: 1.45; }
        .welcomeText :global(p) { margin: .55em 0; }

        .nflBanner {
            min-height: 48px;
            gap: 7px;
            padding: 8px 12px;
            margin-bottom: 14px;
            border-radius: 10px;
        }
        .nflLabel { font-size: .58rem; }
        .nflWeek { font-size: .88rem; }

        .sectionTitle {
            margin: 18px 2px 9px;
            font-size: 1.2rem;
        }

        .navigation {
            grid-template-columns: repeat(2, minmax(0,1fr));
            gap: 7px;
        }

        .navCard {
            display: flex;
            align-items: center;
            gap: 9px;
            min-height: 54px;
            box-sizing: border-box;
            padding: 9px 10px;
            border-radius: 11px;
        }

        .navIcon {
            width: 29px;
            margin: 0;
            flex-shrink: 0;
            text-align: center;
            font-size: 1.3rem;
        }

        .navTitle {
            min-width: 0;
            font-size: .82rem;
            font-weight: 800;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .navDescription { display: none; }

        .contentGrid { gap: 10px; }
        .contentGrid > aside { order: -1; }

        .panel {
            padding: 13px;
            margin-bottom: 12px;
            border-radius: 12px;
        }
        .panelTitle { margin-bottom: 10px; font-size: 1.05rem; }

        #currentChamp {
            display: grid;
            grid-template-columns: 72px minmax(0,1fr);
            grid-template-rows: auto auto auto;
            align-items: center;
            column-gap: 10px;
            padding: 12px;
            margin-bottom: 2px;
            text-align: left;
        }

        #currentChamp .champTitle { grid-column: 2; grid-row: 1; margin: 0; font-size: .98rem; }
        #currentChamp .champYear { grid-column: 2; grid-row: 2; font-size: .72rem; }
        #currentChamp .champTeam { grid-column: 2; grid-row: 3; font-size: 1rem; }
        #champ {
            grid-column: 1;
            grid-row: 1 / 4;
            width: 70px;
            height: 70px;
            margin: 0;
        }
        .first { width: 42px; height: 42px; }
        .laurel { width: 68px; }
    }

    @media (max-width: 370px) {
        .dashboard { padding-left: 7px; padding-right: 7px; }
        .heroBrand { font-size: .72rem; }
        .navCard { gap: 6px; padding-left: 7px; padding-right: 7px; }
        .navIcon { width: 25px; font-size: 1.15rem; }
        .navTitle { font-size: .74rem; }
        .statLabel { font-size: .43rem; }
    }
</style>

<div id="home">
    <main class="dashboard">
        <section class="hero">
            <div class="heroTop">
                <div class="heroBrand">{leagueName} Fantasy Football League Hub</div>
            </div>
        </section>

        <section class="stats">
            <div class="statCard">
                <div class="statIcon">👥</div>
                <div class="statLabel">Teams</div>
                <div class="statValue">{managers.length || '—'}</div>
            </div>
            <div class="statCard">
                <div class="statIcon">💰</div>
                <div class="statLabel">Dues</div>
                <div class="statValue">${dues}</div>
            </div>
            <div class="statCard">
                <div class="statIcon">🏈</div>
                <div class="statLabel">NFL</div>
                <div class="statValue">
                    {#await nflState}
                        ...
                    {:then state}
                        {state.season_type === 'regular' ? `Wk ${state.week}` : state.season_type === 'pre' ? 'Pre' : 'Post'}
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

        <section class="intro">
            <div class="introTitle">Welcome to {leagueName}</div>
            <div class="welcomeText">{@html homepageText}</div>
        </section>

        <section class="nflBanner">
            <div class="nflLabel">NFL Status</div>
            {#await nflState}
                <div class="nflWeek">Retrieving NFL state...</div>
                <LinearProgress indeterminate />
            {:then nflStateData}
                <div class="nflWeek">
                    NFL {nflStateData.season}
                    {#if nflStateData.season_type == 'pre'}— Preseason{:else if nflStateData.season_type == 'post'}— Postseason{:else}— Week {nflStateData.week}{/if}
                </div>
            {:catch}
                <div class="nflWeek">Unable to retrieve NFL status</div>
            {/await}
        </section>

        <h2 class="sectionTitle">League Center</h2>
        <section class="navigation">
            {#each navigation as item}
                <a class="navCard" href={item.href}>
                    <div class="navIcon">{item.icon}</div>
                    <div>
                        <div class="navTitle">{item.title}</div>
                        <div class="navDescription">{item.description}</div>
                    </div>
                </a>
            {/each}
        </section>

        <h2 class="sectionTitle">League Highlights</h2>
        <section class="contentGrid">
            <div>
                <div class="panel">
                    <div class="panelTitle">🔥 Power Rankings</div>
                    <PowerRankings />
                </div>

                <div class="panel">
                    <div class="panelTitle">🔄 Recent Transactions</div>
                    <Transactions />
                </div>
            </div>

            <aside>
                <div id="currentChamp">
                    {#await waitForAll(podiumsData, leagueTeamManagersData)}
                        <p>Retrieving league history...</p>
                        <LinearProgress indeterminate />
                    {:then [podiums, leagueTeamManagers]}
                        {#if podiums[0]}
                            <div class="champTitle">🏆 Defending Champion</div>
                            <div class="champYear">{podiums[0].year} Champion</div>
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
                                    src={getAvatarFromTeamManagers(leagueTeamManagers, podiums[0].champion, podiums[0].year)}
                                    class="first"
                                    alt="champion"
                                />
                                <img src="/laurel.png" class="laurel" alt="champion laurel" />
                            </div>
                            <div
                                class="champTeam"
                                onclick={() => gotoManager({
                                    year: podiums[0].year,
                                    leagueTeamManagers,
                                    rosterID: parseInt(podiums[0].champion)
                                })}
                            >
                                {getTeamFromTeamManagers(leagueTeamManagers, podiums[0].champion, podiums[0].year).name}
                            </div>
                        {:else}
                            <p>No former champions.</p>
                        {/if}
                    {:catch}
                        <p>Unable to retrieve championship history.</p>
                    {/await}
                </div>
            </aside>
        </section>
    </main>
</div>