<script>
	import { tabs } from '$lib/utils/tabs';
	import Tab, { Icon, Label } from '@smui/tab';
	import List, { Item, Graphic, Text, Separator } from '@smui/list';
	import TabBar from '@smui/tab-bar';
    import { page } from '$app/state';
	import { goto, preloadData } from '$app/navigation';
	import { enableBlog, managers } from '$lib/utils/leagueInfo';

	let active = $state(tabs.find(tab => tab.dest == page.url.pathname || (tab.nest && tab.children.find(subTab => subTab.dest == page.url.pathname))));
	let display = $state(false);
	let el = $state();
	let width = $state();
	let height= $state();
	let left = $state();
	let top = $state();

	$effect(() => {
		top = el?.getBoundingClientRect() ? el?.getBoundingClientRect().top  : 0;
		const bottom = el?.getBoundingClientRect() ? el?.getBoundingClientRect().bottom  : 0;
		height = bottom - top + 1;
		left = el?.getBoundingClientRect() ? el?.getBoundingClientRect().left  : 0;
		const right = el?.getBoundingClientRect() ? el?.getBoundingClientRect().right  : 0;
		width = right - left;
	});

	let innerWidth = $state();

	const open = () => {
		display = !display;
	}

	const subGoto = (tab) => {
		display = false;
		if (tab.external) {
			window.location.href = tab.dest;
			return;
		}
		goto(tab.dest);
	}

	let tabChildren = $state([]);
	for(const tab of tabs) {
		if(tab.nest) tabChildren = tab.children;
	}

	const visibleChildren = () => tabChildren.filter(tab => !tab.hidden && (tab.label !== 'Managers' || managers.length));
</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    :global(.navBar) {
		display: inline-flex;
		position: relative;
    	justify-content: center;
    }

	:global(.navBar .material-icons) {
		font-size: 1.8em;
		height: 25px;
		width: 22px;
	}

	.parent { position: relative; }

	.subMenu {
		overflow-y: hidden;
		display: block;
		position: absolute;
		z-index: 5;
		background-color: var(--fff);
		transition: all 0.4s;
	}

	.overlay {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		z-index: 4;
	}

	:global(.mdc-deprecated-list) { padding: 0; }
	:global(.subText) { font-size: 0.8em; }
	:global(.dontDisplay) { display: none; }
</style>

<div tabindex="0" role="button" class="overlay" style="display: {display ? "block" : "none"};" onclick={() => display = false}></div>

<div class="parent">
	<TabBar class="navBar" {tabs} key={(tab) => tab.key} bind:active>
		{#snippet tab(tab)}
			{#if !tab.hidden}
				{#if tab.nest}
					<div bind:this={el}>
						<Tab {tab} minWidth onclick={() => open()}>
							<Icon class="material-icons">{tab.icon}</Icon>
							<Label>{tab.label}</Label>
						</Tab>
					</div>
				{:else}
					<Tab
						class="{tab.label == 'Blog' && !enableBlog ? 'dontDisplay' : ''}"
						{tab}
						onTouchstart={() => {if(!tab.external) preloadData(tab.dest)}}
						onMouseover={() => {if(!tab.external) preloadData(tab.dest)}}
						href={tab.dest}
						minWidth
					>
						<Icon class="material-icons">{tab.icon}</Icon>
						<Label>{tab.label}</Label>
					</Tab>
				{/if}
			{/if}
		{/snippet}
	</TabBar>
	<div class="subMenu" style="max-height: {display ? 49 * visibleChildren().length - 1 : 0}px; width: {width}px; top: {height}px; left: {left}px; box-shadow: 0 0 {display ? "3px" : "0"} 0 #00316b; border: {display ? "1px" : "0"} solid #00316b; border-top: none;">
		<List>
			{#each visibleChildren() as subTab, ix}
				<Item onSMUIAction={() => subGoto(subTab)} ontouchstart={() => {if(!subTab.external) preloadData(subTab.dest)}} onmouseover={() => {if(!subTab.external) preloadData(subTab.dest)}}>
					<Graphic class="material-icons">{subTab.icon}</Graphic>
					<Text class="subText">{subTab.label}</Text>
				</Item>
				{#if ix != visibleChildren().length - 1}
					<Separator />
				{/if}
			{/each}
		</List>
	</div>
</div>
