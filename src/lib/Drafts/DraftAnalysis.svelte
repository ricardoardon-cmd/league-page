<script>
    import {
        getAvatarFromTeamManagers,
        getTeamNameFromTeamManagers
    } from '$lib/utils/helperFunctions/universalFunctions';

    export let previousDrafts = [];
    export let leagueTeamManagers = [];
    export let players = {};

    const completedDrafts = (previousDrafts || [])
        .filter((draft) => draft?.draft?.length && draft?.draftOrder?.length)
        .sort((a, b) => Number(b.year) - Number(a.year));

    let selectedYear = completedDrafts[0]?.year;

    $: selectedDraft = completedDrafts.find((draft) => String(draft.year) === String(selectedYear));
    $: analysis = selectedDraft ? analyzeDraft(selectedDraft) : null;

    function median(values) {
        const nums = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
        if (!nums.length) return null;
        const middle = Math.floor(nums.length / 2);
        return nums.length % 2 ? nums[middle] : (nums[middle - 1] + nums[middle]) / 2;
    }

    function pickInRound(draftData, roundIndex, colIndex) {
        const round = roundIndex + 1;
        const teamCount = draftData.draftOrder.length;
        const reversalRound = draftData.reversalRound;
        const draftType = draftData.draftType;

        if (draftType === 'snake' && !reversalRound) {
            return round % 2 === 0 ? teamCount - colIndex : colIndex + 1;
        }

        if (draftType === 'snake' && reversalRound) {
            if ((round < reversalRound && round % 2 === 0) || (round >= reversalRound && round % 2 === 1)) {
                return teamCount - colIndex;
            }
            return colIndex + 1;
        }

        if (!reversalRound || round < reversalRound) return colIndex + 1;
        return teamCount - colIndex;
    }

    function flattenPicks(draftData) {
        const teamCount = draftData.draftOrder.length;
        const picks = [];

        draftData.draft.forEach((draftRow, roundIndex) => {
            draftRow.forEach((draftCol, colIndex) => {
                if (!draftCol?.player) return;

                const roundPick = pickInRound(draftData, roundIndex, colIndex);
                const owner = draftCol.newOwner || draftData.draftOrder[colIndex];
                const player = players?.[draftCol.player] || {};

                picks.push({
                    owner,
                    playerId: draftCol.player,
                    playerName: `${player.fn || ''} ${player.ln || ''}`.trim() || 'Unknown Player',
                    position: player.pos || 'UNK',
                    round: roundIndex + 1,
                    roundPick,
                    overall: (roundIndex * teamCount) + roundPick
                });
            });
        });

        return picks.sort((a, b) => a.overall - b.overall);
    }

    function gradeFromScore(score) {
        if (score >= 94) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 87) return 'A-';
        if (score >= 83) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 77) return 'B-';
        if (score >= 73) return 'C+';
        if (score >= 70) return 'C';
        if (score >= 67) return 'C-';
        if (score >= 63) return 'D+';
        if (score >= 60) return 'D';
        return 'F';
    }

    function buildTeamScore(team, baselines, teamCount) {
        let score = 70;
        const strengths = [];
        const watch = [];
        const qbs = team.picks.filter((pick) => pick.position === 'QB');
        const rbs = team.picks.filter((pick) => pick.position === 'RB');
        const wrs = team.picks.filter((pick) => pick.position === 'WR');
        const tes = team.picks.filter((pick) => pick.position === 'TE');
        const firstQB = qbs[0];
        const secondQB = qbs[1];
        const earlyPicks = team.picks.filter((pick) => pick.round <= 6);
        const earlySkill = earlyPicks.filter((pick) => ['RB', 'WR', 'TE'].includes(pick.position)).length;

        if (qbs.length >= 3) {
            score += 12;
            strengths.push('Drafted a QB3 for true 2-QB insurance');
        } else if (qbs.length === 2) {
            score += 8;
            watch.push('Only two quarterbacks leaves little injury or bye-week margin');
        } else if (qbs.length === 1) {
            score -= 20;
            watch.push('Finished the draft without a second starting quarterback');
        } else {
            score -= 35;
            watch.push('No quarterbacks drafted in a league that starts two');
        }

        if (firstQB && baselines.firstQB) {
            if (firstQB.overall <= baselines.firstQB) {
                score += 7;
                strengths.push('Secured QB1 earlier than the GGL median');
            } else if (firstQB.overall <= baselines.firstQB + teamCount) {
                score += 3;
            } else {
                score -= 6;
                watch.push('Waited more than a round past the GGL median for QB1');
            }
        }

        if (secondQB && baselines.secondQB) {
            if (secondQB.overall <= baselines.secondQB) {
                score += 7;
                strengths.push('Locked in QB2 before the GGL median');
            } else if (secondQB.overall <= baselines.secondQB + teamCount) {
                score += 2;
            } else {
                score -= 8;
                watch.push('QB2 came more than a round later than the GGL median');
            }
        }

        if (earlySkill >= 4) {
            score += 7;
            strengths.push('Kept strong early-round investment in RB/WR/TE');
        } else if (earlySkill >= 3) {
            score += 4;
        } else {
            score -= 5;
            watch.push('Heavy early QB investment reduced early skill-position capital');
        }

        if (rbs.length >= 3) score += 3;
        else watch.push('Light running-back depth');

        if (wrs.length >= 4) score += 3;
        else watch.push('Light wide-receiver depth');

        if (tes.length >= 1) score += 2;
        else watch.push('No tight end drafted');

        score = Math.max(45, Math.min(98, Math.round(score)));

        const qbsByRoundFive = qbs.filter((pick) => pick.round <= 5).length;
        let identity = 'Balanced build';
        if (qbsByRoundFive >= 2) identity = 'QB-forward build';
        else if (qbsByRoundFive === 0) identity = 'Late-QB build';

        let qbPlan = 'QB room incomplete';
        if (qbs.length >= 3) qbPlan = `${qbs.length} QBs · built-in insurance`;
        else if (qbs.length === 2) qbPlan = '2 QBs · starters secured';
        else if (qbs.length === 1) qbPlan = '1 QB · major 2-QB exposure';

        return {
            ...team,
            score,
            grade: gradeFromScore(score),
            strengths: strengths.slice(0, 2),
            watch: watch.slice(0, 2),
            identity,
            qbPlan,
            counts: {
                QB: qbs.length,
                RB: rbs.length,
                WR: wrs.length,
                TE: tes.length
            },
            firstQB,
            secondQB
        };
    }

    function analyzeDraft(draftData) {
        const picks = flattenPicks(draftData);
        const teams = draftData.draftOrder
            .filter(Boolean)
            .map((rosterID) => ({
                rosterID,
                picks: picks.filter((pick) => String(pick.owner) === String(rosterID))
            }));

        const firstQBs = teams.map((team) => team.picks.filter((pick) => pick.position === 'QB')[0]?.overall);
        const secondQBs = teams.map((team) => team.picks.filter((pick) => pick.position === 'QB')[1]?.overall);
        const baselines = {
            firstQB: median(firstQBs),
            secondQB: median(secondQBs)
        };

        const scoredTeams = teams
            .map((team) => buildTeamScore(team, baselines, draftData.draftOrder.length))
            .sort((a, b) => b.score - a.score);

        return {
            teams: scoredTeams,
            baselines,
            top: scoredTeams.slice(0, 3)
        };
    }

    function pickLabel(pick) {
        if (!pick) return '—';
        return `${pick.round}.${String(pick.roundPick).padStart(2, '0')}`;
    }
</script>

<style>
    .analysisWrap{width:95%;max-width:1100px;margin:0 auto}.analysisIntro{padding:18px;border:1px solid var(--ccc);border-radius:18px;background:var(--fff);box-shadow:0 4px 16px rgba(0,0,0,.06)}.analysisIntro h2{margin:0;font-size:1.4rem}.analysisIntro p{margin:8px 0 0;line-height:1.55;opacity:.68}.analysisIntro strong{opacity:1}.yearBar{display:flex;gap:8px;align-items:center;margin:14px 0 18px;overflow-x:auto}.yearBar span{font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.8px;opacity:.5}.yearBar button{border:1px solid var(--ccc);background:var(--fff);color:inherit;border-radius:999px;padding:8px 14px;font:inherit;font-size:.76rem;font-weight:850;cursor:pointer}.yearBar button.active{background:var(--blueOne);border-color:var(--blueOne);color:#fff}.baseline{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:18px}.baselineCard{padding:14px;border:1px solid var(--ccc);border-radius:14px;background:var(--f3f3f3)}.baselineCard small{display:block;font-size:.62rem;font-weight:850;text-transform:uppercase;letter-spacing:.7px;opacity:.5}.baselineCard strong{display:block;margin-top:4px;font-size:1rem}.leaderRow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}.leader{padding:15px;border:1px solid var(--ccc);border-radius:16px;background:var(--fff);text-align:center}.leaderPlace{font-size:.65rem;font-weight:900;opacity:.5}.leader img{width:42px;height:42px;border-radius:50%;object-fit:cover;margin:8px auto 5px;display:block;border:1px solid var(--ccc)}.leader strong{display:block;font-size:.78rem}.leaderGrade{margin-top:5px;font-size:1.45rem;font-weight:950}.teamGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.teamCard{border:1px solid var(--ccc);border-radius:18px;background:var(--fff);padding:16px;box-shadow:0 4px 14px rgba(0,0,0,.05)}.teamTop{display:flex;align-items:center;gap:10px}.teamTop img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid var(--ccc)}.teamIdentity{min-width:0;flex:1}.teamName{font-size:.9rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.identity{font-size:.65rem;margin-top:2px;opacity:.55;font-weight:750}.grade{font-size:1.65rem;font-weight:950}.score{font-size:.58rem;text-align:center;opacity:.5}.qbLine{margin-top:13px;padding:10px 11px;border-radius:12px;background:var(--f3f3f3);font-size:.72rem;display:flex;justify-content:space-between;gap:8px}.positions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.pos{padding:5px 8px;border-radius:999px;border:1px solid var(--ccc);font-size:.62rem;font-weight:850}.notes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.note{font-size:.68rem;line-height:1.45}.note strong{display:block;margin-bottom:4px;font-size:.61rem;text-transform:uppercase;letter-spacing:.6px;opacity:.5}.note div+div{margin-top:4px}.empty{padding:30px 20px;text-align:center;border:1px solid var(--ccc);border-radius:18px;background:var(--fff);opacity:.65}.method{margin-top:16px;font-size:.65rem;line-height:1.5;opacity:.55;text-align:center}
    @media(max-width:700px){.analysisWrap{width:98%}.leaderRow{grid-template-columns:1fr}.leader{display:grid;grid-template-columns:auto 42px 1fr auto;align-items:center;text-align:left;gap:9px}.leader img{margin:0}.leaderGrade{margin:0}.teamGrid{grid-template-columns:1fr}.notes{grid-template-columns:1fr}.baseline{grid-template-columns:1fr 1fr}.analysisIntro{padding:15px}.teamCard{padding:14px}}
</style>

<div class="analysisWrap">
    <div class="analysisIntro">
        <h2>🧠 GGL 2-QB Draft Analysis</h2>
        <p>
            This first model grades <strong>2-QB roster construction</strong>, quarterback timing, depth and early-round balance using the league's own completed drafts as the baseline. Player-value/ADP grading will be layered into the 2026 version after the draft.
        </p>
    </div>

    {#if completedDrafts.length}
        <div class="yearBar">
            <span>Test year</span>
            {#each completedDrafts as draft}
                <button class:active={String(selectedYear) === String(draft.year)} onclick={() => selectedYear = draft.year}>{draft.year}</button>
            {/each}
        </div>
    {/if}

    {#if analysis}
        <div class="baseline">
            <div class="baselineCard">
                <small>GGL median QB1</small>
                <strong>Overall pick {analysis.baselines.firstQB ? Math.round(analysis.baselines.firstQB) : '—'}</strong>
            </div>
            <div class="baselineCard">
                <small>GGL median QB2</small>
                <strong>Overall pick {analysis.baselines.secondQB ? Math.round(analysis.baselines.secondQB) : '—'}</strong>
            </div>
        </div>

        <div class="leaderRow">
            {#each analysis.top as team, index}
                <div class="leader">
                    <div class="leaderPlace">#{index + 1}</div>
                    <img src={getAvatarFromTeamManagers(leagueTeamManagers, team.rosterID, selectedYear)} alt="Team avatar" />
                    <strong>{getTeamNameFromTeamManagers(leagueTeamManagers, team.rosterID, selectedYear)}</strong>
                    <div class="leaderGrade">{team.grade}</div>
                </div>
            {/each}
        </div>

        <div class="teamGrid">
            {#each analysis.teams as team}
                <article class="teamCard">
                    <div class="teamTop">
                        <img src={getAvatarFromTeamManagers(leagueTeamManagers, team.rosterID, selectedYear)} alt="Team avatar" />
                        <div class="teamIdentity">
                            <div class="teamName">{getTeamNameFromTeamManagers(leagueTeamManagers, team.rosterID, selectedYear)}</div>
                            <div class="identity">{team.identity}</div>
                        </div>
                        <div>
                            <div class="grade">{team.grade}</div>
                            <div class="score">{team.score}/100</div>
                        </div>
                    </div>

                    <div class="qbLine">
                        <span>{team.qbPlan}</span>
                        <strong>QB1 {pickLabel(team.firstQB)} · QB2 {pickLabel(team.secondQB)}</strong>
                    </div>

                    <div class="positions">
                        <span class="pos">QB {team.counts.QB}</span>
                        <span class="pos">RB {team.counts.RB}</span>
                        <span class="pos">WR {team.counts.WR}</span>
                        <span class="pos">TE {team.counts.TE}</span>
                    </div>

                    <div class="notes">
                        <div class="note">
                            <strong>What worked</strong>
                            {#if team.strengths.length}
                                {#each team.strengths as item}<div>✓ {item}</div>{/each}
                            {:else}
                                <div>✓ Balanced draft profile</div>
                            {/if}
                        </div>
                        <div class="note">
                            <strong>Watch list</strong>
                            {#if team.watch.length}
                                {#each team.watch as item}<div>• {item}</div>{/each}
                            {:else}
                                <div>• No major construction flags</div>
                            {/if}
                        </div>
                    </div>
                </article>
            {/each}
        </div>

        <div class="method">
            Baseline grade only: this version measures draft structure, not whether an individual NFL player ultimately outperformed his draft slot.
        </div>
    {:else}
        <div class="empty">No completed draft is available for analysis yet.</div>
    {/if}
</div>