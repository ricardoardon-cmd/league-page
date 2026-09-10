<script>
    import { onMount } from 'svelte';
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { matchupInjurySentence } from './injuryStoryUtils.js';

    export let matchupArray = [];
    export let players = {};
    export let displayWeek;
    export let year;
    export let leagueTeamManagers;

    let playerSpotlightLabel = 'Player Of The Night';
    let liveInjuries = {};

    const liveStarterIds = () => [...new Set(
        (matchupArray || [])
            .flatMap((matchup) => (matchup || []).flatMap((entry) => entry?.starters || []))
            .filter((id) => id && id != 0)
            .map(String)
    )];

    const refreshInjuries = async () => {
        try {
            const ids = liveStarterIds();
            const query = ids.length ? `&ids=${encodeURIComponent(ids.join(','))}` : '';
            const res = await fetch(`/api/player_injuries?t=${Date.now()}${query}`, { cache: 'no-store' });
            if (res.ok) liveInjuries = await res.json();
        } catch (error) {
            // Injury data should never stop the rest of the newsroom from rendering.
        }
    };

    onMount(() => {
        const updateLabel = () => {
            const now = new Date();
            playerSpotlightLabel = now.getDay() === 0 && now.getHours() >= 9 && now.getHours() < 17
                ? 'Player Of The Day'
                : 'Player Of The Night';
        };

        updateLabel();
        refreshInjuries();
        const labelTimer = setInterval(updateLabel, 60000);
        const injuryTimer = setInterval(refreshInjuries, 120000);

        return () => {
            clearInterval(labelTimer);
            clearInterval(injuryTimer);
        };
    });

    $: newsroomPlayers = (() => {
        const merged = { ...players };
        for (const [id, injury] of Object.entries(liveInjuries || {})) {
            merged[id] = { ...(players?.[id] || {}), ...injury };
        }
        return merged;
    })();

    const numericRound = (value) => Number(round(Number(value) || 0));
    const sum = (values = []) => values.reduce((total, value) => total + (Number(value) || 0), 0);
    const actual = (entry) => numericRound(sum(entry?.points || []));

    const safeTeam = (id) => {
        try {
            return getTeamFromTeamManagers(leagueTeamManagers, Number(id), year) || { name: `Team ${id}` };
        } catch (error) {
            return { name: `Team ${id}` };
        }
    };

    const projection = (entry) => numericRound(
        (entry?.starters || []).reduce((total, id) => {
            const value = Number(players?.[id]?.wi?.[displayWeek]?.p);
            return total + (Number.isFinite(value) ? value : 0);
        }, 0)
    );

    const playerName = (id) => {
        const player = players?.[id];
        if (!player) return `Player ${id}`;
        if (player.pos === 'DEF') return player.ln || player.fn || String(id).toUpperCase();
        return `${player.fn || ''} ${player.ln || ''}`.trim() || `Player ${id}`;
    };

    const starterPerformances = (entry) => {
        const starters = entry?.starters || [];
        const points = entry?.points || [];

        return starters
            .map((id, index) => {
                if (!id || id == 0) return null;
                const scored = Number(points[index] || 0);
                const projected = Number(players?.[id]?.wi?.[displayWeek]?.p) || 0;
                return {
                    id,
                    name: playerName(id),
                    points: numericRound(scored),
                    projection: numericRound(projected),
                    delta: numericRound(scored - projected)
                };
            })
            .filter(Boolean);
    };

    const topScorer = (entry) => [...starterPerformances(entry)].sort((a, b) => b.points - a.points)[0] || null;

    const bestPerformance = (entry) => [...starterPerformances(entry)]
        .filter((player) => player.points > 0)
        .sort((a, b) => b.delta - a.delta || b.points - a.points)[0] || null;

    const biggestDisappointment = (entry) => [...starterPerformances(entry)]
        .filter((player) => player.projection >= 8)
        .sort((a, b) => a.delta - b.delta)[0] || null;

    const performanceSentence = (entry, teamName) => {
        const best = bestPerformance(entry);
        const cold = biggestDisappointment(entry);
        const parts = [];

        if (best && best.delta >= 5) {
            parts.push(`${best.name} has given ${teamName} an early lift with ${best.points} points, already ${numericRound(best.delta)} above projection`);
        } else if (best && best.points >= 12) {
            parts.push(`${best.name} is carrying the scoring load for ${teamName} with ${best.points} points`);
        }

        if (cold && cold.points > 0 && cold.delta <= -8) {
            parts.push(`${cold.name} has yet to match expectations, sitting ${numericRound(Math.abs(cold.delta))} below projection`);
        }

        return parts.length ? `${parts.join(', while ')}.` : '';
    };

    const buildNarrative = (a, b, one, two, leader, trailer, favorite, margin, projectedMargin, isUpset, top) => {
        let tag = '📈 EARLY EDGE';
        let tone = 'normal';
        const paragraphs = [];
        const total = one.score + two.score;
        const isEarly = total < 35;

        if (!leader) {
            tag = '⚔️ DEAD EVEN';
            tone = 'close';
            paragraphs.push(`${one.team.name} and ${two.team.name} are deadlocked. With neither side able to create separation yet, this matchup is still waiting for somebody to take control.`);
        } else if (isUpset) {
            tag = '🚨 UPSET BREWING';
            tone = 'upset';
            paragraphs.push(`${leader.team.name} has turned the pregame script upside down. The ${projectedMargin}-point underdog currently owns a ${margin}-point advantage over ${favorite.team.name}${isEarly ? ', putting the favorite under pressure early' : ', and the upset threat is becoming very real'}.`);
        } else if (margin >= 30) {
            tag = '💥 BLOWOUT DEVELOPING';
            tone = 'blowout';
            paragraphs.push(`${leader.team.name} is running away with this one. A ${margin}-point lead has turned what began as a weekly matchup into the biggest kind of scoreboard pressure for ${trailer.team.name}.`);
        } else if (margin <= 5) {
            tag = '😬 LEAD IN DANGER';
            tone = 'close';
            paragraphs.push(`${leader.team.name} has the lead, but there is almost no breathing room. Only ${margin} points separate these teams, leaving ${trailer.team.name} one productive player swing away from taking control.`);
        } else if (favorite === trailer && margin >= 8) {
            tag = '🔥 COMEBACK WATCH';
            tone = 'comeback';
            paragraphs.push(`${trailer.team.name} entered the week with the projection advantage, but the scoreboard has created a different problem. The favorite now trails ${leader.team.name} by ${margin} and needs its remaining lineup to deliver a comeback.`);
        } else if (margin >= 20) {
            tag = '🔥 TAKING CONTROL';
            tone = 'hot';
            paragraphs.push(`${leader.team.name} is beginning to put distance between itself and ${trailer.team.name}. The lead has reached ${margin}, shifting the pressure almost entirely onto the trailing lineup.`);
        } else {
            paragraphs.push(`${leader.team.name} has moved in front of ${trailer.team.name} by ${margin}. ${favorite === leader ? 'That follows the pregame projection, but there is still enough room for this matchup to turn.' : 'That is running against the pregame projection and has the favorite chasing the scoreboard.'}`);
        }

        const leaderEntry = leader === one ? a : b;
        const trailerEntry = leader === one ? b : a;

        if (leader) {
            const leaderPerformance = performanceSentence(leaderEntry, leader.team.name);
            const trailerPerformance = performanceSentence(trailerEntry, trailer.team.name);
            if (leaderPerformance) paragraphs.push(leaderPerformance);
            else if (top?.points > 0) paragraphs.push(`${top.name} is the top-scoring starter in this matchup so far with ${top.points} points.`);
            if (trailerPerformance) paragraphs.push(trailerPerformance);
        } else if (top?.points > 0) {
            paragraphs.push(`${top.name} is setting the individual pace with ${top.points} points, but it has not been enough to separate the teams.`);
        }

        const injuryText = matchupInjurySentence(
            a,
            b,
            newsroomPlayers,
            displayWeek,
            one.team.name,
            two.team.name,
            'live'
        ).trim();

        if (injuryText) paragraphs.push(injuryText);

        if (leader && margin <= 10) {
            paragraphs.push(`For now, this stays firmly in the balance. ${leader.team.name} has the scoreboard edge, but ${trailer.team.name} is still close enough to flip the story with one strong performance.`);
        } else if (leader && margin >= 20) {
            paragraphs.push(`${trailer.team.name} needs a major swing from the players still to come, while ${leader.team.name} is in position to make the rest of the night about protecting the advantage.`);
        }

        return { tag, tone, text: paragraphs.join(' ') };
    };

    const makeUpdate = (matchup) => {
        const a = matchup?.[0];
        const b = matchup?.[1];
        if (!a || !b) return null;

        const one = { team: safeTeam(a.roster_id), score: actual(a), projection: projection(a) };
        const two = { team: safeTeam(b.roster_id), score: actual(b), projection: projection(b) };
        const topA = topScorer(a);
        const topB = topScorer(b);
        const top = !topA ? topB : !topB ? topA : topA.points >= topB.points ? topA : topB;
        const leader = one.score === two.score ? null : one.score > two.score ? one : two;
        const trailer = leader === one ? two : one;
        const favorite = one.projection === two.projection ? null : one.projection > two.projection ? one : two;
        const margin = numericRound(Math.abs(one.score - two.score));
        const projectedMargin = numericRound(Math.abs(one.projection - two.projection));
        const isUpset = leader && favorite && leader !== favorite && projectedMargin >= 3;
        const narrative = buildNarrative(a, b, one, two, leader, trailer, favorite, margin, projectedMargin, isUpset, top);

        return {
            teamOne: one.team,
            teamTwo: two.team,
            scoreOne: one.score,
            scoreTwo: two.score,
            projectionOne: one.projection,
            projectionTwo: two.projection,
            top,
            tag: narrative.tag,
            tone: narrative.tone,
            text: narrative.text,
            margin,
            leader,
            trailer,
            favorite,
            total: one.score + two.score
        };
    };

    $: updates = (matchupArray || []).map(makeUpdate).filter(Boolean);
    $: highest = updates.flatMap((item) => [
        { team: item.teamOne, points: item.scoreOne },
        { team: item.teamTwo, points: item.scoreTwo }
    ]).sort((a, b) => b.points - a.points)[0];
    $: closest = [...updates].sort((a, b) => a.margin - b.margin)[0];
    $: topPlayer = updates.map((item) => item.top).filter(Boolean).sort((a, b) => b.points - a.points)[0];
    $: upset = updates.find((item) => item.tone === 'upset');

    $: liveStories = (() => {
        const stories = [];
        if (upset) stories.push({ label: '🚨 Upset Brewing', text: `${upset.leader.team.name} is forcing projected favorite ${upset.favorite.team.name} to chase the scoreboard. If the favorite cannot find production from the rest of its lineup, this could become one of Week ${displayWeek}'s defining results.` });
        const blowout = [...updates].filter((item) => item.margin >= 30).sort((a, b) => b.margin - a.margin)[0];
        if (blowout) stories.push({ label: '💥 Blowout Developing', text: `${blowout.leader.team.name} owns the largest live advantage of the week at ${blowout.margin}. The question is shifting from who wins to whether ${blowout.trailer.team.name} can make the final margin respectable.` });
        const comeback = updates.find((item) => item.favorite && item.leader && item.favorite !== item.leader && item.margin >= 8);
        if (comeback) stories.push({ label: '🔥 Comeback Watch', text: `${comeback.favorite.team.name} was supposed to have the edge, but now needs to erase a ${comeback.margin}-point deficit. Its remaining starters have become the biggest comeback watch on the board.` });
        if (closest && closest.margin <= 7) stories.push({ label: '👀 One to Watch', text: `${closest.teamOne.name} and ${closest.teamTwo.name} are separated by only ${closest.margin}. No matchup has less margin for error right now.` });
        if (topPlayer && topPlayer.projection > 0 && topPlayer.points >= topPlayer.projection + 10) stories.push({ label: '🏆 Statement Performance', text: `${topPlayer.name} has already delivered ${topPlayer.points}, beating the pregame projection by ${numericRound(topPlayer.points - topPlayer.projection)} and changing the shape of the matchup.` });
        return stories.slice(0, 4);
    })();

    $: liveVerdict = (() => {
        if (!updates.length) return '';
        const sentences = [];
        if (highest) sentences.push(`${highest.team.name} currently owns the league's scoring pace at ${highest.points} points`);
        if (upset) sentences.push(`the biggest developing surprise is ${upset.leader.team.name} putting projected favorite ${upset.favorite.team.name} on upset watch`);
        if (closest && closest.margin <= 7) sentences.push(`${closest.teamOne.name} vs ${closest.teamTwo.name} remains the matchup with the least room for error`);
        if (!sentences.length) return `Week ${displayWeek} is still developing, with no single storyline taking over the league just yet.`;
        return `The Week ${displayWeek} picture is starting to take shape: ${sentences.join('; ')}. There is still football left, but those are the pressure points driving the GGL board right now.`;
    })();
</script>

<style>
    .liveCard { width: 95%; max-width: 900px; margin: 0 auto 24px; padding: 20px; box-sizing: border-box; border: 1px solid var(--ccc); border-radius: 16px; background: var(--fff); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
    .header { text-align: center; margin-bottom: 16px; }
    .eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; opacity: .72; }
    h4 { margin: 5px 0 0; font-size: 1.35rem; }
    .sub { margin-top: 5px; font-size: .7rem; opacity: .62; }
    .summary { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin-bottom: 16px; }
    .summaryItem, .story, .game { padding: 12px; border-radius: 12px; background: var(--f3f3f3); }
    .label { font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; opacity: .78; }
    .value { margin-top: 4px; font-size: .86rem; font-weight: 850; }
    .stories, .games { display: grid; gap: 10px; }
    .stories { margin-bottom: 16px; }
    .storyText { margin-top: 5px; font-size: .78rem; line-height: 1.55; font-weight: 600; }
    .analysisTag { margin-bottom: 9px; text-align: center; font-size: .65rem; font-weight: 900; letter-spacing: .7px; opacity: .95; color: var(--ddd); }
    .scoreLine { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); align-items: center; gap: 8px; font-weight: 900; color: var(--ddd); }
    .teamOne { text-align: right; }
    .teamTwo { text-align: left; }
    .score { white-space: nowrap; font-size: 1.05rem; color: var(--ddd); }
    .projections { margin-top: 5px; text-align: center; font-size: .67rem; opacity: .62; }
    .note { margin-top: 11px; text-align: left; font-size: .8rem; line-height: 1.6; }
    .verdict { margin-top: 16px; padding: 15px; border: 1px solid var(--ccc); border-radius: 12px; }
    .verdictTitle { font-size: .72rem; font-weight: 900; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
    .verdictText { font-size: .82rem; line-height: 1.55; font-weight: 600; }
    @media(max-width:600px) { .liveCard { width: 100%; padding: 15px 12px; } .scoreLine { font-size: .84rem; } .score { font-size: .98rem; } .note, .storyText { font-size: .74rem; } }
</style>

{#if updates.length}
<section class="liveCard">
    <div class="header">
        <div class="eyebrow">Live Week {displayWeek} Newsroom</div>
        <h4>📰 GGL Live Desk</h4>
        <div class="sub">The story changes as the Sleeper scoreboard changes</div>
    </div>
    <div class="summary">
        <div class="summaryItem"><div class="label">🔥 Hot Start</div><div class="value">{highest?.team?.name || '—'} · {highest?.points ?? 0}</div></div>
        <div class="summaryItem"><div class="label">⚔️ Game To Watch</div><div class="value">{closest ? `${closest.teamOne.name} vs ${closest.teamTwo.name}` : '—'}</div></div>
        <div class="summaryItem"><div class="label">⭐ {playerSpotlightLabel}</div><div class="value">{topPlayer ? `${topPlayer.name} · ${topPlayer.points}` : '—'}</div></div>
        <div class="summaryItem"><div class="label">🚨 Upset Watch</div><div class="value">{upset ? `${upset.leader.team.name} over ${upset.favorite.team.name}` : 'None yet'}</div></div>
    </div>
    {#if liveStories.length}
        <div class="stories">
            {#each liveStories as story}
                <div class="story"><div class="label">{story.label}</div><div class="storyText">{story.text}</div></div>
            {/each}
        </div>
    {/if}
    <div class="games">
        {#each updates as item}
            <div class="game">
                <div class="analysisTag">{item.tag}</div>
                <div class="scoreLine"><div class="teamOne">{item.teamOne.name}</div><div class="score">{item.scoreOne} – {item.scoreTwo}</div><div class="teamTwo">{item.teamTwo.name}</div></div>
                <div class="projections">Pregame projection: {item.projectionOne} – {item.projectionTwo}</div>
                <div class="note">{item.text}</div>
            </div>
        {/each}
    </div>
    {#if liveVerdict}
        <div class="verdict"><div class="verdictTitle">📰 Live Newsroom Pulse</div><div class="verdictText">{liveVerdict}</div></div>
    {/if}
</section>
{/if}
