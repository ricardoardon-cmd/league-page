import { json } from '@sveltejs/kit';

const getCandidateWeek = (candidate) =>
    Number(
        candidate?.week ??
        candidate?.game_week ??
        candidate?.stats?.week ??
        candidate?.metadata?.week
    );

const getCandidatePlayerID = (candidate) =>
    String(
        candidate?.player_id ??
        candidate?.player?.player_id ??
        candidate?.stats?.player_id ??
        ''
    );

const cleanStats = (candidate) => {
    if (!candidate) return null;

    const stats = candidate?.stats && typeof candidate.stats === 'object'
        ? candidate.stats
        : candidate;

    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
        return null;
    }

    return stats;
};

const findWeekStats = (data, week, playerID) => {
    if (!data) return null;

    const targetWeek = Number(week);
    const targetPlayerID = String(playerID);

    if (Array.isArray(data)) {
        for (const candidate of data) {
            const candidatePlayerID = getCandidatePlayerID(candidate);
            const candidateWeek = getCandidateWeek(candidate);

            if (candidatePlayerID && candidatePlayerID !== targetPlayerID) {
                continue;
            }

            if (Number.isFinite(candidateWeek) && candidateWeek === targetWeek) {
                return cleanStats(candidate);
            }
        }

        return null;
    }

    if (typeof data !== 'object') return null;

    const directWeek = data[targetWeek] ?? data[String(targetWeek)];
    if (directWeek) {
        return cleanStats(directWeek);
    }

    const nestedWeek = data?.weeks?.[targetWeek] ?? data?.weeks?.[String(targetWeek)];
    if (nestedWeek) {
        return cleanStats(nestedWeek);
    }

    const dataWeek = getCandidateWeek(data);
    if (Number.isFinite(dataWeek) && dataWeek === targetWeek) {
        return cleanStats(data);
    }

    for (const candidate of Object.values(data)) {
        if (!candidate || typeof candidate !== 'object') continue;

        const candidatePlayerID = getCandidatePlayerID(candidate);
        const candidateWeek = getCandidateWeek(candidate);

        if (candidatePlayerID && candidatePlayerID !== targetPlayerID) {
            continue;
        }

        if (Number.isFinite(candidateWeek) && candidateWeek === targetWeek) {
            return cleanStats(candidate);
        }
    }

    return null;
};

export async function GET({ url, fetch }) {
    const playerID = url.searchParams.get('player_id');
    const season = Number(url.searchParams.get('season'));
    const week = Number(url.searchParams.get('week'));
    const position = url.searchParams.get('position') || '';

    if (!playerID || !Number.isFinite(season) || !Number.isFinite(week)) {
        return json(
            { stats: null, error: 'Missing player, season, or week.' },
            { status: 400 }
        );
    }

    let stats = null;

    try {
        const playerResponse = await fetch(
            `https://api.sleeper.app/stats/nfl/player/${encodeURIComponent(playerID)}?season_type=regular&season=${season}&grouping=week`,
            { compress: true }
        );

        if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            stats = findWeekStats(playerData, week, playerID);
        }
    } catch (error) {
        console.error('Unable to load Sleeper player stats', error);
    }

    // Team defenses and some historical players are not always returned by
    // the per-player endpoint. Fall back to Sleeper's weekly stats feed.
    if (!stats) {
        try {
            const positionQuery = position
                ? `&position[]=${encodeURIComponent(position)}`
                : '&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K&position[]=DEF';

            const weeklyResponse = await fetch(
                `https://api.sleeper.app/stats/nfl/${season}/${week}?season_type=regular${positionQuery}`,
                { compress: true }
            );

            if (weeklyResponse.ok) {
                const weeklyData = await weeklyResponse.json();
                stats = findWeekStats(weeklyData, week, playerID);

                if (!stats && Array.isArray(weeklyData)) {
                    const playerRow = weeklyData.find(
                        (candidate) =>
                            getCandidatePlayerID(candidate) === String(playerID)
                    );
                    stats = cleanStats(playerRow);
                }
            }
        } catch (error) {
            console.error('Unable to load Sleeper weekly stats', error);
        }
    }

    return json(
        { stats },
        {
            headers: {
                'cache-control': 'public, max-age=3600, s-maxage=86400'
            }
        }
    );
}
