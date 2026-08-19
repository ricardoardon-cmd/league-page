<script>
import { onMount } from 'svelte';
export let data;

const URL = 'https://uawddygirnbpmkjhqcvu.supabase.co';
const KEY = 'sb_publishable_bEps0rM2t0HJsA6BPLjQPg_becZ1PsM';
const POS = ['QB','RB','WR','TE','K','DEF'];

let mode='home', name='', room=null, teams=[], picks=[], activeRooms=[], loading=false, error='';
let pollTimer, timerTick, clientToken='', search='', positionFilter='ALL', cpuWorking=false, secondsLeft=60, lastPickSeen=null;
let shareNotice='';

const players = Object.entries(data?.playerData?.players || {})
    .map(([id,p]) => ({id,...p}))
    .filter(p => POS.includes(pos(p)) && (p.fn || p.first_name || p.ln || p.last_name));

function pos(p){ const x=p.pos||p.position; return x==='DST'?'DEF':x||'UNK'; }
function pname(p){
    const f=p.fn||p.first_name||'', l=p.ln||p.last_name||'';
    return pos(p)==='DEF' ? (p.t||p.team||`${f} ${l}`.trim()) : (`${f} ${l}`.trim()||p.full_name||'Unknown Player');
}
function rank(p){ const n=Number(p.search_rank??p.rank??9999); return Number.isFinite(n)&&n>0?n:9999; }
function hdr(prefer){ return {apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})}; }
async function req(path,o={}){
    const r=await fetch(`${URL}/rest/v1/${path}`,{...o,headers:{...hdr(o.prefer),...(o.headers||{})}});
    if(!r.ok) throw new Error(await r.text()||`Request failed ${r.status}`);
    const t=await r.text(); return t?JSON.parse(t):null;
}
function snakeSlot(n,c=10){ const r=Math.floor((n-1)/c)+1,p=(n-1)%c+1; return r%2?p:c-p+1; }
function overallFor(round,slot,c=10){ const p=round%2?slot:c-slot+1; return (round-1)*c+p; }
function ctx(n=Number(room?.current_pick||1)){
    const c=Number(room?.team_count||10), round=Math.floor((n-1)/c)+1, pickInRound=(n-1)%c+1, slot=snakeSlot(n,c);
    return {overallPick:n,round,pickInRound,slot,team:teams.find(t=>Number(t.draft_slot)===slot)};
}

$: current=room?ctx():null;
$: myTurn=room?.status==='drafting'&&current?.team?.player_token===clientToken;
$: drafted=new Set(picks.map(p=>String(p.player_id)));
$: available=players
    .filter(p=>!drafted.has(String(p.id)))
    .filter(p=>positionFilter==='ALL'||pos(p)===positionFilter)
    .filter(p=>{const q=search.trim().toLowerCase();return !q||pname(p).toLowerCase().includes(q)||(p.t||p.team||'').toLowerCase().includes(q);})
    .sort((a,b)=>rank(a)-rank(b)).slice(0,120);

async function loadActive(){
    try{ activeRooms=await req('mock_rooms?status=in.(lobby,drafting)&select=*&order=created_at.desc&limit=8')||[]; }
    catch(e){ console.error(e); }
}
async function refresh(){
    if(!room?.id)return;
    try{
        const [rr,tt,pp]=await Promise.all([
            req(`mock_rooms?id=eq.${room.id}&select=*`),
            req(`mock_teams?room_id=eq.${room.id}&select=*&order=draft_slot.asc`),
            req(`mock_picks?room_id=eq.${room.id}&select=*&order=overall_pick.asc`)
        ]);
        if(!rr?.length){ leaveLocal(); return; }
        room=rr[0]; teams=tt||[]; picks=pp||[];
        mode=['drafting','completed'].includes(room.status)?'draft':'room';
        if(room.status==='drafting') requestAnimationFrame(maybeCpu);
    }catch(e){ console.error(e); }
}
function polling(){ clearInterval(pollTimer); pollTimer=setInterval(refresh,1500); }

async function createRoom(){
    error=''; loading=true;
    try{
        const made=await req('mock_rooms',{method:'POST',prefer:'return=representation',body:JSON.stringify({room_code:crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase(),host_id:clientToken,team_count:10,rounds:16,status:'lobby',current_pick:1})});
        room=made?.[0];
        if(!room) throw Error('Room could not be created.');
        await req('mock_teams',{method:'POST',prefer:'return=minimal',body:JSON.stringify(Array.from({length:10},(_,i)=>({room_id:room.id,draft_slot:i+1,is_cpu:true})))});
        await refresh(); polling();
    }catch(e){ error=e.message; }
    finally{ loading=false; }
}
async function join(r){ room=r; await refresh(); polling(); }
async function claim(t){
    if(!name.trim()){ error='Enter your name before claiming a team.'; return; }
    const mine=teams.find(x=>x.player_token===clientToken);
    if(mine&&mine.id!==t.id) await req(`mock_teams?id=eq.${mine.id}`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({manager_name:null,player_token:null,is_cpu:true})});
    await req(`mock_teams?id=eq.${t.id}&is_cpu=eq.true`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({manager_name:name.trim(),player_token:clientToken,is_cpu:false})});
    await refresh();
}
async function release(t){
    await req(`mock_teams?id=eq.${t.id}`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({manager_name:null,player_token:null,is_cpu:true})});
    await refresh();
}
async function startDraft(){
    if(room?.host_id!==clientToken){ error='Only the host can start the draft.'; return; }
    if(!teams.some(t=>t.player_token===clientToken)){ error='Claim a slot before starting.'; return; }
    await req(`mock_rooms?id=eq.${room.id}`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({status:'drafting',current_pick:1})});
    await refresh();
}
function counts(id){ const c={QB:0,RB:0,WR:0,TE:0,K:0,DEF:0}; picks.filter(p=>p.team_id===id).forEach(p=>{if(c[p.position]!=null)c[p.position]++;}); return c; }
function cpuScore(p,id,r){
    const c=counts(id),z=pos(p); let x=10000-rank(p);
    if(z==='QB'){if(c.QB<2)x+=r<=5?1200:700;else if(c.QB>=3)x-=900;}
    if(z==='RB'){if(c.RB<2)x+=500;if(c.RB>=5)x-=600;}
    if(z==='WR'){if(c.WR<3)x+=500;if(c.WR>=6)x-=500;}
    if(z==='TE'){if(c.TE<1)x+=r>=4?300:100;if(c.TE>=2)x-=550;}
    if(z==='K'||z==='DEF'){if(r<13)x-=3000;if(c[z]>=1)x-=5000;}
    return x;
}
function bestCpu(team,round){ return players.filter(p=>!drafted.has(String(p.id))).sort((a,b)=>cpuScore(b,team.id,round)-cpuScore(a,team.id,round))[0]; }
async function makePick(p,team=current?.team){
    if(!room||!team||room.status!=='drafting')return;
    const c=ctx(Number(room.current_pick)); if(c.team?.id!==team.id)return;
    try{
        await req('mock_picks',{method:'POST',prefer:'return=minimal',body:JSON.stringify({room_id:room.id,team_id:team.id,overall_pick:c.overallPick,round:c.round,pick_in_round:c.pickInRound,player_id:String(p.id),player_name:pname(p),position:pos(p)})});
        const total=Number(room.team_count||10)*Number(room.rounds||16);
        await req(`mock_rooms?id=eq.${room.id}&current_pick=eq.${c.overallPick}`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({current_pick:Math.min(c.overallPick+1,total+1),status:c.overallPick>=total?'completed':'drafting'})});
        await refresh();
    }catch(e){ await refresh(); }
}
async function draftPlayer(p){ if(myTurn) await makePick(p,current.team); }
async function maybeCpu(){
    if(cpuWorking||room?.status!=='drafting')return;
    const c=ctx(); if(!c.team?.is_cpu)return;
    cpuWorking=true;
    try{ const p=bestCpu(c.team,c.round); if(p){await new Promise(r=>setTimeout(r,700));await makePick(p,c.team);} }
    finally{ cpuWorking=false; }
}
async function autoHuman(){
    if(!myTurn||secondsLeft>0||cpuWorking)return;
    cpuWorking=true;
    try{ const c=ctx(),p=bestCpu(c.team,c.round); if(p)await makePick(p,c.team); }
    finally{ cpuWorking=false; }
}
async function finishDraft(){
    if(room?.host_id!==clientToken)return;
    if(!confirm('Finish this mock now? The draft will become read-only.'))return;
    await req(`mock_rooms?id=eq.${room.id}`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({status:'completed'})});
    await refresh();
}
async function deleteDraft(){
    if(room?.host_id!==clientToken)return;
    if(!confirm('Delete this mock draft permanently?'))return;
    try{
        await req(`mock_picks?room_id=eq.${room.id}`,{method:'DELETE',prefer:'return=minimal'});
        await req(`mock_teams?room_id=eq.${room.id}`,{method:'DELETE',prefer:'return=minimal'});
        await req(`mock_rooms?id=eq.${room.id}`,{method:'DELETE',prefer:'return=minimal'});
        leaveLocal(); await loadActive();
    }catch(e){ error='Could not delete this mock. Check Supabase delete policies.'; }
}
function shareUrl(){
    if(!room?.id || typeof window==='undefined') return '';
    const u=new URL(window.location.href);
    u.search=''; u.hash=''; u.searchParams.set('mock',room.id);
    return u.toString();
}
async function shareMock(){
    const url=shareUrl(); if(!url)return;
    const shareData={title:'Join my GGL Mock Draft',text:'Join this GGL fantasy football mock draft.',url};
    try{
        if(navigator.share){ await navigator.share(shareData); shareNotice='Shared'; }
        else if(navigator.clipboard){ await navigator.clipboard.writeText(url); shareNotice='Link copied'; }
        else{ prompt('Copy this mock draft link:',url); shareNotice='Link ready'; }
    }catch(e){ if(e?.name!=='AbortError') error='Could not share the mock link.'; }
    if(shareNotice) setTimeout(()=>shareNotice='',1800);
}
function leaveLocal(){ clearInterval(pollTimer); room=null; teams=[]; picks=[]; mode='home'; error=''; shareNotice=''; if(typeof window!=='undefined')history.replaceState({},'',window.location.pathname); }
async function leave(){ leaveLocal(); await loadActive(); }

onMount(async()=>{
    clientToken=localStorage.getItem('ggl_mock_token')||crypto.randomUUID();
    localStorage.setItem('ggl_mock_token',clientToken);
    const mockId=new URLSearchParams(window.location.search).get('mock');
    if(mockId){
        try{
            const rows=await req(`mock_rooms?id=eq.${encodeURIComponent(mockId)}&select=*`);
            if(rows?.[0]){ room=rows[0]; await refresh(); polling(); }
            else{ error='That mock draft is no longer available.'; await loadActive(); }
        }catch(e){ error='Could not open that shared mock draft.'; await loadActive(); }
    }else await loadActive();
    timerTick=setInterval(()=>{
        if(room?.status!=='drafting'){secondsLeft=60;lastPickSeen=null;return;}
        const n=Number(room.current_pick);
        if(lastPickSeen!==n){lastPickSeen=n;secondsLeft=60;}
        else if(current?.team?.is_cpu){secondsLeft=60;}
        else if(secondsLeft>0)secondsLeft--;
        if(secondsLeft<=0)autoHuman();
    },1000);
    return()=>{clearInterval(pollTimer);clearInterval(timerTick);};
});
</script>

<svelte:head><title>GGL Mock Draft</title></svelte:head>
<div class="page">
<header><small>GGL DRAFT LAB</small><h1>🎯 Mock Draft</h1><p>10-team Superflex · 16-round snake · multiplayer</p></header>

{#if mode==='home'}
<section class="card home">
    <label>Your name<input bind:value={name} placeholder="Ricardo"></label>
    <button class="primary" onclick={createRoom}>Start New Mock</button>
    <h3>Active Mocks</h3>
    {#each activeRooms as r}
        <button class="active" onclick={()=>join(r)}><b>{r.status==='drafting'?'Draft in progress':'Lobby open'}</b><span>Join →</span></button>
    {:else}<p class="muted">No active mocks.</p>{/each}
</section>

{:else if mode==='room'}
<div class="top"><b>Active Lobby</b><div class="topActions"><button class="share" onclick={shareMock}>↗ Share Mock</button><button onclick={leave}>Leave</button></div></div>
{#if shareNotice}<div class="notice">{shareNotice}</div>{/if}
<section class="card"><label>Your display name<input bind:value={name}></label></section>
<h2>Draft Order <small>{teams.filter(t=>!t.is_cpu).length}/10 joined</small></h2>
<div class="teams">{#each teams as t}<div class:mine={t.player_token===clientToken} class="team"><b>{t.draft_slot}. {t.is_cpu?'GGL CPU':t.manager_name}</b>{#if t.player_token===clientToken}<button onclick={()=>release(t)}>Release</button>{:else if t.is_cpu}<button onclick={()=>claim(t)}>Claim</button>{:else}<span>Taken</span>{/if}</div>{/each}</div>
{#if room.host_id===clientToken}<div class="host"><button class="primary" onclick={startDraft}>Start Draft</button><button class="share" onclick={shareMock}>↗ Share Mock</button><button class="danger" onclick={deleteDraft}>Delete Mock</button></div>{:else}<p class="muted">Waiting for the host to start.</p>{/if}

{:else if mode==='draft'}
<div class="top">
    <button onclick={leave}>← Leave</button>
    <div><small>{room.status==='completed'?'Draft complete':`Round ${current?.round} · Pick ${current?.overallPick} · Slot ${current?.slot}`}</small><b>{room.status==='completed'?'GGL Mock Complete':`${current?.team?.is_cpu?'GGL CPU':current?.team?.manager_name||'Team'} is on the clock`}</b></div>
    <div class:turn={myTurn} class="clock">{room.status==='completed'?'FINAL':current?.team?.is_cpu?'CPU':`${secondsLeft}s`}</div>
</div>
<div class="hostbar"><button class="share" onclick={shareMock}>↗ Share Mock</button>{#if room.host_id===clientToken}<button onclick={finishDraft} disabled={room.status==='completed'}>Finish Draft</button><button class="danger" onclick={deleteDraft}>Delete Mock</button>{/if}</div>
{#if shareNotice}<div class="notice">{shareNotice}</div>{/if}
<div class="layout">
<section class="panel"><h2>Draft Board <small>Snake · {picks.length}/{Number(room.team_count||10)*Number(room.rounds||16)}</small></h2><div class="scroll"><div class="board"><div class="head">Rd</div>{#each teams as t}<div class="head">S{t.draft_slot}<small>{t.is_cpu?'CPU':t.manager_name}</small></div>{/each}{#each Array.from({length:Number(room.rounds||16)},(_,i)=>i+1) as r}<div class="head">R{r}</div>{#each teams as t}{@const o=overallFor(r,Number(t.draft_slot),Number(room.team_count||10))}{@const pk=picks.find(x=>x.overall_pick===o)}<div class:now={room.current_pick===o&&room.status==='drafting'} class:mine={t.player_token===clientToken} class={`pick ${pk?`p-${pk.position}`:''}`}><small>#{o}</small><b>{pk?pk.player_name:(t.is_cpu?'CPU':t.manager_name)}</b><span>{pk?.position||'—'}</span></div>{/each}{/each}</div></div></section>
<section class="panel players"><h2>Available Players <small>{myTurn?'Make your pick':'Best available'}</small></h2><input bind:value={search} placeholder="Search player or team"><div class="filters">{#each ['ALL',...POS] as p}<button class:on={positionFilter===p} onclick={()=>positionFilter=p}>{p}</button>{/each}</div><div class="list">{#each available as p}<button class={`player p-${pos(p)}`} onclick={()=>draftPlayer(p)} disabled={!myTurn||room.status!=='drafting'}><span>{rank(p)<9999?rank(p):'—'}</span><b>{pname(p)}<small>{pos(p)} · {p.t||p.team||'FA'}</small></b><strong>{myTurn?'Draft':pos(p)}</strong></button>{/each}</div><p class="muted">Human picks have 60 seconds. If time expires, GGL CPU makes the best available roster-aware pick.</p></section>
</div>
{/if}
{#if error}<div class="error">{error}</div>{/if}
</div>

<style>
.page{width:96%;max-width:1200px;margin:auto;padding:22px 0 70px}header{text-align:center;margin-bottom:18px}header small{font-weight:900;letter-spacing:.14em;opacity:.5}header h1{margin:5px 0}header p{margin:0;opacity:.6}.card,.top,.panel,.team{background:var(--fff);border:1px solid var(--ccc);border-radius:14px}.home{max-width:600px;margin:auto;padding:16px}label{display:flex;flex-direction:column;gap:6px;font-size:.72rem;font-weight:800}input{background:var(--f3f3f3);color:inherit;border:1px solid var(--ccc);border-radius:10px;padding:11px;font:inherit}.primary,.danger,button{cursor:pointer;font:inherit}.primary{background:var(--blueOne);color:#fff;border:0;border-radius:10px;padding:11px 14px;font-weight:900}.home>.primary{width:100%;margin-top:10px}.active{width:100%;display:flex;justify-content:space-between;padding:11px;margin:6px 0;border:1px solid var(--ccc);border-radius:10px;background:var(--f3f3f3);color:inherit}.top{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;margin-bottom:10px}.top>div:not(.topActions){display:flex;flex-direction:column}.topActions,.hostbar{display:flex;align-items:center;gap:8px}.top button,.hostbar button,.team button,.share{border:1px solid var(--ccc);background:var(--f3f3f3);color:inherit;border-radius:9px;padding:7px 10px}.share{font-weight:850}.clock{font-weight:900;background:var(--f3f3f3);border-radius:999px;padding:8px 12px}.clock.turn{background:var(--blueOne);color:#fff}.teams{display:grid;grid-template-columns:1fr 1fr;gap:7px}.team{display:flex;justify-content:space-between;align-items:center;padding:10px}.mine{box-shadow:inset 0 0 0 2px var(--blueOne)}h2{font-size:1rem}h2 small{font-size:.65rem;opacity:.55}.host{display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-top:12px}.danger{border:1px solid #d55!important;background:transparent!important;color:#d55!important;border-radius:10px;padding:10px;font-weight:850}.hostbar{justify-content:flex-end;margin-bottom:10px}.notice{width:max-content;max-width:90%;margin:-2px 0 10px auto;padding:7px 10px;border-radius:999px;background:var(--blueOne);color:#fff;font-size:.68rem;font-weight:850}.layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:10px}.panel{overflow:hidden}.panel>h2{display:flex;justify-content:space-between;padding:11px;margin:0;border-bottom:1px solid var(--ccc)}.scroll{overflow:auto;max-height:70vh}.board{display:grid;grid-template-columns:42px repeat(10,minmax(105px,1fr));min-width:1100px}.head,.pick{border-right:1px solid var(--ccc);border-bottom:1px solid var(--ccc);padding:6px}.head{background:var(--f3f3f3);font-size:.65rem;font-weight:900}.head small{display:block;opacity:.5}.pick{min-height:55px;display:flex;flex-direction:column;justify-content:center;border-left:3px solid var(--pc,var(--ccc))}.pick small{font-size:.55rem;opacity:.45}.pick b{font-size:.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pick span{font-size:.58rem}.pick.now{outline:3px solid var(--blueOne);outline-offset:-3px}.players>input{width:calc(100% - 20px);margin:10px;box-sizing:border-box}.filters{display:flex;gap:5px;overflow:auto;padding:0 10px 9px}.filters button{border:1px solid var(--ccc);background:var(--f3f3f3);color:inherit;border-radius:999px;padding:5px 8px}.filters .on{background:var(--blueOne);color:#fff}.list{max-height:55vh;overflow:auto;padding:0 8px}.player{width:100%;display:grid;grid-template-columns:30px 1fr auto;gap:7px;align-items:center;text-align:left;background:var(--fff);color:inherit;border:1px solid var(--ccc);border-left:4px solid var(--pc,var(--ccc));border-radius:9px;padding:8px;margin-bottom:5px}.player b{font-size:.76rem}.player b small{display:block;font-weight:400;opacity:.55}.player strong{font-size:.62rem;color:var(--pc)}.p-QB{--pc:#ef4444}.p-RB{--pc:#22c55e}.p-WR{--pc:#3b82f6}.p-TE{--pc:#f59e0b}.p-K{--pc:#a855f7}.p-DEF{--pc:#64748b}.muted{font-size:.68rem;opacity:.55;padding:0 10px}.error{margin:12px auto;padding:10px;max-width:600px;border:1px solid #d55;border-radius:10px}.card:not(.home){padding:12px;margin-bottom:10px}
@media(max-width:760px){.teams,.layout{grid-template-columns:1fr}.scroll{max-height:42vh}.list{max-height:45vh}.top{align-items:flex-start}.topActions{flex-direction:column;align-items:stretch}.host{grid-template-columns:1fr}.board{min-width:1040px}.hostbar{flex-wrap:wrap}}
</style>