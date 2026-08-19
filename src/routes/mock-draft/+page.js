import { loadPlayers } from '$lib/utils/helper';

// Verified FantasyPros 2026 Superflex anchors stay at the top of the board.
const FANTASYPROS_SUPERFLEX_2026 = [
    'Josh Allen','Drake Maye','Lamar Jackson','Joe Burrow','Bijan Robinson','Jayden Daniels',
    'Jahmyr Gibbs','Jalen Hurts',"Ja'Marr Chase",'Puka Nacua','Justin Herbert','Jaxon Smith-Njigba'
];

const normalize = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const playerName = (p={}) => `${p.fn||p.first_name||''} ${p.ln||p.last_name||''}`.trim();
const playerPosition = (p={}) => { const x=p.pos||p.position||''; return x==='DST'?'DEF':x; };
const rawRank = (p={}) => { const n=Number(p.search_rank??p.rank); return Number.isFinite(n)&&n>0?n:null; };
const isActive = (p={}) => p.active !== false && !['Inactive','Retired'].includes(p.status);

// Build a deterministic rank inside each position. Sleeper search_rank is used when
// present, then depth-chart order, then experience/name only as tie breakers.
// This prevents missing/equal search ranks from collapsing the board alphabetically.
function buildPositionRanks(players) {
    const groups={QB:[],RB:[],WR:[],TE:[],K:[],DEF:[]};
    for (const [id,p] of Object.entries(players)) {
        const position=playerPosition(p);
        if (!groups[position] || !isActive(p) || !playerName(p)) continue;
        groups[position].push({id,p});
    }
    const result=new Map();
    for (const [position,list] of Object.entries(groups)) {
        list.sort((a,b)=>{
            const ar=rawRank(a.p), br=rawRank(b.p);
            if (ar!==null || br!==null) {
                if (ar===null) return 1;
                if (br===null) return -1;
                if (ar!==br) return ar-br;
            }
            const ad=Number(a.p.depth_chart_order??99), bd=Number(b.p.depth_chart_order??99);
            if (ad!==bd) return ad-bd;
            const ae=Number(a.p.years_exp??0), be=Number(b.p.years_exp??0);
            if (ae!==be) return be-ae;
            return playerName(a.p).localeCompare(playerName(b.p));
        });
        list.forEach((entry,index)=>result.set(entry.id,{position,posRank:index+1}));
    }
    return result;
}

// Approximate 10-team Superflex draft slots from positional rank. These curves are
// deliberately format-aware rather than pretending Sleeper search_rank is ADP.
function superflexSlot(position,posRank) {
    switch(position) {
        case 'QB':
            if(posRank<=6) return 2+posRank*2.2;
            if(posRank<=12) return 15+(posRank-6)*4.2;
            if(posRank<=20) return 40+(posRank-12)*6;
            return 88+(posRank-20)*8;
        case 'RB':
            if(posRank<=8) return 5+posRank*2.8;
            if(posRank<=24) return 27+(posRank-8)*3.6;
            return 85+(posRank-24)*4.8;
        case 'WR':
            if(posRank<=10) return 6+posRank*2.5;
            if(posRank<=30) return 31+(posRank-10)*3.1;
            return 93+(posRank-30)*4.1;
        case 'TE':
            if(posRank<=3) return 18+posRank*7;
            if(posRank<=12) return 42+(posRank-3)*7;
            return 106+(posRank-12)*8;
        case 'K': return 145+posRank*2;
        case 'DEF': return 142+posRank*2.2;
        default: return 9999;
    }
}

export async function load({fetch}) {
    const playerData=await loadPlayers(fetch);
    const players=playerData?.players||{};
    const anchors=new Map(FANTASYPROS_SUPERFLEX_2026.map((name,index)=>[normalize(name),index+1]));
    const positional=buildPositionRanks(players);
    const pool=[];

    for (const [id,p] of Object.entries(players)) {
        const name=playerName(p), position=playerPosition(p), anchor=anchors.get(normalize(name));
        if(anchor){
            p.ggl_rank=anchor;
            p.ggl_rank_source='FantasyPros Superflex ECR';
            continue;
        }
        const info=positional.get(id);
        if(!info){p.ggl_rank=99999;p.ggl_rank_source='Not in draft pool';continue;}
        const original=rawRank(p);
        // Small market nudge preserves useful Sleeper ordering without allowing missing
        // values to create giant ties. Positional curve remains the dominant signal.
        const marketNudge=original===null?0:Math.min(original,500)*0.015;
        pool.push({id,p,score:superflexSlot(position,info.posRank)+marketNudge,posRank:info.posRank,position});
    }

    pool.sort((a,b)=>a.score-b.score || a.posRank-b.posRank || String(a.id).localeCompare(String(b.id)));
    pool.forEach((entry,index)=>{
        entry.p.ggl_rank=FANTASYPROS_SUPERFLEX_2026.length+index+1;
        entry.p.ggl_rank_source='GGL Superflex positional board';
        entry.p.ggl_position_rank=entry.posRank;
    });

    // Current mock UI and CPU read search_rank, so feed them the canonical GGL rank.
    for(const p of Object.values(players)) p.search_rank=p.ggl_rank??99999;
    return {playerData};
}
