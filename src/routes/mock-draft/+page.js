import { loadPlayers } from '$lib/utils/helper';

// 2026 Superflex/2QB master board. The first 100 are taken directly from the
// current August Superflex market board; Sleeper ADP is used only as deep fallback.
const SUPERFLEX_TOP_100 = [
'Josh Allen','Lamar Jackson','Jahmyr Gibbs','Jayden Daniels','Bijan Robinson','Drake Maye',"Ja'Marr Chase",'Joe Burrow','Puka Nacua','Christian McCaffrey','Jalen Hurts','Jaxon Smith-Njigba','Jonathan Taylor','Amon-Ra St. Brown','CeeDee Lamb','Justin Herbert','James Cook III','Caleb Williams','Justin Jefferson','Saquon Barkley','Trevor Lawrence','Derrick Henry','Kenneth Walker III','Ashton Jeanty','Chase Brown','Dak Prescott','Drake London','Omarion Hampton',"De'Von Achane",'Jaxson Dart','Brock Bowers','George Pickens','A.J. Brown','Nico Collins','Chris Olave','Kyren Williams','Matthew Stafford','Javonte Williams','Brock Purdy','Bo Nix','Jeremiyah Love','Malik Nabers','Trey McBride','DeVonta Smith','Josh Jacobs','Jared Goff','Travis Etienne Jr.','Breece Hall','Baker Mayfield','Tee Higgins','Zay Flowers','Rashee Rice','Ladd McConkey','Garrett Wilson','Emeka Egbuka','Kyler Murray','Davante Adams',"D'Andre Swift",'Jaylen Waddle','Colston Loveland','Luther Burden III','Cam Skattebo','Patrick Mahomes II','Jordan Love','Jameson Williams','Tyler Shough','Terry McLaurin','Tetairoa McMillan','Mike Evans','David Montgomery','DJ Moore','Bucky Irving','Jadarian Price','Malik Willis','Bhayshul Tuten','Christian Watson','Quinshon Judkins','Jordyn Tyson','Parker Washington','Sam Darnold','Rhamondre Stevenson','C.J. Stroud','TreVeyon Henderson','Tony Pollard','Carnell Tate','Daniel Jones','Marvin Harrison Jr.','Tyler Warren','Rico Dowdle','Rome Odunze','Tucker Kraft','Brian Thomas Jr.','Cam Ward','DK Metcalf','Jaylen Warren','Bryce Young','Jordan Addison','Sam LaPorta','Jayden Reed','J.K. Dobbins'
];

const normalize=(v='')=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const playerName=(p={})=>`${p.fn||p.first_name||''} ${p.ln||p.last_name||''}`.trim();
const playerPosition=(p={})=>{const x=p.pos||p.position||'';return x==='DST'?'DEF':x;};

function projectionPlayerId(row={}){return String(row.player_id??row.player?.player_id??row.player?.id??row.id??'');}
function projectionAdp(row={}){
 const stats=row.stats||row.projection||row;
 for(const key of ['adp_dd_ppr','adp_ppr']){const n=Number(stats?.[key]??row?.[key]);if(Number.isFinite(n)&&n>0&&n<999)return n;}
 return null;
}
async function loadSleeperAdp(fetch){
 for(const url of ['https://api.sleeper.com/projections/nfl/2026/1?season_type=regular&order_by=adp_dd_ppr','https://api.sleeper.com/projections/nfl/2026/1?season_type=regular&order_by=adp_ppr']){
  try{const r=await fetch(url,{headers:{accept:'application/json'}});if(!r.ok)continue;const rows=await r.json();if(Array.isArray(rows)&&rows.length)return rows;if(rows&&typeof rows==='object')return Object.values(rows);}catch(e){console.warn('Sleeper ADP fetch failed',e);}
 }
 return [];
}

export async function load({fetch}){
 const [playerData,adpRows]=await Promise.all([loadPlayers(fetch),loadSleeperAdp(fetch)]);
 const players=playerData?.players||{};
 const master=new Map(SUPERFLEX_TOP_100.map((name,i)=>[normalize(name),i+1]));
 const adpById=new Map();
 for(const row of adpRows){const id=projectionPlayerId(row),adp=projectionAdp(row);if(id&&adp!==null)adpById.set(id,adp);}

 // Primary board: authoritative Superflex order. No additional QB multiplier.
 const ranked=[],fallback=[];
 for(const [id,p] of Object.entries(players)){
  const fixed=master.get(normalize(playerName(p)));
  if(fixed){ranked.push({id,p,score:fixed});continue;}
  const adp=adpById.get(String(id));
  if(adp!==undefined&&['QB','RB','WR','TE','K','DEF'].includes(playerPosition(p)))fallback.push({id,p,adp});
  else{p.ggl_rank=99999;p.search_rank=99999;p.ggl_rank_source='Outside draft pool';}
 }
 ranked.sort((a,b)=>a.score-b.score);
 ranked.forEach((x,i)=>{x.p.ggl_rank=i+1;x.p.search_rank=i+1;x.p.ggl_rank_source='2026 Superflex/2QB master board';});

 // Players outside the master board remain usable, but can never jump ahead of it.
 fallback.sort((a,b)=>a.adp-b.adp||String(a.id).localeCompare(String(b.id)));
 fallback.forEach((x,i)=>{x.p.ggl_rank=101+i;x.p.search_rank=101+i;x.p.sleeper_adp=x.adp;x.p.ggl_rank_source='Sleeper deep-pool fallback';});

 return {playerData,adpCount:ranked.length+fallback.length};
}
