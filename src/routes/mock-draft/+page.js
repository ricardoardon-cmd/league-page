import { loadPlayers } from '$lib/utils/helper';

// Keep the verified FantasyPros Superflex leaders as light anchors while the
// complete board comes from Sleeper's 2026 draft ADP feed.
const FANTASYPROS_SUPERFLEX_2026 = [
    'Josh Allen','Drake Maye','Lamar Jackson','Joe Burrow','Bijan Robinson','Jayden Daniels',
    'Jahmyr Gibbs','Jalen Hurts',"Ja'Marr Chase",'Puka Nacua','Justin Herbert','Jaxon Smith-Njigba'
];

const normalize=(v='')=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const playerName=(p={})=>`${p.fn||p.first_name||''} ${p.ln||p.last_name||''}`.trim();
const playerPosition=(p={})=>{const x=p.pos||p.position||'';return x==='DST'?'DEF':x;};

function projectionPlayerId(row={}) {
    return String(row.player_id ?? row.player?.player_id ?? row.player?.id ?? row.id ?? '');
}
function projectionAdp(row={}) {
    // Sleeper's current week-1 draft feed exposes adp_dd_ppr. Keep compatible
    // aliases in case Sleeper changes/duplicates the key in the response.
    const stats=row.stats||row.projection||row;
    for(const key of ['adp_dd_ppr','adp_ppr','adp_dd_half_ppr','adp_dd_std','adp']) {
        const n=Number(stats?.[key] ?? row?.[key]);
        if(Number.isFinite(n) && n>0 && n<999) return n;
    }
    return null;
}

// Sleeper ADP is primarily a normal redraft market. For GGL Superflex we keep
// that real market order, then pull QBs forward based on QB positional rank.
function superflexAdp(position,adp,qbRank) {
    if(position!=='QB') return adp;
    if(qbRank<=6) return Math.min(adp,2+qbRank*2.2);
    if(qbRank<=12) return Math.min(adp,15+(qbRank-6)*4.2);
    if(qbRank<=20) return Math.min(adp,40+(qbRank-12)*6);
    return adp;
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

    // Rank QBs by their real Sleeper ADP so the Superflex premium is applied in
    // market order instead of from player names/search_rank.
    const qbs=Object.entries(players)
        .filter(([id,p])=>playerPosition(p)==='QB'&&adpById.has(String(id)))
        .sort((a,b)=>adpById.get(String(a[0]))-adpById.get(String(b[0])));
    const qbRank=new Map(qbs.map(([id],index)=>[String(id),index+1]));

    const ranked=[];
    for(const [id,p] of Object.entries(players)){
        const position=playerPosition(p),adp=adpById.get(String(id));
        if(adp===undefined){
            p.ggl_rank=99999;
            p.ggl_rank_source='No Sleeper ADP';
            continue;
        }
        const anchor=anchors.get(normalize(playerName(p)));
        let score=superflexAdp(position,adp,qbRank.get(String(id))||999);
        // Anchors only nudge the very top; Sleeper ADP remains the full-board source.
        if(anchor) score=Math.min(score,anchor);
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
            ? 'Sleeper ADP + FantasyPros Superflex anchor'
            : entry.position==='QB'
                ? 'Sleeper ADP + GGL Superflex QB adjustment'
                : 'Sleeper 2026 PPR ADP';
    });

    // If the feed is temporarily unavailable, preserve a deterministic fallback
    // instead of allowing the UI to fall into alphabetical ordering.
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
