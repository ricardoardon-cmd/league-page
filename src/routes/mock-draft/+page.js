import { loadPlayers } from '$lib/utils/helper';

// FantasyPros 2026 Superflex ECR: verified top tier.
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

// Current 2026 Sleeper market ordering verified through FantasyPros ADP tables.
// These are positional Sleeper ADP values, not Superflex overall ADP, so the
// GGL layer converts them into a Superflex-aware market score below.
const SLEEPER_POSITION_ADP_2026 = {
    QB: {
        'Josh Allen': 1,
        'Lamar Jackson': 2,
        'Drake Maye': 3,
        'Joe Burrow': 4,
        'Jayden Daniels': 5
    },
    WR: {
        "Ja'Marr Chase": 1,
        'Puka Nacua': 2,
        'Jaxon Smith-Njigba': 3,
        'CeeDee Lamb': 4,
        'Amon-Ra St. Brown': 5
    },
    TE: {
        'Trey McBride': 1,
        'Brock Bowers': 2,
        'Colston Loveland': 3,
        'Tyler Warren': 4,
        'Harold Fannin Jr.': 5
    }
};

// Sleeper standard overall ADP values currently exposed by FantasyPros.
const SLEEPER_OVERALL_ADP_2026 = {
    'Bijan Robinson': 1,
    'Jahmyr Gibbs': 2,
    'Jonathan Taylor': 3,
    'Christian McCaffrey': 4,
    'James Cook III': 5
};

const normalize = (value = '') =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

const normalizedMap = (source = {}) =>
    Object.fromEntries(Object.entries(source).map(([name, value]) => [normalize(name), value]));

// Convert verified Sleeper positional market ranks to a Superflex-aware value.
// QB is intentionally elevated because raw Sleeper ADP is a 1-QB market.
function superflexMarketRank(position, positionalAdp, overallAdp) {
    if (Number.isFinite(overallAdp)) return 100 + overallAdp;
    if (!Number.isFinite(positionalAdp)) return null;

    if (position === 'QB') return 120 + positionalAdp * 7;
    if (position === 'WR') return 170 + positionalAdp * 8;
    if (position === 'RB') return 170 + positionalAdp * 8;
    if (position === 'TE') return 230 + positionalAdp * 12;
    return null;
}

export async function load({ fetch }) {
    const playerData = await loadPlayers(fetch);
    const players = playerData?.players || {};

    const fantasyProsRanks = Object.fromEntries(
        FANTASYPROS_SUPERFLEX_2026.map((name, index) => [normalize(name), index + 1])
    );
    const sleeperOverall = normalizedMap(SLEEPER_OVERALL_ADP_2026);
    const sleeperByPosition = Object.fromEntries(
        Object.entries(SLEEPER_POSITION_ADP_2026).map(([position, values]) => [position, normalizedMap(values)])
    );

    for (const player of Object.values(players)) {
        const fullName = `${player?.fn || player?.first_name || ''} ${player?.ln || player?.last_name || ''}`.trim();
        const key = normalize(fullName);
        const position = player?.pos === 'DST' ? 'DEF' : (player?.pos || player?.position || '');
        const fpRank = fantasyProsRanks[key];
        const overallAdp = sleeperOverall[key];
        const positionalAdp = sleeperByPosition[position]?.[key];
        const marketRank = superflexMarketRank(position, positionalAdp, overallAdp);
        const sleeperSearchRank = Number(player?.search_rank ?? player?.rank ?? 9999);

        player.sleeper_adp = Number.isFinite(overallAdp) ? overallAdp : null;
        player.sleeper_position_adp = Number.isFinite(positionalAdp) ? positionalAdp : null;

        if (fpRank) {
            player.ggl_rank = fpRank;
            player.search_rank = fpRank;
            player.ggl_rank_source = 'FantasyPros Superflex ECR';
        } else if (marketRank !== null) {
            player.ggl_rank = marketRank;
            player.search_rank = marketRank;
            player.ggl_rank_source = 'Sleeper ADP + GGL Superflex adjustment';
        } else {
            const fallbackRank = Number.isFinite(sleeperSearchRank) && sleeperSearchRank > 0 ? 1000 + sleeperSearchRank : 9999;
            player.ggl_rank = fallbackRank;
            player.search_rank = fallbackRank;
            player.ggl_rank_source = 'Sleeper player-rank fallback';
        }
    }

    return { playerData };
}
