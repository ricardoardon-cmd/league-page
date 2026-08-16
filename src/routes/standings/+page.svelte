<script>
    import { Standings } from '$lib/components';

    export let data;

    $: ({
        standingsData,
        leagueTeamManagersData,
        playoffBracketData,
        playoffMatchupsData,
        playersData,
        availableSeasons,
        selectedSeason
    } = data);
</script>

<style>
    .holder {
        position: relative;
        z-index: 1;
        text-align: center;
    }
</style>

<div class="holder">
    {#key selectedSeason}
        <Standings
            {standingsData}
            {leagueTeamManagersData}
            {playoffBracketData}
            {playoffMatchupsData}
            {playersData}
            {availableSeasons}
            {selectedSeason}
        />
    {/key}
</div>
