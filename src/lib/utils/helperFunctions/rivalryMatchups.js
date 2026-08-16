import { getLeagueData } from "./leagueData";
import { leagueID } from '$lib/utils/leagueInfo';
import { getNflState } from "./nflState";
import { waitForAll } from './multiPromise';
import {
    getRosterIDFromManagerIDAndYear
} from '$lib/utils/helperFunctions/universalFunctions';
import { getLeagueTeamManagers } from "./leagueTeamManagers";


export const getRivalryMatchups = async (
    userOneID,
    userTwoID
) => {

    if (!userOneID || !userTwoID) {
        return;
    }


    let curLeagueID = leagueID;


    const [nflState, teamManagers] =
        await waitForAll(
            getNflState(),
            getLeagueTeamManagers()
        ).catch((err) => {
            console.error(err);
        });


    let week = 1;

    if (nflState.season_type == 'regular') {

        week = nflState.display_week;

    } else if (
        nflState.season_type == 'post'
    ) {

        week = 18;

    }


    const rivalry = {

        points: {
            one: 0,
            two: 0
        },

        wins: {
            one: 0,
            two: 0
        },

        ties: 0,

        matchups: []

    };


    while (
        curLeagueID &&
        curLeagueID != 0
    ) {

        const leagueData =
            await getLeagueData(
                curLeagueID
            ).catch((err) => {
                console.error(err);
            });


        if (!leagueData) {
            break;
        }


        const year =
            leagueData.season;


        const rosterIDOne =
            getRosterIDFromManagerIDAndYear(
                teamManagers,
                userOneID,
                year
            );


        const rosterIDTwo =
            getRosterIDFromManagerIDAndYear(
                teamManagers,
                userTwoID,
                year
            );


        if (
            !rosterIDOne ||
            !rosterIDTwo ||
            rosterIDOne == rosterIDTwo
        ) {

            curLeagueID =
                leagueData.previous_league_id;

            week = 18;

            continue;
        }


        const playoffWeekStart =
            Number(
                leagueData
                    ?.settings
                    ?.playoff_week_start
            );


        /*
         * =====================================================
         * REGULAR SEASON
         * =====================================================
         */

        const regularSeasonPromises = [];


        if (
            playoffWeekStart &&
            playoffWeekStart > 1
        ) {

            for (
                let i = 1;
                i < playoffWeekStart;
                i++
            ) {

                regularSeasonPromises.push(
                    fetch(
                        `https://api.sleeper.app/v1/league/${curLeagueID}/matchups/${i}`,
                        {
                            compress: true
                        }
                    )
                );

            }

        }


        const regularSeasonResponses =
            regularSeasonPromises.length
                ? await waitForAll(
                    ...regularSeasonPromises
                )
                : [];


        const regularSeasonJsonPromises = [];


        for (
            const matchupRes
            of regularSeasonResponses
        ) {

            if (
                !matchupRes ||
                !matchupRes.ok
            ) {

                console.error(
                    'Unable to load rivalry matchup',
                    matchupRes
                );

                continue;
            }


            regularSeasonJsonPromises.push(
                matchupRes.json()
            );

        }


        const regularSeasonData =
            regularSeasonJsonPromises.length
                ? await waitForAll(
                    ...regularSeasonJsonPromises
                )
                : [];


        for (
            let i = 0;
            i < regularSeasonData.length;
            i++
        ) {

            const matchupWeek =
                i + 1;


            const processed =
                processRivalryMatchups(
                    regularSeasonData[i],
                    matchupWeek,
                    rosterIDOne,
                    rosterIDTwo
                );


            addRivalryResult({
                processed,
                rivalry,
                year
            });

        }


        /*
         * =====================================================
         * PLAYOFFS
         *
         * Only use Sleeper's WINNERS bracket.
         * This prevents consolation / toilet-bowl matchups
         * from being counted in the rivalry record.
         * =====================================================
         */

        let winnersBracket = [];


        try {

            const bracketResponse =
                await fetch(
                    `https://api.sleeper.app/v1/league/${curLeagueID}/winners_bracket`,
                    {
                        compress: true
                    }
                );


            if (bracketResponse.ok) {

                winnersBracket =
                    await bracketResponse.json();

            }

        } catch (err) {

            console.error(
                'Unable to load playoff bracket',
                err
            );

        }


        if (
            playoffWeekStart &&
            winnersBracket &&
            winnersBracket.length
        ) {

            const playoffRounds =
                [
                    ...new Set(
                        winnersBracket
                            .map(
                                (matchup) =>
                                    Number(
                                        matchup.r
                                    )
                            )
                            .filter(
                                (round) =>
                                    Number.isFinite(
                                        round
                                    )
                            )
                    )
                ]
                    .sort(
                        (a, b) =>
                            a - b
                    );


            const playoffPromises =
                playoffRounds.map(
                    (round) => {

                        const matchupWeek =
                            playoffWeekStart +
                            round -
                            1;


                        return fetch(
                            `https://api.sleeper.app/v1/league/${curLeagueID}/matchups/${matchupWeek}`,
                            {
                                compress: true
                            }
                        );

                    }
                );


            const playoffResponses =
                playoffPromises.length
                    ? await waitForAll(
                        ...playoffPromises
                    )
                    : [];


            for (
                let i = 0;
                i < playoffResponses.length;
                i++
            ) {

                const response =
                    playoffResponses[i];


                if (
                    !response ||
                    !response.ok
                ) {

                    continue;

                }


                const round =
                    playoffRounds[i];


                /*
                 * First verify these two teams actually met
                 * in Sleeper's winners bracket in this round.
                 */
                const playoffMeeting =
                    isWinnersBracketMatchup(
                        winnersBracket,
                        round,
                        rosterIDOne,
                        rosterIDTwo
                    );


                if (!playoffMeeting) {
                    continue;
                }


                const matchupWeek =
                    playoffWeekStart +
                    round -
                    1;


                const matchupData =
                    await response.json();


                const processed =
                    processRivalryMatchups(
                        matchupData,
                        matchupWeek,
                        rosterIDOne,
                        rosterIDTwo
                    );


                addRivalryResult({
                    processed,
                    rivalry,
                    year
                });

            }

        }


        curLeagueID =
            leagueData.previous_league_id;


        week = 18;

    }


    rivalry.matchups.sort(
        (a, b) => {

            const yearOrder =
                b.year - a.year;

            const weekOrder =
                b.week - a.week;

            return (
                yearOrder ||
                weekOrder
            );

        }
    );


    return rivalry;
};



const addRivalryResult = ({
    processed,
    rivalry,
    year
}) => {

    if (!processed) {
        return;
    }


    const {
        matchup,
        week
    } = processed;


    const sideA =
        matchup[0];

    const sideB =
        matchup[1];


    const sideAPoints =
        (sideA.points || [])
            .reduce(
                (total, score) =>
                    total +
                    Number(score || 0),
                0
            );


    const sideBPoints =
        (sideB.points || [])
            .reduce(
                (total, score) =>
                    total +
                    Number(score || 0),
                0
            );


    rivalry.points.one +=
        sideAPoints;

    rivalry.points.two +=
        sideBPoints;


    if (
        sideAPoints >
        sideBPoints
    ) {

        rivalry.wins.one++;

    } else if (
        sideAPoints <
        sideBPoints
    ) {

        rivalry.wins.two++;

    } else {

        rivalry.ties++;

    }


    rivalry.matchups.push({

        week,

        year,

        matchup

    });

};



const isWinnersBracketMatchup = (
    bracket,
    round,
    rosterIDOne,
    rosterIDTwo
) => {

    const rosterOne =
        Number(rosterIDOne);

    const rosterTwo =
        Number(rosterIDTwo);


    return bracket.some(
        (bracketMatchup) => {

            if (
                Number(
                    bracketMatchup.r
                ) !== Number(round)
            ) {
                return false;
            }


            /*
             * For completed playoff games, w/l give us both
             * participants even when t1/t2 were originally
             * populated from previous bracket games.
             */
            const participants =
                [
                    bracketMatchup.t1,
                    bracketMatchup.t2,
                    bracketMatchup.w,
                    bracketMatchup.l
                ]
                    .map(
                        (value) =>
                            Number(value)
                    )
                    .filter(
                        (value) =>
                            Number.isFinite(
                                value
                            )
                    );


            return (
                participants.includes(
                    rosterOne
                ) &&
                participants.includes(
                    rosterTwo
                )
            );

        }
    );

};



const processRivalryMatchups = (
    inputMatchups,
    week,
    rosterIDOne,
    rosterIDTwo
) => {

    if (
        !inputMatchups ||
        inputMatchups.length == 0
    ) {
        return false;
    }


    const matchups = {};


    for (
        const match
        of inputMatchups
    ) {

        if (
            match.roster_id ==
                rosterIDOne ||
            match.roster_id ==
                rosterIDTwo
        ) {

            if (
                !matchups[
                    match.matchup_id
                ]
            ) {

                matchups[
                    match.matchup_id
                ] = [];

            }


            const starterPoints = Array.isArray(match.starters_points)
                ? match.starters_points
                : (match.starters || []).map((playerID) =>
                    Number(match.players_points?.[playerID]) || 0
                );


            matchups[
                match.matchup_id
            ].push({

                roster_id:
                    match.roster_id,

                starters:
                    match.starters,

                // Keep the original rivalry shape for totals/history cards.
                points:
                    starterPoints,

                // Also keep the standard Sleeper field so Matchup.svelte can
                // render the actual per-player scores instead of projections only.
                starters_points:
                    starterPoints

            });

        }

    }


    const keys =
        Object.keys(
            matchups
        );


    if (!keys.length) {
        return;
    }


    const matchup =
        matchups[
            keys[0]
        ];


    /*
     * If both teams were not in the same matchup,
     * this is not a head-to-head game.
     */
    if (
        keys.length > 1 ||
        !matchup ||
        matchup.length < 2
    ) {
        return;
    }


    /*
     * Keep manager one as the first side.
     */
    if (
        matchup[0].roster_id ==
        rosterIDTwo
    ) {

        const two =
            matchup.shift();

        matchup.push(two);

    }


    return {
        matchup,
        week
    };

};