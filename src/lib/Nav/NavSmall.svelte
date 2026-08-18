<script>
	import { tabs } from '$lib/utils/tabs';
	import Drawer, {
	  Content,
	  Header,
	  Title,
	} from '@smui/drawer';
	import { Icon } from '@smui/tab';
  	import List, { Item, Text, Graphic, Separator, Subheader } from '@smui/list';
	import { goto, preloadData } from '$app/navigation';
    import { page } from '$app/state';
	import { leagueName } from '$lib/utils/helper';
	import { enableBlog, managers } from '$lib/utils/leagueInfo';

	let active = $state(page.url.pathname);
	let open = $state(false);

	const menuIcons = {
		Home: '🏠',
		Matchups: '🏈',
		'Trades & Waivers': '↔️',
		Rosters: '📋',
		Players: '👤',
		Managers: '👥',
		Rivalry: '⚔️',
		Standings: '🏆',
		Drafts: '🎯',
		History: '🏛️',
		'Season Archive': '🗃️',
		Records: '📊',
		'Go to Sleeper': '💤'
	};

	const getMenuIcon = (label) => menuIcons[label] || '•';

	const selectTab = (tab) => {
		open = false;
		if (tab.external) {
			window.location.href = tab.dest;
			return;
		}
		goto(tab.dest);
	}
</script>

<style>
	:global(.menuIcon) {
		position: absolute;
		top: 15px;
		left: 15px;
		font-size: 2em;
		color: #888;
		padding: 6px;
		cursor: pointer;
	}

	:global(.menuIcon:hover) {
		color: #00316b;
	}

	:global(.nav-drawer) {
		z-index: 9;
		top: 0;
		left: 0;
	}

	:global(.nav-item) {
		color: #858585 !important;
	}

	:global(.drawerEmoji) {
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif !important;
		font-size: 1.45rem !important;
		line-height: 1;
		width: 40px;
		min-width: 40px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.nav-back {
		position: fixed;
		z-index: 8;
		width: 100%;
		width: 100vw;
		height: 100%;
		height: 100vh;
		top: 0;
		left: 0;
		background-color: rgba(0, 0, 0, 0.32);
		transition: all 0.7s;
	}
</style>

<Icon class="material-icons menuIcon" onclick={() => open = true} ripple={false} touch={true}>menu</Icon>

<div class="nav-back" style="pointer-events: {open ? "visible" : "none"}; opacity: {open ? 1 : 0};" onclick={() => open = false}></div>

<Drawer variant="modal" class="nav-drawer" fixed={true} bind:open>
	<Header>
		<Title>{leagueName}</Title>
	</Header>
	<Content>
		<List>
			{#each tabs as tab}
				{#if !tab.hidden && !tab.nest && (tab.label != 'Blog' || (tab.label == 'Blog' && enableBlog))}
					<Item href="javascript:void(0)" onSMUIAction={() => selectTab(tab)} ontouchstart={() => {if(!tab.external) preloadData(tab.dest)}} onmouseover={() => {if(!tab.external) preloadData(tab.dest)}} activated={active == tab.dest} >
						<Graphic class="drawerEmoji" aria-hidden="true">{getMenuIcon(tab.label)}</Graphic>
						<Text class="{active == tab.dest ? "" : "nav-item"}">{tab.label}</Text>
					</Item>
				{/if}
			{/each}
			{#each tabs as tab}
				{#if tab.nest}
					<Separator />
					<Subheader>{tab.label}</Subheader>
					{#each tab.children as subTab}
						{#if !subTab.hidden}
							{#if subTab.label == 'Managers'}
								{#if managers.length}
									<Item href="javascript:void(0)" onSMUIAction={() => selectTab(subTab)} activated={active == subTab.dest} ontouchstart={() => preloadData(subTab.dest)} onmouseover={() => preloadData(subTab.dest)}>
										<Graphic class="drawerEmoji" aria-hidden="true">{getMenuIcon(subTab.label)}</Graphic>
										<Text class="{active == subTab.dest ? "" : "nav-item"}">{subTab.label}</Text>
									</Item>
								{/if}
							{:else}
								<Item href="javascript:void(0)" onSMUIAction={() => selectTab(subTab)} activated={active == subTab.dest} ontouchstart={() => {if(!subTab.external) preloadData(subTab.dest)}} onmouseover={() => {if(!subTab.external) preloadData(subTab.dest)}}>
									<Graphic class="drawerEmoji" aria-hidden="true">{getMenuIcon(subTab.label)}</Graphic>
									<Text class="{active == subTab.dest ? "" : "nav-item"}">{subTab.label}</Text>
								</Item>
							{/if}
						{/if}
					{/each}
				{/if}
			{/each}
		</List>
	</Content>
</Drawer>
