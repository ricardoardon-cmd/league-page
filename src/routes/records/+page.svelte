<script>
	import LinearProgress from '@smui/linear-progress';
	import { Records } from '$lib/components';

    export let data;
    const recordsInfo = data.recordsInfo;
</script>

<style>
    #main {
        position: relative;
        z-index: 1;
    }
    .loading {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
    }

    /* Improve readability of the records page, especially the expanded matchup on phones. */
    @media (max-width: 700px) {
        :global(.scoringHighTable tbody tr.recordMatchupRow td),
        :global(.scoringLowTable tbody tr.recordMatchupRow td) {
            font-size: .86rem !important;
        }

        :global(.scoringHighTable th),
        :global(.scoringLowTable th) {
            font-size: .8rem !important;
        }

        :global(.scoringHighTable thead tr:first-child th),
        :global(.scoringLowTable thead tr:first-child th) {
            font-size: .95rem !important;
        }

        :global(.recordDetail) {
            font-size: .92em !important;
        }

        :global(.recordDetailTitle) {
            font-size: .92rem !important;
        }

        :global(.recordClose) {
            font-size: .82rem !important;
        }

        /* The embedded historical matchup has its own aggressive mobile font reductions.
           Override only inside the Records expansion so normal Matchups pages stay unchanged. */
        :global(.recordDetail .playerName) {
            font-size: 1rem !important;
            line-height: 1.15 !important;
        }

        :global(.recordDetail .points) {
            font-size: 1rem !important;
            line-height: 1.15 !important;
        }

        :global(.recordDetail .playerTeam) {
            font-size: .68rem !important;
            line-height: 1.15 !important;
        }

        :global(.recordDetail .totalProjection) {
            font-size: .72rem !important;
        }

        :global(.recordDetail .pos) {
            font-size: .78rem !important;
            font-weight: 700;
        }
    }
</style>

<div id="main">
    {#await recordsInfo}
        <!-- promise is pending -->
        <div class="loading">
            <p>Loading league records...</p>
            <LinearProgress indeterminate />
        </div>
    {:then [leagueData, {totals, stale}, leagueTeamManagers]}
        <Records {leagueData} {totals} {stale} {leagueTeamManagers} />
    {:catch error}
        <!-- promise was rejected -->
        <p>Something went wrong: {error.message}</p>
    {/await}
</div>
