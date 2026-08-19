import { loadPlayers } from '$lib/utils/helper';

// Verified current FantasyPros PPR Superflex top 12. This gives the early board
// the correct QB-heavy mix instead of forcing every QB ahead of elite RB/WRs.
const FANTASYPROS_SUPERFLEX_2026 = [
    'Josh Allen','Drake Maye','Lamar Jackson','Joe Burrow','Jayden Daniels',"Ja'Marr Chase",
    'Puka Nacua','Bijan Robinson','Jahmyr Gibbs','Jalen Hurts','Jaxon Smith-Njigba','Justin Herbert'
];

const normalize=(v='')=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const playerName=(p={})=>`${p.fn||p.first_name||''} ${p.ln||p.last_name||''}`.trim();
const playerPosition=(p={})=>{const x=p.pos||p.position||'';return x==='DST'?'DEF':x;};

function projectionPlayerId(row={}) {
    return String(row.player_id ?? row.player?.player_id ?? row.player?.id ?? row.id ?? '');
}
function projectionAdp(row={}) {
    const stats=row.stats||row.projection||row;
    for(const key of ['adp_dd_ppr','adp_ppr','adp_dd_half_ppr','adp_dd_std','adp']) {
        const n=Number(stats?.[key] ?? row?.[key]);
        if(Number.isFinite(n) && n>0 && n<999) return n;
    }
    return null;
}

// Blend normal Sleeper PPR ADP with a Superflex QB curve. The key difference from
// the previous version is that QB1-QB20 are no longer all hard-pulled ahead of the
// elite RB/WR tier. The curve targets realistic Superflex zones and then blends
// those targets with Sleeper market ADP.
function superflexAdp(position,adp,qbRank) {
    if(position!=='QB') return adp;
    let target;
    if(qbRank<=5) target=1+(qbRank-1)*2.0;          // QB1-5: picks ~1,3,5,7,9
    else if(qbRank<=8) target=11+(qbRank-6)*3.0;    // QB6-8: ~11,14,17
    else if(qbRank<=12) target=20+(qbRank-9)*4.0;   // QB9-12: ~20-32
    else if(qbRank<=16) target=36+(qbRank-13)*6.0;  // QB13-16: ~36-54
    else if(qbRank<=20) target=60+(qbRank-17)*8.0;  // QB17-20: ~60-84
    else return adp;

    // 75% Superflex target + 25% Sleeper market keeps the premium strong without
    // turning the top of the board into an uninterrupted run of quarterbacks.
    return target*0.75 + adp*0.25;
}

async function loadSleeperAdp(fetch) {
    const endpoints=[
        'https://api.sleeper.com/projections/nfl/2026/1?season_type=regular&order_by=adp_dd_ppr',
        'https://api.sleeper.com/projections/nfl/2026/1?season_type=regular&order_by=adp_ppr'
    ];
    for(const url of endpoints){
        try{
            const response=await fetch(url,{headers:{accept:'application/json'}});
            if(!response.ok) continue;
            const rows=await response.json();
            if(Array.isArray(rows)&&rows.length) return rows;
            if(rows&&typeof rows==='object') return Object.values(rows);
        }catch(e){console.warn('Sleeper ADP fetch failed',url,e);}
    }
    return [];
}

export async function load({fetch}) {
    const [playerData,adpRows]=await Promise.all([loadPlayers(fetch),loadSleeperAdp(fetch)]);
    const players=playerData?.players||{};
    const anchors=new Map(FANTASYPROS_SUPERFLEX_2026.map((name,index)=>[normalize(name),index+1]));

    const adpById=new Map();
    for(const row of adpRows){
        const id=projectionPlayerId(row),adp=projectionAdp(row);
        if(id&&adp!==null) adpById.set(id,adp);
    }

    const qbs=Object.entries(players)
        .filter(([id,p])=>playerPosition(p)==='QB'&&adpById.has(String(id)))
        .sort((a,b)=>adpById.get(String(a[0]))-adpById.get(String(b[0])));
    const qbRank=new Map(qbs.map(([id],index)=>[String(id),index+1]));

    const ranked=[];
    for(const [id,p] of Object.entries(players)){
        const position=playerPosition(p),adp=adpById.get(String(id));
        if(adp===undefined){p.ggl_rank=99999;p.ggl_rank_source='No Sleeper ADP';continue;}
        const anchor=anchors.get(normalize(playerName(p)));
        let score=superflexAdp(position,adp,qbRank.get(String(id))||999);

        // Exact top-12 Superflex ECR anchors win at the top. Past that point the
        // full Sleeper ADP board + QB blend controls the order.
        if(anchor) score=anchor;
        if(position==='K') score=Math.max(score,145);
        if(position==='DEF') score=Math.max(score,142);
        ranked.push({id,p,score,adp,position});
        p.sleeper_adp=adp;
    }

    ranked.sort((a,b)=>a.score-b.score||a.adp-b.adp||String(a.id).localeCompare(String(b.id)));
    ranked.forEach((entry,index)=>{
        entry.p.ggl_rank=index+1;
        entry.p.search_rank=index+1;
        entry.p.ggl_rank_source=anchors.has(normalize(playerName(entry.p)))
            ? 'FantasyPros PPR Superflex ECR'
            : entry.position==='QB'
                ? 'Sleeper ADP + blended GGL Superflex QB premium'
                : 'Sleeper 2026 PPR ADP';
    });

    if(ranked.length<50){
        console.warn(`Sleeper ADP returned only ${ranked.length} ranked players; using search-rank fallback.`);
        const fallback=Object.entries(players)
            .filter(([,p])=>['QB','RB','WR','TE','K','DEF'].includes(playerPosition(p)))
            .sort((a,b)=>{
                const ar=Number(a[1].search_rank??a[1].rank??99999),br=Number(b[1].search_rank??b[1].rank??99999);
                return ar-br||String(a[0]).localeCompare(String(b[0]));
            });
        fallback.forEach(([id,p],index)=>{p.ggl_rank=index+1;p.search_rank=index+1;p.ggl_rank_source='Sleeper fallback';});
    }

    return {playerData,adpCount:ranked.length};
}
