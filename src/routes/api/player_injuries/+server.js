import { json, error } from '@sveltejs/kit';

const normalizeInjury = (player = {}) => ({
    injury_status: player.injury_status || player.status || '',
    status: player.status || '',
    practice_participation:
        player.practice_participation ||
        player.practice_description ||
        player.practice ||
        '',
    injury_body_part:
        player.injury_body_part ||
        player.body_part ||
        player.primary ||
        '',
    injury_notes:
        player.injury_notes ||
        player.notes ||
        player.description ||
        '',
    news_updated: player.news_updated || player.updated_at || player.updated || null
});

const hasMeaningfulInjury = (injury = {}) => Boolean(
    injury.injury_status ||
    injury.practice_participation ||
    injury.injury_body_part ||
    injury.injury_notes ||
    ['IR', 'PUP'].includes(injury.status)
);

export async function GET({ url, setHeaders }) {
    const injuries = {};
    const ids = [...new Set(
        (url.searchParams.get('ids') || '')
            .split(',')
            .map((id) => id.trim())
            .filter((id) => /^\d+$/.test(id))
    )].slice(0, 40);

    // For the players actually starting in the live GGL matchups, ask Sleeper
    // for each player directly. This avoids depending only on the large player
    // map, which Sleeper documents as data that can be cached for a day.
    if (ids.length) {
        const responses = await Promise.allSettled(
            ids.map(async (id) => {
                const res = await fetch(`https://api.sleeper.app/v1/players/nfl/${id}?t=${Date.now()}`, {
                    compress: true,
                    headers: { 'cache-control': 'no-cache' }
                });

                if (!res.ok) return null;
                const player = await res.json();
                return { id, player };
            })
        );

        for (const response of responses) {
            if (response.status !== 'fulfilled' || !response.value) continue;
            const { id, player } = response.value;
            const normalized = normalizeInjury(player);
            if (hasMeaningfulInjury(normalized)) injuries[id] = normalized;
        }
    }

    // Fallback: use the public player map for any status the individual-player
    // lookups did not return. This keeps pregame designations such as Q/D/IR.
    const res = await fetch(`https://api.sleeper.app/v1/players/nfl?t=${Date.now()}`, {
        compress: true,
        headers: { 'cache-control': 'no-cache' }
    });

    if (!res.ok && !Object.keys(injuries).length) {
        throw error(502, 'Unable to load Sleeper player injury data');
    }

    if (res.ok) {
        const playerData = await res.json();
        const candidateIds = ids.length ? ids : Object.keys(playerData);

        for (const id of candidateIds) {
            if (injuries[id]) continue;
            const player = playerData[id];
            if (!player) continue;
            const normalized = normalizeInjury(player);
            if (hasMeaningfulInjury(normalized)) injuries[id] = normalized;
        }
    }

    setHeaders({
        'cache-control': 'no-store, max-age=0'
    });

    return json(injuries);
}
