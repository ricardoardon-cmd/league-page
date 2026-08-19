import {leagueID} from '$lib/utils/leagueInfo';

export const tabs = [
    { icon: 'home', label: 'Home', dest: '/', key: 'home' },
    { icon: 'sports', label: 'Matchups', dest: '/matchups', key: 'matchups' },
    { icon: 'swap_horiz', label: 'Trades & Waivers', dest: '/transactions', key: 'transactions' },
    { icon: 'article', label: 'Blog', dest: '/blog', key: 'blog' },
    {
        icon: 'view_comfy', label: 'League Info', nest: true, key: 'league_info',
        children: [
            { icon: 'storage', label: 'Rosters', dest: '/rosters' },
            { icon: 'person_search', label: 'Players', dest: '/players' },
            { icon: 'groups', label: 'Managers', dest: '/managers' },
            { icon: 'local_fire_department', label: 'Rivalry', dest: '/rivalry' },
            { icon: 'leaderboard', label: 'Standings', dest: '/standings' },
            { icon: 'view_comfy', label: 'Drafts', dest: '/drafts' },
            { icon: 'casino', label: 'Mock Draft', dest: '/mock-draft' },
            { icon: 'emoji_events', label: 'History', dest: '/awards' },
            { icon: 'photo_library', label: 'Season Archive', dest: '/archive' },
            { icon: 'military_tech', label: 'Records', dest: '/records' },
            { icon: 'history_edu', label: 'Constitution', dest: '/constitution', hidden: true },
            { icon: 'sports_football', label: 'Go to Sleeper', dest: `https://sleeper.com/leagues/${leagueID}/league`, external: true },
        ]
    },
];
