<script>
	import Textfield from '@smui/textfield';
  	import Icon from '@smui/textfield/icon';
	import TradeTransaction from './TradeTransaction.svelte';
	import Button, { Label } from '@smui/button';
	import IconButton from '@smui/icon-button';
	import Pagination from '../Pagination.svelte';
	import { match } from 'fuzzyjs';
	import { goto } from '$app/navigation';
	import { getLeagueTransactions, loadPlayers } from '$lib/utils/helper';
	import WaiverTransaction from './WaiverTransaction.svelte';

	export let show, playersInfo, query, queryPage, transactions, stale, perPage, postUpdate=false, leagueTeamManagers;
	const oldQuery = query;
	let page = queryPage || 0;

	const refreshTransactions = async () => {
		const newTransactions = await getLeagueTransactions(false, true);
		transactions = newTransactions.transactions;
	}

	if(stale) {
		refreshTransactions();
	}

	let players = playersInfo.players;

	const refreshPlayers = async () => {
		const newPlayersInfo = await loadPlayers(null, true);
		players = newPlayersInfo.players;
	}

	if(playersInfo.stale) {
		refreshPlayers();
	}

	// filtered subset based on search
	let subsetTransactions = [];

	let totalTransactions = 0;

	const setFilter = (filterBy, transactions) => {
		if(filterBy == "both") {
			return transactions;
		} else {
			return transactions.filter( transaction => transaction.type == filterBy);
		}
	}

	// filtered subset based on filter
	$: filteredTransactions = setFilter(show, transactions);

	const setQuery = (query, filteredTransactions) => {
		if(!filteredTransactions) {
			return [];
		}
		if(query && query.trim() != "") {
			subsetTransactions = filteredTransactions.filter( transaction => checkForQuery(transaction));
			totalTransactions = subsetTransactions.length;
		} else {
			subsetTransactions = filteredTransactions;
			totalTransactions = subsetTransactions.length;
		}

		const start = page * perPage;
		const end = (page + 1) * perPage;
		return subsetTransactions.slice(start, end);
	}
	$: displayTransactions = setQuery(query, filteredTransactions);

	const changePage = (dest, pageChange = false) => {
		if(queryPage == dest && pageChange) return;
		page = dest;
		if(dest > (filteredTransactions.length / perPage) || dest < 0) {
			page = 0;
		}
		displayTransactions = setQuery(query, filteredTransactions);
		if(postUpdate) {
            goto(`/transactions?show=${show}&query=${query}&page=${page+1}`, {noscroll: true,  keepfocus: true});
		}
	}

	let lastUpdate = new Date;

    let timer;

	const debounce = (dest) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
            goto(dest,{noscroll: true,  keepfocus: true});
		}, 750);
	}

	const search = () => {
		lastUpdate = new Date;
		query = query.trimLeft();
		if(query.trim() == oldQuery) return;
		page = 0;
		if(postUpdate) {
            const dest = `/transactions?show=${show}&query=${query.trim()}&page=${page+1}`;
            debounce(dest);
		}
	}

	const clearSearch = () => {
		query = "";
		if(postUpdate) {
			goto(`/transactions?show=${show}&query=&page=${page+1}`, {noscroll: true,  keepfocus: true});
		}
	}
	
	const checkMatch = (query, name) => {
		const nameMatch = match(query, name)
		if(nameMatch.match && nameMatch.score > 0) {
			(nameMatch.score);
			return true;
		}
	}

	const checkForQuery = (transaction) => {
		const moves = transaction.moves;
		for(const move of moves) {
			for(const col of move) {
				if(!col?.player) continue;
				return checkMatch(query, `${players[col.player].fn} ${players[col.player].ln}`);
			}
		}
		return false;
	}

	$: changePage(page, true);

	$: setQuery(query);

    let el;

    $: top = el?.getBoundingClientRect() ? el?.getBoundingClientRect().top  : 0;

	const setShow = (val) => {
		show = val;
		page = 0;
		changePage(0);
	}
</script>

<style>
    .transactionsPage {
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        padding: 30px 20px 70px;
        box-sizing: border-box;
    }

    .pageHeader {
        text-align: center;
        margin-bottom: 26px;
    }

    .pageEyebrow {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 1.3px;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 6px;
    }

    .pageHeader h1 {
        margin: 0;
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1.1;
    }

    .pageHeader p {
        margin: 9px 0 0;
        opacity: 0.65;
    }

    .controlsCard {
        width: 100%;
        margin-bottom: 26px;
        padding: 20px;
        box-sizing: border-box;
        border-radius: 18px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .filterLabel {
        text-align: center;
        margin-bottom: 12px;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .buttons {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .searchContainer {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 18px;
    }

    .transactions {
        width: 100%;
    }

    .transactionsHeader {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 15px;
        margin: 10px 0 18px;
    }

    .transactionsTitle {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
    }

    .transactionCount {
        font-size: 0.78rem;
        font-weight: 700;
        opacity: 0.55;
        white-space: nowrap;
    }

    .transactions-child {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    :global(.disabled) {
        pointer-events: none;
    }

    .clearPlaceholder {
        width: 48px;
        display: inline-block;
    }

    .empty {
        width: 100%;
        margin: 35px auto;
        padding: 24px;
        box-sizing: border-box;
        border-radius: 14px;
        background: var(--fff);
        border: 1px solid var(--ccc);
        font-style: italic;
        text-align: center;
        opacity: 0.65;
    }

    @media (max-width: 650px) {
        .transactionsPage {
            padding: 20px 10px 50px;
        }

        .pageHeader h1 {
            font-size: 2rem;
        }

        .controlsCard {
            padding: 16px 10px;
        }

        .transactionsHeader {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
        }

        .transactionsTitle {
            font-size: 1.3rem;
        }
    }
</style>

<div class="transactionsPage">

    <div class="pageHeader">
        <div class="pageEyebrow">
            GGL LEAGUE ACTIVITY
        </div>

        <h1>
            🔄 Transactions
        </h1>

        <p>
            Trades, waivers, adds and drops across league history
        </p>
    </div>

    <div class="controlsCard">

        <div class="filterLabel">
            Transaction Type
        </div>

        <div class="buttons">

            <Button
                class={show == "trade" ? "disabled" : ""}
                color="primary"
                onclick={() => setShow("trade")}
                variant={show == "trade" ? "raised" : "outlined"}
                touch
            >
                <Label>🤝 Trades</Label>
            </Button>

            <Button
                class={show == "waiver" ? "disabled" : ""}
                color="primary"
                onclick={() => setShow("waiver")}
                variant={show == "waiver" ? "raised" : "outlined"}
                touch
            >
                <Label>➕ Waivers</Label>
            </Button>

            <Button
                class={show == "both" ? "disabled" : ""}
                color="primary"
                onclick={() => setShow("both")}
                variant={show == "both" ? "raised" : "outlined"}
                touch
            >
                <Label>📋 All Activity</Label>
            </Button>

        </div>

        <div class="searchContainer">

            <span class="clearPlaceholder"></span>

            <Textfield
                class="shaped-outlined"
                variant="outlined"
                bind:value={query}
                label="Search for a player..."
                on:input={() => search()}
            >
                <Icon
                    class="material-icons"
                    slot="leadingIcon"
                >
                    search
                </Icon>
            </Textfield>

            {#if query.length > 0}

                <IconButton
                    class="material-icons"
                    onclick={() => clearSearch()}
                >
                    clear
                </IconButton>

            {:else}

                <span class="clearPlaceholder"></span>

            {/if}

        </div>

    </div>

    <div
        class="transactions"
        bind:this={el}
    >

        <div class="transactionsHeader">

            <h2 class="transactionsTitle">
                {#if show == "both"}
                    Recent Transactions
                {:else if show == "trade"}
                    Recent Trades
                {:else}
                    Recent Waivers
                {/if}
            </h2>

            <div class="transactionCount">
                {totalTransactions}
                {totalTransactions === 1
                    ? ' transaction'
                    : ' transactions'}
            </div>

        </div>

        <Pagination
            {perPage}
            total={totalTransactions}
            bind:page
            target={top}
            scroll={false}
        />

        <div class="transactions-child">

            {#each displayTransactions as transaction (transaction.id)}

                {#if transaction.type == "waiver"}

                    <WaiverTransaction
                        {players}
                        {transaction}
                        {leagueTeamManagers}
                    />

                {:else}

                    <TradeTransaction
                        {players}
                        {transaction}
                        {leagueTeamManagers}
                    />

                {/if}

            {/each}

        </div>

        <Pagination
            {perPage}
            total={totalTransactions}
            bind:page
            target={top}
            scroll={true}
        />

    </div>

    {#if totalTransactions == 0}

        {#if show == "trade"}

            <p class="empty">
                {query.trim() != ""
                    ? "No trades match your search"
                    : "Nobody has made any trades yet... that's just sad"}
            </p>

        {:else if show == "waiver"}

            <p class="empty">
                {query.trim() != ""
                    ? "No waivers match your search"
                    : "Nobody has made any waiver wire moves yet... that's just sad"}
            </p>

        {:else}

            <p class="empty">
                {query.trim() != ""
                    ? "No transactions match your search"
                    : "Nobody has made any moves yet... that's just sad"}
            </p>

        {/if}

    {/if}

</div>
</div>
