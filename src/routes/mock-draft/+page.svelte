<script>
import { onMount } from 'svelte';
export let data;

const SUPABASE_URL = 'https://uawddygirnbpmkjhqcvu.supabase.co';
const KEY = 'sb_publishable_bEps0rM2t0HJsA6BPLjQPg_becZ1PsM';
const POS = ['QB','RB','WR','TE','K','DEF'];

let mode='home', name='', room=null, teams=[], picks=[], activeRooms=[], loading=false, error='';
let pollTimer, timerTick, clientToken='', search='', positionFilter='ALL', cpuWorking=false, secondsLeft=60, lastPick