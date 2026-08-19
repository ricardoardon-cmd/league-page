<script>
    import { onMount } from 'svelte';

    export let data;

    const SUPABASE_URL = 'https://uawddygirnbpmkjhqcvu.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_bEps0rM2t0HJsA6BPLjQPg_becZ1PsM';
    const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

    let mode = 'home';
    let name = '';
    let room = null;
    let teams = [];
    let picks = [];
    let activeRooms = [];
    let loading = false;
    let error = '';
    let pollTimer;
    let clientToken = '';
    let search = '';
    let positionFilter = 'ALL';
    let cpuWorking = false;

    const sleeperPlayers = data?.playerData?.players || {};

    const playerPool = Object.entries(sleeperPlayers)
        .map(([id, player]) => ({ id, ...player }))
        .filter((player) => {
            const pos = normalizePosition(player.pos || player.position);
            return POSITION_ORDER.includes(pos) && (player.fn || player.first_name || player.ln || player.last_name);
        });

    const headers = (prefer) => ({
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {})
    });

    const hiddenRoomCode = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();

    function normalizePosition(pos) {
        if (pos === 'DST') return 'DEF';
        return pos || 'UNK';
    }

    function playerName(player) {
        const first = player.fn || player.first_name || '';
        const last = player.ln || player.last_name || '';
        if (normalizePosition(player.pos || player.position) === 'DEF') return player.t || player.team || `${first} ${last}`.trim();
        return `${first} ${last}`.trim() || player.full_name || 'Unknown Player';
    }

    function nflTeam(player) {
        return player.t || player.team || 'FA';
    }

    function playerRank(player) {
        const raw = Number(player.search_rank ?? player.rank ?? 9999);
        return Number.isFinite(raw) && raw > 0 ? raw : 9999;
    }

    function snakeSlotForOverall(overallPick, teamCount = 10) {
        const round = Math.floor((overallPick - 1) / teamCount) + 1;
        const pickInRound = ((overallPick - 1) % teamCount) + 1;
        return round % 2 === 1 ? pickInRound : teamCount - pickInRound + 1;
    }

    function overallForRoundAndSlot(round, slot, teamCount = 10) {
        const pickInRound = round % 2 === 1 ? slot : teamCount - slot + 1;
        return (round - 1) * teamCount + pickInRound;
    }

    const request = async (path, options = {}) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
            ...options,
            headers: {
                ...headers(options.prefer),
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Supabase request failed (${response.status})`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    };

    const loadActiveRooms = async () => {
        try {
            activeRooms = await request('mock_rooms?status=in.(lobby,drafting)&select=*&order=created_at.desc&limit=8') || [];
        } catch (err) {
            console.error(err);
        }
    };

    const refreshRoom = async () => {
        if (!room?.id) return;

        try {
            const [roomRows, teamRows, pickRows] = await Promise.all([
                request(`mock_rooms?id=eq.${room.id}&select=*`),
                request(`mock_teams?room_id=eq.${room.id}&select=*&order=draft_slot.asc`),
                request(`mock_picks?room_id=eq.${room.id}&select=*&order=overall_pick.asc`)
            ]);

            if (roomRows?.[0]) room = roomRows[0];
            teams = teamRows || [];
            picks = pickRows || [];
            mode = room?.status === 'drafting' || room?.status === 'completed' ? 'draft' : 'room';

            if (room?.status === 'drafting') requestAnimationFrame(maybeRunCpu);
        } catch (err) {
            console.error(err);
        }
    };

    const beginPolling = () => {
        clearInterval(pollTimer);
        pollTimer = setInterval(refreshRoom, 1500);
    };

    const createRoom = async () => {
        error = '';
        loading = true;

        try {
            const created = await request('mock_rooms', {
                method: 'POST',
                prefer: 'return=representation',
                body: JSON.stringify({
                    room_code: hiddenRoomCode(),
                    host_id: clientToken,
                    team_count: 10,
                    rounds: 16,
                    status: 'lobby',
                    current_pick: 1
                })
            });

            room = created?.[0];
            if (!room) throw new Error('Room could not be created.');

            const teamRows = Array.from({ length: 10 }, (_, index) => ({
                room_id: room.id,
                draft_slot: index + 1,
                is_cpu: true
            }));

            await request('mock_teams', {
                method: 'POST',
                prefer: 'return=minimal',
                body: JSON.stringify(teamRows)
            });

            await refreshRoom();
            mode = 'room';
            beginPolling();
        } catch (err) {
            error = err.message || 'Unable to create room.';
        } finally {
            loading = false;
        }
    };

    const joinRoom = async (activeRoom) => {
        error = '';
        loading = true;

        try {
            room = activeRoom;
            await refreshRoom();
            beginPolling();
        } catch (err) {
            error = err.message || 'Unable to join room.';
        } finally {
            loading = false;
        }
    };

    const claimTeam = async (team) => {
        error = '';
        if (!name.trim()) {
            error = 'Enter your name before claiming a team.';
            return;
        }

        try {
            const alreadyMine = teams.find((item) => item.player_token === clientToken);
            if (alreadyMine && alreadyMine.id !== team.id) {
                await request(`mock_teams?id=eq.${alreadyMine.id}`, {
                    method: 'PATCH', prefer: 'return=minimal',
                    body: JSON.stringify({ manager_name: null, player_token: null, is_cpu: true })
                });
            }

            await request(`mock_teams?id=eq.${team.id}&is_cpu=eq.true`, {
                method: 'PATCH', prefer: 'return=minimal',
                body: JSON.stringify({ manager_name: name.trim(), player_token: clientToken, is_cpu: false })
            });

            await refreshRoom();
        } catch (err) {
            error = err.message || 'Unable to claim that draft slot.';
        }
    };

    const releaseTeam = async (team) => {
        try {
            await request(`mock_teams?id=eq.${team.id}`, {
                method: 'PATCH', prefer: 'return=minimal',
                body: JSON.stringify({ manager_name: null, player_token: null, is_cpu: true })
            });
            await refreshRoom();
        } catch (err) {
            error = err.message || 'Unable to release team.';
        }
    };

    const startDraft = async () => {
        if (room?.host_id !== clientToken) {
            error = 'Only the person who started this mock can begin the draft.';
            return;
        }
        if (!teams.some((team) => team.player_token === clientToken)) {
            error = 'Claim a draft slot before starting.';
            return;
        }

        loading = true;
        error = '';
        try {
            await request(`mock_rooms?id=eq.${room.id}`, {
                method: 'PATCH', prefer: 'return=minimal',
                body: JSON.stringify({ status: 'drafting', current_pick: 1 })
            });
            await refreshRoom();
        } catch (err) {
            error = err.message || 'Unable to start draft.';
        } finally {
            loading = false;
        }
    };

    function pickContext(overallPick = room?.current_pick || 1) {
        const teamCount = Number(room?.team_count || 10);
        const round = Math.floor((overallPick - 1) / teamCount) + 1;
        const pickInRound = ((overallPick - 1) % teamCount) + 1;
        const slot = snakeSlotForOverall(overallPick, teamCount);
        const team = teams.find((item) => Number(item.draft_slot) === slot);
        return { overallPick, round, pickInRound, slot, team };
    }

    $: current = room ? pickContext() : null;
    $: myTeam = teams.find((team) => team.player_token === clientToken);
    $: myTurn = room?.status === 'drafting' && current?.team?.player_token === clientToken;
    $: draftedIds = new Set(picks.map((pick) => String(pick.player_id)));
    $: availablePlayers = playerPool
        .filter((player) => !draftedIds.has(String(player.id)))
        .filter((player) => positionFilter === 'ALL' || normalizePosition(player.pos || player.position) === positionFilter)
        .filter((player) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return playerName(player).toLowerCase().includes(q) || nflTeam(player).toLowerCase().includes(q);
        })
        .sort((a, b) => playerRank(a) - playerRank(b))
        .slice(0, 120);

    async function makePick(player, team = current?.team) {
        if (!room || !team || room.status !== 'drafting') return;
        const context = pickContext(Number(room.current_pick));
        if (context.team?.id !== team.id) return;

        const pos = normalizePosition(player.pos || player.position);
        const totalPicks = Number(room.team_count || 10) * Number(room.rounds || 16);

        try {
            await request('mock_picks', {
                method: 'POST', prefer: 'return=minimal',
                body: JSON.stringify({
                    room_id: room.id,
                    team_id: team.id,
                    overall_pick: context.overallPick,
                    round: context.round,
                    pick_in_round: context.pickInRound,
                    player_id: String(player.id),
                    player_name: playerName(player),
                    position: pos
                })
            });

            const nextPick = context.overallPick + 1;
            await request(`mock_rooms?id=eq.${room.id}&current_pick=eq.${context.overallPick}`, {
                method: 'PATCH', prefer: 'return=minimal',
                body: JSON.stringify({
                    current_pick: Math.min(nextPick, totalPicks + 1),
                    status: context.overallPick >= totalPicks ? 'completed' : 'drafting'
                })
            });

            await refreshRoom();
        } catch (err) {
            if (!String(err.message).includes('duplicate')) error = err.message || 'Unable to make pick.';
            await refreshRoom();
        }
    }

    const draftPlayer = async (player) => {
        if (!myTurn) return;
        await makePick(player, current.team);
    };

    function rosterCounts(teamId) {
        const counts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
        picks.filter((pick) => pick.team_id === teamId).forEach((pick) => {
            if (counts[pick.position] !== undefined) counts[pick.position] += 1;
        });
        return counts;
    }

    function cpuScore(player, teamId, round) {
        const pos = normalizePosition(player.pos || player.position);
        const counts = rosterCounts(teamId);
        let score = 10000 - playerRank(player);

        if (pos === 'QB') {
            if (counts.QB < 2) score += round <= 5 ? 1200 : 700;
            else if (counts.QB >= 3) score -= 900;
        }
        if (pos === 'RB') {
            if (counts.RB < 2) score += 500;
            if (counts.RB >= 5) score -= 600;
        }
        if (pos === 'WR') {
            if (counts.WR < 3) score += 500;
            if (counts.WR >= 6) score -= 500;
        }
        if (pos === 'TE') {
            if (counts.TE < 1) score += round >= 4 ? 300 : 100;
            if (counts.TE >= 2) score -= 550;
        }
        if (pos === 'K' || pos === 'DEF') {
            if (round < 13) score -= 3000;
            if (counts[pos] >= 1) score -= 5000;
        }

        return score;
    }

    async function maybeRunCpu() {
        if (cpuWorking || room?.status !== 'drafting') return;
        const context = pickContext(Number(room.current_pick));
        if (!context.team?.is_cpu) return;

        cpuWorking = true;
        try {
            const candidates = playerPool
                .filter((player) => !draftedIds.has(String(player.id)))
                .filter((player) => POSITION_ORDER.includes(normalizePosition(player.pos || player.position)))
                .sort((a, b) => cpuScore(b, context.team.id, context.round) - cpuScore(a, context.team.id, context.round));

            const choice = candidates[0];
            if (choice) {
                await new Promise((resolve) => setTimeout(resolve, 700));
                await makePick(choice, context.team);
            }
        } finally {
            cpuWorking = false;
        }
    }

    const leaveRoom = async () => {
        clearInterval(pollTimer);
        room = null;
        teams = [];
        picks = [];
        mode = 'home';
        error = '';
        await loadActiveRooms();
    };

    onMount(async () => {
        clientToken = localStorage.getItem('ggl_mock_token') || crypto.randomUUID();
        localStorage.setItem('ggl_mock_token', clientToken);
        await loadActiveRooms();
        return () => clearInterval(pollTimer);
    });
</script>

<svelte:head><title>GGL Mock Draft</title></svelte:head>

<div class="page">
    <div class="header">
        <div class="eyebrow">GGL DRAFT LAB</div>
        <h1>🎯 Mock Draft</h1>
        <p>Run a 10-team GGL Superflex mock with league mates. Unclaimed teams draft automatically.</p>
    </div>

    {#if mode === 'home'}
        <section class="card homeCard">
            <div class="field"><label for="managerName">Your name</label><input id="managerName" bind:value={name} placeholder="Ricardo" /></div>
            <button class="primary" onclick={createRoom} disabled={loading}>{loading ? 'Starting mock…' : 'Start New Mock'}</button>
            <div class="divider"><span>active mocks</span></div>
            {#if activeRooms.length}
                <div class="activeList">
                    {#each activeRooms as activeRoom, index}
                        <button class="activeRoom" onclick={() => joinRoom(activeRoom)} disabled={loading}>
                            <span class="mockNumber">Mock #{activeRooms.length - index}</span>
                            <span class="mockMeta">10 teams · 16 rounds · {activeRoom.status === 'drafting' ? 'In progress' : 'Lobby open'}</span>
                            <strong>{activeRoom.status === 'drafting' ? 'Watch / Rejoin →' : 'Join Mock →'}</strong>
                        </button>
                    {/each}
                </div>
            {:else}<div class="emptyActive">No mock is open right now. Start one and your league mates will see it here.</div>{/if}
            <div class="featureGrid"><div><b>10 teams</b><span>Claim any open slot</span></div><div><b>16 rounds</b><span>Snake format</span></div><div><b>Superflex</b><span>2-QB CPU logic</span></div></div>
        </section>
    {:else if mode === 'room' && room}
        <section class="roomBar"><div><span class="label">Mock draft</span><strong>Active Lobby</strong></div><div><span class="label">Status</span><strong>{room.status}</strong></div><button onclick={leaveRoom}>Leave</button></section>
        <section class="card nameCard"><div class="field"><label for="roomName">Your display name</label><input id="roomName" bind:value={name} placeholder="Enter your name to claim a team" /></div></section>
        <div class="sectionTitle"><div><h2>Draft Order</h2><p>Tap any CPU slot to claim it. Unclaimed slots stay CPU controlled.</p></div><span>{teams.filter((team) => !team.is_cpu).length}/10 joined</span></div>
        <section class="teamGrid">
            {#each teams as team}
                <article class:mine={team.player_token === clientToken} class:human={!team.is_cpu} class="teamCard">
                    <div class="slot">{team.draft_slot}</div><div class="teamInfo"><strong>{team.is_cpu ? 'GGL CPU' : team.manager_name}</strong><span>{team.is_cpu ? 'Available to claim' : team.player_token === clientToken ? 'Your team' : 'League mate'}</span></div>
                    {#if team.player_token === clientToken}<button class="release" onclick={() => releaseTeam(team)}>Release</button>{:else if team.is_cpu}<button class="claim" onclick={() => claimTeam(team)}>Claim</button>{:else}<span class="taken">Taken</span>{/if}
                </article>
            {/each}
        </section>
        {#if room.host_id === clientToken}<button class="startDraft" onclick={startDraft} disabled={loading}>Start Draft</button>{:else}<div class="waiting">Waiting for the mock host to start the draft.</div>{/if}
    {:else if mode === 'draft' && room}
        <section class="draftTop">
            <button onclick={leaveRoom}>← Leave</button>
            <div><span>{room.status === 'completed' ? 'Draft complete' : `Round ${current?.round} · Pick ${current?.overallPick} · Slot ${current?.slot}`}</span><strong>{room.status === 'completed' ? 'GGL Mock Complete' : `${current?.team?.is_cpu ? 'GGL CPU' : current?.team?.manager_name || 'Team'} is on the clock`}</strong></div>
            <div class:yourTurn={myTurn} class="turnBadge">{room.status === 'completed' ? `${picks.length} picks` : myTurn ? 'YOUR PICK' : current?.team?.is_cpu ? 'CPU PICK' : 'WAITING'}</div>
        </section>

        <div class="draftLayout">
            <section class="boardPanel">
                <div class="panelHeading"><h2>Draft Board</h2><span>Snake · {picks.length}/{(room.team_count || 10) * (room.rounds || 16)}</span></div>
                <div class="boardScroller">
                    <div class="board">
                        <div class="corner">Rd</div>
                        {#each teams as team}<div class:mineHeader={team.player_token === clientToken} class="teamHeader"><b>S{team.draft_slot}</b><small>{team.is_cpu ? 'CPU' : team.manager_name}</small></div>{/each}
                        {#each Array.from({length: room.rounds || 16}, (_, r) => r + 1) as round}
                            <div class="roundLabel">R{round}</div>
                            {#each teams as team}
                                {@const overall = overallForRoundAndSlot(round, Number(team.draft_slot), Number(room.team_count || 10))}
                                {@const pickInRound = ((overall - 1) % Number(room.team_count || 10)) + 1}
                                {@const pick = picks.find((item) => item.overall_pick === overall)}
                                <div class:activePick={room.current_pick === overall && room.status === 'drafting'} class:minePick={team.player_token === clientToken} class={`boardCell ${pick ? `pos-${pick.position}` : ''}`}>
                                    <small>{round}.{String(pickInRound).padStart(2,'0')} · #{overall}</small>
                                    {#if pick}<b>{pick.player_name}</b><span>{pick.position}</span>{:else}<b>{team.is_cpu ? 'CPU' : team.manager_name || `Slot ${team.draft_slot}`}</b><span>—</span>{/if}
                                </div>
                            {/each}
                        {/each}
                    </div>
                </div>
            </section>

            <section class="playerPanel">
                <div class="panelHeading"><h2>Available Players</h2><span>{myTurn ? 'Make your pick' : 'Best available'}</span></div>
                <input class="search" bind:value={search} placeholder="Search player or NFL team" />
                <div class="filters">{#each ['ALL', ...POSITION_ORDER] as pos}<button class:active={positionFilter===pos} onclick={() => positionFilter=pos}>{pos}</button>{/each}</div>
                <div class="playerList">
                    {#each availablePlayers as player}
                        {@const pos = normalizePosition(player.pos || player.position)}
                        <button class={`playerRow pos-${pos}`} onclick={() => draftPlayer(player)} disabled={!myTurn || room.status !== 'drafting'}>
                            <span class="rank">{playerRank(player) < 9999 ? playerRank(player) : '—'}</span>
                            <span class="pInfo"><b>{playerName(player)}</b><small>{pos} · {nflTeam(player)}</small></span>
                            <span class="draftAction">{myTurn ? 'Draft' : pos}</span>
                        </button>
                    {/each}
                </div>
                <p class="engineNote">CPU test engine currently uses Sleeper search rank plus GGL roster-construction rules. FantasyPros Superflex will replace the ranking layer next.</p>
            </section>
        </div>
    {/if}

    {#if error}<div class="error">{error}</div>{/if}
</div>

<style>
.page{width:96%;max-width:1200px;margin:auto;padding:24px 0 70px}.header{text-align:center;margin-bottom:20px}.eyebrow{font-size:.7rem;font-weight:900;letter-spacing:.14em;opacity:.55}.header h1{font-size:2.2rem;margin:5px 0 6px}.header p{max-width:650px;margin:auto;line-height:1.45;opacity:.65}.card,.roomBar,.teamCard,.draftTop,.boardPanel,.playerPanel{background:var(--fff);border:1px solid var(--ccc);border-radius:16px}.homeCard{max-width:620px;margin:auto;padding:20px}.field{display:flex;flex-direction:column;gap:7px}.field label{font-size:.72rem;font-weight:850;opacity:.65}.field input,.search{border:1px solid var(--ccc);background:var(--f3f3f3);color:inherit;border-radius:12px;padding:12px 13px;font:inherit;box-sizing:border-box}.primary,.claim,.release,.roomBar button,.startDraft,.draftTop button{border:0;border-radius:12px;padding:11px 14px;font:inherit;font-weight:850;cursor:pointer}.primary,.startDraft{width:100%;margin-top:12px;background:var(--blueOne);color:#fff}.divider{display:flex;align-items:center;gap:10px;margin:18px 0 12px;font-size:.7rem;opacity:.5}.divider:before,.divider:after{content:'';height:1px;background:var(--ccc);flex:1}.activeList{display:flex;flex-direction:column;gap:8px}.activeRoom{display:grid;grid-template-columns:1fr auto;gap:3px 10px;width:100%;padding:12px;border:1px solid var(--ccc);border-radius:12px;background:var(--f3f3f3);color:inherit;text-align:left;cursor:pointer}.mockNumber{font-weight:900}.mockMeta{grid-column:1;font-size:.68rem;opacity:.55}.activeRoom strong{grid-column:2;grid-row:1/3;align-self:center;color:var(--blueOne);font-size:.78rem}.emptyActive,.waiting{padding:15px;border:1px dashed var(--ccc);border-radius:12px;text-align:center;font-size:.76rem;line-height:1.45;opacity:.65;margin-top:12px}.featureGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.featureGrid div{border:1px solid var(--ccc);border-radius:12px;padding:10px;text-align:center}.featureGrid b,.featureGrid span{display:block}.featureGrid span{font-size:.65rem;opacity:.55;margin-top:3px}.roomBar{display:flex;align-items:center;gap:18px;padding:14px;margin-bottom:12px}.roomBar>div{display:flex;flex-direction:column}.roomBar .label{font-size:.62rem;text-transform:uppercase;opacity:.5}.roomBar button{margin-left:auto;background:var(--f3f3f3);color:inherit;border:1px solid var(--ccc)}.nameCard{padding:14px;margin-bottom:16px}.sectionTitle{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:18px 2px 10px}.sectionTitle h2{margin:0}.sectionTitle p{margin:4px 0 0;font-size:.75rem;opacity:.6}.sectionTitle>span{font-size:.75rem;font-weight:850}.teamGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.teamCard{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding:12px}.teamCard.human{border-color:var(--blueTwo)}.teamCard.mine{box-shadow:0 0 0 2px color-mix(in srgb,var(--blueOne) 45%,transparent)}.slot{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--f3f3f3);font-weight:900}.teamInfo{min-width:0;display:flex;flex-direction:column}.teamInfo span{font-size:.68rem;opacity:.55}.claim{background:var(--blueOne);color:#fff}.release{background:var(--f3f3f3);color:inherit;border:1px solid var(--ccc)}.taken{font-size:.68rem;font-weight:850;opacity:.5}.draftTop{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:12px;margin-bottom:12px;position:sticky;top:0;z-index:3}.draftTop button{background:var(--f3f3f3);color:inherit;border:1px solid var(--ccc)}.draftTop div:nth-child(2){display:flex;flex-direction:column}.draftTop div:nth-child(2) span{font-size:.68rem;opacity:.55}.turnBadge{padding:8px 10px;border-radius:999px;background:var(--f3f3f3);font-size:.68rem;font-weight:900}.turnBadge.yourTurn{background:var(--blueOne);color:#fff}.draftLayout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:12px}.boardPanel,.playerPanel{overflow:hidden}.panelHeading{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--ccc)}.panelHeading h2{margin:0;font-size:1rem}.panelHeading span{font-size:.68rem;opacity:.55}.boardScroller{overflow:auto;max-height:70vh}.board{display:grid;grid-template-columns:46px repeat(10,minmax(110px,1fr));min-width:1180px}.corner,.teamHeader,.roundLabel{background:var(--f3f3f3);border-right:1px solid var(--ccc);border-bottom:1px solid var(--ccc)}.corner{position:sticky;left:0;top:0;z-index:3;display:grid;place-items:center;font-size:.65rem;font-weight:900}.teamHeader{position:sticky;top:0;z-index:2;min-height:42px;padding:6px;display:flex;flex-direction:column;justify-content:center}.teamHeader b{font-size:.7rem}.teamHeader small{font-size:.55rem;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.teamHeader.mineHeader{background:color-mix(in srgb,var(--blueOne) 10%,var(--f3f3f3))}.roundLabel{position:sticky;left:0;z-index:1;display:grid;place-items:center;font-size:.7rem;font-weight:900}.boardCell{min-height:58px;padding:7px;border-right:1px solid var(--ccc);border-bottom:1px solid var(--ccc);display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}.boardCell small{font-size:.55rem;opacity:.45}.boardCell b{font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.boardCell span{font-size:.58rem;font-weight:850;opacity:.7}.boardCell.activePick{box-shadow:inset 0 0 0 3px var(--blueOne)}.boardCell.minePick{background:color-mix(in srgb,var(--blueOne) 7%,var(--fff))}.playerPanel{padding-bottom:10px}.search{width:calc(100% - 20px);margin:10px}.filters{display:flex;gap:5px;overflow-x:auto;padding:0 10px 10px}.filters button{border:1px solid var(--ccc);background:var(--f3f3f3);color:inherit;border-radius:999px;padding:6px 9px;font-size:.65rem;font-weight:850}.filters button.active{background:var(--blueOne);color:#fff;border-color:var(--blueOne)}.playerList{max-height:58vh;overflow:auto;padding:0 8px}.playerRow{width:100%;display:grid;grid-template-columns:36px 1fr auto;gap:8px;align-items:center;padding:9px 8px;margin-bottom:5px;border:1px solid var(--ccc);border-left:4px solid var(--pos-color,var(--ccc));border-radius:10px;background:var(--fff);color:inherit;text-align:left}.playerRow:disabled{cursor:default;opacity:.8}.rank{font-size:.65rem;font-weight:900;opacity:.5}.pInfo{display:flex;flex-direction:column;min-width:0}.pInfo b{font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pInfo small{font-size:.62rem;opacity:.55}.draftAction{font-size:.62rem;font-weight:900;color:var(--pos-color,inherit)}.engineNote{padding:8px 12px 0;margin:0;font-size:.62rem;line-height:1.4;opacity:.5}.pos-QB{--pos-color:#ef4444}.pos-RB{--pos-color:#22c55e}.pos-WR{--pos-color:#3b82f6}.pos-TE{--pos-color:#f59e0b}.pos-K{--pos-color:#a855f7}.pos-DEF{--pos-color:#64748b}.boardCell[class*='pos-']{border-left:3px solid var(--pos-color)}.error{max-width:620px;margin:14px auto 0;padding:12px;border:1px solid #d66565;border-radius:12px;background:color-mix(in srgb,#d66565 10%,transparent);font-size:.8rem}
@media(max-width:760px){.page{padding-top:16px}.header h1{font-size:1.8rem}.featureGrid{grid-template-columns:1fr}.teamGrid{grid-template-columns:1fr}.draftLayout{grid-template-columns:1fr}.boardScroller{max-height:42vh}.playerList{max-height:45vh}.draftTop{grid-template-columns:auto 1fr}.turnBadge{grid-column:1/3;text-align:center}.board{grid-template-columns:40px repeat(10,minmax(100px,1fr));min-width:1040px}.sectionTitle{align-items:flex-start}.teamCard{grid-template-columns:38px 1fr auto}}
</style>
