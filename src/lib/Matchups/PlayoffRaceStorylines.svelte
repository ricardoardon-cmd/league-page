<script>
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let matchupArray = [];
    export let matchupWeeks = [];
    export let displayWeek;
    export let year;
    export let playoffTeams = 0;
    export let regularSeasonLength = 0;
    export let leagueTeamManagers;

    const START_WEEK = 7;
    const numericRound = (value) => Number(round(Number(value) || 0));
    const sum = (values = []) => values.reduce((total, value) => total + (Number(value) || 0), 0);

    const safeTeam = (rosterID) => {
        try { return getTeamFromTeamManagers(leagueTeamManagers, Number(rosterID), year); }
        catch (error) { return { name: `Team ${rosterID}` }; }
    };

    const standingsBeforeWeek = () => {
        const stats = new Map();
        const ensure = (id) => {
            if (!stats.has(id)) stats.set(id, { rosterID:id, wins:0, losses:0, ties:0, pointsFor:0 });
            return stats.get(id);
        };

        for (const weekData of matchupWeeks || []) {
            if (Number(weekData?.week) >= Number(displayWeek)) continue;
            for (const matchup of Object.values(weekData?.matchups || {})) {
                if (!Array.isArray(matchup) || matchup.length < 2) continue;
                const one = matchup[0], two = matchup[1];
                const a = ensure(Number(one.roster_id)), b = ensure(Number(two.roster_id));
                const ap = sum(one?.points || []), bp = sum(two?.points || []);
                a.pointsFor += ap; b.pointsFor += bp;
                if (ap > bp) { a.wins++; b.losses++; }
                else if (bp > ap) { b.wins++; a.losses++; }
                else { a.ties++; b.ties++; }
            }
        }

        return [...stats.values()].map((team) => {
            const games = team.wins + team.losses + team.ties;
            return {...team, games, winPct:games ? (team.wins + team.ties / 2) / games : 0};
        }).sort((a,b) => b.winPct-a.winPct || b.pointsFor-a.pointsFor)
          .map((team,index) => ({...team, rank:index+1}));
    };

    const record = (team) => team.ties ? `${team.wins}-${team.losses}-${team.ties}` : `${team.wins}-${team.losses}`;

    const buildStories = () => {
        const weekNumber = Number(displayWeek);
        const seasonLength = Number(regularSeasonLength || 0);
        if (weekNumber < START_WEEK || (seasonLength && weekNumber > seasonLength)) return [];

        const standings = standingsBeforeWeek();
        if (!standings.length) return [];
        const slots = Number(playoffTeams || Math.ceil(standings.length / 2));
        const cutoff = standings[Math.min(slots - 1, standings.length - 1)];
        const stories = [];

        for (const matchup of matchupArray || []) {
            if (!Array.isArray(matchup) || matchup.length < 2) continue;
            const one = standings.find(t => Number(t.rosterID) === Number(matchup[0]?.roster_id));
            const two = standings.find(t => Number(t.rosterID) === Number(matchup[1]?.roster_id));
            if (!one || !two) continue;
            const oneTeam = safeTeam(one.rosterID), twoTeam = safeTeam(two.rosterID);

            if (Math.abs(one.rank - two.rank) <= 1 && Math.max(one.rank,two.rank) >= Math.max(2,slots-1) && Math.min(one.rank,two.rank) <= slots+2) {
                stories.push({priority:4,label:'⚔️ Separation Game',text:`${oneTeam.name} (${record(one)}) and ${twoTeam.name} (${record(two)}) enter Week ${weekNumber} side by side in the standings. This one could directly reshape the playoff race.`});
                continue;
            }

            const outside = [one,two].filter(t => t.rank > slots).sort((a,b) => a.rank-b.rank)[0];
            if (outside && outside.rank <= slots+3) {
                const team = safeTeam(outside.rosterID);
                const gamesBack = cutoff ? numericRound(Math.max(0,(cutoff.winPct-outside.winPct)*Math.max(outside.games,1))) : 0;
                const late = seasonLength ? weekNumber >= seasonLength-3 : weekNumber >= 10;
                stories.push({priority:late?5:3,label:late?'🚨 Must-Win Territory':'🔥 Playoff Push',text:late ? `${team.name} enters Week ${weekNumber} at ${record(outside)}, sitting ${outside.rank}th and ${gamesBack || 'less than one'} game${gamesBack===1?'':'s'} off the playoff pace. A loss here could leave the season on life support.` : `${team.name} enters Week ${weekNumber} at ${record(outside)} and ${outside.rank}th in the standings. A win here would keep the pressure on the teams sitting above the playoff line.`});
            }
        }

        if (!stories.length) {
            const outside = standings.find(t => t.rank === slots+1);
            if (outside) {
                const team = safeTeam(outside.rosterID);
                stories.push({priority:2,label:'👀 On the Bubble',text:`${team.name} enters Week ${weekNumber} at ${record(outside)}, sitting first outside the playoff field. Every win is becoming more valuable as the postseason race tightens.`});
            }
        }

        return stories.sort((a,b) => b.priority-a.priority).slice(0,2);
    };

    $: stories = buildStories();
</script>

<style>
    .storyBox{width:95%;max-width:900px;margin:-12px auto 24px;display:grid;gap:10px;box-sizing:border-box}.story{padding:14px 16px;border:1px solid var(--ccc);border-radius:14px;background:var(--fff);box-shadow:0 4px 14px rgba(0,0,0,.06)}.label{font-size:.72rem;font-weight:850;letter-spacing:.5px;text-transform:uppercase;opacity:.65;margin-bottom:5px}.text{font-size:.9rem;line-height:1.5;font-weight:600}@media(max-width:600px){.storyBox{width:100%}.story{padding:13px}.text{font-size:.82rem}}
</style>

{#if stories.length}
    <section class="storyBox">
        {#each stories as story}
            <div class="story"><div class="label">{story.label}</div><div class="text">{story.text}</div></div>
        {/each}
    </section>
{/if}
