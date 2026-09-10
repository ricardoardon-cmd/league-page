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

export async function GET({ setHeaders }) {
    const injuries = {};

    // Sleeper's injury-specific feed updates faster than the full player map when available.
    try {
        const injuryRes = await fetch('https://api.sleeper.app/v1/players/injuries', {
            compress: true,
            headers: { 'cache-control': 'no-cache' }
        });

        if (injuryRes.ok) {
            const injuryData = await injuryRes.json();
            const rows = Array.isArray(injuryData)
                ? injuryData
                : Object.values(injuryData || {});

            for (const row of rows) {
                const id = row?.player_id || row?.id;
                if (!id) continue;
                injuries[String(id)] = normalizeInjury(row);
            }
        }
    } catch (error) {
        // Fall through to the standard Sleeper player endpoint below.
    }

    const res = await fetch('https://api.sleeper.app/v1/players/nfl', {
        compress: true,
        headers: { 'cache-control': 'no-cache' }
    });

    if (!res.ok && !Object.keys(injuries).length) {
        throw error(502, 'Unable to load Sleeper player injury data');
    }

    if (res.ok) {
        const playerData = await res.json();

        for (const id in playerData) {
            const player = playerData[id];
            const normalized = normalizeInjury(player);
            const hasInjury =
                normalized.injury_status ||
                normalized.practice_participation ||
                normalized.injury_body_part ||
                normalized.injury_notes ||
                ['IR', 'PUP'].includes(normalized.status);

            if (!hasInjury) continue;

            injuries[id] = {
                ...normalized,
                ...(injuries[id] || {})
            };
        }
    }

    setHeaders({
        'cache-control': 'no-store, max-age=0'
    });

    return json(injuries);
}
