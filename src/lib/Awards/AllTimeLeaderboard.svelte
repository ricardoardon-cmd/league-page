<script>
    import { goto } from '$app/navigation';
    import { managers } from '$lib/utils/leagueInfo';
    import { getLegacyManagerCareer, getLegacySeason } from '$lib/utils/legacyHistory';
    import { checkIfManagerReceivedAward } from '$lib/utils/helperFunctions/universalFunctions';

    export let awards = [];
    export let records;
    export let leagueTeamManagers;

    let view = 'all';

    const legacyLookupName = (name) => {
        const normalized = String(name || '').trim().toLowerCase();
        if (normalized === 'pico' || normalized === 'picorico') return 'Pico';
        return name;
    };

    const legacyPlayoffCutoff = (teamCount) => {
        if (teamCount === 10) return 6;
        if (teamCount === 8 || teamCount === 6) return 4;
        return 0;
    };

    const getLegacyPlayoffAppearances = (legacyCareer) =>
        (legacyCareer?.seasonHistory || []).reduce((total, season) => {
            const seasonData = getLegacySeason(season.year);
            const cutoff = legacyPlayoffCutoff(seasonData?.teamCount || 0);
            return total + (cutoff && Number(season.finish) <= cutoff ? 1 : 0);
        }, 0);

    const getManagerID = (manager) => {
        if (manager?.managerID) return manager.managerID;

        const years = Object.keys(leagueTeamManagers?.teamManagersMap || {})
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => b - a);

        for (const year of years) {
            const roster = leagueTeamManagers?.teamManagersMap?.[year]?.[String(manager.roster)];
            const managerID = roster?.managers?.[0];
            if (managerID) return managerID;
        }

        return null;
    };

    const getSleeperChampionships = (managerID, rosterID) => {
        let championships = 0;

        for (const podium of awards || []) {
            if (!podium?.champion) continue;

            if (managerID) {
                if (checkIfManagerReceivedAward(
                    leagueTeamManagers,
                    podium.champion,
                    podium.year,
                    managerID
                )) {
                    championships++;
                }
            } else if (String(podium.champion) === String(rosterID)) {
                championships++;
            }
        }

        return championships;
    };

    const getSleeperRecord = (managerID) => {
        if (!managerID) return null;
        return records?.regularSeasonData?.leagueManagerRecords?.[managerID] || null;
    };

    const getSleeperPlayoffRecord = (managerID) => {
        if (!managerID) return null;
        return records?.playoffData?.leagueManagerRecords?.[managerID] || null;
    };

    const buildLeaderboard = () => managers.map((manager, index) => {
        const managerID = getManagerID(manager);
        const sleeperRecord = getSleeperRecord(managerID);
        const sleeperPlayoffRecord = getSleeperPlayoffRecord(managerID);
        const legacyCareer = getLegacyManagerCareer(legacyLookupName(manager.name));

        const sleeper = {
            wins: Number(sleeperRecord?.wins || 0),
            losses: Number(sleeperRecord?.losses || 0),
            ties: Number(sleeperRecord?.ties || 0),
            points: Number(sleeperRecord?.fptsFor || 0),
            championships: getSleeperChampionships(managerID, manager.roster),
            playoffAppearances: Number(sleeperPlayoffRecord?.playoffAppearances || 0)
        };

        const legacy = {
            wins: Number(legacyCareer?.wins || 0),
            losses: Number(legacyCareer?.losses || 0),
            ties: Number(legacyCareer?.ties || 0),
            championships: Number(legacyCareer?.championships || 0),
            playoffAppearances: getLegacyPlayoffAppearances(legacyCareer)
        };

        return {
            index,
            manager,
            managerID,
            sleeper,
            legacy,
            all: {
                wins: sleeper.wins + legacy.wins,
                losses: sleeper.losses + legacy.losses,
                ties: sleeper.ties + legacy.ties,
                championships: sleeper.championships + legacy.championships,
                playoffAppearances: sleeper.playoffAppearances + legacy.playoffAppearances
            }
        };
    });

    const winPercentage = (record) => {
        const games = record.wins + record.losses + record.ties;
        if (!games) return 0;
        return ((record.wins + (record.ties / 2)) / games) * 100;
    };

    const recordText = (record) =>
        `${record.wins}-${record.losses}${record.ties ? `-${record.ties}` : ''}`;

    const sortRows = (rows) => [...rows].sort((a, b) => {
        const aRecord = view === 'sleeper' ? a.sleeper : a.all;
        const bRecord = view === 'sleeper' ? b.sleeper : b.all;

        return (
            bRecord.championships - aRecord.championships ||
            bRecord.playoffAppearances - aRecord.playoffAppearances ||
            bRecord.wins - aRecord.wins ||
            winPercentage(bRecord) - winPercentage(aRecord) ||
            a.manager.name.localeCompare(b.manager.name)
        );
    });

    $: leaderboard = sortRows(buildLeaderboard());
</script>

<style>
    .leaderboardWrap {
        max-width: 980px;
        margin: 0 auto;
    }

    .filters {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 0 0 18px;
    }

    .filterButton {
        border: 1px solid var(--ccc);
        background: var(--f3f3f3);
        color: inherit;
        border-radius: 999px;
        padding: 8px 16px;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
    }

    .filterButton.active {
        background: var(--blueTwo);
        border-color: var(--blueOne);
        color: #fff;
    }

    .tableShell {
        width: 100%;
        overflow-x: auto;
        border: 1px solid var(--ccc);
        border-radius: 14px;
        background: var(--fff);
    }

    .leaderboard {
        width: 100%;
        min-width: 720px;
        border-collapse: collapse;
    }

    .leaderboard th {
        padding: 11px 10px;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        opacity: 0.58;
        text-align: center;
        border-bottom: 1px solid var(--ccc);
        background: var(--f3f3f3);
    }

    .leaderboard th.managerHead {
        text-align: left;
    }

    .managerRow {
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .managerRow:hover {
        background: var(--f3f3f3);
    }

    .managerRow td {
        padding: 13px 10px;
        border-bottom: 1px solid var(--ccc);
        text-align: center;
        font-size: 0.82rem;
    }

    .managerRow:last-child td {
        border-bottom: 0;
    }

    .rank {
        width: 48px;
        font-weight: 800;
        font-size: 1rem !important;
    }

    .managerCell {
        text-align: left !important;
        min-width: 185px;
    }

    .managerIdentity {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .managerPhoto {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--ccc);
        flex-shrink: 0;
    }

    .managerName {
        font-weight: 800;
        font-size: 0.9rem;
    }

    .titleCount {
        font-weight: 800;
    }

    .record {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
    }

    .points {
        white-space: nowrap;
    }

    .leaderboardNote {
        margin: 12px auto 0;
        text-align: center;
        font-size: 0.7rem;
        opacity: 0.58;
        max-width: 720px;
        line-height: 1.45;
    }

    @media (max-width: 700px) {
        .filterButton {
            padding: 7px 13px;
            font-size: 0.7rem;
        }

        .leaderboard {
            min-width: 650px;
        }

        .managerRow td {
            padding: 11px 8px;
        }
    }
</style>

<div class="leaderboardWrap">
    <div class="filters">
        <button
            class:active={view === 'all'}
            class="filterButton"
            onclick={() => view = 'all'}
        >
            All-Time
        </button>

        <button
            class:active={view === 'sleeper'}
            class="filterButton"
            onclick={() => view = 'sleeper'}
        >
            Sleeper
        </button>
    </div>

    <div class="tableShell">
        <table class="leaderboard">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th class="managerHead">Manager</th>
                    <th>Titles</th>
                    <th>Playoffs</th>
                    <th>Record</th>
                    <th>Win %</th>
                    {#if view === 'sleeper'}
                        <th>Points</th>
                    {/if}
                </tr>
            </thead>

            <tbody>
                {#each leaderboard as row, rank}
                    {@const selected = view === 'sleeper' ? row.sleeper : row.all}
                    <tr
                        class="managerRow"
                        onclick={() => goto(`/manager?manager=${row.index}`)}
                        title={`Open ${row.manager.name}'s manager profile`}
                    >
                        <td class="rank">
                            {#if rank === 0}🥇{:else if rank === 1}🥈{:else if rank === 2}🥉{:else}{rank + 1}{/if}
                        </td>

                        <td class="managerCell">
                            <div class="managerIdentity">
                                <img class="managerPhoto" src={row.manager.photo} alt={row.manager.name} />
                                <span class="managerName">{row.manager.name}</span>
                            </div>
                        </td>

                        <td class="titleCount">{selected.championships}</td>
                        <td>{selected.playoffAppearances}</td>
                        <td class="record">{recordText(selected)}</td>
                        <td>{winPercentage(selected).toFixed(1)}%</td>

                        {#if view === 'sleeper'}
                            <td class="points">{row.sleeper.points.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        {/if}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <p class="leaderboardNote">
        {#if view === 'all'}
            All-Time combines the reconstructed NFL Fantasy legacy era with Sleeper records. Legacy scoring totals are incomplete, so career points are intentionally omitted from this view.
        {:else}
            Sleeper view uses Sleeper-era championships, playoff appearances, regular-season record and fantasy points.
        {/if}
    </p>
</div>