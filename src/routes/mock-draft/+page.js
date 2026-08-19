import { loadPlayers } from '$lib/utils/helper';

const FANTASYPROS_SUPERFLEX_2026 = [
    'Josh Allen',
    'Drake Maye',
    'Lamar Jackson',
    'Joe Burrow',
    'Bijan Robinson',
    'Jayden Daniels',
    'Jahmyr Gibbs',
    'Jalen Hurts',
    "Ja'Marr Chase",
    'Puka Nacua',
    'Justin Herbert',
    'Jaxon Smith-Njigba'
];

const normalize = (value = '') =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

export async function load({ fetch }) {
    const playerData = await loadPlayers(fetch);
    const players = playerData?.players || {};

    const fantasyProsRanks = Object.fromEntries(
        FANTASYPROS_SUPERFLEX_2026.map((name, index) => [normalize(name), index + 1])
    );

    for (const player of Object.values(players)) {
        const fullName = `${player?.fn || player?.first_name || ''} ${player?.ln || player?.last_name || ''}`.trim();
        const fpRank = fantasyProsRanks[normalize(fullName)];

        if (fpRank) {
            player.search_rank = fpRank;
            player.ggl_rank_source = 'FantasyPros';
        }
    }

    return {
        playerData
    };
}
