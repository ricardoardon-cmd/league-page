import { json } from '@sveltejs/kit';

const SOURCE_URL = 'https://www.rotoballer.com/updated-superflex-fantasy-football-2qb-rankings-august-2026/1903872';

function decode(value = '') {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&#039;|&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&rsquo;|&#8217;/gi, "'")
        .replace(/&ndash;|&#8211;/gi, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseTop200(html) {
    const rankings = [];
    const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];

    for (const row of rows) {
        const cells = [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => decode(m[1]));
        if (cells.length < 4) continue;

        // RotoBaller table shape: Tier | Rank | Player Name | Pos
        const rank = Number(cells[1]);
        const name = cells[2];
        const position = cells[3].toUpperCase().replace('DST', 'DEF');

        if (!Number.isInteger(rank) || rank < 1 || rank > 200) continue;
        if (!name || !['QB','RB','WR','TE','K','DEF'].includes(position)) continue;

        rankings.push({ rank, name, position });
    }

    return rankings
        .sort((a, b) => a.rank - b.rank)
        .filter((item, index, all) => index === 0 || item.rank !== all[index - 1].rank)
        .slice(0, 200);
}

export async function GET({ fetch }) {
    try {
        const response = await fetch(SOURCE_URL, {
            headers: {
                accept: 'text/html,application/xhtml+xml',
                'user-agent': 'Mozilla/5.0 GGL-Fantasy-Draft-Rankings/1.0'
            }
        });

        if (!response.ok) {
            return json({ rankings: [], source: 'RotoBaller', error: `Source returned ${response.status}` }, { status: 502 });
        }

        const html = await response.text();
        const rankings = parseTop200(html);

        if (rankings.length < 150) {
            return json({ rankings, source: 'RotoBaller', error: `Only parsed ${rankings.length} rankings` }, { status: 502 });
        }

        return json(
            { rankings, source: 'RotoBaller', count: rankings.length },
            { headers: { 'cache-control': 'public, max-age=21600, s-maxage=21600' } }
        );
    } catch (error) {
        return json({ rankings: [], source: 'RotoBaller', error: error?.message || 'Ranking fetch failed' }, { status: 502 });
    }
}
