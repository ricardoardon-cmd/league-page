<script>
    import { onMount } from 'svelte';

    const SUPABASE_URL = 'https://uawddygirnbpmkjhqcvu.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_bEps0rM2t0HJsA6BPLjQPg_becZ1PsM';

    let mode = 'home';
    let name = '';
    let room = null;
    let teams = [];
    let activeRooms = [];
    let loading = false;
    let error = '';
    let pollTimer;
    let clientToken = '';

    const headers = (prefer) => ({
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {})
    });

    const hiddenRoomCode = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();

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
            activeRooms = await request('mock_rooms?status=eq.lobby&select=*&order=created_at.desc&limit=6') || [];
        } catch (err) {
            console.error(err);
        }
    };

    const refreshRoom = async () => {
        if (!room?.id) return;

        try {
            const roomRows = await request(`mock_rooms?id=eq.${room.id}&select=*`);
            const teamRows = await request(`mock_teams?room_id=eq.${room.id}&select=*&order=draft_slot.asc`);

            if (roomRows?.[0]) room = roomRows[0];
            teams = teamRows || [];
        } catch (err) {
            console.error(err);
        }
    };

    const beginPolling = () => {
        clearInterval(pollTimer);
        pollTimer = setInterval(refreshRoom, 2000);
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
                    status: 'lobby'
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
            mode = 'room';
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
                    method: 'PATCH',
                    prefer: 'return=minimal',
                    body: JSON.stringify({ manager_name: null, player_token: null, is_cpu: true })
                });
            }

            await request(`mock_teams?id=eq.${team.id}&is_cpu=eq.true`, {
                method: 'PATCH',
                prefer: 'return=minimal',
                body: JSON.stringify({
                    manager_name: name.trim(),
                    player_token: clientToken,
                    is_cpu: false
                })
            });

            await refreshRoom();
        } catch (err) {
            error = err.message || 'Unable to claim that draft slot.';
        }
    };

    const releaseTeam = async (team) => {
        try {
            await request(`mock_teams?id=eq.${team.id}`, {
                method: 'PATCH',
                prefer: 'return=minimal',
                body: JSON.stringify({ manager_name: null, player_token: null, is_cpu: true })
            });
            await refreshRoom();
        } catch (err) {
            error = err.message || 'Unable to release team.';
        }
    };

    const leaveRoom = async () => {
        clearInterval(pollTimer);
        room = null;
        teams = [];
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

<svelte:head>
    <title>GGL Mock Draft</title>
</svelte:head>

<div class="page">
    <div class="header">
        <div class="eyebrow">GGL DRAFT LAB</div>
        <h1>🎯 Mock Draft</h1>
        <p>Run a 10-team GGL Superflex mock. Claim a slot, invite league mates, and let CPU teams handle the rest.</p>
    </div>

    {#if mode === 'home'}
        <section class="card homeCard">
            <div class="field">
                <label for="managerName">Your name</label>
                <input id="managerName" bind:value={name} placeholder="Ricardo" />
            </div>

            <button class="primary" onclick={createRoom} disabled={loading}>
                {loading ? 'Starting mock…' : 'Start New Mock'}
            </button>

            <div class="divider"><span>active mocks</span></div>

            {#if activeRooms.length}
                <div class="activeList">
                    {#each activeRooms as activeRoom, index}
                        <button class="activeRoom" onclick={() => joinRoom(activeRoom)} disabled={loading}>
                            <span class="mockNumber">Mock #{activeRooms.length - index}</span>
                            <span class="mockMeta">10 teams · 16 rounds · Lobby open</span>
                            <strong>Join Mock →</strong>
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="emptyActive">No mock is open right now. Start one and your league mates will see it here.</div>
            {/if}

            <div class="featureGrid">
                <div><b>10 teams</b><span>Claim any open slot</span></div>
                <div><b>16 rounds</b><span>Snake format</span></div>
                <div><b>Superflex</b><span>GGL 2-QB logic</span></div>
            </div>
        </section>
    {:else if room}
        <section class="roomBar">
            <div>
                <span class="label">Mock draft</span>
                <strong>Active Lobby</strong>
            </div>
            <div>
                <span class="label">Status</span>
                <strong>{room.status}</strong>
            </div>
            <button onclick={leaveRoom}>Leave</button>
        </section>

        <section class="card nameCard">
            <div class="field">
                <label for="roomName">Your display name</label>
                <input id="roomName" bind:value={name} placeholder="Enter your name to claim a team" />
            </div>
        </section>

        <div class="sectionTitle">
            <div>
                <h2>Draft Order</h2>
                <p>Tap any CPU slot to claim it. Everyone in the lobby sees changes automatically.</p>
            </div>
            <span>{teams.filter((team) => !team.is_cpu).length}/10 joined</span>
        </div>

        <section class="teamGrid">
            {#each teams as team}
                <article class:mine={team.player_token === clientToken} class:human={!team.is_cpu} class="teamCard">
                    <div class="slot">{team.draft_slot}</div>
                    <div class="teamInfo">
                        <strong>{team.is_cpu ? 'GGL CPU' : team.manager_name}</strong>
                        <span>{team.is_cpu ? 'Available to claim' : team.player_token === clientToken ? 'Your team' : 'League mate'}</span>
                    </div>

                    {#if team.player_token === clientToken}
                        <button class="release" onclick={() => releaseTeam(team)}>Release</button>
                    {:else if team.is_cpu}
                        <button class="claim" onclick={() => claimTeam(team)}>Claim</button>
                    {:else}
                        <span class="taken">Taken</span>
                    {/if}
                </article>
            {/each}
        </section>

        <section class="nextCard">
            <span>Next build step</span>
            <strong>Live draft board + FantasyPros/GGL CPU pick engine</strong>
        </section>
    {/if}

    {#if error}
        <div class="error">{error}</div>
    {/if}
</div>

<style>
    .page{width:95%;max-width:1050px;margin:auto;padding:28px 0 70px}.header{text-align:center;margin-bottom:22px}.eyebrow{font-size:.72rem;font-weight:900;letter-spacing:.14em;opacity:.55}.header h1{font-size:2.4rem;margin:5px 0 8px}.header p{max-width:650px;margin:auto;line-height:1.5;opacity:.65}.card,.roomBar,.teamCard,.nextCard{background:var(--fff);border:1px solid var(--ccc);border-radius:16px}.homeCard{max-width:620px;margin:auto;padding:20px}.field{display:flex;flex-direction:column;gap:7px}.field label{font-size:.72rem;font-weight:850;opacity:.65}.field input{border:1px solid var(--ccc);background:var(--f3f3f3);color:inherit;border-radius:12px;padding:12px 13px;font:inherit;box-sizing:border-box}.primary,.claim,.release,.roomBar button{border:0;border-radius:12px;padding:11px 14px;font:inherit;font-weight:850;cursor:pointer}.primary{width:100%;margin-top:12px;background:var(--blueOne);color:#fff}.divider{display:flex;align-items:center;gap:10px;margin:18px 0 12px;font-size:.7rem;opacity:.5}.divider:before,.divider:after{content:'';height:1px;background:var(--ccc);flex:1}.activeList{display:flex;flex-direction:column;gap:8px}.activeRoom{display:grid;grid-template-columns:1fr auto;gap:3px 10px;width:100%;padding:12px;border:1px solid var(--ccc);border-radius:12px;background:var(--f3f3f3);color:inherit;text-align:left;cursor:pointer}.activeRoom:hover{border-color:var(--blueOne)}.mockNumber{font-weight:900}.mockMeta{grid-column:1;font-size:.68rem;opacity:.55}.activeRoom strong{grid-column:2;grid-row:1/3;align-self:center;color:var(--blueOne);font-size:.78rem}.emptyActive{padding:15px;border:1px dashed var(--ccc);border-radius:12px;text-align:center;font-size:.76rem;line-height:1.45;opacity:.65}.featureGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.featureGrid div{border:1px solid var(--ccc);border-radius:12px;padding:10px;text-align:center}.featureGrid b,.featureGrid span{display:block}.featureGrid span{font-size:.65rem;opacity:.55;margin-top:3px}.roomBar{display:flex;align-items:center;gap:18px;padding:14px;margin-bottom:12px}.roomBar>div{display:flex;flex-direction:column}.roomBar .label{font-size:.62rem;text-transform:uppercase;opacity:.5}.roomBar strong{text-transform:uppercase}.roomBar button{margin-left:auto;background:var(--f3f3f3);color:inherit;border:1px solid var(--ccc)}.nameCard{padding:14px;margin-bottom:16px}.sectionTitle{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:18px 2px 10px}.sectionTitle h2{margin:0}.sectionTitle p{margin:4px 0 0;font-size:.75rem;opacity:.6}.sectionTitle>span{font-size:.75rem;font-weight:850;white-space:nowrap}.teamGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.teamCard{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding:12px;transition:.15s}.teamCard.human{border-color:var(--blueTwo)}.teamCard.mine{box-shadow:0 0 0 2px color-mix(in srgb,var(--blueOne) 45%,transparent)}.slot{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--f3f3f3);font-weight:900}.teamInfo{min-width:0;display:flex;flex-direction:column}.teamInfo strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.teamInfo span{font-size:.68rem;opacity:.55;margin-top:2px}.claim{background:var(--blueOne);color:#fff}.release{background:var(--f3f3f3);color:inherit;border:1px solid var(--ccc)}.taken{font-size:.68rem;font-weight:850;opacity:.5}.nextCard{margin-top:16px;padding:14px;text-align:center}.nextCard span,.nextCard strong{display:block}.nextCard span{font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;opacity:.5}.nextCard strong{margin-top:4px}.error{max-width:620px;margin:14px auto 0;padding:12px;border:1px solid #d66565;border-radius:12px;background:color-mix(in srgb,#d66565 10%,transparent);font-size:.8rem}
    @media(max-width:620px){.page{padding-top:18px}.header h1{font-size:1.9rem}.homeCard{padding:14px}.featureGrid{grid-template-columns:1fr}.teamGrid{grid-template-columns:1fr}.roomBar{gap:10px}.teamCard{grid-template-columns:38px 1fr auto}.sectionTitle{align-items:flex-start}.sectionTitle p{max-width:260px}}
</style>
