import { loadPlayers } from '$lib/utils/helper';

// Verified FantasyPros 2026 Superflex anchors stay at the top of the board.
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

// Small verified Sleeper market anchors. The rest of the board is generated
// dynamically from Sleeper's player pool instead of a hand-maintained ADP list.
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

function playerName(player = {}) {
    return `${player?.fn || player?.first_name || ''} ${player?.ln || player?.last_name || ''}`.trim();
}

function playerPosition(player = {}) {
    const position = player?.pos || player?.position || '';
    return position === 'DST' ? 'DEF' : position;
}

function sleeperBaseRank(player = {}) {
    const value = Number(player?.search_rank ?? player?.rank ?? 9999);
    return Number.isFinite(value) && value > 0 ? value : 9999;
}

// Convert Sleeper's broad player ordering into a GGL Superflex board.
// This is intentionally a format adjustment, not a claim that search_rank is ADP.
// QB gets the strongest premium, TE a modest scarcity premium, while RB/WR track
// the market more closely. K/DEF are intentionally pushed to the final rounds.
function dynamicSuperflexScore(player = {}) {
    const base = sleeperBaseRank(player);
    const position = playerPosition(player);

    if (base >= 9999) return 99999;

    switch (position) {
        case 'QB':
            return base * 0.48 + 18;
        case 'RB':
            return base * 0.92 + 38;
        case 'WR':
            return base * 0.94 + 40;
        case 'TE':
            return base * 0.82 + 70;
        case 'K':
            return base + 850;
        case 'DEF':
            return base + 900;
        default:
            return base + 1200;
    }
}

// Blend verified Sleeper market anchors into the dynamic board. These values
// guide the model without requiring us to invent a complete Sleeper ADP dataset.
function verifiedMarketScore(position, positionalAdp, overallAdp) {
    if (Number.isFinite(overallAdp)) return 35 + overallAdp * 8;
    if (!Number.isFinite(positionalAdp)) return null;

    switch (position) {
        case 'QB': return 28 + positionalAdp * 9;
        case 'RB': return 48 + positionalAdp * 10;
        case 'WR': return 50 + positionalAdp * 10;
        case 'TE': return 82 + positionalAdp * 13;
        default: return null;
    }
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

    const dynamicPool = [];

    for (const [id, player] of Object.entries(players)) {
        const name = playerName(player);
        const key = normalize(name);
        const position = playerPosition(player);
        const fpRank = fantasyProsRanks[key];
        const overallAdp = sleeperOverall[key];
        const positionalAdp = sleeperByPosition[position]?.[key];
        const marketScore = verifiedMarketScore(position, positionalAdp, overallAdp);
        const dynamicScore = dynamicSuperflexScore(player);

        player.sleeper_adp = Number.isFinite(overallAdp) ? overallAdp : null;
        player.sleeper_position_adp = Number.isFinite(positionalAdp) ? positionalAdp : null;
        player.ggl_dynamic_score = dynamicScore;

        if (fpRank) {
            player.ggl_rank = fpRank;
            player.ggl_rank_source = 'FantasyPros Superflex ECR';
            continue;
        }

        dynamicPool.push({
            id,
            player,
            score: marketScore === null ? dynamicScore : Math.min(dynamicScore, marketScore),
            source: marketScore === null
                ? 'GGL dynamic Superflex model'
                : 'Sleeper market anchor + GGL Superflex model'
        });
    }

    // Turn model scores into a clean continuous board directly after the verified
    // FantasyPros anchors. Tie breakers use Sleeper's original player ordering.
    dynamicPool.sort((a, b) =>
        a.score - b.score ||
        sleeperBaseRank(a.player) - sleeperBaseRank(b.player) ||
        playerName(a.player).localeCompare(playerName(b.player))
    );

    dynamicPool.forEach((entry, index) => {
        const rank = FANTASYPROS_SUPERFLEX_2026.length + index + 1;
        entry.player.ggl_rank = rank;
        entry.player.ggl_rank_source = entry.source;
    });

    // Keep the existing mock UI/CPU compatible: it currently reads search_rank.
    // ggl_rank remains the canonical value so we can switch the UI explicitly later.
    for (const player of Object.values(players)) {
        player.search_rank = player.ggl_rank ?? 99999;
    }

    return { playerData };
}
