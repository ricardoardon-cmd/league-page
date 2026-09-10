<script>
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let matchupWeeks = [];
    export let displayWeek;
    export let year;
    export let playoffTeams = 0;
    export let leagueTeamManagers;

    const TRADE_DEADLINE_WEEK = 11;
    const START_WEEK = 7;
    const numericRound = (value) => Number(round(Number(value) || 0));
    const sum = (values = []) => values.reduce((total, value) => total + (Number(value) || 0), 0);

    const safeTeam = (rosterID) => {
        try {
            return getTeamFromTeamManagers(leagueTeamManagers, Number(rosterID), year);
        } catch (error) {
            return { name: `Team ${rosterID}` };
        }
    };

    const standingsBeforeWeek = () => {
        const stats = new Map();
        const ensure = (id) => {
            if (!stats.has(id)) stats.set(id, { rosterID: id, wins: 0, losses: 0, ties: 0, pointsFor: 0 });
            return stats.get(id);
        };

        for (const weekData of matchupWeeks || []) {
            if (Number(weekData?.week) >= Number(displayWeek)) continue;

            for (const matchup of Object.values(weekData?.matchups || {})) {
                if (!Array.isArray(matchup) || matchup.length < 2) continue;
                const one = matchup[0];
                const two = matchup[1];
                const oneStats = ensure(Number(one.roster_id));
                const twoStats = ensure(Number(two.roster_id));
                const onePoints = sum(one?.points || []);
                const twoPoints = sum(two?.points || []);
                oneStats.pointsFor += onePoints;
                twoStats.pointsFor += twoPoints;

                if (onePoints > twoPoints) { oneStats.wins++; twoStats.losses++; }
                else if (twoPoints > onePoints) { twoStats.wins++; oneStats.losses++; }
                else { oneStats.ties++; twoStats.ties++; }
            }
        }

        return [...stats.values()]
            .map((team) => {
                const games = team.wins + team.losses + team.ties;
                return { ...team, games, winPct: games ? (team.wins + team.ties / 2) / games : 0 };
            })
            .sort((a, b) => b.winPct - a.winPct || b.pointsFor - a.pointsFor)
            .map((team, index) => ({ ...team, rank: index + 1 }));
    };

    const makeWatch = () => {
        const weekNumber = Number(displayWeek);
        if (weekNumber < START_WEEK || weekNumber > TRADE_DEADLINE_WEEK) return null;

        const standings = standingsBeforeWeek();
        if (!standings.length) return null;

        const slots = Number(playoffTeams || Math.ceil(standings.length / 2));
        const cutoff = standings[Math.min(slots - 1, standings.length - 1)];
        const candidates = standings
            .filter((team) => team.rank > slots && team.rank <= slots + 3)
            .map((team) => ({
                ...team,
                gamesBack: cutoff ? numericRound(Math.max(0, (cutoff.winPct - team.winPct) * Math.max(team.games, 1))) : 0
            }))
            .sort((a, b) => a.rank - b.rank || b.pointsFor - a.pointsFor);

        let target = candidates[0];
        if (!target) target = standings[Math.min(slots, standings.length - 1)];
        if (!target) return null;

        const team = safeTeam(target.rosterID);
        const record = target.ties ? `${target.wins}-${target.losses}-${target.ties}` : `${target.wins}-${target.losses}`;
        const position = target.rank <= slots ? 'inside the playoff picture' : `${target.rank}${target.rank === 1 ? 'st' : target.rank === 2 ? 'nd' : target.rank === 3 ? 'rd' : 'th'} in the standings`;

        if (weekNumber === 7) return { label: '🛒 Trade Watch', text: `${team.name} is ${record} and ${position}. With the Week 11 trade deadline on the horizon, this may be the time to start looking for a move that can strengthen the playoff push.` };
        if (weekNumber === 8) return { label: '🛒 Trade Watch', text: `${team.name} sits at ${record} and ${position}. The playoff race is taking shape, and a smart deal before the Week 11 deadline could make a difference.` };
        if (weekNumber === 9) return { label: '⚠️ Time to Make a Move', text: `${team.name} is ${record} and ${position}. With only two weeks until the trade deadline, standing pat is getting harder to justify.` };
        if (weekNumber === 10) return { label: '🚨 Deadline Pressure', text: `${team.name} enters the week ${record} and ${position}. The Week 11 deadline is almost here—if there is a move that can improve this roster, now is the time.` };
        return { label: '⏰ Last Call', text: `It is trade deadline week. ${team.name} is ${record} and ${position}. If there is one final deal that can improve the playoff outlook, the clock is running out.` };
    };

    $: watch = makeWatch();
</script>

<style>
    .watch { width:95%; max-width:900px; margin:-12px auto 24px; padding:14px 16px; box-sizing:border-box; border:1px solid var(--ccc); border-radius:14px; background:var(--fff); box-shadow:0 4px 14px rgba(0,0,0,.06); }
    .label { font-size:.72rem; font-weight:850; letter-spacing:.5px; text-transform:uppercase; opacity:.65; margin-bottom:5px; }
    .text { font-size:.9rem; line-height:1.5; font-weight:600; }
    @media(max-width:600px){ .watch{width:100%;padding:13px}.text{font-size:.82rem} }
</style>

{#if watch}
    <section class="watch">
        <div class="label">{watch.label}</div>
        <div class="text">{watch.text}</div>
    </section>
{/if}
