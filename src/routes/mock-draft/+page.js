import { loadPlayers } from '$lib/utils/helper';

const normalize=(v='')=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const playerName=(p={})=>`${p.fn||p.first_name||''} ${p.ln||p.last_name||''}`.trim();
const playerPosition=(p={})=>{const x=p.pos||p.position||'';return x==='DST'?'DEF':x;};

export async function load({fetch}){
    const [playerData,rankingResponse]=await Promise.all([
        loadPlayers(fetch),
        fetch('/api/mock-rankings').catch(()=>null)
    ]);

    const players=playerData?.players||{};
    let rankingData={rankings:[]};
    try{
        if(rankingResponse?.ok) rankingData=await rankingResponse.json();
    }catch(e){console.warn('Could not read Superflex ranking response',e);}

    const rankings=Array.isArray(rankingData?.rankings)?rankingData.rankings:[];
    const byName=new Map();
    for(const item of rankings){
        if(item?.name&&Number.isFinite(Number(item.rank))) byName.set(normalize(item.name),Number(item.rank));
    }

    let matched=0;
    for(const p of Object.values(players)){
        const position=playerPosition(p);
        const fixed=byName.get(normalize(playerName(p)));
        if(fixed&&['QB','RB','WR','TE','K','DEF'].includes(position)){
            p.ggl_rank=fixed;
            p.search_rank=fixed;
            p.ggl_rank_source='RotoBaller 2026 Superflex Top 200';
            matched++;
        }else{
            // The mock is intentionally based on the published Top 200. Players
            // outside that board remain searchable but sit behind all ranked players.
            const old=Number(p.search_rank??p.rank??99999);
            p.ggl_rank=10000+(Number.isFinite(old)?old:99999);
            p.search_rank=p.ggl_rank;
            p.ggl_rank_source='Outside Superflex Top 200';
        }
    }

    return {
        playerData,
        rankingSource:rankingData?.source||'RotoBaller',
        rankingCount:rankings.length,
        rankingMatched:matched,
        rankingError:rankingData?.error||null
    };
}
