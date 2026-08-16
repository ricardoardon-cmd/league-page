<script>
    import { getLegacyManagerCareer, getLegacySeason } from '$lib/utils/legacyHistory';
    import { checkIfManagerReceivedAward } from '$lib/utils/helperFunctions/universalFunctions';

    export let awards, records, rosterID, leagueTeamManagers, managerID, managerName;

    let recordView = 'all';
    let stats = {
        championships: 0,
        awards: 0,
        playoffAppearances: 0,
        sleeperPlayoffAppearances: 0,
        legacyPlayoffAppearances: 0,
        sleeper: { wins: 0, losses: 0, ties: 0 },
        legacy: { wins: 0, losses: 0, ties: 0 },
        all: { wins: 0, losses: 0, ties: 0 }
    };

    const checkIfDeserves = (awardRosterID, userRosterID, year) => {
        if(!managerID || !year || !awardRosterID) {
            return awardRosterID == userRosterID;
        }
        return checkIfManagerReceivedAward(leagueTeamManagers, awardRosterID, year, managerID);
    };

    const checkIfDeservesWithManagerID = (recordManagerID, userRosterID) => {
        if(managerID) {
            return recordManagerID == managerID;
        }

        for(const year in leagueTeamManagers.teamManagersMap) {
            for(const historicalRosterID in leagueTeamManagers.teamManagersMap[year]) {
                if(leagueTeamManagers.teamManagersMap[year][historicalRosterID].managers.indexOf(recordManagerID) > -1) {
                    return historicalRosterID == userRosterID;
                }
            }
        }

        return false;
    };

    const findManagerRecord = (recordSet, userRosterID) => {
        if(!recordSet?.leagueManagerRecords) return null;

        for(const key in recordSet.leagueManagerRecords) {
            if(checkIfDeservesWithManagerID(key, userRosterID)) {
                return recordSet.leagueManagerRecords[key];
            }
        }

        return null;
    };

    const getLegacyLookupName = (name) => {
        const normalized = String(name || '').trim().toLowerCase();
        if(normalized === 'picorico') return 'Pico';
        return name;
    };

    const legacyPlayoffCutoff = (teamCount) => {
        if(teamCount === 10) return 6;
        if(teamCount === 8 || teamCount === 6) return 4;
        return 0;
    };

    const getLegacyPlayoffAppearances = (legacyCareer) => {
        return (legacyCareer?.seasonHistory || []).reduce((total, season) => {
            const seasonData = getLegacySeason(season.year);
            const cutoff = legacyPlayoffCutoff(seasonData?.teamCount || 0);
            return total + (cutoff && season.finish <= cutoff ? 1 : 0);
        }, 0);
    };

    const buildStats = (userRosterID, name) => {
        let sleeperChampionships = 0;
        let totalAwards = 0;

        for(const podium of awards || []) {
            if(checkIfDeserves(podium.champion, userRosterID, podium.year)) {
                sleeperChampionships++;
                totalAwards++;
            }

            if(checkIfDeserves(podium.second, userRosterID, podium.year)) totalAwards++;
            if(checkIfDeserves(podium.third, userRosterID, podium.year)) totalAwards++;

            if(podium.divisions) {
                for(const division of podium.divisions) {
                    if(checkIfDeserves(division.rosterID, userRosterID, podium.year)) {
                        totalAwards++;
                    }
                }
            }

            if(checkIfDeserves(podium.toilet, userRosterID, podium.year)) totalAwards++;
        }

        const sleeperRecord = findManagerRecord(records?.regularSeasonData, userRosterID);
        const playoffRecord = findManagerRecord(records?.playoffData, userRosterID);
        const legacyCareer = getLegacyManagerCareer(getLegacyLookupName(name));

        const sleeper = {
            wins: sleeperRecord?.wins || 0,
            losses: sleeperRecord?.losses || 0,
            ties: sleeperRecord?.ties || 0
        };

        const legacy = {
            wins: legacyCareer?.wins || 0,
            losses: legacyCareer?.losses || 0,
            ties: legacyCareer?.ties || 0
        };

        const sleeperPlayoffAppearances = playoffRecord?.playoffAppearances || 0;
        const legacyPlayoffAppearances = getLegacyPlayoffAppearances(legacyCareer);

        stats = {
            championships: sleeperChampionships + (legacyCareer?.championships || 0),
            awards: totalAwards,
            playoffAppearances: sleeperPlayoffAppearances + legacyPlayoffAppearances,
            sleeperPlayoffAppearances,
            legacyPlayoffAppearances,
            sleeper,
            legacy,
            all: {
                wins: sleeper.wins + legacy.wins,
                losses: sleeper.losses + legacy.losses,
                ties: sleeper.ties + legacy.ties
            }
        };
    };

    $: buildStats(rosterID, managerName);
    $: selectedRecord = stats[recordView] || stats.all;

    const recordText = (record) =>
        `${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ''}`;
</script>

<style>
    :global(.careerStats) {
        display: none !important;
    }

    .managerCareerStats {
        width: 97%;
        max-width: 800px;
        margin: 25px auto 35px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
    }

    .careerStat {
        background: var(--fff);
        border: 1px solid var(--ccc);
        border-radius: 18px;
        padding: 18px 10px;
        text-align: center;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    .careerIcon {
        font-size: 1.5rem;
        line-height: 1;
        margin-bottom: 8px;
    }

    .careerValue {
        font-size: 1.7rem;
        font-weight: 800;
        line-height: 1.1;
    }

    .careerLabel {
        margin-top: 7px;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.7px;
        text-transform: uppercase;
        opacity: 0.6;
    }

    .careerSub {
        margin-top: 5px;
        font-size: 0.67rem;
        opacity: 0.58;
    }

    .recordFilters {
        display: flex;
        justify-content: center;
        gap: 4px;
        margin-top: 10px;
        flex-wrap: wrap;
    }

    .recordFilter {
        border: 1px solid var(--ccc);
        background: var(--f3f3f3);
        color: inherit;
        border-radius: 999px;
        padding: 4px 7px;
        font-size: 0.58rem;
        font-weight: 700;
        cursor: pointer;
    }

    .recordFilter.active {
        background: var(--blueTwo);
        border-color: var(--blueOne);
        color: #fff;
    }

    @media (max-width: 600px) {
        .managerCareerStats {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 20px auto 28px;
        }

        .careerStat {
            padding: 15px 8px;
        }

        .careerValue {
            font-size: 1.45rem;
        }
    }
</style>

<div class="managerCareerStats">
    <div class="careerStat">
        <div class="careerIcon">🏆</div>
        <div class="careerValue">{stats.championships}</div>
        <div class="careerLabel">Championships</div>
        <div class="careerSub">Legacy + Sleeper</div>
    </div>

    <div class="careerStat">
        <div class="careerIcon">🥇</div>
        <div class="careerValue">{stats.awards}</div>
        <div class="careerLabel">Awards</div>
        <div class="careerSub">Sleeper era</div>
    </div>

    <div class="careerStat">
        <div class="careerIcon">📊</div>
        <div class="careerValue">{recordText(selectedRecord)}</div>
        <div class="careerLabel">Career Record</div>
        <div class="recordFilters">
            <button class:active={recordView === 'all'} class="recordFilter" onclick={() => recordView = 'all'}>All-Time</button>
            <button class:active={recordView === 'sleeper'} class="recordFilter" onclick={() => recordView = 'sleeper'}>Sleeper</button>
            <button class:active={recordView === 'legacy'} class="recordFilter" onclick={() => recordView = 'legacy'}>Legacy</button>
        </div>
    </div>

    <div class="careerStat">
        <div class="careerIcon">🎯</div>
        <div class="careerValue">{stats.playoffAppearances}</div>
        <div class="careerLabel">Playoff Appearances</div>
        <div class="careerSub">Legacy {stats.legacyPlayoffAppearances} · Sleeper {stats.sleeperPlayoffAppearances}</div>
    </div>
</div>
