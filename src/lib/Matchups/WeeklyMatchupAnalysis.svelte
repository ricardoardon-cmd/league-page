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

    const getActualTotal = (entry) => sum(entry?.points || []);

    const getTeamHistory = (rosterID) => {
        let wins = 0;
        let losses = 0;
        let ties = 0;
        let pointsFor = 0;
        let games = 0;

        const lastCompletedWeek = Math.max(0, Number(displayWeek) - 1);

        for (let weekIndex = 0; weekIndex < lastCompletedWeek; weekIndex++) {
            const weekData = matchupWeeks?.[weekIndex]?.matchups || {};

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

                const teamPoints = getActualTotal(team);
                const opponentPoints = getActualTotal(opponent);

                pointsFor += teamPoints;
                games++;

                if (teamPoints > opponentPoints) wins++;
                else if (teamPoints < opponentPoints) losses++;
                else ties++;
            }
        }

        return {
            wins,
            losses,
            ties,
            games,
            ppg: games ? round(pointsFor / games) : 0
        };
    };

    const formatRecord = (record) => {
        if (record.ties) {
            return `${record.wins}-${record.losses}-${record.ties}`;
        }

        return `${record.wins}-${record.losses}`;
    };

    const makePreview = (matchup) => {
        const home = matchup?.[0];
        const away = matchup?.[1];

        if (!home || !away) return null;

        const homeTeam = safeTeam(home.roster_id);
        const awayTeam = safeTeam(away.roster_id);
        const homeHistory = getTeamHistory(home.roster_id);
        const awayHistory = getTeamHistory(away.roster_id);
        const homeProjection = round(getProjectedTotal(home));
        const awayProjection = round(getProjectedTotal(away));
        const projectedMargin = round(Math.abs(homeProjection - awayProjection));
        const projectedWinner = homeProjection >= awayProjection ? homeTeam : awayTeam;

        const text =
            `${homeTeam.name} enters Week ${displayWeek} at ${formatRecord(homeHistory)}` +
            `${homeHistory.games ? ` and ${homeHistory.ppg} PPG` : ''}, while ` +
            `${awayTeam.name} is ${formatRecord(awayHistory)}` +
            `${awayHistory.games ? ` at ${awayHistory.ppg} PPG` : ''}. ` +
            `Current projections favor ${projectedWinner.name} ` +
            `${homeProjection}-${awayProjection}` +
            `${projectedMargin ? `, a ${projectedMargin}-point edge.` : '.'}`;

        return {
            mode: 'preview',
            homeTeam,
            awayTeam,
            homeProjection,
            awayProjection,
            margin: projectedMargin,
            text
        };
    };

    const makeRecap = (matchup) => {
        const home = matchup?.[0];
        const away = matchup?.[1];

        if (!home || !away) return null;

        const homeTeam = safeTeam(home.roster_id);
        const awayTeam = safeTeam(away.roster_id);
        const homePoints = round(getActualTotal(home));
        const awayPoints = round(getActualTotal(away));
        const margin = round(Math.abs(homePoints - awayPoints));
        const homeHistoryBefore = getTeamHistory(home.roster_id);
        const awayHistoryBefore = getTeamHistory(away.roster_id);

        let resultText;

        if (homePoints === awayPoints) {
            resultText = `${homeTeam.name} and ${awayTeam.name} finished tied ${homePoints}-${awayPoints}.`;
        } else {
            const winner = homePoints > awayPoints ? homeTeam : awayTeam;
            const loser = homePoints > awayPoints ? awayTeam : homeTeam;
            const winnerPoints = Math.max(homePoints, awayPoints);
            const loserPoints = Math.min(homePoints, awayPoints);

            resultText = `${winner.name} defeated ${loser.name} ${winnerPoints}-${loserPoints} by ${margin} points.`;
        }

        const homeAfter = {
            ...homeHistoryBefore,
            wins: homeHistoryBefore.wins + (homePoints > awayPoints ? 1 : 0),
            losses: homeHistoryBefore.losses + (homePoints < awayPoints ? 1 : 0),
            ties: homeHistoryBefore.ties + (homePoints === awayPoints ? 1 : 0)
        };

        const awayAfter = {
            ...awayHistoryBefore,
            wins: awayHistoryBefore.wins + (awayPoints > homePoints ? 1 : 0),
            losses: awayHistoryBefore.losses + (awayPoints < homePoints ? 1 : 0),
            ties: awayHistoryBefore.ties + (awayPoints === homePoints ? 1 : 0)
        };

        return {
            mode: 'recap',
            homeTeam,
            awayTeam,
            homePoints,
            awayPoints,
            margin,
            text:
                `${resultText} ${homeTeam.name} moves to ${formatRecord(homeAfter)}, ` +
                `while ${awayTeam.name} moves to ${formatRecord(awayAfter)}.`
        };
    };

    $: isPastWeek = Number(displayWeek) < Number(currentWeek);
    $: analyses = (matchupArray || [])
        .map((matchup) => (isPastWeek ? makeRecap(matchup) : makePreview(matchup)))
        .filter(Boolean);

    $: weeklySummary = (() => {
        if (!analyses.length) return null;

        if (isPastWeek) {
            const byTotal = analyses
                .map((item) => ({
                    ...item,
                    highScore: Math.max(item.homePoints, item.awayPoints),
                    lowScore: Math.min(item.homePoints, item.awayPoints)
                }))
                .sort((a, b) => b.highScore - a.highScore);

            const highest = byTotal[0];
            const closest = [...analyses].sort((a, b) => a.margin - b.margin)[0];
            const biggest = [...analyses].sort((a, b) => b.margin - a.margin)[0];

            return {
                title: `Week ${displayWeek} Recap`,
                eyebrow: 'Weekly Results',
                cards: [
                    {
                        label: 'Highest Score',
                        value: highest.highScore
                    },
                    {
                        label: 'Closest Game',
                        value: `${closest.margin} pts`
                    },
                    {
                        label: 'Biggest Margin',
                        value: `${biggest.margin} pts`
                    }
                ]
            };
        }

        const highestProjected = [...analyses].sort(
            (a, b) =>
                Math.max(b.homeProjection, b.awayProjection) -
                Math.max(a.homeProjection, a.awayProjection)
        )[0];

        const closestProjected = [...analyses].sort(
            (a, b) => a.margin - b.margin
        )[0];

        const biggestProjected = [...analyses].sort(
            (a, b) => b.margin - a.margin
        )[0];

        return {
            title: `Week ${displayWeek} Preview`,
            eyebrow: 'Matchup Outlook',
            cards: [
                {
                    label: 'Highest Projection',
                    value: Math.max(
                        highestProjected.homeProjection,
                        highestProjected.awayProjection
                    )
                },
                {
                    label: 'Closest Projection',
                    value: `${closestProjected.margin} pts`
                },
                {
                    label: 'Biggest Edge',
                    value: `${biggestProjected.margin} pts`
                }
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
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
        font-size: 1.05rem;
        font-weight: 800;
    }

    .analysisList {
        display: grid;
        gap: 10px;
    }

    .analysisItem {
        padding: 13px 14px;
        border-radius: 12px;
        background: var(--f3f3f3);
        line-height: 1.45;
        font-size: 0.9rem;
    }

    @media (max-width: 600px) {
        .analysisCard {
            width: 100%;
            padding: 15px 12px;
        }

        .summaryGrid {
            grid-template-columns: 1fr;
        }

        .analysisItem {
            font-size: 0.82rem;
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
