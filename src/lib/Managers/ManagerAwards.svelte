<script>
    import { round } from '$lib/utils/helper';
    import { checkIfManagerReceivedAward, getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { getLegacyManagerSeasons, getLegacySeason } from '$lib/utils/legacyHistory';

    export let awards, records, rosterID, tookOver, leagueTeamManagers, managerID, managerName = '';

    let displayAwards = [];
    let formerGlobal = false;
    let expandedGroupKey = null;

    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

    const checkIfDeserves = (awardRosterID, userRosterID, year) => {
        if(!managerID || !year || !awardRosterID) return awardRosterID == userRosterID;
        return checkIfManagerReceivedAward(leagueTeamManagers, awardRosterID, year, managerID);
    };

    const checkIfDeservesWithManagerID = (recordManagerID, userRosterID) => {
        if(managerID) return recordManagerID == managerID;

        for(const year in leagueTeamManagers.teamManagersMap) {
            for(const historicalRosterID in leagueTeamManagers.teamManagersMap[year]) {
                if(leagueTeamManagers.teamManagersMap[year][historicalRosterID].managers.indexOf(recordManagerID) > -1) {
                    return historicalRosterID == userRosterID;
                }
            }
        }
        return false;
    };

    const addLegacyAwards = () => {
        const legacySeasons = getLegacyManagerSeasons(managerName);

        for(const legacy of legacySeasons) {
            const seasonData = getLegacySeason(legacy.year);

            if(legacy.finish === 1) {
                displayAwards.push({ award: 'Regular Season Champion', icon: '/awards/division.png', type: 'award', originalName: legacy.team, year: legacy.year, legacy: true });
            }
            if(legacy.champion) {
                displayAwards.push({ award: 'Champion', icon: '/awards/champion.png', type: 'award', originalName: legacy.team, year: legacy.year, legacy: true });
            }
            if(legacy.runnerUp) {
                displayAwards.push({ award: 'Second', icon: '/awards/second.png', type: 'award', originalName: legacy.team, year: legacy.year, legacy: true });
            }
            if(legacy.thirdPlace) {
                displayAwards.push({ award: 'Third', icon: '/awards/third.png', type: 'award', originalName: legacy.team, year: legacy.year, legacy: true });
            }
            if(legacy.mostPoints && seasonData?.mostPoints?.points != null) {
                displayAwards.push({
                    award: 'Points Leader',
                    icon: '/awards/record-1.png',
                    type: 'Legacy Season Points Leader',
                    originalName: legacy.team,
                    year: legacy.year,
                    extraInfo: seasonData.mostPoints.points,
                    legacy: true
                });
            }
            if(legacy.toiletBowlLoser) {
                displayAwards.push({ award: 'Toilet', icon: '/awards/toilet.png', type: 'award', originalName: legacy.team, year: legacy.year, legacy: true });
            }
        }
    };

    const computePodiums = (cRosterID, name) => {
        formerGlobal = false;
        displayAwards = [];
        expandedGroupKey = null;

        for(const podium of awards || []) {
            for(const award in podium) {
                if(award == 'year') continue;

                if(award == 'divisions') {
                    for(const division of podium[award]) {
                        if(checkIfDeserves(division.rosterID, cRosterID, podium.year)) {
                            const former = tookOver && tookOver > podium.year;
                            if(former) formerGlobal = true;

                            let awardTitle = 'Regular Season Champion';
                            if(division.name) awardTitle = `${division.name} Division Champion`;

                            displayAwards.push({
                                award: awardTitle,
                                icon: '/awards/division.png',
                                type: 'award',
                                originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, podium.year),
                                year: podium.year,
                                former
                            });
                        }
                    }
                } else if(checkIfDeserves(podium[award], cRosterID, podium.year)) {
                    const former = tookOver && tookOver > podium.year;
                    if(former) formerGlobal = true;

                    displayAwards.push({
                        award: capitalizeFirstLetter(award),
                        icon: '/awards/' + award + '.png',
                        type: 'award',
                        originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, podium.year),
                        year: podium.year,
                        former
                    });
                }
            }
        }

        const leagueManagerRecords = [];
        for(const key in records?.regularSeasonData?.leagueManagerRecords || {}) {
            const record = records.regularSeasonData.leagueManagerRecords[key];
            leagueManagerRecords.push({ ...record, rosterID: key });
        }

        const winRecords = [...leagueManagerRecords].sort((a, b) => b.wins - a.wins);
        const pointsRecords = [...leagueManagerRecords].sort((a, b) => b.fptsFor - a.fptsFor);
        const iqRecords = [...leagueManagerRecords].sort((a, b) => (b.fptsFor / b.potentialPoints) - (a.fptsFor / a.potentialPoints));
        const leagueWeekHighs = records?.regularSeasonData?.leagueWeekHighs || [];
        const seasonLongPoints = records?.regularSeasonData?.mostSeasonLongPoints || [];

        for(let i = 0; i < leagueWeekHighs.length; i++) {
            const leagueWeekRecord = leagueWeekHighs[i];
            const seasonLongRecord = seasonLongPoints[i];
            const winRecord = winRecords[i];
            const pointsRecord = pointsRecords[i];
            const iqRecord = iqRecords[i];

            if(checkIfDeservesWithManagerID(winRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({ award: i + 1, icon: '/awards/record-' + (i + 1) + '.png', type: 'All-Time Wins Record', extraInfo: winRecord.wins, wins: true });
            }
            if(checkIfDeservesWithManagerID(pointsRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({ award: i + 1, icon: '/awards/record-' + (i + 1) + '.png', type: 'All-Time Fantasy Points Record', extraInfo: round(pointsRecord.fptsFor) });
            }
            if(checkIfDeservesWithManagerID(iqRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({ award: i + 1, icon: '/awards/record-' + (i + 1) + '.png', type: 'All-Time Lineup IQ Record', extraInfo: round(iqRecord.fptsFor * 100 / iqRecord.potentialPoints), iq: true });
            }

            if(leagueWeekRecord && checkIfDeserves(leagueWeekRecord.rosterID, cRosterID, leagueWeekRecord.year)) {
                const former = tookOver && tookOver > leagueWeekRecord.year;
                if(former) formerGlobal = true;
                displayAwards.push({
                    award: i + 1,
                    icon: '/awards/' + (i < 3 ? `record-${i + 1}` : 'generic') + '.png',
                    type: 'All-Time Single Week Record',
                    originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, leagueWeekRecord.year),
                    year: leagueWeekRecord.year,
                    week: leagueWeekRecord.week,
                    extraInfo: leagueWeekRecord.fpts,
                    former
                });
            }

            if(seasonLongRecord && checkIfDeserves(seasonLongRecord.rosterID, cRosterID, seasonLongRecord.year)) {
                const former = tookOver && tookOver > seasonLongRecord.year;
                if(former) formerGlobal = true;
                displayAwards.push({
                    award: i + 1,
                    icon: '/awards/' + (i < 3 ? `record-${i + 1}` : 'generic') + '.png',
                    type: 'All-Time Season Long Points',
                    originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, seasonLongRecord.year),
                    year: seasonLongRecord.year,
                    extraInfo: seasonLongRecord.fpts,
                    former
                });
            }
        }

        for(const yearRecords of records?.regularSeasonData?.seasonWeekRecords || []) {
            for(let i = 0; i < Math.min(3, yearRecords.seasonPointsHighs?.length || 0); i++) {
                const seasonPointsRecord = yearRecords.seasonPointsHighs[i];
                if(checkIfDeserves(seasonPointsRecord.rosterID, cRosterID, yearRecords.year)) {
                    const former = tookOver && tookOver > yearRecords.year;
                    if(former) formerGlobal = true;
                    displayAwards.push({
                        award: i + 1,
                        icon: '/awards/' + (i < 3 ? `record-${i + 1}` : 'generic') + '.png',
                        type: `${yearRecords.year} Single Week Record`,
                        originalName: getTeamNameFromTeamManagers(leagueTeamManagers, cRosterID, seasonPointsRecord.year),
                        year: null,
                        week: seasonPointsRecord.week,
                        extraInfo: seasonPointsRecord.fpts,
                        former
                    });
                }
            }
        }

        if(name) addLegacyAwards();

        displayAwards.sort((a, b) => {
            if(a.year && b.year && a.year !== b.year) return b.year - a.year;
            if(a.legacy !== b.legacy) return a.legacy ? 1 : -1;
            return 0;
        });
    };

    $: computePodiums(rosterID, managerName);

    const computeAward = (award) => {
        switch (award) {
            case 1: return '1st Place';
            case 2: return '2nd Place';
            case 3: return '3rd Place';
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10: return award + 'th Place';
            case 'Champion': return award;
            case 'Second':
            case 'Third': return award + ' Place';
            case 'Toilet': return award + ' Bowl';
            default: return award;
        }
    };

    const groupLabel = (award) => {
        if(award.type === 'award') return computeAward(award.award);
        return award.type.replace(/^\d{4}\s+/, '');
    };

    const groupKey = (award) => `${groupLabel(award)}|${award.icon}`;

    const groupAwards = (items) => {
        const groups = new Map();

        for(const award of items) {
            const key = groupKey(award);
            if(!groups.has(key)) {
                groups.set(key, {
                    key,
                    label: groupLabel(award),
                    icon: award.icon,
                    items: []
                });
            }
            groups.get(key).items.push(award);
        }

        return [...groups.values()].sort((a, b) => {
            const aYear = Math.max(...a.items.map((item) => Number(item.year) || 0));
            const bYear = Math.max(...b.items.map((item) => Number(item.year) || 0));
            return bYear - aYear;
        });
    };

    $: groupedAwards = groupAwards(displayAwards);
    $: expandedGroup = groupedAwards.find((group) => group.key === expandedGroupKey) || null;

    const toggleGroup = (key) => {
        expandedGroupKey = expandedGroupKey === key ? null : key;
    };
</script>

<style>
    .awardsCase {
        background-color: var(--fff);
        padding: 0 0 2em;
        margin: 3em 0 4em;
        border-bottom: 1px solid var(--aaa);
        border-top: 1px solid var(--aaa);
        box-shadow: 0 0 8px 4px var(--ccc);
    }

    .awardsCaseInner {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
        gap: 18px 12px;
        max-width: 1000px;
        margin: 0 auto;
        padding: 1.2em 1em .5em;
    }

    h3 {
        text-align: center;
        font-size: 1.5em;
        margin: 1.5em 0 0.5em;
        font-weight: 200;
    }

    .groupButton {
        appearance: none;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        padding: 0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 0;
    }

    .groupButton:hover .awardIcon,
    .groupButton:focus-visible .awardIcon,
    .groupButton.active .awardIcon {
        box-shadow: 0 0 0 2px var(--blueOne), 0 4px 12px var(--ccc);
        transform: translateY(-2px);
    }

    .groupButton:focus-visible { outline: none; }

    .groupLabel {
        width: 110px;
        min-height: 2.4em;
        margin-bottom: .5em;
        text-align: center;
        font-size: .78em;
        font-weight: 600;
        line-height: 1.15em;
    }

    .iconWrap { position: relative; }

    .awardIcon {
        height: 80px;
        width: 80px;
        border-radius: 100%;
        box-shadow: 0 0 4px 1px var(--ccc);
        text-align: center;
        overflow: hidden;
        transition: transform .15s ease, box-shadow .15s ease;
    }

    .awardImage { height: 100%; }

    .countBadge {
        position: absolute;
        top: -8px;
        right: -10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 27px;
        height: 27px;
        padding: 0 5px;
        box-sizing: border-box;
        border-radius: 999px;
        background: var(--blueTwo);
        border: 2px solid var(--fff);
        color: #fff;
        font-size: .72rem;
        font-weight: 800;
        box-shadow: 0 2px 6px rgba(0,0,0,.22);
    }

    .tapHint {
        margin-top: 8px;
        font-size: .62em;
        color: var(--g999);
        text-transform: uppercase;
        letter-spacing: .5px;
    }

    .detailsPanel {
        max-width: 920px;
        margin: 1em auto .5em;
        padding: 18px;
        border: 1px solid var(--ccc);
        border-radius: 16px;
        background: var(--f3f3f3);
    }

    .detailsTitle {
        text-align: center;
        margin: 0 0 14px;
        font-size: 1rem;
        font-weight: 800;
    }

    .detailsGrid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
    }

    .detailItem {
        padding: 12px 10px;
        border: 1px solid var(--ccc);
        border-radius: 12px;
        background: var(--fff);
        text-align: center;
    }

    .awardLabel {
        font-size: .9em;
        font-weight: 700;
        line-height: 1.2em;
    }

    .subText, .legacyTeam {
        font-size: .78em;
        color: var(--g555);
        margin-top: .35em;
        font-style: italic;
        line-height: 1.25em;
    }

    .legacyBadge {
        display: inline-block;
        margin-top: .45em;
        padding: 2px 7px;
        border: 1px solid var(--ccc);
        border-radius: 999px;
        font-size: .58em;
        font-weight: 700;
        letter-spacing: .4px;
        text-transform: uppercase;
        opacity: .7;
    }

    .sad, .disclaimer {
        color: var(--g999);
        font-style: italic;
        text-align: center;
    }

    .disclaimer { font-size: .8em; margin: 1em 0 0; }

    @media (max-width: 530px) {
        .awardsCaseInner {
            grid-template-columns: repeat(3, 1fr);
            gap: 18px 6px;
            padding-left: .5em;
            padding-right: .5em;
        }

        .awardIcon { height: 60px; width: 60px; }
        .groupLabel { width: 82px; font-size: .66em; }
        .countBadge { min-width: 23px; height: 23px; font-size: .64rem; top: -7px; right: -8px; }
        .tapHint { font-size: .54em; }
        .detailsPanel { margin-left: 10px; margin-right: 10px; padding: 12px; }
        .detailsGrid { grid-template-columns: 1fr 1fr; }
    }
</style>

<div class="awardsCase">
    <h3>Team Awards & Records</h3>

    <div class="awardsCaseInner">
        {#each groupedAwards as group}
            <button
                type="button"
                class:active={expandedGroupKey === group.key}
                class="groupButton"
                onclick={() => toggleGroup(group.key)}
                aria-expanded={expandedGroupKey === group.key}
            >
                <div class="groupLabel">{group.label}</div>
                <div class="iconWrap">
                    <div class="awardIcon">
                        <img class="awardImage" src={group.icon} alt={group.label} />
                    </div>
                    {#if group.items.length > 1}
                        <span class="countBadge">×{group.items.length}</span>
                    {/if}
                </div>
                <div class="tapHint">Tap for details</div>
            </button>
        {:else}
            <p class="sad">...nothing yet</p>
        {/each}
    </div>

    {#if expandedGroup}
        <div class="detailsPanel">
            <div class="detailsTitle">{expandedGroup.label}</div>
            <div class="detailsGrid">
                {#each expandedGroup.items as award}
                    <div class="detailItem">
                        <div class="awardLabel">
                            {award.type == 'award' ? `${award.year} ` : ''}{computeAward(award.award)}{award.former ? '*' : ''}
                        </div>
                        {#if award.type != 'award'}
                            <div class="subText">{award.type}</div>
                        {/if}
                        {#if award.extraInfo}
                            <div class="subText">
                                {award.year ? `${award.year} ` : ''}{award.week ? `Week ${award.week} ` : ''}{award.year || award.week ? ' - ' : ''}{award.extraInfo}{award.wins ? ' Wins' : ''}{award.iq ? '%' : ''}{!award.wins && !award.iq ? 'pts' : ''}
                            </div>
                        {/if}
                        {#if award.originalName}
                            <div class="legacyTeam">{award.originalName}</div>
                        {/if}
                        {#if award.legacy}
                            <div class="legacyBadge">Legacy Era</div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if formerGlobal}
        <p class="disclaimer">*Awarded under a previous manager</p>
    {/if}
</div>