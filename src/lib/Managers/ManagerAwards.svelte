<script>
    import { round } from '$lib/utils/helper';
    import { checkIfManagerReceivedAward, getTeamNameFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { getLegacyManagerSeasons, getLegacySeason } from '$lib/utils/legacyHistory';

    export let awards, records, rosterID, tookOver, leagueTeamManagers, managerID, managerName = '';

    let displayAwards = [];
    let formerGlobal = false;

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
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

    const addLegacyAwards = () => {
        const legacySeasons = getLegacyManagerSeasons(managerName);

        for(const legacy of legacySeasons) {
            const seasonData = getLegacySeason(legacy.year);

            // Regular-season first place is a real legacy accolade too.
            if(legacy.finish === 1) {
                displayAwards.push({
                    award: 'Regular Season Champion',
                    icon: '/awards/division.png',
                    type: 'award',
                    originalName: legacy.team,
                    year: legacy.year,
                    legacy: true
                });
            }

            if(legacy.champion) {
                displayAwards.push({
                    award: 'Champion',
                    icon: '/awards/champion.png',
                    type: 'award',
                    originalName: legacy.team,
                    year: legacy.year,
                    legacy: true
                });
            }

            if(legacy.runnerUp) {
                displayAwards.push({
                    award: 'Second',
                    icon: '/awards/second.png',
                    type: 'award',
                    originalName: legacy.team,
                    year: legacy.year,
                    legacy: true
                });
            }

            if(legacy.thirdPlace) {
                displayAwards.push({
                    award: 'Third',
                    icon: '/awards/third.png',
                    type: 'award',
                    originalName: legacy.team,
                    year: legacy.year,
                    legacy: true
                });
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
                displayAwards.push({
                    award: 'Toilet',
                    icon: '/awards/toilet.png',
                    type: 'award',
                    originalName: legacy.team,
                    year: legacy.year,
                    legacy: true
                });
            }
        }
    };

    const computePodiums = (cRosterID, name) => {
        formerGlobal = false;
        displayAwards = [];

        // Sleeper-era annual awards.
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

        // Sleeper-era record book entries.
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
                displayAwards.push({
                    award: i + 1,
                    icon: '/awards/record-' + (i + 1) + '.png',
                    type: 'All-Time Wins Record',
                    extraInfo: winRecord.wins,
                    wins: true
                });
            }

            if(checkIfDeservesWithManagerID(pointsRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({
                    award: i + 1,
                    icon: '/awards/record-' + (i + 1) + '.png',
                    type: 'All-Time Fantasy Points Record',
                    extraInfo: round(pointsRecord.fptsFor)
                });
            }

            if(checkIfDeservesWithManagerID(iqRecord?.rosterID, cRosterID) && i < 3) {
                displayAwards.push({
                    award: i + 1,
                    icon: '/awards/record-' + (i + 1) + '.png',
                    type: 'All-Time Lineup IQ Record',
                    extraInfo: round(iqRecord.fptsFor * 100 / iqRecord.potentialPoints),
                    iq: true
                });
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

        // Add the reconstructed 2012-2022 NFL Fantasy accolades to the same case.
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
            case 10:
                return award + 'th Place';
            case 'Champion': return award;
            case 'Second':
            case 'Third': return award + ' Place';
            case 'Toilet': return award + ' Bowl';
            default: return award;
        }
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
        display: flex;
        justify-content: space-evenly;
        flex-wrap: wrap;
    }

    h3 {
        text-align: center;
        font-size: 1.5em;
        margin: 1.5em 0 0.5em;
        font-weight: 200;
    }

    .award {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        margin: 1em 0.5em 2em;
    }

    .awardHeader, .awardLabel, .subText, .legacyTeam {
        text-align: center;
        line-height: 1.2em;
    }

    .awardHeader {
        height: 2.4em;
        font-size: 0.85em;
        width: 110px;
        margin-bottom: 0.5em;
    }

    .awardLabel {
        font-size: 0.9em;
        margin-top: 1em;
        font-weight: 500;
        width: 130px;
    }

    .subText, .legacyTeam {
        font-size: 0.8em;
        width: 130px;
        color: var(--g555);
        margin-top: 0.3em;
        font-style: italic;
    }

    .legacyBadge {
        display: inline-block;
        margin-top: 0.35em;
        padding: 2px 7px;
        border: 1px solid var(--ccc);
        border-radius: 999px;
        font-size: 0.58em;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        opacity: 0.7;
    }

    .sad {
        color: var(--g999);
        font-style: italic;
    }

    .awardIcon {
        height: 80px;
        width: 80px;
        border-radius: 100%;
        box-shadow: 0 0 4px 1px var(--ccc);
        text-align: center;
        overflow: hidden;
    }

    .awardImage {
        height: 100%;
    }

    .disclaimer {
        font-size: 0.8em;
        color: var(--g999);
        font-style: italic;
        text-align: center;
        margin: 0;
        line-height: 1em;
    }

    @media (max-width: 730px) {
        .awardHeader {
            height: 3.6em;
            font-size: 0.8em;
            width: 90px;
        }

        .awardLabel, .subText, .legacyTeam {
            width: 90px;
        }
    }

    @media (max-width: 530px) {
        .awardIcon {
            height: 60px;
            width: 60px;
        }

        .awardHeader {
            height: 3.6em;
            font-size: 0.58em;
            width: 65px;
        }

        .awardLabel {
            font-size: 0.7em;
            width: 65px;
        }

        .subText, .legacyTeam {
            font-size: 0.6em;
            width: 65px;
        }
    }
</style>

<div class="awardsCase">
    <h3>Team Awards & Records</h3>
    <div class="awardsCaseInner">
        {#each displayAwards as award}
            <div class="award">
                <div class="awardHeader">{award.type != 'award' ? award.type : ''}</div>
                <div class="awardIcon">
                    <img class="awardImage" src="{award.icon}" alt="trophy" />
                </div>
                <div class="awardLabel">
                    {award.type == 'award' ? `${award.year} ` : ''}{computeAward(award.award)}{award.former ? '*' : ''}
                </div>
                {#if award.extraInfo}
                    <div class="subText">
                        {award.year ? `${award.year} ` : ''}{award.week ? `Week ${award.week} ` : ''}{award.year || award.week ? ' - ' : ''}{award.extraInfo}{award.wins ? ' Wins' : ''}{award.iq ? '%' : ''}{!award.wins && !award.iq ? 'pts' : ''}
                    </div>
                {/if}
                {#if award.legacy && award.originalName}
                    <div class="legacyTeam">{award.originalName}</div>
                    <div class="legacyBadge">Legacy Era</div>
                {/if}
            </div>
        {:else}
            <p class="sad">...nothing yet</p>
        {/each}
    </div>
    {#if formerGlobal}
        <p class="disclaimer">*Awarded under a previous manager</p>
    {/if}
</div>
