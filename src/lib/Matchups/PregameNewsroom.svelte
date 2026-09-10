<script>
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { matchupInjurySentence } from './injuryStoryUtils.js';
    import { favoriteTeamStory } from './favoriteTeamStoryUtils.js';

    export let matchupArray = [];
    export let matchupWeeks = [];
    export let displayWeek;
    export let players = {};
    export let year;
    export let leagueTeamManagers;

    const n = (value) => Number(round(Number(value) || 0));
    const sum = (values = []) => values.reduce((total, value) => total + (Number(value) || 0), 0);
    const team = (id) => { try { return getTeamFromTeamManagers(leagueTeamManagers, Number(id), year) || { name: `Team ${id}` }; } catch (error) { return { name: `Team ${id}` }; } };
    const proj = (entry) => (entry?.starters || []).reduce((total, id) => { const value = Number(players?.[id]?.wi?.[displayWeek]?.p); return total + (Number.isFinite(value) ? value : 0); }, 0);
    const game = (id, weekNumber) => { const weekData = (matchupWeeks || []).find((item) => Number(item?.week) === Number(weekNumber))?.matchups || {}; for (const matchup of Object.values(weekData)) { if (!Array.isArray(matchup) || matchup.length < 2) continue; const current = matchup.find((entry) => Number(entry?.roster_id) === Number(id)); if (!current) continue; return { team: current, opp: matchup.find((entry) => Number(entry?.roster_id) !== Number(id)) }; } return null; };
    const hist = (id, through = Number(displayWeek) - 1) => { let wins = 0, losses = 0, pointsFor = 0; const results = []; for (let weekNumber = 1; weekNumber <= through; weekNumber++) { const result = game(id, weekNumber); if (!result?.team || !result?.opp) continue; const teamPoints = sum(result.team.points), opponentPoints = sum(result.opp.points); pointsFor += teamPoints; if (teamPoints > opponentPoints) { wins++; results.push('W'); } else if (teamPoints < opponentPoints) { losses++; results.push('L'); } else results.push('T'); } const type = results.length ? results[results.length - 1] : null; let streak = 0; for (let index = results.length - 1; index >= 0; index--) { if (results[index] !== type) break; streak++; } return { w: wins, l: losses, pf: pointsFor, g: results.length, ppg: results.length ? pointsFor / results.length : 0, streak, type }; };
    const standings = () => { const ids = new Set(); for (const matchup of matchupArray || []) for (const entry of matchup || []) if (entry?.roster_id != null) ids.add(Number(entry.roster_id)); return [...ids].map((id) => ({ id, ...hist(id) })).sort((a, b) => { const aPct = a.g ? a.w / a.g : 0, bPct = b.g ? b.w / b.g : 0; if (bPct !== aPct) return bPct - aPct; return b.pf - a.pf; }).map((entry, index) => ({ ...entry, rank: index + 1 })); };
    const priorMeeting = (rosterOne, rosterTwo) => { for (let weekNumber = Number(displayWeek) - 1; weekNumber >= 1; weekNumber--) { const result = game(rosterOne, weekNumber); if (!result?.opp || Number(result.opp.roster_id) !== Number(rosterTwo)) continue; const onePoints = sum(result.team.points), twoPoints = sum(result.opp.points); return { week: weekNumber, winner: onePoints > twoPoints ? rosterOne : twoPoints > onePoints ? rosterTwo : null, margin: n(Math.abs(onePoints - twoPoints)) }; } return null; };

    const build = () => {
        if (Number(displayWeek) < 2) return [];
        const st = standings(), stories = [], ppgValues = st.map((entry) => entry.ppg).sort((a, b) => a - b), medianPpg = ppgValues[Math.floor(ppgValues.length / 2)] || 0, maxPpg = st.length ? Math.max(...st.map((entry) => entry.ppg)) : 0;
        let gameOfWeek = null, bestScore = -Infinity;
        for (const matchup of matchupArray || []) {
            const a = matchup?.[0], b = matchup?.[1]; if (!a || !b) continue;
            const A = team(a.roster_id), B = team(b.roster_id), aHistory = hist(a.roster_id), bHistory = hist(b.roster_id), aRank = st.find((entry) => entry.id === Number(a.roster_id))?.rank || 99, bRank = st.find((entry) => entry.id === Number(b.roster_id))?.rank || 99, aProjection = n(proj(a)), bProjection = n(proj(b)), meeting = priorMeeting(a.roster_id, b.roster_id), injuryText = matchupInjurySentence(a, b, players, displayWeek, A.name, B.name, 'pregame');
            const loyalty = favoriteTeamStory(a, b, players, displayWeek, 'pregame');
            if (loyalty) stories.push({ p: 9, label: loyalty.label, text: loyalty.text });
            let score = 20 - Math.abs(aProjection - bProjection) + Math.max(0, 12 - (aRank + bRank)); if (meeting) score += 5;
            if (score > bestScore) { bestScore = score; gameOfWeek = { label: '🏆 Game of the Week', text: `${A.name} vs ${B.name} has all the ingredients for chaos. The projection sits at ${aProjection}-${bProjection}${meeting ? `, and these two already have unfinished business from Week ${meeting.week}` : ''}. One big performance could turn this into the matchup everyone talks about when Week ${displayWeek} is over.` + injuryText }; }
            if (meeting?.winner) { const winner = Number(meeting.winner) === Number(a.roster_id) ? A : B, loser = Number(meeting.winner) === Number(a.roster_id) ? B : A; stories.push({ p: 8, label: '🔥 Revenge Game', text: `${loser.name} gets another crack at ${winner.name} after taking a ${meeting.margin}-point loss in Week ${meeting.week}. This one has revenge written all over it, and another loss would make the first meeting sting even more.` }); stories.push({ p: 6, label: '🧹 Season Sweep Watch', text: `${winner.name} already drew blood once this season. Beat ${loser.name} again and the sweep is complete — no excuses, no split, just total ownership of the matchup.` }); }
            const hotCold = (aHistory.type === 'W' && aHistory.streak >= 2 && bHistory.type === 'L' && bHistory.streak >= 2) || (bHistory.type === 'W' && bHistory.streak >= 2 && aHistory.type === 'L' && aHistory.streak >= 2); if (hotCold) { const hot = aHistory.type === 'W' ? A : B, cold = aHistory.type === 'L' ? A : B, hotStreak = aHistory.type === 'W' ? aHistory.streak : bHistory.streak, coldStreak = aHistory.type === 'L' ? aHistory.streak : bHistory.streak; stories.push({ p: 7, label: '📈 Hot vs. Cold', text: `${hot.name} comes in riding a ${hotStreak}-game winning streak while ${cold.name} has dropped ${coldStreak} straight. One team is rolling. The other is desperate to stop the bleeding.` }); }
            const giantKiller = (aRank <= 2 && bRank >= st.length - 2) || (bRank <= 2 && aRank >= st.length - 2); if (giantKiller) { const giant = aRank <= 2 ? A : B, killer = aRank <= 2 ? B : A; stories.push({ p: 7, label: '👑 Giant Killer Opportunity', text: `${killer.name} gets a shot at one of the league's heavyweights in ${giant.name}. Pull this off and the standings do not just move — the whole league starts paying attention.` }); }
            if (aHistory.g >= 2 && bHistory.g >= 2 && maxPpg > 0) { const averagePpg = (aHistory.ppg + bHistory.ppg) / 2; if (averagePpg >= maxPpg * 0.88) stories.push({ p: 5, label: '💣 Shootout Alert', text: `${A.name} and ${B.name} are bringing serious firepower into this one. If both offenses hit, the scoreboard could get ridiculous in a hurry.` }); }
            if (aRank >= st.length - 1 && bRank >= st.length - 1) stories.push({ p: 5, label: '🗑️ Toilet Bowl Alert', text: `${A.name} and ${B.name} meet near the basement of the standings. Pride is on the line, and somebody is about to leave this week feeling a whole lot worse.` });
            const odd = [{ history: aHistory, team: A, rank: aRank }, { history: bHistory, team: B, rank: bRank }].find((entry) => entry.history.g >= 3 && ((entry.rank <= 3 && entry.history.ppg < medianPpg) || (entry.rank >= st.length - 2 && entry.history.ppg > medianPpg))); if (odd) stories.push({ p: 4, label: '🎯 Prove-It Game', text: `${odd.team.name}'s record and scoring profile are telling two completely different stories. Week ${displayWeek} is another chance to prove whether this team is real or living on borrowed time.` });
        }
        return [gameOfWeek, ...stories.sort((a, b) => b.p - a.p).slice(0, 3)].filter(Boolean);
    };
    $: stories = build();
</script>
<style>.box{width:95%;max-width:900px;margin:-12px auto 24px;display:grid;gap:10px}.story{padding:14px 16px;border:1px solid var(--ccc);border-radius:14px;background:var(--fff);box-shadow:0 4px 14px rgba(0,0,0,.06)}.label{font-size:.72rem;font-weight:850;letter-spacing:.5px;text-transform:uppercase;opacity:.65;margin-bottom:5px}.text{font-size:.9rem;line-height:1.5;font-weight:600}@media(max-width:600px){.box{width:100%}.text{font-size:.82rem}}</style>
{#if stories.length}<section class="box">{#each stories as story}<div class="story"><div class="label">{story.label}</div><div class="text">{story.text}</div></div>{/each}</section>{/if}
