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

const