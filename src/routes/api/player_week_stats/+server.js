import { json } from '@sveltejs/kit';

function extractWeekStats(data, week) {
    if (!data || typeof data !== 'object') return null;

    var weekKey = String(week);

    // Sleeper's player-season stats endpoint may return weekly data keyed by week.
    if (data[weekKey] && typeof data[weekKey] === 'object') {
        return data[weekKey].stats && typeof data[weekKey].stats === 'object'
            ? data[weekKey].stats
            : data[weekKey];
    }

    if (data.weeks && data.weeks[weekKey] && typeof data.weeks[weekKey] === 'object') {
        return data.weeks[weekKey].stats && typeof data.weeks[weekKey].stats === 'object'
            ? data.weeks[weekKey].stats
            : data.weeks[weekKey];
    }

    if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (!row || typeof row !== 'object') continue;

            var rowWeek = Number(row.week != null ? row.week : row.game_week);
            if (rowWeek === Number(week)) {
                return row.stats && typeof row.stats === 'object' ? row.stats : row;
            }
        }
    }

    return null;
}

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

    if (data[targetID]) return extractStats(data[targetID]);

    var values = Object.values(data);
    for (var j = 0; j < values.length; j++) {
        if (getPlayerId(values[j]) === targetID) {
            return extractStats(values[j]);
        }
    }

    return null;
}

async function requestJson(fetch, endpoint) {
    try {
        var response = await fetch(endpoint, { compress: true });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Sleeper stats request failed:', endpoint, error);
        return null;
    }
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
    var source = null;

    // First try Sleeper's player-season stats endpoint. This is a better fit
    // for historical games than the league matchup endpoint because it stores
    // the player's actual NFL stat categories for the selected season.
    var playerSeasonUrls = [
        'https://api.sleeper.app/stats/nfl/player/' + encodeURIComponent(playerID) + '?season_type=regular&season=' + season + '&grouping=week',
        'https://api.sleeper.com/stats/nfl/player/' + encodeURIComponent(playerID) + '?season_type=regular&season=' + season + '&grouping=week'
    ];

    for (var i = 0; i < playerSeasonUrls.length && !stats; i++) {
        var playerSeasonData = await requestJson(fetch, playerSeasonUrls[i]);
        stats = extractWeekStats(playerSeasonData, week);
        if (stats) source = 'player-season';
    }

    // Fall back to Sleeper's weekly stats feed and locate the player in it.
    if (!stats) {
        var weeklyUrls = [
            'https://api.sleeper.app/stats/nfl/' + season + '/' + week + '?season_type=regular',
            'https://api.sleeper.com/stats/nfl/' + season + '/' + week + '?season_type=regular'
        ];

        for (var j = 0; j < weeklyUrls.length && !stats; j++) {
            var weeklyData = await requestJson(fetch, weeklyUrls[j]);
            stats = findPlayerStats(weeklyData, playerID);
            if (stats) source = 'weekly';
        }
    }

    return json(
        {
            stats: stats,
            source: source,
            player_id: String(playerID),
            season: season,
            week: week
        },
        {
            headers: {
                'cache-control': 'public, max-age=3600, s-maxage=86400'
            }
        }
    );
}
