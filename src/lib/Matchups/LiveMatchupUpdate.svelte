<script>
    import { onMount } from 'svelte';
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import { matchupInjurySentence } from './injuryStoryUtils.js';

    export let matchupArray = [];
    export let players = {};
    export let displayWeek;
    export let year;
    export let leagueTeamManagers;

    let playerSpotlightLabel = 'Player Of The Night';
    onMount(() => {
        const update = () => { const now=new Date(); playerSpotlightLabel=now.getDay()===0&&now.getHours()>=9&&now.getHours()<17?'Player Of The Day':'Player Of The Night'; };
        update(); const timer=setInterval(update,60000); return()=>clearInterval(timer);
    });

    const numericRound=v=>Number(round(Number(v)||0));
    const sum=(v=[])=>v.reduce((t,n)=>t+(Number(n)||0),0);
    const actual=e=>numericRound(sum(e?.points||[]));
    const safeTeam=id=>{try{return getTeamFromTeamManagers(leagueTeamManagers,Number(id),year)||{name:`Team ${id}`}}catch(e){return{name:`Team ${id}`}}};
    const projection=e=>numericRound((e?.starters||[]).reduce((t,id)=>{const v=Number(players?.[id]?.wi?.[displayWeek]?.p);return t+(Number.isFinite(v)?v:0)},0));
    const playerName=id=>{const p=players?.[id];if(!p)return`Player ${id}`;if(p.pos==='DEF')return p.ln||p.fn||String(id).toUpperCase();return`${p.fn||''} ${p.ln||''}`.trim()||`Player ${id}`};
    const topScorer=e=>{const s=e?.starters||[],pts=e?.points||[];let best=null;s.forEach((id,i)=>{const score=Number(pts[i]||0);if(!id||id==0||score<=0)return;if(!best||score>best.points)best={name:playerName(id),points:numericRound(score),projection:numericRound(Number(players?.[id]?.wi?.[displayWeek]?.p)||0)}});return best};

    const makeUpdate=m=>{
        const a=m?.[0],b=m?.[1];if(!a||!b)return null;
        const one={team:safeTeam(a.roster_id),score:actual(a),projection:projection(a)},two={team:safeTeam(b.roster_id),score:actual(b),projection:projection(b)};
        const ta=topScorer(a),tb=topScorer(b),top=!ta?tb:!tb?ta:ta.points>=tb.points?ta:tb;
        const leader=one.score===two.score?null:one.score>two.score?one:two,trailer=leader===one?two:one;
        const favorite=one.projection===two.projection?null:one.projection>two.projection?one:two;
        const margin=numericRound(Math.abs(one.score-two.score)),projectedMargin=numericRound(Math.abs(one.projection-two.projection));
        const total=one.score+two.score,isEarly=total<35,isUpset=leader&&favorite&&leader!==favorite&&projectedMargin>=3;
        let tag='📈 EARLY EDGE',tone='normal',text='';
        if(!leader){tag='⚔️ DEAD EVEN';tone='close';text=`${one.team.name} and ${two.team.name} are tied right now. This one is completely up for grabs.`}
        else if(isUpset){tag='🚨 UPSET BREWING';tone='upset';text=`${leader.team.name} has flipped the script and leads ${favorite.team.name} by ${margin} after entering as a ${projectedMargin}-point underdog. ${isEarly?'It is early, but the favorite is already playing from behind.':'The favorite is officially in danger.'}`}
        else if(margin>=30){tag='💥 BLOWOUT DEVELOPING';tone='blowout';text=`${leader.team.name} has opened a ${margin}-point lead over ${trailer.team.name}. What started as a matchup is turning into a beatdown.`}
        else if(margin<=5){tag='😬 LEAD IN DANGER';tone='close';text=`${leader.team.name} leads by only ${margin}. ${trailer.team.name} is within striking distance and this is one score swing away from changing hands.`}
        else if(favorite===trailer&&margin>=8){tag='🔥 COMEBACK WATCH';tone='comeback';text=`${trailer.team.name} was the pregame favorite but trails by ${margin}. The projected winner now needs a comeback to avoid the upset.`}
        else if(margin>=20){tag='🔥 TAKING CONTROL';tone='hot';text=`${leader.team.name} has built a ${margin}-point advantage over ${trailer.team.name} and is beginning to separate.`}
        else{text=`${leader.team.name} owns a ${margin}-point lead over ${trailer.team.name}. ${favorite===leader?'So far, the projected favorite is backing up the pregame numbers.':'The live scoreboard is running against the pregame expectation.'}`}
        if(top)text+=` ${top.name} leads the matchup's starters with ${top.points} points.`;
        text+=matchupInjurySentence(a,b,players,displayWeek,one.team.name,two.team.name,'live');
        return{teamOne:one.team,teamTwo:two.team,scoreOne:one.score,scoreTwo:two.score,projectionOne:one.projection,projectionTwo:two.projection,top,tag,tone,text,margin,leader,trailer,favorite,total};
    };

    $: updates=(matchupArray||[]).map(makeUpdate).filter(Boolean);
    $: highest=updates.flatMap(i=>[{team:i.teamOne,points:i.scoreOne},{team:i.teamTwo,points:i.scoreTwo}]).sort((a,b)=>b.points-a.points)[0];
    $: closest=[...updates].sort((a,b)=>a.margin-b.margin)[0];
    $: topPlayer=updates.map(i=>i.top).filter(Boolean).sort((a,b)=>b.points-a.points)[0];
    $: upset=updates.find(i=>i.tone==='upset');
    $: liveStories=(()=>{const s=[];if(upset)s.push({label:'🚨 Upset Brewing',text:`${upset.leader.team.name} is currently threatening to knock off projected favorite ${upset.favorite.team.name}.`});const blow=[...updates].filter(i=>i.margin>=30).sort((a,b)=>b.margin-a.margin)[0];if(blow)s.push({label:'💥 Blowout Developing',text:`${blow.leader.team.name} owns the biggest live lead of the week at ${blow.margin} points.`});const comeback=updates.find(i=>i.favorite&&i.leader&&i.favorite!==i.leader&&i.margin>=8);if(comeback)s.push({label:'🔥 Comeback Watch',text:`${comeback.favorite.team.name} entered favored but now has a ${comeback.margin}-point hole to climb out of.`});if(closest&&closest.margin<=7)s.push({label:'👀 One to Watch',text:`${closest.teamOne.name} vs ${closest.teamTwo.name} is the tightest matchup on the board, separated by just ${closest.margin} points.`});if(topPlayer&&topPlayer.projection>0&&topPlayer.points>=topPlayer.projection+10)s.push({label:'🏆 Statement Performance',text:`${topPlayer.name} already has ${topPlayer.points} points, ${numericRound(topPlayer.points-topPlayer.projection)} above his pregame projection.`});return s.slice(0,4)})();
    $: liveVerdict=(()=>{if(!updates.length)return'';const pieces=[];if(highest)pieces.push(`${highest.team.name} currently sets the scoring pace with ${highest.points}`);if(upset)pieces.push(`${upset.leader.team.name} has an upset brewing against ${upset.favorite.team.name}`);if(closest&&closest.margin<=7)pieces.push(`${closest.teamOne.name} and ${closest.teamTwo.name} are locked in the week's tightest fight`);return pieces.length?`${pieces.join('; ')}. The live board can still change, but these are the stories defining Week ${displayWeek} right now.`:''})();
</script>

<style>
.liveCard{width:95%;max-width:900px;margin:0 auto 24px;padding:20px;box-sizing:border-box;border:1px solid var(--ccc);border-radius:16px;background:var(--fff);box-shadow:0 4px 14px rgba(0,0,0,.06)}.header{text-align:center;margin-bottom:16px}.eyebrow{font-size:.72rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;opacity:.55}h4{margin:5px 0 0;font-size:1.35rem}.sub{margin-top:5px;font-size:.7rem;opacity:.55}.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px}.summaryItem,.story,.game{padding:12px;border-radius:12px;background:var(--f3f3f3)}.label{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.4px;opacity:.55}.value{margin-top:4px;font-size:.86rem;font-weight:850}.stories,.games{display:grid;gap:10px}.stories{margin-bottom:16px}.storyText{margin-top:5px;font-size:.78rem;line-height:1.45;font-weight:600}.analysisTag{margin-bottom:9px;text-align:center;font-size:.62rem;font-weight:900;letter-spacing:.65px;opacity:.72}.scoreLine{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px;font-weight:850}.teamOne{text-align:right}.teamTwo{text-align:left}.score{white-space:nowrap;font-size:1.05rem}.projections{margin-top:5px;text-align:center;font-size:.67rem;opacity:.55}.note{margin-top:9px;text-align:center;font-size:.78rem;line-height:1.45}.verdict{margin-top:16px;padding:15px;border:1px solid var(--ccc);border-radius:12px}.verdictTitle{font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}.verdictText{font-size:.82rem;line-height:1.5;font-weight:600}@media(max-width:600px){.liveCard{width:100%;padding:15px 12px}.scoreLine{font-size:.8rem}.score{font-size:.95rem}.note,.storyText{font-size:.73rem}}
</style>

{#if updates.length}<section class="liveCard"><div class="header"><div class="eyebrow">Live Week {displayWeek} Newsroom</div><h4>📰 GGL Live Desk</h4><div class="sub">The story changes as the Sleeper scoreboard changes</div></div><div class="summary"><div class="summaryItem"><div class="label">🔥 Hot Start</div><div class="value">{highest?.team?.name||'—'} · {highest?.points??0}</div></div><div class="summaryItem"><div class="label">⚔️ Game To Watch</div><div class="value">{closest?`${closest.teamOne.name} vs ${closest.teamTwo.name}`:'—'}</div></div><div class="summaryItem"><div class="label">⭐ {playerSpotlightLabel}</div><div class="value">{topPlayer?`${topPlayer.name} · ${topPlayer.points}`:'—'}</div></div><div class="summaryItem"><div class="label">🚨 Upset Watch</div><div class="value">{upset?`${upset.leader.team.name} over ${upset.favorite.team.name}`:'None yet'}</div></div></div>{#if liveStories.length}<div class="stories">{#each liveStories as story}<div class="story"><div class="label">{story.label}</div><div class="storyText">{story.text}</div></div>{/each}</div>{/if}<div class="games">{#each updates as item}<div class="game"><div class="analysisTag">{item.tag}</div><div class="scoreLine"><div class="teamOne">{item.teamOne.name}</div><div class="score">{item.scoreOne} – {item.scoreTwo}</div><div class="teamTwo">{item.teamTwo.name}</div></div><div class="projections">Pregame projection: {item.projectionOne} – {item.projectionTwo}</div><div class="note">{item.text}</div></div>{/each}</div>{#if liveVerdict}<div class="verdict"><div class="verdictTitle">📰 Live Newsroom Pulse</div><div class="verdictText">{liveVerdict}</div></div>{/if}</section>{/if}