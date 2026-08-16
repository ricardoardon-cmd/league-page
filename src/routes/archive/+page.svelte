<script>
    let activeFilter = 'All';
    let activeVideo = 0;

    const filters = ['All', 'Draft Day', 'Punishment'];
    const videos = [
        { id: 'QDbLYQWL9Uc', title: 'Combine 2025 pt1' },
        { id: 'IqcXkIwQKNg', title: 'Combine 2025 pt2' },
        { id: 'UaWTUPAhAPQ', title: 'Combine 2025 pt3' }
    ];

    const moments = [
        { src: '/archive/2025/league-group.jpg', tag: 'Draft Day', title: '2025 League Crew', featured: true }
    ];

    $: visibleMoments = activeFilter === 'All' ? moments : moments.filter((moment) => moment.tag === activeFilter);
    $: currentVideo = videos[activeVideo];

    const nextVideo = () => activeVideo = (activeVideo + 1) % videos.length;
    const previousVideo = () => activeVideo = (activeVideo - 1 + videos.length) % videos.length;
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
        <div><span>🎬</span><strong>Season Films</strong><small>{videos.length} videos added</small></div>
    </section>

    <section class="videoSection">
        <div class="videoHeading">
            <div><small>WATCH THE SEASON</small><h2>🎬 2025 Season Films</h2></div>
            <span>{activeVideo + 1} / {videos.length}</span>
        </div>
        <div class="videoCarousel">
            <button class="videoArrow left" onclick={previousVideo} aria-label="Previous video">‹</button>
            <div class="videoStage">
                <div class="videoEmbed">
                    <iframe src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}`} title={`GGL 2025 ${currentVideo.title}`} frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="videoTitle">{currentVideo.title}</div>
            </div>
            <button class="videoArrow right" onclick={nextVideo} aria-label="Next video">›</button>
        </div>
        <div class="videoDots" aria-label="Choose a video">
            {#each videos as video, index}<button class:active={activeVideo === index} onclick={() => activeVideo = index} aria-label={`Play ${video.title}`}></button>{/each}
        </div>
        <div class="swipeHint">Swipe-style controls · tap the arrows or dots for the next video</div>
    </section>

    <section class="gallerySection">
        <div class="galleryHeader"><div><small>SEASON MEMORIES</small><h2>📸 2025 Photo Archive</h2></div><span>{moments.length} loaded</span></div>
        <div class="filters">{#each filters as filter}<button class:active={activeFilter === filter} onclick={() => activeFilter = filter}>{filter}</button>{/each}</div>
        <div class="gallery">
            {#each visibleMoments as moment}
                <figure class:featured={moment.featured}><img src={moment.src} alt={moment.title} /><figcaption><span>{moment.tag}</span><strong>{moment.title}</strong></figcaption></figure>
            {/each}
        </div>
        {#if visibleMoments.length === 0}<div class="comingSoon">The rest of the 2025 photos are being added to this category.</div>{/if}
    </section>

    <section class="nextSeason"><small>GGL TIME CAPSULE</small><h2>2024 → 2025 → 2026</h2><p>Once 2025 is dialed in, we can reuse this exact format for 2024 and 2023.</p></section>
</div>

<style>
.archivePage{max-width:1120px;margin:0 auto;padding:32px 18px 80px;box-sizing:border-box}.hero{text-align:center}.eyebrow,.videoHeading small,.galleryHeader small,.nextSeason small{font-size:.68rem;font-weight:900;letter-spacing:1.5px;opacity:.55}.hero h1{font-size:3.4rem;margin:7px 0 4px}.hero p{margin:0 auto 24px;max-width:650px;opacity:.68}.heroImage{height:460px;border-radius:24px;overflow:hidden;border:1px solid var(--ccc);box-shadow:0 14px 40px rgba(0,0,0,.18)}.heroImage img{width:100%;height:100%;object-fit:cover}.seasonStrip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 28px}.seasonStrip>div{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;padding:15px;border:1px solid var(--ccc);border-radius:15px;background:var(--fff)}.seasonStrip span{grid-row:1/3;font-size:1.45rem}.seasonStrip strong{font-size:.82rem}.seasonStrip small{font-size:.65rem;opacity:.55}.videoSection,.gallerySection,.nextSeason{border:1px solid var(--ccc);border-radius:20px;background:var(--fff);padding:24px;margin-top:18px}.videoHeading h2,.galleryHeader h2,.nextSeason h2{margin:3px 0 0}.videoHeading,.galleryHeader{display:flex;justify-content:space-between;align-items:end;gap:12px}.videoHeading>span,.galleryHeader>span{font-size:.7rem;opacity:.55}.videoCarousel{position:relative;margin-top:18px}.videoStage{max-width:820px;margin:0 auto}.videoEmbed{aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;border:1px solid #30404b}.videoEmbed iframe{width:100%;height:100%;display:block}.videoTitle{text-align:center;margin-top:10px;font-size:.86rem;font-weight:800}.videoArrow{position:absolute;top:calc(50% - 24px);z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid var(--ccc);background:rgba(10,10,10,.82);color:#fff;font-size:2rem;line-height:1;cursor:pointer}.videoArrow.left{left:8px}.videoArrow.right{right:8px}.videoDots{display:flex;justify-content:center;gap:8px;margin-top:13px}.videoDots button{width:9px;height:9px;padding:0;border:0;border-radius:50%;background:var(--ccc);cursor:pointer}.videoDots button.active{width:24px;border-radius:999px;background:var(--blueOne)}.swipeHint{text-align:center;margin-top:8px;font-size:.66rem;opacity:.5}.filters{display:flex;gap:8px;margin:18px 0;overflow:auto}.filters button{border:1px solid var(--ccc);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font-weight:800;white-space:nowrap}.filters button.active{background:#078dcc;color:#fff;border-color:#078dcc}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.gallery figure{margin:0;position:relative;min-height:320px;border-radius:16px;overflow:hidden;background:#111}.gallery img{position:absolute;width:100%;height:100%;object-fit:cover}.gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:45px 14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff;display:flex;flex-direction:column}.gallery figcaption span{font-size:.58rem;text-transform:uppercase;letter-spacing:1px;color:#5cc8ff;font-weight:900}.gallery figcaption strong{margin-top:3px}.comingSoon{margin-top:14px;padding:14px;border-radius:12px;background:var(--f3f3f3);font-size:.76rem;line-height:1.5;opacity:.7}.nextSeason{text-align:center}.nextSeason p{opacity:.65;margin-bottom:0}
@media(max-width:700px){.archivePage{padding:20px 10px 55px}.hero h1{font-size:2.5rem}.hero p{font-size:.9rem}.heroImage{height:340px;border-radius:18px}.seasonStrip{grid-template-columns:1fr;margin-top:12px}.seasonStrip>div{padding:11px 14px}.videoSection,.gallerySection,.nextSeason{padding:16px;border-radius:16px}.videoSection{padding-left:10px;padding-right:10px}.videoHeading,.galleryHeader{padding:0 6px;align-items:start}.videoArrow{width:38px;height:38px;font-size:1.65rem;top:calc(50% - 27px)}.videoArrow.left{left:3px}.videoArrow.right{right:3px}.videoStage{padding:0 22px}.videoEmbed{border-radius:13px}.gallery{grid-template-columns:1fr}.gallery figure{min-height:360px}}
</style>
