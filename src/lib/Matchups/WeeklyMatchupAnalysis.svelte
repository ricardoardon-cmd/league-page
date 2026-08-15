<script>
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';

    export let matchupArray = [];
    export let matchupWeeks = [];
    export let displayWeek;
    export let currentWeek;
    export let players;
    export let year;
    export let leagueTeamManagers;
    export let regularSeasonLength = 0;
    export let playoffTeams = 0;

    const numericRound = (value) => Number(round(Number(value) || 0));

    const safeTeam = (rosterID) => {
        try {
            return getTeamFromTeamManagers(
                leagueTeamManagers,
                Number(rosterID),
                year
            );
        } catch (error) {
            return {
                name: `Team ${rosterID}`,
                avatar: ''
            };
        }
    };

    const sum = (values = []) =>
        values.reduce((total, value) => total + (Number(value) || 0), 0);

    const getActualTotal = (entry) => sum(entry?.points || []);

    const getProjectedTotal = (entry) => {
        const starters = entry?.starters || [];

        return starters.reduce((total, playerID) => {
            if (!playerID || playerID == 0) return total;

            const projection = Number(
                players?.[playerID]?.wi?.[displayWeek]?.p
            );

            return total + (Number.isFinite(projection) ? projection : 0);
        }, 0);
    };

    const getPlayerName = (playerID) => {
        const player = players?.[playerID];
        if (!player) return `Player ${playerID}`;

        if (player.pos === 'DEF') {
            return player.ln || player.fn || String(playerID).toUpperCase();
        }

        const name = `${player.fn || ''} ${player.ln || ''}`.trim();
        return name || `Player ${playerID}`;
    };

    const getTopStarter = (entry, projected = false) => {
        const starters = entry?.starters || [];
        const points = entry?.points || [];
        let best = null;

        for (let index = 0; index < starters.length; index++) {
            const playerID = starters[index];
            if (!playerID || playerID == 0) continue;

            const value = projected
                ? Number(players?.[playerID]?.wi?.[displayWeek]?.p || 0)
                : Number(points[index] || 0);

            if (!best || value > best.points) {
                best = {
                    playerID,
                    name: getPlayerName(playerID),
                    points: numericRound(value)
                };
            }
        }

        return best;
    };

    const getWeekData = (weekNumber) =>
        matchupWeeks.find(
            (item) => Number(item?.week) === Number(weekNumber)
        )?.matchups || {};

    const getTeamGame = (rosterID, weekNumber) => {
        const weekData = getWeekData(weekNumber);

        for (const matchup of Object.values(weekData)) {
            if (!Array.isArray(matchup) || matchup.length < 2) continue;

            const team = matchup.find(
                (entry) => Number(entry?.roster_id) === Number(rosterID)
            );

            if (!team) continue;

            const opponent = matchup.find(
                (entry) => Number(entry?.roster_id) !== Number(rosterID)
            );

            if (!opponent) continue;

            return { team, opponent };
        }

        return null;
    };

    const getStreak = (results = []) => {
        if (!results.length) return { type: null, length: 0 };

        const type = results[results.length - 1].result;
        let length = 0;

        for (let index = results.length - 1; index >= 0; index--) {
            if (results[index].result !== type) break;
            length++;
        }

        return { type, length };
    };

    const getTeamHistory = (rosterID, throughWeek = Number(displayWeek) - 1) => {
        let wins = 0;
        let losses = 0;
        let ties = 0;
        let pointsFor = 0;
        let games = 0;
        const results = [];

        const weeks = (matchupWeeks || [])
            .map((item) => Number(item?.week))
            .filter((weekNumber) => Number.isFinite(weekNumber) && weekNumber <= Number(throughWeek))
            .sort((a, b) => a - b);

        for (const weekNumber of weeks) {
            const game = getTeamGame(rosterID, weekNumber);
            if (!game) continue;

            const teamPoints = getActualTotal(game.team);
            const opponentPoints = getActualTotal(game.opponent);
            pointsFor += teamPoints;
            games++;

            let result = 'T';
            if (teamPoints > opponentPoints) {
                wins++;
                result = 'W';
            } else if (teamPoints < opponentPoints) {
                losses++;
                result = 'L';
            } else {
                ties++;
            }

            results.push({ result, week: weekNumber });
        }

        const denominator = wins + losses + ties;

        return {
            wins,
            losses,
            ties,
            games,
            pointsFor,
            ppg: games ? numericRound(pointsFor / games) : 0,
            winPct: denominator ? (wins + ties / 2) / denominator : 0,
            streak: getStreak(results)
        };
    };

    const formatRecord = (record) =>
        record.ties
            ? `${record.wins}-${record.losses}-${record.ties}`
            : `${record.wins}-${record.losses}`;

    const formatStreak = (streak) => {
        if (!streak?.type || !streak.length) return '';
        if (streak.type === 'W') return `${streak.length}-game winning streak`;
        if (streak.type === 'L') return `${streak.length}-game losing streak`;
        return `${streak.length}-game tie streak`;
    };

    const getSeasonSeries = (rosterOne, rosterTwo, throughWeek) => {
        let oneWins = 0;
        let twoWins = 0;
        let ties = 0;
        let meetings = 0;

        const weeks = (matchupWeeks || [])
            .map((item) => Number(item?.week))
            .filter((weekNumber) => weekNumber <= Number(throughWeek))
            .sort((a, b) => a - b);

        for (const weekNumber of weeks) {
            const game = getTeamGame(rosterOne, weekNumber);
            if (!game || Number(game.opponent.roster_id) !== Number(rosterTwo)) continue;

            meetings++;
            const onePoints = getActualTotal(game.team);
            const twoPoints = getActualTotal(game.opponent);

            if (onePoints > twoPoints) oneWins++;
            else if (onePoints < twoPoints) twoWins++;
            else ties++;
        }

        return { oneWins, twoWins, ties, meetings };
    };

    const getSeriesNote = (home, away, throughWeek) => {
        const series = getSeasonSeries(home.roster_id, away.roster_id, throughWeek);
        if (series.meetings < 2) return '';

        const homeTeam = safeTeam(home.roster_id);
        const awayTeam = safeTeam(away.roster_id);

        if (series.oneWins === series.twoWins) {
            return `The season series is tied ${series.oneWins}-${series.twoWins}${series.ties ? ` with ${series.ties} tie` : ''}.`;
        }

        const leader = series.oneWins > series.twoWins ? homeTeam : awayTeam;
        return `${leader.name} leads the season series ${Math.max(series.oneWins, series.twoWins)}-${Math.min(series.oneWins, series.twoWins)}.`;
    };

    const buildStandings = (throughWeek) => {
        const rosterIDs = new Set();

        for (const weekData of matchupWeeks || []) {
            for (const matchup of Object.values(weekData?.matchups || {})) {
                for (const entry of matchup || []) {
                    if (entry?.roster_id != null) rosterIDs.add(Number(entry.roster_id));
                }
            }
        }

        return [...rosterIDs]
            .map((rosterID) => ({
                rosterID,
                ...getTeamHistory(rosterID, throughWeek)
            }))
            .sort((a, b) => {
                if (b.winPct !== a.winPct) return b.winPct - a.winPct;
                if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
                return a.rosterID - b.rosterID;
            })
            .map((team, index) => ({ ...team, rank: index + 1 }));
    };

    const getRank = (standings, rosterID) =>
        standings.find((team) => Number(team.rosterID) === Number(rosterID))?.rank || null;

    const ordinal = (number) => {
        const value = Number(number);
        const mod100 = value % 100;
        if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
        if (value % 10 === 1) return `${value}st`;
        if (value % 10 === 2) return `${value}nd`;
        if (value % 10 === 3) return `${value}rd`;
        return `${value}th`;
    };

    const getPlayoffNote = (rosterID, beforeRank, afterRank) => {
        const slots = Number(playoffTeams || 0);
        const weekNumber = Number(displayWeek || 0);
        const seasonLength = Number(regularSeasonLength || 0);

        if (!slots || !seasonLength || weekNumber > seasonLength) return '';
        if (weekNumber < Math.max(4, seasonLength - 3)) return '';
        if (!afterRank) return '';

        const team = safeTeam(rosterID);

        if (beforeRank && beforeRank > slots && afterRank <= slots) {
            return `${team.name} moved into a playoff position at ${ordinal(afterRank)}.`;
        }

        if (beforeRank && beforeRank <= slots && afterRank > slots) {
            return `${team.name} fell outside the playoff line to ${ordinal(afterRank)}.`;
        }

        if (afterRank === slots + 1) {
            return `${team.name} is the first team outside the playoff line.`;
        }

        return '';
    };

    const makePreview = (matchup) => {
        const home = matchup?.[0];
        const away = matchup?.[1];
        if (!home || !away) return null;

        const homeTeam = safeTeam(home.roster_id);
        const awayTeam = safeTeam(away.roster_id);
        const homeHistory = getTeamHistory(home.roster_id);
        const awayHistory = getTeamHistory(away.roster_id);
        const homeProjection = numericRound(getProjectedTotal(home));
        const awayProjection = numericRound(getProjectedTotal(away));
        const margin = numericRound(Math.abs(homeProjection - awayProjection));
        const projectedWinner = homeProjection >= awayProjection ? homeTeam : awayTeam;
        const homeTop = getTopStarter(home, true);
        const awayTop = getTopStarter(away, true);
        const topPerformer = !homeTop ? awayTop : !awayTop ? homeTop : homeTop.points >= awayTop.points ? homeTop : awayTop;
        const notes = [];

        if (homeHistory.streak.length >= 2) {
            notes.push(`${homeTeam.name} enters on a ${formatStreak(homeHistory.streak)}.`);
        }

        if (awayHistory.streak.length >= 2) {
            notes.push(`${awayTeam.name} enters on a ${formatStreak(awayHistory.streak)}.`);
        }

        const rivalry = getSeriesNote(home, away, Number(displayWeek) - 1);
        if (rivalry) notes.push(rivalry);

        return {
            homeTeam,
            awayTeam,
            homeProjection,
            awayProjection,
            margin,
            topPerformer,
            text:
                `${homeTeam.name} enters Week ${displayWeek} at ${formatRecord(homeHistory)}` +
                `${homeHistory.games ? ` and ${homeHistory.ppg} PPG` : ''}, while ` +
                `${awayTeam.name} is ${formatRecord(awayHistory)}` +
                `${awayHistory.games ? ` at ${awayHistory.ppg} PPG` : ''}. ` +
                `Current projections favor ${projectedWinner.name} ${homeProjection}-${awayProjection}` +
                `${margin ? `, a ${margin}-point edge.` : '.'}` +
                `${notes.length ? ` ${notes.join(' ')}` : ''}`
        };
    };

    const makeRecap = (matchup) => {
        const home = matchup?.[0];
        const away = matchup?.[1];
        if (!home || !away) return null;

        const homeTeam = safeTeam(home.roster_id);
        const awayTeam = safeTeam(away.roster_id);
        const homePoints = numericRound(getActualTotal(home));
        const awayPoints = numericRound(getActualTotal(away));
        const margin = numericRound(Math.abs(homePoints - awayPoints));
        const homeBefore = getTeamHistory(home.roster_id, Number(displayWeek) - 1);
        const awayBefore = getTeamHistory(away.roster_id, Number(displayWeek) - 1);
        const homeAfter = getTeamHistory(home.roster_id, Number(displayWeek));
        const awayAfter = getTeamHistory(away.roster_id, Number(displayWeek));
        const homeTop = getTopStarter(home);
        const awayTop = getTopStarter(away);
        const topPerformer = !homeTop ? awayTop : !awayTop ? homeTop : homeTop.points >= awayTop.points ? homeTop : awayTop;
        const notes = [];

        let resultText;
        let winner = null;
        let loser = null;
        let upset = false;

        if (homePoints === awayPoints) {
            resultText = `${homeTeam.name} and ${awayTeam.name} finished tied ${homePoints}-${awayPoints}.`;
        } else {
            const homeWon = homePoints > awayPoints;
            winner = homeWon ? homeTeam : awayTeam;
            loser = homeWon ? awayTeam : homeTeam;
            const winnerBefore = homeWon ? homeBefore : awayBefore;
            const loserBefore = homeWon ? awayBefore : homeBefore;

            upset =
                winnerBefore.games >= 2 &&
                loserBefore.games >= 2 &&
                winnerBefore.winPct < loserBefore.winPct;

            resultText = `${winner.name} defeated ${loser.name} ${Math.max(homePoints, awayPoints)}-${Math.min(homePoints, awayPoints)} by ${margin} points.`;

            if (upset) {
                notes.push(`It was a record-based upset: ${winner.name} entered ${formatRecord(winnerBefore)}, while ${loser.name} came in ${formatRecord(loserBefore)}.`);
            }
        }

        if (topPerformer?.points > 0) {
            notes.push(`${topPerformer.name} led all starters in the matchup with ${topPerformer.points} points.`);
        }

        const winnerBeforeStreak = homePoints > awayPoints ? homeBefore.streak : awayBefore.streak;
        const winnerAfterStreak = homePoints > awayPoints ? homeAfter.streak : awayAfter.streak;
        const loserBeforeStreak = homePoints > awayPoints ? awayBefore.streak : homeBefore.streak;

        if (winner && winnerAfterStreak?.type === 'W' && winnerAfterStreak.length >= 3) {
            notes.push(`${winner.name} has now won ${winnerAfterStreak.length} straight.`);
        }

        if (winner && loserBeforeStreak?.type === 'W' && loserBeforeStreak.length >= 2) {
            notes.push(`${winner.name} snapped ${loser.name}'s ${loserBeforeStreak.length}-game winning streak.`);
        } else if (winner && winnerBeforeStreak?.type === 'L' && winnerBeforeStreak.length >= 2) {
            notes.push(`${winner.name} snapped a ${winnerBeforeStreak.length}-game losing streak.`);
        }

        const rivalry = getSeriesNote(home, away, Number(displayWeek));
        if (rivalry) notes.push(rivalry);

        if (Number(displayWeek) <= Number(regularSeasonLength)) {
            const beforeStandings = buildStandings(Number(displayWeek) - 1);
            const afterStandings = buildStandings(Number(displayWeek));
            const homePlayoff = getPlayoffNote(
                home.roster_id,
                getRank(beforeStandings, home.roster_id),
                getRank(afterStandings, home.roster_id)
            );
            const awayPlayoff = getPlayoffNote(
                away.roster_id,
                getRank(beforeStandings, away.roster_id),
                getRank(afterStandings, away.roster_id)
            );

            if (homePlayoff) notes.push(homePlayoff);
            if (awayPlayoff && awayPlayoff !== homePlayoff) notes.push(awayPlayoff);
        } else {
            notes.push(`This was a postseason matchup.`);
        }

        return {
            homeTeam,
            awayTeam,
            homePoints,
            awayPoints,
            margin,
            topPerformer,
            upset,
            winner,
            text:
                `${resultText} ${homeTeam.name} moved to ${formatRecord(homeAfter)}, while ${awayTeam.name} moved to ${formatRecord(awayAfter)}.` +
                `${notes.length ? ` ${notes.join(' ')}` : ''}`
        };
    };

    $: isPastWeek = Number(displayWeek) < Number(currentWeek);
    $: analyses = (matchupArray || [])
        .map((matchup) => (isPastWeek ? makeRecap(matchup) : makePreview(matchup)))
        .filter(Boolean);

    $: weeklySummary = (() => {
        if (!analyses.length) return null;

        if (isPastWeek) {
            const teams = analyses.flatMap((item) => [
                { team: item.homeTeam, points: item.homePoints },
                { team: item.awayTeam, points: item.awayPoints }
            ]).sort((a, b) => b.points - a.points);

            const topPerformer = analyses
                .map((item) => item.topPerformer)
                .filter(Boolean)
                .sort((a, b) => b.points - a.points)[0];

            const closest = [...analyses].sort((a, b) => a.margin - b.margin)[0];
            const biggest = [...analyses].sort((a, b) => b.margin - a.margin)[0];
            const upset = analyses.filter((item) => item.upset).sort((a, b) => b.margin - a.margin)[0];

            const cards = [
                { label: 'Highest Score', value: `${teams[0].team.name} · ${teams[0].points}` },
                { label: 'Top Performer', value: topPerformer ? `${topPerformer.name} · ${topPerformer.points}` : '—' },
                { label: 'Closest Game', value: `${closest.margin} pts` },
                { label: 'Biggest Margin', value: `${biggest.margin} pts` }
            ];

            if (upset?.winner) {
                cards.push({ label: 'Upset of the Week', value: upset.winner.name });
            }

            return {
                title: `Week ${displayWeek} Recap`,
                eyebrow: Number(displayWeek) > Number(regularSeasonLength) ? 'Postseason Results' : 'Weekly Results',
                cards
            };
        }

        const teams = analyses.flatMap((item) => [
            { team: item.homeTeam, points: item.homeProjection },
            { team: item.awayTeam, points: item.awayProjection }
        ]).sort((a, b) => b.points - a.points);

        const topPerformer = analyses
            .map((item) => item.topPerformer)
            .filter(Boolean)
            .sort((a, b) => b.points - a.points)[0];
        const closest = [...analyses].sort((a, b) => a.margin - b.margin)[0];
        const biggest = [...analyses].sort((a, b) => b.margin - a.margin)[0];

        return {
            title: `Week ${displayWeek} Preview`,
            eyebrow: Number(displayWeek) > Number(regularSeasonLength) ? 'Postseason Outlook' : 'Matchup Outlook',
            cards: [
                { label: 'Highest Projection', value: `${teams[0].team.name} · ${teams[0].points}` },
                { label: 'Top Player Projection', value: topPerformer ? `${topPerformer.name} · ${topPerformer.points}` : '—' },
                { label: 'Closest Projection', value: `${closest.margin} pts` },
                { label: 'Biggest Edge', value: `${biggest.margin} pts` }
            ]
        };
    })();
</script>

<style>
    .analysisCard {
        width: 95%;
        max-width: 900px;
        margin: 0 auto 24px;
        padding: 20px;
        box-sizing: border-box;
        border: 1px solid var(--ccc);
        border-radius: 16px;
        background: var(--fff);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    .analysisHeader {
        text-align: center;
        margin-bottom: 16px;
    }

    .eyebrow {
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    h4 {
        margin: 5px 0 0;
        font-size: 1.35rem;
    }

    .summaryGrid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
        gap: 10px;
        margin-bottom: 18px;
    }

    .summaryItem {
        padding: 12px;
        border-radius: 12px;
        background: var(--f3f3f3);
        text-align: center;
    }

    .summaryLabel {
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        opacity: 0.55;
    }

    .summaryValue {
        margin-top: 4px;
        font-size: 0.9rem;
        font-weight: 800;
        line-height: 1.25;
    }

    .analysisList {
        display: grid;
        gap: 10px;
    }

    .analysisItem {
        padding: 13px 14px;
        border-radius: 12px;
        background: var(--f3f3f3);
        line-height: 1.5;
        font-size: 0.9rem;
    }

    @media (max-width: 600px) {
        .analysisCard {
            width: 100%;
            padding: 15px 12px;
        }

        .summaryGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .summaryValue {
            font-size: 0.76rem;
        }

        .analysisItem {
            font-size: 0.82rem;
        }
    }

    @media (max-width: 380px) {
        .summaryGrid {
            grid-template-columns: 1fr;
        }
    }
</style>

{#if weeklySummary && analyses.length}
    <section class="analysisCard">
        <div class="analysisHeader">
            <div class="eyebrow">{weeklySummary.eyebrow}</div>
            <h4>{isPastWeek ? '📰' : '🔮'} {weeklySummary.title}</h4>
        </div>

        <div class="summaryGrid">
            {#each weeklySummary.cards as card}
                <div class="summaryItem">
                    <div class="summaryLabel">{card.label}</div>
                    <div class="summaryValue">{card.value}</div>
                </div>
            {/each}
        </div>

        <div class="analysisList">
            {#each analyses as item}
                <div class="analysisItem">{item.text}</div>
            {/each}
        </div>
    </section>
{/if}
