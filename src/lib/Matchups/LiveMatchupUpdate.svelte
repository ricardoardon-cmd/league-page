<script>
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let matchupArray = [];
    export let players = {};
    export let displayWeek;
    export let year;
    export let leagueTeamManagers;

    const numericRound = (value) => Number(round(Number(value) || 0));
    const sum = (values = []) => values.reduce((total, value) => total + (Number(value) || 0), 0);
    const actual = (entry) => numericRound(sum(entry?.points || []));

    const safeTeam = (rosterID) => {
        try {
            return getTeamFromTeamManagers(leagueTeamManagers, Number(rosterID), year);
        } catch (error) {
            return { name: `Team ${rosterID}` };
        }
    };

    const projection = (entry) => numericRound(
        (entry?.starters || []).reduce((total, playerID) => {
            const value = Number(players?.[playerID]?.wi?.[displayWeek]?.p);
            return total + (Number.isFinite(value) ? value : 0);
        }, 0)
    );

    const playerName = (playerID) => {
        const player = players?.[playerID];
        if (!player) return `Player ${playerID}`;
        if (player.pos === 'DEF') return player.ln || player.fn || String(playerID).toUpperCase();
        return `${player.fn || ''} ${player.ln || ''}`.trim() || `Player ${playerID}`;
    };

    const topScorer = (entry) => {
        const starters = entry?.starters || [];
        const points = entry?.points || [];
        let best = null;
        starters.forEach((playerID, index) => {
            const score = Number(points[index] || 0);
            if (!playerID || playerID == 0 || score <= 0) return;
            if (!best || score > best.points) best = { name: playerName(playerID), points: numericRound(score) };
        });
        return best;
    };

    const makeUpdate = (matchup) => {
        const one = matchup?.[0];
        const two = matchup?.[1];
        if (!one || !two) return null;

        const teamOne = safeTeam(one.roster_id);
        const teamTwo = safeTeam(two.roster_id);
        const scoreOne = actual(one);
        const scoreTwo = actual(two);
        const projectionOne = projection(one);
        const projectionTwo = projection(two);
        const leader = scoreOne === scoreTwo ? null : scoreOne > scoreTwo ? teamOne : teamTwo;
        const lead = numericRound(Math.abs(scoreOne - scoreTwo));
        const topOne = topScorer(one);
        const topTwo = topScorer(two);
        const top = !topOne ? topTwo : !topTwo ? topOne : topOne.points >= topTwo.points ? topOne : topTwo;

        return {
            teamOne,
            teamTwo,
            scoreOne,
            scoreTwo,
            projectionOne,
            projectionTwo,
            top,
            text: leader
                ? `${leader.name} currently leads by ${lead} points. ${top ? `${top.name} is the matchup's top scorer so far with ${top.points}.` : ''}`
                : `${teamOne.name} and ${teamTwo.name} are currently tied. ${top ? `${top.name} is the matchup's top scorer so far with ${top.points}.` : ''}`
        };
    };

    $: updates = (matchupArray || []).map(makeUpdate).filter(Boolean);
    $: highest = updates.flatMap((item) => [
        { team: item.teamOne, points: item.scoreOne },
        { team: item.teamTwo, points: item.scoreTwo }
    ]).sort((a, b) => b.points - a.points)[0];
    $: closest = [...updates].sort((a, b) => Math.abs(a.scoreOne - a.scoreTwo) - Math.abs(b.scoreOne - b.scoreTwo))[0];
</script>

<style>
    .liveCard { width:95%; max-width:900px; margin:0 auto 24px; padding:20px; box-sizing:border-box; border:1px solid var(--ccc); border-radius:16px; background:var(--fff); box-shadow:0 4px 14px rgba(0,0,0,.06); }
    .header { text-align:center; margin-bottom:16px; }
    .eyebrow { font-size:.72rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; opacity:.55; }
    h4 { margin:5px 0 0; font-size:1.35rem; }
    .sub { margin-top:5px; font-size:.7rem; opacity:.55; }
    .summary { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
    .summaryItem { padding:12px; border-radius:12px; background:var(--f3f3f3); text-align:center; }
    .label { font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.4px; opacity:.55; }
    .value { margin-top:4px; font-size:.86rem; font-weight:850; }
    .games { display:grid; gap:10px; }
    .game { padding:13px 14px; border-radius:12px; background:var(--f3f3f3); }
    .scoreLine { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr); align-items:center; gap:8px; font-weight:850; }
    .teamOne { text-align:right; min-width:0; }
    .teamTwo { text-align:left; min-width:0; }
    .score { white-space:nowrap; font-size:1.05rem; }
    .projections { margin-top:5px; text-align:center; font-size:.67rem; opacity:.55; }
    .note { margin-top:8px; text-align:center; font-size:.78rem; line-height:1.4; }
    @media(max-width:600px) { .liveCard { width:100%; padding:15px 12px; } .scoreLine { font-size:.8rem; } .score { font-size:.95rem; } .note { font-size:.73rem; } }
</style>

{#if updates.length}
    <section class="liveCard">
        <div class="header">
            <div class="eyebrow">Live Week {displayWeek} Update</div>
            <h4>🏈 Matchups In Progress</h4>
            <div class="sub">Refreshes from Sleeper scoring whenever this page is loaded</div>
        </div>

        <div class="summary">
            <div class="summaryItem">
                <div class="label">Highest Score So Far</div>
                <div class="value">{highest?.team?.name || '—'} · {highest?.points ?? 0}</div>
            </div>
            <div class="summaryItem">
                <div class="label">Closest Game</div>
                <div class="value">{closest ? numericRound(Math.abs(closest.scoreOne - closest.scoreTwo)) : 0} pts</div>
            </div>
        </div>

        <div class="games">
            {#each updates as item}
                <div class="game">
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
{/if>