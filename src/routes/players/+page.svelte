<script>
    import Players from '$lib/Players/index.svelte';

    export let data;

    const { playersInfo } = data;
</script>

<div class="playersRoute">
    <Players {playersInfo} />
</div>

<style>
    .playersRoute {
        position: relative;
        z-index: 1;
    }
</style>
