import { managers } from '$lib/utils/leagueInfo.js';

const normalize = (value) => String(value || '').trim().toLowerCase();
const num = (value) => Number(value) || 0;

const NFL_NAMES = {
    ari:'Cardinals', atl:'Falcons', bal:'Ravens', buf:'Bills', car:'Panthers', chi:'Bears', cin:'Bengals', cle:'Browns',
    dal:'Cowboys', den:'Broncos', det:'Lions', gb:'Packers', hou:'Texans', ind:'Colts', jax:'Jaguars', kc:'Chiefs',
    lv:'Raiders', la:'Rams', lac:'Chargers', mia:'Dolphins', min:'Vikings', ne:'Patriots', no:'Saints', nyg:'Giants',
    nyj:'Jets', phi:'Eagles', pit:'Steelers', sea:'Seahawks', sf:'49ers', tb:'Buccaneers', ten:'Titans', was:'Commanders'
};

const managerForRoster = (rosterId) => (managers || []).find((manager) => Number(manager?.roster) === Number(rosterId));
const teamName = (abbr) => NFL_NAMES[normalize(abbr)] || String(abbr || '').toUpperCase();
const playerName = (player, id) => {
    if (!player) return `Player ${id}`;
    if ((player.pos || player.position) === 'DEF') return player.ln || player.fn || String(id).toUpperCase();
    return `${player.fn || player.first_name || ''} ${player.ln || player.last_name || ''}`.trim() || `Player ${id}`;
};
const projection = (player, week) => num(player?.wi?.[week]?.p);
const actualPoints = (entry, starterId) => {
    const starters = entry?.starters || [];
    const points = entry?.points || [];
    const index = starters.findIndex((id) => String(id) === String(starterId));
    return index >= 0 ? num(points[index]) : 0;
};
const variant = (manager, playerId, week, phase) => {
    const phaseValue = phase === 'live' ? 7 : phase === 'postgame' ? 13 : 3;
    return (Number(manager?.roster || 0) * 11 + Number(playerId || 0) + Number(week || 0) * 5 + phaseValue) % 4;
};

const opposingMatches = (managerEntry, opponentEntry, players, week) => {
    const manager = managerForRoster(managerEntry?.roster_id);
    if (!manager?.favoriteTeam) return [];
    const favorite = normalize(manager.favoriteTeam);
    return (opponentEntry?.starters || [])
        .map((id) => {
            const player = players?.[id];
            if (!player || normalize(player.t || player.team) !== favorite) return null;
            return {
                id,
                name: playerName(player, id),
                projection: projection(player, week),
                points: actualPoints(opponentEntry, id),
                manager,
                nflTeam: teamName(favorite)
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.projection - a.projection || b.points - a.points);
};

export const getFavoriteTeamConflicts = (firstEntry, secondEntry, players = {}, week) => {
    const conflicts = [
        ...opposingMatches(firstEntry, secondEntry, players, week),
        ...opposingMatches(secondEntry, firstEntry, players, week)
    ];
    return conflicts.sort((a, b) => Math.max(b.projection, b.points) - Math.max(a.projection, a.points));
};

export const favoriteTeamStory = (firstEntry, secondEntry, players = {}, week, phase = 'pregame') => {
    const conflicts = getFavoriteTeamConflicts(firstEntry, secondEntry, players, week);
    if (!conflicts.length) return null;

    const candidate = conflicts.find((item) => {
        if (phase === 'pregame') return item.projection >= 7;
        if (phase === 'live') return item.points >= 4 || (item.points > 0 && item.projection >= 8);
        return item.points >= 8;
    });
    if (!candidate) return null;

    const { manager, name, nflTeam, projection: projected, points, id } = candidate;
    const v = variant(manager, id, week, phase);

    if (phase === 'live') {
        const variants = [
            `${manager.name} is getting the worst kind of production from the ${nflTeam}. ${name} has ${points} fantasy points for the opponent, turning a player from ${manager.name}'s favorite NFL team into an enemy for the night.`,
            `This is a brutal loyalty test for ${manager.name}. ${name} is wearing ${nflTeam} colors and has already scored ${points} points for the other fantasy sideline. Every real-life celebration comes with a fantasy-football price.`,
            `${manager.name} normally wants the ${nflTeam} to eat. Tonight, not like this. ${name} has put up ${points} points for the opponent and is making every positive play feel a little complicated.`,
            `Friendly fire is officially in play. ${name} has scored ${points} points against ${manager.name} while representing the ${nflTeam}, the NFL team ${manager.name} usually roots for.`
        ];
        return { label: v % 2 ? '😬 Fan’s Nightmare' : '💔 Friendly Fire', text: variants[v], conflict: candidate };
    }

    if (phase === 'postgame') {
        const firstScore = (firstEntry?.points || []).reduce((t, value) => t + num(value), 0);
        const secondScore = (secondEntry?.points || []).reduce((t, value) => t + num(value), 0);
        const managerWasFirst = Number(manager.roster) === Number(firstEntry?.roster_id);
        const managerScore = managerWasFirst ? firstScore : secondScore;
        const opponentScore = managerWasFirst ? secondScore : firstScore;
        const lost = managerScore < opponentScore;
        const variantsLost = [
            `${manager.name}'s own ${nflTeam} helped hand out the pain. ${name} scored ${points} fantasy points from the opposing lineup, and ${manager.name} still walked away with the loss. That is friendly fire at its cruelest.`,
            `${manager.name} got burned by one of his own. ${name} delivered ${points} points for the opponent while wearing ${nflTeam} colors, helping turn NFL loyalty into fantasy misery.`,
            `The ${nflTeam} gave ${manager.name} something to cheer in real life and something to curse in fantasy. ${name}'s ${points} points landed on the wrong side of the matchup and helped send ${manager.name} to defeat.`,
            `${name} became the nightmare scenario for ${manager.name}: a ${nflTeam} player producing exactly the kind of game a fan wants, except those ${points} fantasy points belonged to the opponent.`
        ];
        const variantsWon = [
            `${manager.name} survived some friendly fire from the ${nflTeam}. ${name} scored ${points} points for the opponent, but ${manager.name} still escaped with the win.`,
            `${name} tried to make ${manager.name} pay for rooting for the ${nflTeam}, dropping ${points} fantasy points from the other lineup. It was not enough — ${manager.name} survived.`,
            `${manager.name} had to root against a little piece of the ${nflTeam} this week. ${name} scored ${points} for the opponent, but the loyalty test ended with a fantasy victory anyway.`,
            `Love you on Sundays, just not in this matchup. ${name} gave the opponent ${points} points for the ${nflTeam}, and ${manager.name} still found a way to win through the friendly fire.`
        ];
        return { label: lost ? '💀 Betrayed By His Own' : '😂 Love You, But Not Today', text: (lost ? variantsLost : variantsWon)[v], conflict: candidate };
    }

    const variants = [
        `${manager.name} has a loyalty problem waiting in this matchup. ${name}, a member of the ${nflTeam}, is projected for ${projected} points in the opposing lineup. Real-life rooting interests may have to wait until the fantasy scoreboard is settled.`,
        `${manager.name} may have to root against one of his own. ${name} plays for the ${nflTeam}, ${manager.name}'s favorite NFL team, but enters this fantasy matchup projected for ${projected} points on the other side.`,
        `The fantasy gods have handed ${manager.name} a loyalty test. ${name} represents the ${nflTeam} in real life and the enemy lineup in fantasy, carrying a ${projected}-point projection into the matchup.`,
        `${manager.name} usually wants big things from the ${nflTeam}. This week comes with an exception: ${name} is projected for ${projected} points for the opponent, creating some very uncomfortable rooting interests.`
    ];
    return { label: v % 2 ? '❤️ Loyalty Test' : '😬 Rooting Against His Own', text: variants[v], conflict: candidate };
};

export const favoriteTeamInlineSentence = (firstEntry, secondEntry, players = {}, week, phase = 'pregame') => {
    const story = favoriteTeamStory(firstEntry, secondEntry, players, week, phase);
    return story ? ` ${story.text}` : '';
};
