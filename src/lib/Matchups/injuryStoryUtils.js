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
    const statusLower = lower(status);
    if (statusLower.includes('injured reserve') || statusLower === 'ir' || statusLower.includes('physically unable') || statusLower === 'pup') return status;
    return '';
};

const statusPriority = (status) => {
    const value = lower(status);
    if (value.includes('injured reserve') || value === 'ir') return 6;
    if (value.includes('out')) return 5;
    if (value.includes('doubt')) return 4;
    if (value.includes('question')) return 3;
    if (value.includes('pup') || value.includes('physically unable')) return 3;
    if (value.includes('probable')) return 1;
    return status ? 2 : 0;
};

const practicePriority = (practice) => {
    const value = lower(practice);
    if (!value) return 0;
    if (value.includes('did not') || value === 'dnp') return 3;
    if (value.includes('limited')) return 2;
    if (value.includes('full')) return 1;
    return 1;
};

const getPractice = (player) => normalize(player?.practice_participation || player?.practiceParticipation || player?.practice_status);
const getBodyPart = (player) => normalize(player?.injury_body_part || player?.injuryBodyPart || player?.injury_bodypart);

const makeInjury = (id, player, week) => {
    if (!player) return null;
    const status = meaningfulStatus(player);
    const practice = getPractice(player);
    const bodyPart = getBodyPart(player);
    const priority = Math.max(statusPriority(status), practicePriority(practice));
    if (!priority) return null;
    return { id, name: playerName(player, id), status, practice, bodyPart, projection: projection(player, week), priority };
};

export const getEntryInjuries = (entry, players = {}, week) => {
    const starters = entry?.starters || [];
    return starters.map((id) => makeInjury(id, players?.[id], week)).filter(Boolean).sort((a, b) => b.priority - a.priority || b.projection - a.projection || a.name.localeCompare(b.name));
};

const describe = (injury, phase) => {
    const status = lower(injury.status);
    const body = injury.bodyPart ? ` with a ${injury.bodyPart} issue` : '';

    if (phase === 'live' && (status === 'out' || status.includes('out'))) {
        return `${injury.name} is now listed OUT${body}`;
    }

    const details = [];
    if (injury.status) details.push(`listed ${injury.status}`);
    if (injury.bodyPart) details.push(`with a ${injury.bodyPart} issue`);
    if (injury.practice) {
        const practice = lower(injury.practice);
        if (practice.includes('did not') || practice === 'dnp') details.push('and did not practice');
        else if (practice.includes('limited')) details.push('and was limited in practice');
    }
    return details.length ? `${injury.name} is ${details.join(' ')}` : '';
};

export const matchupInjurySentence = (firstEntry, secondEntry, players = {}, week, firstTeamName, secondTeamName, phase = 'pregame') => {
    const first = getEntryInjuries(firstEntry, players, week)[0];
    const second = getEntryInjuries(secondEntry, players, week)[0];
    const injuries = [first ? { ...first, teamName: firstTeamName } : null, second ? { ...second, teamName: secondTeamName } : null]
        .filter(Boolean)
        .sort((a, b) => b.priority - a.priority || b.projection - a.projection)
        .slice(0, 2);

    if (!injuries.length) return '';
    const clauses = injuries.map((injury) => {
        const description = describe(injury, phase);
        return description ? `${injury.teamName}: ${description}` : '';
    }).filter(Boolean);
    if (!clauses.length) return '';

    if (phase === 'live') return ` Injury update: ${clauses.join('; ')}.`;
    if (phase === 'postgame') return ` Injury context: ${clauses.join('; ')}.`;
    return ` One lineup factor to watch: ${clauses.join('; ')}.`;
};
