<script>
    import { round } from '$lib/utils/helper';
    import { getTeamFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import PlayerGameStats from './PlayerGameStats.svelte';

    export let matchup, players, active, ix, displayWeek, expandOverride=false, matchupWeek, leagueTeamManagers, year;

    let home = matchup[0];
    let away = matchup[1];

    let homePointsTotal = 0;
    let homeProjectionTotal = 0;
    let awayPointsTotal = 0;
    let awayProjectionTotal = 0;
    let selectedPlayer = null;
    let starters = [];
    let bench = [];
    let winning = 'home';

    const emptyPlayer = () => ({ playerID:null, fullName:'Empty', name:'Empty', avatar:null, pos:null, team:null, opponent:null, projection:0, points:0 });
    const playerDirectory = () => players?.players || players || {};
    const pointMap = (entry) => entry?.players_points || entry?.player_points || {};

    const digestStarter = (starter, points) => {
        if(!starter || starter == 0) return emptyPlayer();
        const player = playerDirectory()?.[starter];
        if(!player) return {
            playerID:starter, fullName:`Player ${starter}`, name:`Player ${starter}`,
            avatar:`background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`,
            pos:null, team:null, opponent:null, projection:0, points:Number(points)||0
        };

        const fullName = player.pos == 'DEF' ? player.ln : `${player.fn || ''} ${player.ln || ''}`.trim();
        const name = player.pos == 'DEF' ? player.ln : `${player.fn?.[0] || ''}. ${player.ln || ''}`.trim();
        let projection = 0;
        if(player.wi && player.wi[displayWeek]) projection = parseFloat(player.wi[displayWeek].p) || 0;

        return {
            playerID:starter, fullName, name,
            avatar: player.pos == 'DEF'
                ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${String(starter).toLowerCase()}.png)`
                : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${starter}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`,
            pos:player.pos, team:player.t,
            opponent:player.wi && player.wi[displayWeek] ? player.wi[displayWeek].o : null,
            projection, points:Number(points)||0
        };
    };

    const getStarterPoints = (entry, starterIDs) => {
        if(matchupWeek) return entry?.points?.[matchupWeek] || [];
        if(Array.isArray(entry?.starters_points)) return entry.starters_points;
        const scores = pointMap(entry);
        return (starterIDs || []).map((id) => Number(scores?.[id]) || 0);
    };

    const buildBench = (entry) => {
        const starterIDs = new Set((entry?.starters || []).map(String));
        const allPlayers = entry?.players || [];
        const scores = pointMap(entry);
        return allPlayers.filter((id) => id && !starterIDs.has(String(id))).map((id) => digestStarter(id, scores?.[id] || 0));
    };

    const digestMatchup = () => {
        home = matchup[0]; away = matchup[1];
        home.manager = getTeamFromTeamManagers(leagueTeamManagers, home.roster_id, year);
        away.manager = getTeamFromTeamManagers(leagueTeamManagers, away.roster_id, year);

        const homeStarters = matchupWeek ? home.starters?.[matchupWeek] || [] : home.starters || [];
        const awayStarters = matchupWeek ? away.starters?.[matchupWeek] || [] : away.starters || [];
        const homePoints = getStarterPoints(home, homeStarters);
        const awayPoints = getStarterPoints(away, awayStarters);

        homePointsTotal=0; homeProjectionTotal=0; awayPointsTotal=0; awayProjectionTotal=0;
        const starterRows=[];
        const starterLength=Math.max(homeStarters.length,awayStarters.length);
        for(let i=0;i<starterLength;i++) {
            const homePlayer=digestStarter(homeStarters[i],homePoints?.[i]||0);
            const awayPlayer=digestStarter(awayStarters[i],awayPoints?.[i]||0);
            homePointsTotal+=Number(homePlayer.points)||0; awayPointsTotal+=Number(awayPlayer.points)||0;
            homeProjectionTotal+=Number(homePlayer.projection)||0; awayProjectionTotal+=Number(awayPlayer.projection)||0;
            starterRows.push({home:homePlayer,away:awayPlayer});
        }
        const homeBench=buildBench(home), awayBench=buildBench(away), benchRows=[];
        for(let i=0;i<Math.max(homeBench.length,awayBench.length);i++) benchRows.push({home:homeBench[i]||emptyPlayer(),away:awayBench[i]||emptyPlayer()});
        starters=starterRows; bench=benchRows;
        if(awayPointsTotal<homePointsTotal) winning='home';
        if(awayPointsTotal>homePointsTotal) winning='away';
        if(awayPointsTotal==homePointsTotal) winning='tied';
    };

    const openPlayerStats=(player)=>{ if(!player?.playerID||player?.name=='Empty') return; selectedPlayer=player; };
    const closePlayerStats=()=>{ selectedPlayer=null; };
    $: digestMatchup(ix,players,matchupWeek,matchup);
    let el;
    $: top=el?.getBoundingClientRect()?el.getBoundingClientRect().top:0;
    const expandClose=()=>{ if(expandOverride)return; active=active==ix?null:ix; setTimeout(()=>window.scrollTo({left:0,top,behavior:'smooth'}),200); };
    const handlePlayerKey=(event,player)=>{ if(!player?.playerID)return; if(event.key==='Enter'||event.key===' '){event.preventDefault();openPlayerStats(player);} };
</script>

<style>
    .matchup { width: 95%; max-width: 600px; margin: 10px auto; }
    .header { display: flex; justify-content: space-between; position: relative; border: 1px solid #bbb; border-radius: 10px; opacity: 0.8; cursor: pointer; transition: opacity 0.5s; overflow: hidden; }
    .header:hover { opacity: 1; }
    .opponent { display: flex; align-items: center; width: 46%; padding: 5px 2%; top: 0; z-index: 2; }
    .divider { position: absolute; z-index: 3; transform: translateX(-50%); top: 0; left: 50%; height: 100%; width: 15px; }
    .home { justify-content: flex-start; left: 0; text-align: left; background-color: #485566; }
    :global(.homeGlow) { box-shadow: 0 0 6px 4px #3279cf; background-color: #00316b !important; }
    .away { justify-content: flex-end; right: 0; text-align: right; background-color: #8b6969; }
    :global(.awayGlow) { box-shadow: 0 0 6px 4px #d15454; background-color: #920505 !important; }
    .name { margin: 0 5px; font-size: 1em; line-height: 1.1em; flex-grow: 1; word-break: break-word; color: #fff; font-style: italic; }
    .avatar { vertical-align: middle; border-radius: 50%; height: 35px; width: 35px; margin: 0; border: 0.25px solid #777; background-color: #eee; }
    .playerAvatar { position: relative; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px; }
    .pos { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; max-width: 32px; min-width: 32px; height: 32px; }
    .QB { background-color: var(--QB); } .WR { background-color: var(--WR); } .RB { background-color: var(--RB); } .TE { background-color: var(--TE); }
    .FLEX { background: linear-gradient(to right, var(--WR), var(--WR) 33.33%, var(--RB) 33.33%, var(--RB) 66.66%, var(--TE) 66.66%); }
    .WRRB { background: linear-gradient(to right, var(--WR), var(--WR) 50%, var(--RB) 50%); } .K { background-color: var(--K); } .DEF { background-color: var(--DEF); }
    .DL, .DE, .DT { background-color: var(--DL); } .LB { background-color: var(--LB); } .DB, .CB, .SS, .FS { background-color: var(--DB); }
    .IDP { background: linear-gradient(to right, var(--DL), var(--DL) 33.33%, var(--LB) 33.33%, var(--LB) 66.66%, var(--DB) 66.66%); }
    .rosters { position: relative; background-color: var(--fff); border-radius: 8px; overflow: hidden; border-left: 1px solid #bbb; border-right: 1px solid #bbb; border-bottom: 1px solid #bbb; transition: max-height 0.45s ease; }
    .line { position: relative; display: flex; justify-content: space-between; border-top: 1px solid #bbb; min-height: 72px; }
    .player { position: relative; width: 46%; transition: background-color 0.15s ease; } .playerClickable { cursor: pointer; } .playerClickable:hover { background-color: var(--eee); }
    .iconAndTeam { display: flex; align-items: center; } .iconAndTeamHome { justify-content: flex-start; } .iconAndTeamAway { justify-content: flex-end; }
    .playerHome { padding: 0 1.5% 0 2.5%; text-align: left; } .playerAway { padding: 0 2.5% 0 1.5%; text-align: right; }
    .playerInfo { display: inline-block; padding: 0 6px; } .playerTeam { display: inline-block; color: #888; font-style: italic; text-align: center; font-size: 0.5em; }
    .playerName { word-break: break-word; } .playerNameHome { text-align: left; } .playerNameAway { text-align: right; }
    .dividerLine { display: block; position: absolute; top: 0; left: 50%; height: 100%; width: 0; border-left: 1px solid var(--eee); z-index: 1; }
    .close { display: block; width: 100%; background-color: var(--eee); text-align: center; cursor: pointer; z-index: 2; font-size: 1.1em; padding: 6px 0; } .close:hover { background-color: var(--ddd); }
    .nameHolder { display: block; } .nameHolderR { justify-content: flex-end; text-align: right; } .nameHolderL { justify-content: flex-start; text-align: left; }
    .totalPoints { line-height: 1.1em; color: #fff; } .totalPointsR { margin-right: 0.1em; text-align: right; } .totalPointsL { margin-left: 0.1em; text-align: left; }
    .totalProjection { color: #ccc; font-size: 0.7em; font-style: italic; } .points { position: absolute; line-height: 1.1em; top: 1em; } .pointsL { left: 1em; } .pointsR { right: 1em; }
    .playerEmpty { height: 100%; color: #555; font-style: italic; display: flex; align-items: center; }
    .teamLogo { width: 21px; position: absolute; top: 0; } .teamHomeLogo { right: -16px; } .teamAwayLogo { left: -16px; }
    .benchHeader { position: relative; z-index: 3; padding: 8px 12px; border-top: 1px solid #bbb; background: var(--f3f3f3); text-align: center; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.7px; text-transform: uppercase; opacity: 0.72; }
    .benchLine { background: color-mix(in srgb, var(--f3f3f3) 45%, var(--fff)); } .benchLine .totalProjection { display: none; }
    @media (max-width:500px){.name,.totalPoints,.nameHolder{font-size:.8em}.points{font-size:.9em}}
    @media (max-width:410px){.name,.totalPoints,.nameHolder{font-size:.7em}.points{font-size:.75em}}
    @media (max-width:360px){.name,.totalPoints{font-size:.5em}}
    @media (max-width:340px){.teamLogo{width:20px}.teamHomeLogo{right:-7px}.teamAwayLogo{left:-7px}}
</style>

{#snippet playerCell(player, side)}
    <div class="player {side === 'home' ? 'playerHome' : 'playerAway'}{player.playerID ? ' playerClickable' : ''}" role={player.playerID ? 'button' : undefined} tabindex={player.playerID ? '0' : undefined} onclick={() => openPlayerStats(player)} onkeydown={(event) => handlePlayerKey(event, player)}>
        {#if side === 'home'}
            <span class="iconAndTeam iconAndTeamHome">{#if player.pos}<span class="pos {player.pos}">{player.pos}</span>{/if}{#if player.avatar}<div class="playerAvatar playerInfo" style={player.avatar}>{#if player.team && player.pos != 'DEF'}<img src="https://sleepercdn.com/images/team_logos/nfl/{player.team.toLowerCase()}.png" class="teamLogo teamHomeLogo" alt="team logo" />{/if}</div>{/if}</span>
            <div class="nameHolder nameHolderL{player.name == 'Empty' ? ' playerEmpty' : ''}"><span class="playerInfo playerName playerNameHome">{player.name}</span>{#if player.team}<div class="playerTeam">{player.pos != 'DEF' ? player.team : ''}{player.opponent ? ` vs ${player.opponent}` : ''}</div>{/if}</div>
            <span class="points pointsR">{round(player.points)}<div class="totalProjection">{round(player.projection)}</div></span>
        {:else}
            <span class="iconAndTeam iconAndTeamAway">{#if player.avatar}<div class="playerAvatar playerInfo" style={player.avatar}>{#if player.team && player.pos != 'DEF'}<img src="https://sleepercdn.com/images/team_logos/nfl/{player.team.toLowerCase()}.png" class="teamLogo teamAwayLogo" alt="team logo" />{/if}</div>{/if}{#if player.pos}<span class="pos {player.pos}">{player.pos}</span>{/if}</span>
            <div class="nameHolder nameHolderR{player.name == 'Empty' ? ' playerEmpty' : ''}">{#if player.team}<div class="playerTeam">{player.opponent ? `${player.opponent} vs ` : ''}{player.pos != 'DEF' ? player.team : ''}</div>{/if}<span class="playerInfo playerName playerNameAway">{player.name}</span></div>
            <span class="points pointsL">{round(player.points)}<div class="totalProjection">{round(player.projection)}</div></span>
        {/if}
    </div>
{/snippet}

<div class="matchup">
    <div class="header" onclick={() => expandClose()} bind:this={el}>
        <div class="opponent home{winning == 'home' ? ' homeGlow' : ''}"><img class="avatar" src={home.manager.avatar} alt="home team avatar" /><div class="name">{home.manager.name}</div><div class="totalPoints totalPointsR">{round(homePointsTotal)}<div class="totalProjection">{round(homeProjectionTotal)}</div></div></div>
        <img class="divider" src="/{winning}Divider.jpg" alt="divider" />
        <div class="opponent away{winning == 'away' ? ' awayGlow' : ''}"><div class="totalPoints totalPointsL">{round(awayPointsTotal)}<div class="totalProjection">{round(awayProjectionTotal)}</div></div><div class="name">{away.manager.name}</div><img class="avatar" src={away.manager.avatar} alt="away team avatar" /></div>
    </div>
    <div class="rosters" style="max-height: {active == ix ? '5000px' : '0'}; {active != ix ? 'border: none' : ''};">
        {#each starters as player}<div class="line">{@render playerCell(player.home, 'home')}<div class="dividerLine"></div>{@render playerCell(player.away, 'away')}</div>{/each}
        {#if bench.length}<div class="benchHeader">Bench</div>{#each bench as player}<div class="line benchLine">{@render playerCell(player.home, 'home')}<div class="dividerLine"></div>{@render playerCell(player.away, 'away')}</div>{/each}{/if}
        {#if !expandOverride}<div class="close" onclick={() => expandClose()}>Close Matchup</div>{/if}
    </div>
</div>

{#if selectedPlayer}<PlayerGameStats player={selectedPlayer} {year} week={displayWeek} onClose={closePlayerStats} />{/if}