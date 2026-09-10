<script>
    import { favoriteTeamStory } from './favoriteTeamStoryUtils.js';
    export let matchupArray=[]; export let players={}; export let displayWeek;
    $: stories=(matchupArray||[]).map((matchup)=>favoriteTeamStory(matchup?.[0],matchup?.[1],players,displayWeek,'live')).filter(Boolean).slice(0,3);
</script>
<style>
    .box{width:95%;max-width:900px;margin:-14px auto 24px;display:grid;gap:10px}.story{padding:14px 16px;border:1px solid var(--ccc);border-radius:14px;background:var(--fff);box-shadow:0 4px 14px rgba(0,0,0,.06)}.label{font-size:.72rem;font-weight:850;letter-spacing:.5px;text-transform:uppercase;opacity:.7;margin-bottom:5px}.text{font-size:.86rem;line-height:1.5;font-weight:600}@media(max-width:600px){.box{width:100%}.text{font-size:.8rem}}
</style>
{#if stories.length}<section class="box">{#each stories as story}<div class="story"><div class="label">{story.label}</div><div class="text">{story.text}</div></div>{/each}</section>{/if}
