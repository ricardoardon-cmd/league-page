import { json } from '@sveltejs/kit';

function getPlayerId(entry) {
    if (!entry || typeof entry !== 'object') return null;

    if (entry.player_id != null) return String(entry.player_id);
    if (entry.player && entry.player.player_id != null) return String(entry.player.player_id);
    if (entry.stats && entry.stats.player_id != null) return String(entry.stats.player_id);

    return null;
}

function extractStats(entry) {
    if (!entry || typeof entry !== 'object') return null;

    if (entry.stats && typeof entry.stats === 'object' && !Array.isArray(entry.stats)) {
        return entry.stats;
    }

    return entry;
}

function findPlayerStats(data, playerID) {
    var targetID = String(playerID);

    if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
            if (getPlayerId(data[i]) === targetID) {
                return extractStats(data[i]);
            }
        }
        return null;
    }

    if (!data || typeof data !== 'object') return null;

    if (data[targetID]) {
        return extractStats(data[targetID]);
    }

    var values = Object.values(data);
    for (var j = 0; j < values.length; j++) {
        if (getPlayerId(values[j]) === targetID) {
            return extractStats(values[j]);
        }
    }

    return null;
}

export async function GET({ url, fetch }) {
    var playerID = url.searchParams.get('player_id');
    var season = Number(url.searchParams.get('season'));
    var week = Number(url.searchParams.get('week'));

    if (!playerID || !Number.isFinite(season) || !Number.isFinite(week)) {
        return json(
            { stats: null, error: 'Missing player, season, or week.' },
            { status: 400 }
        );
    }

    var stats = null;

    try {
        var response = await fetch(
            'https://api.sleeper.app/stats/nfl/' + season + '/' + week + '?season_type=regular',
            { compress: true }
        );

        if (response.ok) {
            var data = await response.json();
            stats = findPlayerStats(data, playerID);
        }
    } catch (error) {
        console.error('Unable to load Sleeper weekly stats', error);
    }

    return json(
        { stats: stats },
        {
            headers: {
                'cache-control': 'public, max-age=3600, s-maxage=86400'
            }
        }
    );
}
