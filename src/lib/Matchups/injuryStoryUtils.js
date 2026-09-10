const normalize = (value) => String(value || '').trim();
const lower = (value) => normalize(value).toLowerCase();

const playerName = (player, id) => {
    if (!player) return `Player ${id}`;
    const first = player.fn || player.first_name || '';
    const last = player.ln || player.last_name || '';
    const position = player.pos || player.position;
    if (position === 'DEF') return last || first || String(id).toUpperCase();
    return `${first} ${last}`.trim() || `Player ${id}`;
};

const projection = (player, week) => {
    const value = Number(player?.wi?.[week]?.p);
    return Number.isFinite(value) ? value : 0;
};

const meaningfulStatus = (player) => {
    const injuryStatus = normalize(
        player?.injury_status || player?.injuryStatus || player?.inj_status || player?.is
    );
    if (injuryStatus) return injuryStatus;

    const status = normalize(player?.status);
    const value = lower(status);
    if (value.includes('injured reserve') || value === 'ir' || value.includes('physically unable') || value === 'pup') return status;
    return '';
};

const statusPriority = (status) => {
    const value = lower(status);
    if (value.includes('injured reserve') || value === 'ir') return 7;
    if (value === 'out' || value.includes(' out')) return 6;
    if (value.includes('doubt')) return 5;
    if (value.includes('question')) return 4;
    if (value.includes('pup') || value.includes('physically unable')) return 4;
    if (value.includes('probable')) return 1;
    return status ? 2 : 0;
};

const getPractice = (player) => normalize(player?.practice_participation || player?.practiceParticipation || player?.practice_status);
const getBodyPart = (player) => normalize(player?.injury_body_part || player?.injuryBodyPart || player?.injury_bodypart);

const makeInjury = (id, player, week) => {
    if (!player) return null;
    const status = meaningfulStatus(player);
    const practice = getPractice(player);
    const bodyPart = getBodyPart(player);
    const priority = statusPriority(status);
    if (!priority) return null;
    return {
        id,
        name: playerName(player, id),
        status,
        practice,
        bodyPart,
        projection: projection(player, week),
        priority
    };
};

export const getEntryInjuries = (entry, players = {}, week) => {
    const starters = entry?.starters || [];
    return starters
        .map((id) => makeInjury(id, players?.[id], week))
        .filter(Boolean)
        .sort((a, b) => b.priority - a.priority || b.projection - a.projection || a.name.localeCompare(b.name));
};

const injuryPhrase = (injury) => {
    const status = lower(injury.status);
    const body = injury.bodyPart ? ` (${injury.bodyPart})` : '';

    if (status.includes('injured reserve') || status === 'ir') return `${injury.name} is on IR${body}`;
    if (status === 'out' || status.includes(' out')) return `${injury.name} is OUT${body}`;
    if (status.includes('doubt')) return `${injury.name} is doubtful${body}`;
    if (status.includes('question')) return `${injury.name} is questionable${body}`;
    return `${injury.name} carries a ${injury.status} designation${body}`;
};

const teamNarrative = (teamName, injuries, phase) => {
    if (!injuries.length) return '';

    const primary = injuries[0];
    const secondary = injuries[1];
    const primaryPhrase = injuryPhrase(primary);
    const secondPhrase = secondary ? injuryPhrase(secondary) : '';
    const projectionText = primary.projection >= 8
        ? `, a major piece of the projected lineup at ${primary.projection} points`
        : '';

    if (phase === 'live') {
        if (lower(primary.status).includes('out')) {
            return `${teamName} has a real availability problem: ${primaryPhrase}${projectionText}${secondPhrase ? `, while ${secondPhrase}` : ''}. That puts more pressure on the rest of the lineup as this matchup develops.`;
        }
        return `${teamName} is also playing with some uncertainty. ${primaryPhrase}${projectionText}${secondPhrase ? `, and ${secondPhrase}` : ''}, giving this matchup another variable to watch as the scores come in.`;
    }

    if (phase === 'postgame') {
        return `${teamName}'s injury situation was part of the backdrop: ${primaryPhrase}${secondPhrase ? `, with ${secondPhrase}` : ''}.`;
    }

    return `${teamName} enters with an injury concern: ${primaryPhrase}${projectionText}${secondPhrase ? `, and ${secondPhrase}` : ''}.`;
};

export const matchupInjurySentence = (firstEntry, secondEntry, players = {}, week, firstTeamName, secondTeamName, phase = 'pregame') => {
    const first = getEntryInjuries(firstEntry, players, week).slice(0, 2);
    const second = getEntryInjuries(secondEntry, players, week).slice(0, 2);
    if (!first.length && !second.length) return '';

    const sides = [
        { teamName: firstTeamName, injuries: first },
        { teamName: secondTeamName, injuries: second }
    ].filter((side) => side.injuries.length);

    sides.sort((a, b) => {
        const ai = a.injuries[0];
        const bi = b.injuries[0];
        return bi.priority - ai.priority || bi.projection - ai.projection;
    });

    const narratives = sides.map((side) => teamNarrative(side.teamName, side.injuries, phase));
    return narratives.length ? ` ${narratives.join(' ')}` : '';
};
