<script>
    import { onMount } from 'svelte';
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let matchupArray = [];
    export let players = {};
    export let displayWeek;
    export let year;
    export let leagueTeamManagers;

    let playerSpotlightLabel = 'Player Of The Night';

    onMount(() => {
        const updatePlayerSpotlightLabel = () => {
            const now = new Date();
            const isSundayDaytime = now.getDay() === 0 && now.getHours() >= 9 && now.getHours() < 17;
            playerSpotlightLabel = isSundayDaytime ? 'Player Of The Day' : 'Player Of The Night';
        };

        updatePlayerSpotlightLabel();
        const timer = setInterval(updatePlayerSpotlightLabel, 60000);
        return () => clearInterval(timer);
    });

    const numericRound = (v) => Number(round(Number(v) || 0));
    const sum = (v = []) => v.reduce((t, n) => t + (Number(n) || 0), 0);
    const actual = (e) => numericRound(sum(e?.points || []));

    const safeTeam = (id) => {
        try {
            return getTeamFromTeamManagers(leagueTeamManagers, Number(id), year);
        } catch (e) {
            return { name: `Team ${id}` };
        }
    };

    const projection = (e) => numericRound(
        (e?.starters || []).reduce((t, id) => {
            const v = Number(players?.[id]?.wi?.[displayWeek]?.p);
            return t + (Number.isFinite(v) ? v : 0);
        }, 0)
    );

    const playerName = (id) => {
        const p = players?.[id];
        if (!p) return `Player ${id}`;
        if (p.pos === 'DEF') return p.ln || p.fn || String(id).toUpperCase();
        return `${p.fn || ''} ${p.ln || ''}`.trim() || `Player ${id}`;
    };

    const topScorer = (e) => {
        const s = e?.starters || [];
        const pts = e?.points || [];
        let best = null;

        s.forEach((id, i) => {
            const score = Number(pts[i] || 0);
            if (!id || id == 0 || score <= 0) return;
            if (!best || score > best.points) {
                best = { name: playerName(id), points: numericRound(score) };
            }
        });

        return best;
    };

    const projectedFavorite = (one, two) => {
        if (one.projection === two.projection) return null;
        return one.projection > two.projection ? one : two;
    };

    const currentLeader = (one, two) => {
        if (one.score === two.score) return null;
        return one.score > two.score ? one : two;
    };

    const makeAnalysis = (one, two, top) => {
        const leader = currentLeader(one, two);
        const favorite = projectedFavorite(one, two);
        const margin = numericRound(Math.abs(one.score - two.score));
        const projectedMargin = numericRound(Math.abs(one.projection - two.projection));
        const totalScored = one.score + two.score;

        if (!leader) {
            const topText = top
                ? ` ${top.name} is setting the pace with ${top.points} points.`
                : '';
            return {
                tag: '⚔️ DEAD EVEN',
                tone: 'close',
                text: `${one.team.name} and ${two.team.name} are tied right now.${topText} This one is still completely up for grabs.`
            };
        }

        const trailing = leader === one ? two : one;
        const isUpset = favorite && favorite !== leader && projectedMargin >= 3;
        const isBigLead = margin >= 20;
        const isClose = margin <= 7;
        const isVeryEarly = totalScored < 35;
        const topText = top ? ` ${top.name} leads all starters in this matchup with ${top.points}.` : '';

        if (isUpset) {
            return {
                tag: '🚨 UPSET WATCH',
                tone: 'upset',
                text: `${leader.team.name} has flipped the script and leads by ${margin}, despite entering the week as the projected underdog by ${projectedMargin}.${topText} ${isVeryEarly ? 'It is still early, but the favorite is already playing from behind.' : 'The pregame favorite now has work to do to regain control.'}`
            };
        }

        if (isBigLead) {
            return {
                tag: '🔥 TAKING CONTROL',
                tone: 'hot',
                text: `${leader.team.name} has opened a ${margin}-point advantage and is beginning to separate from ${trailing.team.name}.${topText} ${favorite === leader ? 'The projected favorite is backing up the pregame numbers so far.' : 'The early scoreboard has moved well beyond the pregame expectation.'}`
            };
        }

        if (isClose) {
            return {
                tag: '⚔️ GAME TO WATCH',
                tone: 'close',
                text: `Only ${margin} points separate ${leader.team.name} and ${trailing.team.name}.${topText} ${favorite ? `${favorite.team.name} held the pregame projection edge by ${projectedMargin}, but this matchup is currently a toss-up.` : 'The projections were even, and the live score is matching that expectation.'}`
            };
        }

        return {
            tag: '📈 EARLY EDGE',
            tone: 'normal',
            text: `${leader.team.name} owns a ${margin}-point lead over ${trailing.team.name}.${topText} ${favorite === leader ? `That follows the pregame projection, which favored ${leader.team.name} by ${projectedMargin}.` : favorite ? `${favorite.team.name} was projected to win by ${projectedMargin}, so the live result is currently running against expectation.` : 'The matchup remains wide open.'}`
        };
    };

    const makeUpdate = (m) => {
        const rawOne = m?.[0];
        const rawTwo = m?.[1];
        if (!rawOne || !rawTwo) return null;

        const one = {
            team: safeTeam(rawOne.roster_id),
            score: actual(rawOne),
            projection: projection(rawOne)
        };

        const two = {
            team: safeTeam(rawTwo.roster_id),
            score: actual(rawTwo),
            projection: projection(rawTwo)
        };

        const a = topScorer(rawOne);
        const b = topScorer(rawTwo);
        const top = !a ? b : !b ? a : a.points >= b.points ? a : b;
        const analysis = makeAnalysis(one, two, top);

        return {
            teamOne: one.team,
            teamTwo: two.team,
            scoreOne: one.score,
            scoreTwo: two.score,
            projectionOne: one.projection,
            projectionTwo: two.projection,
            top,
            ...analysis
        };
    };

    $: updates = (matchupArray || []).map(makeUpdate).filter(Boolean);
    $: highest = updates
        .flatMap((i) => [
            { team: i.teamOne, points: i.scoreOne },
            { team: i.teamTwo, points: i.scoreTwo }
        ])
        .sort((a, b) => b.points - a.points)[0];
    $: closest = [...updates].sort(
        (a, b) => Math.abs(a.scoreOne - a.scoreTwo) - Math.abs(b.scoreOne - b.scoreTwo)
    )[0];
    $: topPlayer = updates
        .map((i) => i.top)
        .filter(Boolean)
        .sort((a, b) => b.points - a.points)[0];
    $: upset = updates.find((i) => i.tone === 'upset');
</script>

<style>
    .liveCard {
        width: 95%;
        max-width: 900px;
        margin: 0 auto 24px;
        padding: 20px;
        box-sizing: border-box;
        border: 1px solid var(--ccc);
        border-radius: 16px;
        background: var(--fff);
        box-shadow: 0 4px 14px rgba(0, 0, 0, .06);
    }

    .header {
        text-align: center;
        margin-bottom: 16px;
    }

    .eyebrow {
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: .55;
    }

    h4 {
        margin: 5px 0 0;
        font-size: 1.35rem;
    }

    .sub {
        margin-top: 5px;
        font-size: .7rem;
        opacity: .55;
    }

    .summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 16px;
    }

    .summaryItem {
        padding: 12px;
        border-radius: 12px;
        background: var(--f3f3f3);
        text-align: center;
    }

    .label {
        font-size: .65rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .4px;
        opacity: .55;
    }

    .value {
        margin-top: 4px;
        font-size: .86rem;
        font-weight: 850;
    }

    .games {
        display: grid;
        gap: 10px;
    }

    .game {
        padding: 13px 14px;
        border-radius: 12px;
        background: var(--f3f3f3);
    }

    .analysisTag {
        margin-bottom: 9px;
        text-align: center;
        font-size: .62rem;
        font-weight: 900;
        letter-spacing: .65px;
        opacity: .72;
    }

    .scoreLine {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        font-weight: 850;
    }

    .teamOne {
        text-align: right;
        min-width: 0;
    }

    .teamTwo {
        text-align: left;
        min-width: 0;
    }

    .score {
        white-space: nowrap;
        font-size: 1.05rem;
    }

    .projections {
        margin-top: 5px;
        text-align: center;
        font-size: .67rem;
        opacity: .55;
    }

    .note {
        margin-top: 9px;
        text-align: center;
        font-size: .78rem;
        line-height: 1.45;
    }

    @media (max-width: 600px) {
        .liveCard {
            width: 100%;
            padding: 15px 12px;
        }

        .scoreLine {
            font-size: .8rem;
        }

        .score {
            font-size: .95rem;
        }

        .note {
            font-size: .73rem;
        }
    }
</style>

{#if updates.length}
    <section class="liveCard">
        <div class="header">
            <div class="eyebrow">Live Week {displayWeek} Analysis</div>
            <h4>🏈 Live League Analyst</h4>
            <div class="sub">Live scoring context powered by Sleeper data</div>
        </div>

        <div class="summary">
            <div class="summaryItem">
                <div class="label">🔥 Hot Start</div>
                <div class="value">{highest?.team?.name || '—'} · {highest?.points ?? 0}</div>
            </div>

            <div class="summaryItem">
                <div class="label">⚔️ Game To Watch</div>
                <div class="value">{closest ? `${closest.teamOne.name} vs ${closest.teamTwo.name}` : '—'}</div>
            </div>

            <div class="summaryItem">
                <div class="label">⭐ {playerSpotlightLabel}</div>
                <div class="value">{topPlayer ? `${topPlayer.name} · ${topPlayer.points}` : '—'}</div>
            </div>

            <div class="summaryItem">
                <div class="label">🚨 Upset Watch</div>
                <div class="value">{upset ? `${upset.teamOne.name} vs ${upset.teamTwo.name}` : 'None yet'}</div>
            </div>
        </div>

        <div class="games">
            {#each updates as item}
                <div class="game">
                    <div class="analysisTag">{item.tag}</div>
                    <div class="scoreLine">
                        <div class="teamOne">{item.teamOne.name}</div>
                        <div class="score">{item.scoreOne} – {item.scoreTwo}</div>
                        <div class="teamTwo">{item.teamTwo.name}</div>
                    </div>
                    <div class="projections">Pregame projection: {item.projectionOne} – {item.projectionTwo}</div>
                    <div class="note">{item.text}</div>
                </div>
            {/each}
        </div>
    </section>
{/if}
