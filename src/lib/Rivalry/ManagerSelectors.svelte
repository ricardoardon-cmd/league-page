<script>
    import { goto } from "$app/navigation";
    import { managers } from "$lib/utils/leagueInfo";

    export let playerOne, playerTwo, leagueTeamManagers;

    const users = Object.keys(leagueTeamManagers.users || {});

    const managerForUser = (userID) => {
        if (!userID) return null;

        const direct = managers.find((manager) => manager.managerID === userID);
        if (direct) return direct;

        const years = Object.keys(leagueTeamManagers?.teamManagersMap || {})
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => b - a);

        for (const year of years) {
            const rosters = leagueTeamManagers?.teamManagersMap?.[year] || {};
            for (const rosterID in rosters) {
                if ((rosters[rosterID]?.managers || []).includes(userID)) {
                    const configured = managers.find((manager) => String(manager.roster) === String(rosterID));
                    if (configured) return configured;
                }
            }
        }

        return null;
    };

    const displayName = (userID) => {
        const configured = managerForUser(userID);
        if (configured?.name) return configured.name;

        const sleeperName = leagueTeamManagers?.users?.[userID]?.display_name || leagueTeamManagers?.users?.[userID]?.username || 'Manager';
        return String(sleeperName).split(/[ _.-]/)[0] || sleeperName;
    };

    const displayPhoto = (userID) => {
        const configured = managerForUser(userID);
        if (configured?.photo) return configured.photo;

        const avatar = leagueTeamManagers?.users?.[userID]?.avatar;
        if (avatar) return avatar;

        return '/managers/question.jpg';
    };

    $: usersOne = users.filter((user) => user !== playerTwo);
    $: usersTwo = users.filter((user) => user !== playerOne);

    $: selectedOneName = playerOne ? displayName(playerOne) : 'Manager One';
    $: selectedTwoName = playerTwo ? displayName(playerTwo) : 'Manager Two';
    $: selectedOnePhoto = playerOne ? displayPhoto(playerOne) : '/managers/question.jpg';
    $: selectedTwoPhoto = playerTwo ? displayPhoto(playerTwo) : '/managers/question.jpg';

    const analyzeRivalry = (p1, p2) => {
        if (!p1 || !p2) return;
        goto(`/rivalry?player_one=${p1}&player_two=${p2}`, { noscroll: true, keepfocus: true });
    };

    $: analyzeRivalry(playerOne, playerTwo);
</script>

<style>
    .selectors {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 20px;
        width: calc(100% - 24px);
        max-width: 820px;
        margin: 2.4em auto 2em;
    }

    .managerCard {
        min-width: 0;
        padding: 16px;
        border: 1px solid var(--ccc);
        border-radius: 18px;
        background: var(--fff);
        box-shadow: 0 4px 14px rgba(0,0,0,.07);
    }

    .managerCard.leftCard { border-top: 3px solid var(--barChartOne); }
    .managerCard.rightCard { border-top: 3px solid var(--barChartSix); }

    .selectedManager {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        min-width: 0;
    }

    .avatar {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        background: var(--f3f3f3);
        border: 2px solid var(--ccc);
        box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }

    .leftCard .avatar { border-color: var(--barChartOne); }
    .rightCard .avatar { border-color: var(--barChartSix); }

    .identity {
        min-width: 0;
        flex: 1;
    }

    .eyebrow {
        display: block;
        margin-bottom: 3px;
        font-size: .58rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .65px;
        opacity: .48;
    }

    .selectedName {
        display: block;
        font-size: 1.05rem;
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .container { position: relative; width: 100%; }

    .selectInput {
        width: 100%;
        min-height: 44px;
        box-sizing: border-box;
        padding: 0 40px 0 12px;
        font-size: .86rem;
        font-weight: 750;
        border-radius: 11px;
        background-color: var(--f3f3f3);
        color: inherit;
        border: 1px solid var(--ccc);
        cursor: pointer;
    }

    .left:focus { outline: 2px solid var(--barChartOne); outline-offset: 2px; }
    .right:focus { outline: 2px solid var(--barChartSix); outline-offset: 2px; }

    .vs {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid var(--ccc);
        background: var(--f3f3f3);
        font-size: .72rem;
        font-weight: 900;
        text-transform: uppercase;
        box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }

    @media (max-width: 650px) {
        .selectors {
            grid-template-columns: 1fr;
            gap: 10px;
            width: calc(100% - 20px);
            margin-top: 1.8em;
        }

        .managerCard {
            padding: 13px;
            border-radius: 15px;
        }

        .selectedManager { margin-bottom: 10px; }
        .avatar { width: 50px; height: 50px; }
        .selectedName { font-size: .98rem; }
        .selectInput { min-height: 42px; font-size: .82rem; }

        .vs {
            width: 36px;
            height: 36px;
            margin: -2px auto;
        }
    }

    @media (max-width: 380px) {
        .selectors { width: calc(100% - 14px); }
        .managerCard { padding: 11px; }
        .avatar { width: 46px; height: 46px; }
    }
</style>

<div class="selectors">
    <div class="managerCard leftCard">
        <div class="selectedManager">
            <img class="avatar" src={selectedOnePhoto} alt={playerOne ? selectedOneName : 'Select manager one'} />
            <div class="identity">
                <span class="eyebrow">Manager One</span>
                <span class="selectedName">{selectedOneName}</span>
            </div>
        </div>

        <div class="container">
            <select class="selectInput left" id="managerOne" name="managerOne" bind:value={playerOne}>
                <option value={null}>Select a manager</option>
                {#each usersOne as user}
                    <option value={user}>{displayName(user)}</option>
                {/each}
            </select>
        </div>
    </div>

    <span class="vs">VS</span>

    <div class="managerCard rightCard">
        <div class="selectedManager">
            <img class="avatar" src={selectedTwoPhoto} alt={playerTwo ? selectedTwoName : 'Select manager two'} />
            <div class="identity">
                <span class="eyebrow">Manager Two</span>
                <span class="selectedName">{selectedTwoName}</span>
            </div>
        </div>

        <div class="container">
            <select class="selectInput right" id="managerTwo" name="managerTwo" bind:value={playerTwo}>
                <option value={null}>Select a manager</option>
                {#each usersTwo as user}
                    <option value={user}>{displayName(user)}</option>
                {/each}
            </select>
        </div>
    </div>
</div>