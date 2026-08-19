import { loadPlayers } from '$lib/utils/helper';

// FantasyPros 2026 Superflex ECR, checked Aug. 18, 2026.
// Ranked players use FantasyPros first; Sleeper remains the fallback until
// the full verified ECR pool is mapped.
const FANTASYPROS_SUPERFLEX_2026 = [
    'Josh Allen',
    'Drake Maye',
    'Lamar Jackson',
    'Joe Burrow',
    'Jayden Daniels',
    'Bijan Robinson',
    'Jahmyr Gibbs',
    "Ja'Marr Chase",
    'Puka Nacua',
    'Jalen Hurts',
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
        const sleeperRank = Number(player?.search_rank ?? player?.rank ?? 9999);

        if (fpRank) {
            player.ggl_rank = fpRank;
            player.ggl_rank_source = 'FantasyPros';
        } else {
            player.ggl_rank = Number.isFinite(sleeperRank) && sleeperRank > 0 ? 1000 + sleeperRank : 9999;
            player.ggl_rank_source = 'Sleeper fallback';
        }
    }

    return { playerData };
}
