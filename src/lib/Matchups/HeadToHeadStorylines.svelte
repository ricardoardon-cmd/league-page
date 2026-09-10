<script>
    import { onMount } from 'svelte';
    import { leagueID, managers } from '$lib/utils/leagueInfo';

    export let matchupArray = [];
    export let displayWeek;
    export let year;
    export let leagueTeamManagers;

    let stories = [];
    let loading = false;

    const managerIDsForRoster = (seasonYear, rosterID) =>
        leagueTeamManagers?.teamManagersMap?.[seasonYear]?.[rosterID]?.managers || [];

    const managerName = (managerID) => {
        const configured = (managers || []).find((manager) => String(manager.managerID || '') === String(managerID));
        return configured?.name || leagueTeamManagers?.users?.[managerID]?.display_name || 'Manager';
    };

    const matchupManager = (rosterID) => {
        const ids = managerIDsForRoster(year, rosterID);
        return ids?.[0] || null;
    };

    const fetchJson = async (url) => {
        try {
            const response = await fetch(url);
            return response.ok ? response.json() : null;
        } catch (error) {
            return null;
        }
    };

    const buildHistory = async () => {
        if (Number(displayWeek) < 2 || !matchupArray?.length || !leagueTeamManagers) {
            stories = [];
            return;
        }

        loading = true;
        const leagueChain = [];
        let id = leagueID;

        while (id && id != 0) {
            const league = await fetchJson(`https://api.sleeper.app/v1/league/${id}`);
            if (!league) break;
            leagueChain.push({ id, season: Number(league.season) });
            id = league.previous_league_id;
        }

        const currentPairs = (matchupArray || []).map((matchup) => {
            const one = matchup?.[0], two = matchup?.[1];
            return {
                oneManager: matchupManager(one?.roster_id),
                twoManager: matchupManager(two?.roster_id)
            };
        }).filter(pair => pair.oneManager && pair.twoManager);

        const pairStats = currentPairs.map((pair) => ({...pair, oneWins:0, twoWins:0, ties:0, meetings:0, lastWinner:null, playoffMeetings:0}));

        for (const season of leagueChain) {
            const yearMap = leagueTeamManagers?.teamManagersMap?.[season.season];
            if (!yearMap) continue;
            const maxWeek = season.season === Number(year) ? Math.max(0, Number(displayWeek) - 1) : 18;

            const requests = [];
            for (let week = 1; week <= maxWeek; week++) {
                requests.push(fetchJson(`https://api.sleeper.app/v1/league/${season.id}/matchups/${week}`).then(data => ({week, data:data || []})));
            }
            const weeks = await Promise.all(requests);

            for (const {week, data} of weeks) {
                const grouped = {};
                for (const entry of data) {
                    if (entry?.matchup_id == null) continue;
                    (grouped[entry.matchup_id] ||= []).push(entry);
                }

                for (const game of Object.values(grouped)) {
                    if (!Array.isArray(game) || game.length < 2) continue;
                    const a = game[0], b = game[1];
                    const aManagers = managerIDsForRoster(season.season, a.roster_id);
                    const bManagers = managerIDsForRoster(season.season, b.roster_id);
                    if (!aManagers.length || !bManagers.length) continue;

                    for (const stat of pairStats) {
                        const normal = aManagers.includes(stat.oneManager) && bManagers.includes(stat.twoManager);
                        const reverse = aManagers.includes(stat.twoManager) && bManagers.includes(stat.oneManager);
                        if (!normal && !reverse) continue;

                        stat.meetings++;
                        const aPoints = Number(a.points || 0), bPoints = Number(b.points || 0);
                        if (aPoints === bPoints) stat.ties++;
                        else {
                            const winnerManagers = aPoints > bPoints ? aManagers : bManagers;
                            if (winnerManagers.includes(stat.oneManager)) { stat.oneWins++; stat.lastWinner = stat.oneManager; }
                            else if (winnerManagers.includes(stat.twoManager)) { stat.twoWins++; stat.lastWinner = stat.twoManager; }
                        }
                    }
                }
            }
        }

        stories = pairStats.map((stat) => {
            if (stat.meetings < 2) return null;
            const one = managerName(stat.oneManager), two = managerName(stat.twoManager);
            const maxWins = Math.max(stat.oneWins, stat.twoWins), minWins = Math.min(stat.oneWins, stat.twoWins);
            const leader = stat.oneWins > stat.twoWins ? one : stat.twoWins > stat.oneWins ? two : null;
            const trailer = leader === one ? two : one;

            if (stat.oneWins === stat.twoWins && stat.meetings >= 4) {
                return {priority:5,label:'⚔️ Dead Even',text:`${one} and ${two} are tied ${stat.oneWins}-${stat.twoWins} all-time${stat.ties ? ` with ${stat.ties} tie${stat.ties === 1 ? '' : 's'}` : ''}. Week ${displayWeek} breaks the deadlock.`};
            }
            if (leader && minWins === 0 && stat.meetings >= 3) {
                return {priority:6,label:"💀 Can't Beat This Guy",text:`${leader} is a perfect ${maxWins}-0 against ${trailer} all-time. ${trailer} gets another shot at finally ending the curse in Week ${displayWeek}.`};
            }
            if (leader && maxWins >= minWins + 3 && stat.meetings >= 4) {
                return {priority:5,label:'😈 Nemesis Alert',text:`${leader} owns a ${maxWins}-${minWins} all-time edge over ${trailer}. History has been one-sided, but Week ${displayWeek} is another chance to flip the script.`};
            }
            if (stat.meetings >= 6) {
                return {priority:4,label:'🔥 Rivalry Renewed',text:`${one} and ${two} meet for the ${stat.meetings + 1}th time. ${leader ? `${leader} leads the all-time series ${maxWins}-${minWins}` : `The all-time series is tied ${stat.oneWins}-${stat.twoWins}`}${stat.ties ? ` with ${stat.ties} tie${stat.ties === 1 ? '' : 's'}` : ''}.`};
            }
            return {priority:2,label:'📚 Matchup History',text:`${one} and ${two} have met ${stat.meetings} times. ${leader ? `${leader} holds a ${maxWins}-${minWins} all-time advantage.` : `They are deadlocked ${stat.oneWins}-${stat.twoWins}.`}`};
        }).filter(Boolean).sort((a,b) => b.priority-a.priority).slice(0,2);

        loading = false;
    };

    $: if (matchupArray && displayWeek && leagueTeamManagers) buildHistory();
</script>

<style>
    .box{width:95%;max-width:900px;margin:-12px auto 24px;display:grid;gap:10px;box-sizing:border-box}.story{padding:14px 16px;border:1px solid var(--ccc);border-radius:14px;background:var(--fff);box-shadow:0 4px 14px rgba(0,0,0,.06)}.label{font-size:.72rem;font-weight:850;letter-spacing:.5px;text-transform:uppercase;opacity:.65;margin-bottom:5px}.text{font-size:.9rem;line-height:1.5;font-weight:600}@media(max-width:600px){.box{width:100%}.story{padding:13px}.text{font-size:.82rem}}
</style>

{#if !loading && stories.length}
    <section class="box">
        {#each stories as story}
            <div class="story"><div class="label">{story.label}</div><div class="text">{story.text}</div></div>
        {/each}
    </section>
{/if}
