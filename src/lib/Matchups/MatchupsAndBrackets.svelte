<script>
    import LinearProgress from '@smui/linear-progress';
    import MatchupWeeks from './MatchupWeeks.svelte';
    import Brackets from './Brackets.svelte';
    import Button, { Group, Label } from '@smui/button';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getLeagueData, loadPlayers } from '$lib/utils/helper';
    import { leagueID