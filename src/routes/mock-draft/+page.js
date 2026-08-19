import { loadPlayers } from '$lib/utils/helper';

export async function load({ fetch }) {
    return {
        playerData: await loadPlayers(fetch)
    };
}
