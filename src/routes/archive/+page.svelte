<script>
    let activeFilter = 'All';
    const filters = ['All', 'Draft Day', 'Punishment'];
    const moments = [
        { src: '/archive/2025/league-group.jpg', tag: 'Draft Day', title: '2025 League Crew', featured: true }
    ];
    $: visibleMoments = activeFilter === 'All' ? moments : moments.filter((moment) => moment.tag === activeFilter);
</script>

<svelte:head><title>2025 Season Archive | GGL</title></svelte:head>

<div class="archivePage">
    <section class="hero">
        <div class="eyebrow">GGL LEAGUE ARCHIVE · SLEEPER ERA</div>
        <h1>2025 Season</h1>
        <p>The draft, the season, the punishment and everything worth remembering.</p>
        <div class="heroImage"><img src="/archive/2025/league-group.jpg" alt="2025 league group" /></div>
    </section>

    <section class="seasonStrip">
        <div><span>🏆</span><strong>Season Recap</strong><small>2025 Sleeper Season</small></div>
        <div><span>📸</span><strong>Photo Archive</strong><small>Draft Day + Punishment</small></div>
        <div><span>🎬</span><strong>Season Film</strong><small>Video 1 added</small></div>
    </section>

    <section class="storyCard">
        <div class="sectionHeading"><span>🏈</span><div><small>THE STORY OF 2025</small><h2>A season worth saving</h2></div></div>
        <p>2025 gets the first full season archive: league photos, draft-day memories, the punishment and season videos. As the archive grows, this page can become the template for every Sleeper-era season.</p>
    </section>

    <section class="videoCard">
        <div class="videoEmbed">
            <iframe
                src="https://www.youtube-nocookie.com/embed/QDbLYQWL9Uc"
                title="GGL 2025 season archive video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
            ></iframe>
        </div>
        <div class="videoCopy"><small>WATCH THE SEASON</small><h2>2025 Season Film · Video 1</h2><p>The first 2025 league video is now part of the archive and plays directly on the site. Additional 2025 videos can be stacked here as you send them.</p></div>
    </section>

    <section class="gallerySection">
        <div class="galleryHeader"><div><small>SEASON MEMORIES</small><h2>📸 2025 Photo Archive</h2></div><span>{moments.length} photos loaded</span></div>
        <div class="filters">{#each filters as filter}<button class:active={activeFilter === filter} onclick={() => activeFilter = filter}>{filter}</button>{/each}</div>
        <div class="gallery">
            {#each visibleMoments as moment}
                <figure class:featured={moment.featured}><img src={moment.src} alt={moment.title} loading="lazy" /><figcaption><span>{moment.tag}</span><strong>{moment.title}</strong></figcaption></figure>
            {/each}
        </div>
        <div class="comingSoon">More of the photos you sent are queued for this archive. This first build establishes the page, layout and category system so we can add the rest without redesigning it.</div>
    </section>

    <section class="nextSeason"><small>GGL TIME CAPSULE</small><h2>2024 → 2025 → 2026</h2><p>Once 2025 is dialed in, we can reuse this exact format for 2024 and 2023.</p></section>
</div>

<style>
    .archivePage{max-width:1120px;margin:0 auto;padding:32px 18px 80px;box-sizing:border-box}.hero{text-align:center}.eyebrow,.sectionHeading small,.videoCopy small,.galleryHeader small,.nextSeason small{font-size:.68rem;font-weight:900;letter-spacing:1.5px;opacity:.55}.hero h1{font-size:3.4rem;margin:7px 0 4px}.hero p{margin:0 auto 24px;max-width:650px;opacity:.68}.heroImage{height:460px;border-radius:24px;overflow:hidden;border:1px solid var(--ccc);box-shadow:0 14px 40px rgba(0,0,0,.18)}.heroImage img{width:100%;height:100%;object-fit:cover}.seasonStrip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 28px}.seasonStrip>div{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;padding:15px;border:1px solid var(--ccc);border-radius:15px;background:var(--fff)}.seasonStrip span{grid-row:1/3;font-size:1.45rem}.seasonStrip strong{font-size:.82rem}.seasonStrip small{font-size:.65rem;opacity:.55}.storyCard,.videoCard,.gallerySection,.nextSeason{border:1px solid var(--ccc);border-radius:20px;background:var(--fff);padding:24px;margin-top:18px}.sectionHeading{display:flex;align-items:center;gap:12px}.sectionHeading>span{font-size:2rem}.sectionHeading h2,.videoCopy h2,.galleryHeader h2,.nextSeason h2{margin:3px 0 0}.storyCard>p{line-height:1.65;opacity:.72;margin-bottom:0}.videoCard{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:center}.videoEmbed{aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;border:1px solid #30404b}.videoEmbed iframe{width:100%;height:100%;display:block}.videoCopy p{line-height:1.55;opacity:.7}.galleryHeader{display:flex;justify-content:space-between;align-items:end;gap:10px}.galleryHeader>span{font-size:.68rem;opacity:.5}.filters{display:flex;gap:8px;margin:18px 0;overflow:auto}.filters button{border:1px solid var(--ccc);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font-weight:800;white-space:nowrap}.filters button.active{background:#078dcc;color:#fff;border-color:#078dcc}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.gallery figure{margin:0;position:relative;min-height:260px;border-radius:16px;overflow:hidden;background:#111}.gallery img{position:absolute;width:100%;height:100%;object-fit:cover}.gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:45px 14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff;display:flex;flex-direction:column}.gallery figcaption span{font-size:.58rem;text-transform:uppercase;letter-spacing:1px;color:#5cc8ff;font-weight:900}.gallery figcaption strong{margin-top:3px}.comingSoon{margin-top:14px;padding:14px;border-radius:12px;background:var(--f3f3f3);font-size:.76rem;line-height:1.5;opacity:.7}.nextSeason{text-align:center}.nextSeason p{opacity:.65;margin-bottom:0}
    @media(max-width:700px){.archivePage{padding:20px 10px 55px}.hero h1{font-size:2.5rem}.hero p{font-size:.9rem}.heroImage{height:340px;border-radius:18px}.seasonStrip{grid-template-columns:1fr;margin-top:12px}.seasonStrip>div{padding:11px 14px}.storyCard,.videoCard,.gallerySection,.nextSeason{padding:16px;border-radius:16px}.videoCard{grid-template-columns:1fr}.videoCopy{order:-1}.galleryHeader{align-items:start}.gallery{grid-template-columns:1fr}.gallery figure{min-height:300px}}
</style>
