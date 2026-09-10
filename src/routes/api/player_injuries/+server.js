import { json, error } from '@sveltejs/kit';

export async function GET({ setHeaders }) {
    const res = await fetch('https://api.sleeper.app/v1/players/nfl', { compress: true });

    if (!res.ok) {
        throw error(502, 'Unable to load Sleeper player injury data');
    }

    const playerData = await res.json();
    const injuries = {};

    for (const id in playerData) {
        const player = playerData[id];
        const injuryStatus = player?.injury_status || '';
        const status = player?.status || '';
        const practice = player?.practice_participation || player?.practice_description || '';
        const bodyPart = player?.injury_body_part || '';
        const notes = player?.injury_notes || '';

        if (!injuryStatus && !practice && !bodyPart && !notes && !['IR', 'PUP'].includes(status)) continue;

        injuries[id] = {
            injury_status: injuryStatus,
            status,
            practice_participation: practice,
            injury_body_part: bodyPart,
            injury_notes: notes
        };
    }

    setHeaders({
        'cache-control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=60'
    });

    return json(injuries);
}
