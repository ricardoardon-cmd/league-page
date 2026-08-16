<script>
    let activeFilter = 'All';
    let activeVideo = 0;

    const filters = ['All', 'Draft Day', 'Punishment'];
    const videos = [
        { id: 'QDbLYQWL9Uc', title: 'Combine 2025 pt1' },
        { id: 'IqcXkIwQKNg', title: 'Combine 2025 pt2' },
        { id: 'UaWTUPAhAPQ', title: 'Combine 2025 pt3' }
    ];

    const combineResults = [
        { name: 'Tony', time: '1:56.09', place: 1 },
        { name: 'Ariel', time: '2:18.17', place: 2 },
        { name: 'Andy', time: '2:26.81', place: 3 },
        { name: 'Eddie', time: '2:28.86', place: 4 },
        { name: 'Pico', time: '2:34.04', place: 5 },
        { name: 'Dustin', time: '2:35.82', place: 6 },
        { name: 'Isai', time: '2:51.01', place: 7 },
        { name: 'Gabe', time: '3:24.16', place: 8 },
        { name: 'Jared', time: '3:30.90', place: 9 },
        { name: 'Mike', time: '4:18.20', place: 10 }
    ];

    const podium = combineResults.slice(0, 3);
    const field = combineResults.slice(3);

    const moments = [
        { src: '/archive/2025/league-group.jpg', tag: 'Draft Day', title: '2025 League Crew', featured: true }
    ];

    $: visibleMoments = activeFilter === 'All' ? moments : moments.filter((moment) => moment.tag === activeFilter);
    $: currentVideo = videos[activeVideo];

    const nextVideo = () => activeVideo = (activeVideo + 1) % videos.length;
    const previousVideo = () => activeVideo = (activeVideo - 1 + videos.length) % videos.length;

    const medal = (place) => place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '';
</script>

<svelte:head><title>2025 Season Archive | GGL</title></svelte:head>

<div class="archivePage">
    <section class="hero">
        <div class="eyebrow">GGL LEAGUE ARCHIVE · SLEEPER ERA</div>
        <h1>2025 Season</h1>
        <div class="heroImage"><img src="/archive/2025/league-group.jpg" alt="2025 league group" /></div>
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

    <section class="combineSection">
        <div class="combineHeading">
            <div><small>OFFICIAL RESULTS</small><h2>🏃 2025 Combine</h2></div>
            <span>10 managers</span>
        </div>

        <div class="podium">
            {#each podium as result}
                <div class="podiumCard place-{result.place}">
                    <div class="podiumMedal">{medal(result.place)}</div>
                    <div class="podiumPlace">#{result.place}</div>
                    <strong>{result.name}</strong>
                    <span>{result.time}</span>
                </div>
            {/each}
        </div>

        <div class="combineList">
            {#each field as result}
                <div class="combineRow">
                    <span class="combinePlace">{result.place}</span>
                    <strong>{result.name}</strong>
                    <span class="combineTime">{result.time}</span>
                </div>
            {/each}
        </div>
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
.archivePage{max-width:1120px;margin:0 auto;padding:32px 18px 80px;box-sizing:border-box}.hero{text-align:center}.eyebrow,.videoHeading small,.combineHeading small,.galleryHeader small,.nextSeason small{font-size:.68rem;font-weight:900;letter-spacing:1.5px;opacity:.55}.hero h1{font-size:3.4rem;margin:7px 0 18px}.heroImage{height:460px;border-radius:24px;overflow:hidden;border:1px solid var(--ccc);box-shadow:0 14px 40px rgba(0,0,0,.18)}.heroImage img{width:100%;height:100%;object-fit:cover}.videoSection,.combineSection,.gallerySection,.nextSeason{border:1px solid var(--ccc);border-radius:20px;background:var(--fff);padding:24px;margin-top:18px}.videoHeading h2,.combineHeading h2,.galleryHeader h2,.nextSeason h2{margin:3px 0 0}.videoHeading,.combineHeading,.galleryHeader{display:flex;justify-content:space-between;align-items:end;gap:12px}.videoHeading>span,.combineHeading>span,.galleryHeader>span{font-size:.7rem;opacity:.55}.videoCarousel{position:relative;margin-top:18px}.videoStage{max-width:820px;margin:0 auto}.videoEmbed{aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;border:1px solid #30404b}.videoEmbed iframe{width:100%;height:100%;display:block}.videoTitle{text-align:center;margin-top:10px;font-size:.86rem;font-weight:800}.videoArrow{position:absolute;top:calc(50% - 24px);z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid var(--ccc);background:rgba(10,10,10,.82);color:#fff;font-size:2rem;line-height:1;cursor:pointer}.videoArrow.left{left:8px}.videoArrow.right{right:8px}.videoDots{display:flex;justify-content:center;gap:8px;margin-top:13px}.videoDots button{width:9px;height:9px;padding:0;border:0;border-radius:50%;background:var(--ccc);cursor:pointer}.videoDots button.active{width:24px;border-radius:999px;background:var(--blueOne)}.swipeHint{text-align:center;margin-top:8px;font-size:.66rem;opacity:.5}.podium{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.podiumCard{position:relative;text-align:center;padding:14px 8px 12px;border:1px solid var(--ccc);border-radius:15px;background:var(--f3f3f3)}.podiumCard.place-1{transform:translateY(-5px);border-color:#d6a700;box-shadow:0 6px 16px rgba(214,167,0,.12)}.podiumMedal{font-size:1.55rem}.podiumPlace{position:absolute;top:8px;right:10px;font-size:.65rem;font-weight:900;opacity:.5}.podiumCard strong{display:block;margin-top:3px;font-size:.9rem}.podiumCard>span{display:block;margin-top:4px;font-size:.75rem;font-weight:800;opacity:.72}.combineList{margin-top:12px;border:1px solid var(--ccc);border-radius:14px;overflow:hidden}.combineRow{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--ccc)}.combineRow:last-child{border-bottom:0}.combinePlace{font-size:.72rem;font-weight:900;opacity:.5}.combineRow strong{font-size:.8rem}.combineTime{font-size:.78rem;font-variant-numeric:tabular-nums;font-weight:850}.filters{display:flex;gap:8px;margin:18px 0;overflow:auto}.filters button{border:1px solid var(--ccc);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font-weight:800;white-space:nowrap}.filters button.active{background:#078dcc;color:#fff;border-color:#078dcc}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.gallery figure{margin:0;position:relative;min-height:320px;border-radius:16px;overflow:hidden;background:#111}.gallery img{position:absolute;width:100%;height:100%;object-fit:cover}.gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:45px 14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff;display:flex;flex-direction:column}.gallery figcaption span{font-size:.58rem;text-transform:uppercase;letter-spacing:1px;color:#5cc8ff;font-weight:900}.gallery figcaption strong{margin-top:3px}.comingSoon{margin-top:14px;padding:14px;border-radius:12px;background:var(--f3f3f3);font-size:.76rem;line-height:1.5;opacity:.7}.nextSeason{text-align:center}.nextSeason p{opacity:.65;margin-bottom:0}
@media(max-width:700px){.archivePage{padding:20px 10px 55px}.hero h1{font-size:2.5rem;margin-bottom:14px}.heroImage{height:340px;border-radius:18px}.videoSection,.combineSection,.gallerySection,.nextSeason{padding:16px;border-radius:16px}.videoSection{padding-left:10px;padding-right:10px}.videoHeading,.combineHeading,.galleryHeader{padding:0 6px;align-items:start}.videoArrow{width:38px;height:38px;font-size:1.65rem;top:calc(50% - 27px)}.videoArrow.left{left:3px}.videoArrow.right{right:3px}.videoStage{padding:0 22px}.videoEmbed{border-radius:13px}.combineSection{padding:14px 10px}.combineHeading h2{font-size:1.35rem}.podium{gap:6px;margin-top:16px}.podiumCard{padding:12px 5px 10px;border-radius:13px}.podiumCard.place-1{transform:translateY(-4px)}.podiumMedal{font-size:1.35rem}.podiumPlace{top:6px;right:7px;font-size:.58rem}.podiumCard strong{font-size:.78rem}.podiumCard>span{font-size:.66rem}.combineList{margin-top:9px}.combineRow{padding:9px 10px}.combineRow strong{font-size:.76rem}.combineTime{font-size:.75rem}.gallery{grid-template-columns:1fr}.gallery figure{min-height:360px}}
</style>
