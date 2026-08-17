<script>
    let activeYear = 2026;
    let activeFilter = 'All';
    let activeVideo = 0;

    const years = [2026, 2025, 2024, 2023, '2022-legacy'];
    const filters = ['All', 'Draft Day', 'Punishment'];

    const videosByYear = {
        2026: [
            { id: 'zJtycX-e5hg', title: '2026 Video 1' },
            { id: 'p4tLDVhYPMs', title: '2026 Video 2' }
        ],
        2025: [
            { id: 'QDbLYQWL9Uc', title: 'Combine 2025 pt1' },
            { id: 'IqcXkIwQKNg', title: 'Combine 2025 pt2' },
            { id: 'UaWTUPAhAPQ', title: 'Combine 2025 pt3' },
            { id: 'saPK13MCYq0', title: 'Combine 2025 pt4' },
            { id: 'PgUK4bmnt_M', title: 'Combine 2025 pt5' },
            { id: '97Z13uwFJc0', title: 'Combine 2025 pt6' },
            { id: 'AkK_nKafvt4', title: 'Combine 2025 pt7' },
            { id: 'ku7TOkLlAN8', title: 'Combine 2025 pt8' },
            { id: 'fETRMXxkyB4', title: 'Combine 2025 pt9' }
        ],
        2024: [
            { id: 'W4ux4DjZVBo', title: '2024 Video 1' },
            { id: '7NTD0m9g6js', title: '2024 Video 2' },
            { id: 'Rjg3Y6bxQ5A', title: '2024 Video 3' },
            { id: '-gBptw3BmFg', title: '2024 Video 4' },
            { id: 'jE7QnxQ85FA', title: '2024 Video 5' },
            { id: '8bLzeI5zQ8w', title: '2024 Video 6' },
            { id: 'T2uT50SjwPQ', title: '2024 Video 7' }
        ],
        2023: [
            { id: 'MTnuTXIR8HQ', title: '2023 Short 1' },
            { id: 'UJNrzNSC0JE', title: '2023 Short 2' }
        ],
        '2022-legacy': []
    };

    const combineByYear = {
        2026: [],
        2025: [
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
        ],
        2024: [
            { name: 'Isai', time: '1:28.9', place: 1 },
            { name: 'Gabe', time: '1:32', place: 2 },
            { name: 'Pico', time: '1:36', place: 3 },
            { name: 'Jared', time: '1:45.76', place: 4 },
            { name: 'Eddie', time: '1:59.35', place: 5 },
            { name: 'Igor', time: '2:01.79', place: 6 },
            { name: 'Andy', time: '2:07', place: 7 },
            { name: 'Dustin', time: '2:08.44', place: 8 },
            { name: 'Ariel', time: '3:34.02', place: 9 },
            { name: 'Tony', time: '5:28', place: 10 }
        ],
        2023: [],
        '2022-legacy': []
    };

    const momentsByYear = {
        2026: [],
        2025: [
            { src: '/archive/2025/league-group.jpg', tag: 'Draft Day', title: '2025 League Crew', featured: true }
        ],
        2024: [],
        2023: [],
        '2022-legacy': []
    };

    $: isLegacy = activeYear === '2022-legacy';
    $: yearLabel = isLegacy ? '2022–Legacy' : activeYear;
    $: videos = videosByYear[activeYear] || [];
    $: combineResults = combineByYear[activeYear] || [];
    $: podium = combineResults.slice(0, 3);
    $: field = combineResults.slice(3);
    $: moments = momentsByYear[activeYear] || [];
    $: visibleMoments = activeFilter === 'All' ? moments : moments.filter((moment) => moment.tag === activeFilter);
    $: currentVideo = videos[activeVideo];

    const nextVideo = () => activeVideo = (activeVideo + 1) % videos.length;
    const previousVideo = () => activeVideo = (activeVideo - 1 + videos.length) % videos.length;

    const selectYear = (year) => {
        activeYear = year;
        activeFilter = 'All';
        activeVideo = 0;
    };

    const medal = (place) => place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '';
</script>

<svelte:head><title>{yearLabel} Archive | GGL</title></svelte:head>

<div class="archivePage">
    <nav class="yearNav" aria-label="Season archive years">
        <span class="yearNavLabel">Season</span>
        <div class="yearButtons">
            {#each years as year}
                <button class:active={activeYear === year} onclick={() => selectYear(year)}>{year === '2022-legacy' ? '2022–Legacy' : year}</button>
            {/each}
        </div>
    </nav>

    <section class="hero">
        <div class="eyebrow">GGL LEAGUE ARCHIVE · SLEEPER ERA</div>
        <h1>{isLegacy ? '2022–Legacy' : `${activeYear} Season`}</h1>
        {#if activeYear === 2025}
            <div class="heroImage"><img src="/league-photo.jpg" alt="2025 league group" /></div>
        {/if}
    </section>

    {#if !isLegacy && videos.length > 0}
        <section class="videoSection">
            <div class="videoHeading">
                <div><small>WATCH THE SEASON</small><h2>🎬 {activeYear}</h2></div>
                <span>{activeVideo + 1} / {videos.length}</span>
            </div>
            <div class="videoCarousel">
                <button class="videoArrow left" onclick={previousVideo} aria-label="Previous video">‹</button>
                <div class="videoStage">
                    <div class="videoEmbed">
                        <iframe src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}`} title={`GGL ${activeYear} ${currentVideo.title}`} frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div class="videoTitle">{currentVideo.title}</div>
                </div>
                <button class="videoArrow right" onclick={nextVideo} aria-label="Next video">›</button>
            </div>
            <div class="videoDots" aria-label="Choose a video">
                {#each videos as video, index}<button class:active={activeVideo === index} onclick={() => activeVideo = index} aria-label={`Play ${video.title}`}></button>{/each}
            </div>
            <div class="swipeHint">Tap the arrows or dots for the next video</div>
        </section>
    {/if}

    {#if !isLegacy && combineResults.length > 0}
        <section class="combineSection">
            <div class="combineHeading">
                <div><small>OFFICIAL RESULTS</small><h2>🏃 {activeYear} Combine</h2></div>
                <span>{combineResults.length} managers</span>
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
    {/if}

    {#if moments.length > 0}
        <section class="gallerySection">
            <div class="galleryHeader"><div><small>{isLegacy ? 'LEAGUE HISTORY' : 'SEASON MEMORIES'}</small><h2>📸 {yearLabel}</h2></div><span>{moments.length} loaded</span></div>
            {#if !isLegacy}<div class="filters">{#each filters as filter}<button class:active={activeFilter === filter} onclick={() => activeFilter = filter}>{filter}</button>{/each}</div>{/if}
            <div class="gallery">
                {#each visibleMoments as moment}
                    <figure class:featured={moment.featured}><img src={moment.src} alt={moment.title} /><figcaption><span>{moment.tag}</span><strong>{moment.title}</strong></figcaption></figure>
                {/each}
            </div>
            {#if visibleMoments.length === 0}<div class="comingSoon">No photos loaded in this category yet.</div>{/if}
        </section>
    {:else if isLegacy}
        <section class="legacyEmpty">
            <div class="emptyIcon">📷</div>
            <small>LEAGUE HISTORY</small>
            <h2>2022 and earlier</h2>
            <p>This archive is ready for older league photos as they are found.</p>
        </section>
    {:else if activeYear !== 2023}
        <section class="mediaComingSoon">
            <strong>📸 {activeYear} photos and videos coming next</strong>
        </section>
    {/if}

    {#if activeYear === 2023 && videos.length === 0 && combineResults.length === 0 && moments.length === 0}
        <section class="emptySeason">
            <div class="emptyIcon">📦</div>
            <h2>2023 archive coming next</h2>
            <p>We can add the 2023 photos, videos and season-specific extras here as you send them.</p>
        </section>
    {/if}
</div>

<style>
.archivePage{max-width:1120px;margin:0 auto;padding:22px 18px 80px;box-sizing:border-box}.yearNav{position:sticky;top:0;z-index:20;display:flex;justify-content:center;align-items:center;gap:12px;margin:0 auto 20px;padding:9px 10px;border:1px solid var(--ccc);border-radius:16px;background:var(--fff);box-shadow:0 5px 18px rgba(0,0,0,.08)}.yearNavLabel{font-size:.66rem;font-weight:900;letter-spacing:1px;text-transform:uppercase;opacity:.5}.yearButtons{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}.yearButtons::-webkit-scrollbar{display:none}.yearButtons button{min-width:66px;padding:8px 14px;border:1px solid var(--ccc);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer}.yearButtons button.active{background:var(--blueOne);border-color:var(--blueOne);color:#fff}.hero{text-align:center}.eyebrow,.videoHeading small,.combineHeading small,.galleryHeader small,.legacyEmpty small{font-size:.68rem;font-weight:900;letter-spacing:1.5px;opacity:.55}.hero h1,.emptySeason h1{font-size:3.4rem;margin:7px 0 18px}.heroImage{height:460px;border-radius:24px;overflow:hidden;border:1px solid var(--ccc);box-shadow:0 14px 40px rgba(0,0,0,.18)}.heroImage img{width:100%;height:100%;object-fit:cover}.videoSection,.combineSection,.gallerySection,.emptySeason,.mediaComingSoon,.legacyEmpty{border:1px solid var(--ccc);border-radius:20px;background:var(--fff);padding:24px;margin-top:18px}.videoHeading h2,.combineHeading h2,.galleryHeader h2{margin:3px 0 0}.videoHeading h2,.galleryHeader h2{font-size:1.5rem;line-height:1.1}.videoHeading,.combineHeading,.galleryHeader{display:flex;justify-content:space-between;align-items:end;gap:12px}.videoHeading>span,.combineHeading>span,.galleryHeader>span{font-size:.7rem;opacity:.55}.videoCarousel{position:relative;margin-top:18px}.videoStage{max-width:820px;margin:0 auto}.videoEmbed{aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;border:1px solid #30404b}.videoEmbed iframe{width:100%;height:100%;display:block}.videoTitle{text-align:center;margin-top:10px;font-size:.86rem;font-weight:800}.videoArrow{position:absolute;top:calc(50% - 24px);z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid var(--ccc);background:rgba(10,10,10,.82);color:#fff;font-size:2rem;line-height:1;cursor:pointer}.videoArrow.left{left:8px}.videoArrow.right{right:8px}.videoDots{display:flex;justify-content:center;gap:8px;margin-top:13px}.videoDots button{width:9px;height:9px;padding:0;border:0;border-radius:50%;background:var(--ccc);cursor:pointer}.videoDots button.active{width:24px;border-radius:999px;background:var(--blueOne)}.swipeHint{text-align:center;margin-top:8px;font-size:.66rem;opacity:.5}.podium{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.podiumCard{position:relative;text-align:center;padding:14px 8px 12px;border:1px solid var(--ccc);border-radius:15px;background:var(--f3f3f3)}.podiumCard.place-1{transform:translateY(-5px);border-color:#d6a700;box-shadow:0 6px 16px rgba(214,167,0,.12)}.podiumMedal{font-size:1.55rem}.podiumPlace{position:absolute;top:8px;right:10px;font-size:.65rem;font-weight:900;opacity:.5}.podiumCard strong{display:block;margin-top:3px;font-size:.9rem}.podiumCard>span{display:block;margin-top:4px;font-size:.75rem;font-weight:800;opacity:.72}.combineList{margin-top:12px;border:1px solid var(--ccc);border-radius:14px;overflow:hidden}.combineRow{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--ccc)}.combineRow:last-child{border-bottom:0}.combinePlace{font-size:.72rem;font-weight:900;opacity:.5}.combineRow strong{font-size:.8rem}.combineTime{font-size:.78rem;font-variant-numeric:tabular-nums;font-weight:850}.filters{display:flex;gap:8px;margin:18px 0;overflow:auto}.filters button{border:1px solid var(--ccc);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font-weight:800;white-space:nowrap}.filters button.active{background:#078dcc;color:#fff;border-color:#078dcc}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.gallery figure{margin:0;position:relative;min-height:320px;border-radius:16px;overflow:hidden;background:#111}.gallery img{position:absolute;width:100%;height:100%;object-fit:cover}.gallery figure.featured{grid-column:1/-1;min-height:500px}.gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 16px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff}.gallery figcaption span{display:block;font-size:.62rem;text-transform:uppercase;letter-spacing:1px;opacity:.7}.gallery figcaption strong{display:block;margin-top:3px}.comingSoon,.mediaComingSoon,.legacyEmpty,.emptySeason{text-align:center}.legacyEmpty,.emptySeason{padding:50px 20px}.emptyIcon{font-size:2rem}.legacyEmpty h2,.emptySeason h2{margin:6px 0}.legacyEmpty p,.emptySeason p{margin:0 auto;max-width:520px;opacity:.65;line-height:1.55}.mediaComingSoon{padding:18px;opacity:.65}
@media(max-width:700px){.archivePage{padding:12px 10px 60px}.yearNav{justify-content:flex-start;position:relative;top:auto;margin-bottom:12px;border-radius:14px;padding:8px}.yearNavLabel{display:none}.yearButtons{width:100%}.yearButtons button{min-width:70px;padding:8px 12px}.hero h1{font-size:2.35rem;margin-bottom:12px}.heroImage{height:320px;border-radius:18px}.videoSection,.combineSection,.gallerySection,.emptySeason,.mediaComingSoon,.legacyEmpty{padding:14px;border-radius:16px;margin-top:12px}.videoHeading h2,.combineHeading h2,.galleryHeader h2{font-size:1.15rem}.videoArrow{width:38px;height:38px;font-size:1.7rem;top:calc(50% - 20px)}.videoArrow.left{left:2px}.videoArrow.right{right:2px}.videoStage{padding:0 22px}.videoEmbed{border-radius:12px}.podium{gap:6px}.podiumCard{padding:11px 4px 10px}.podiumMedal{font-size:1.25rem}.podiumCard strong{font-size:.76rem}.podiumCard>span{font-size:.68rem}.gallery{grid-template-columns:1fr}.gallery figure,.gallery figure.featured{grid-column:auto;min-height:360px}.galleryHeader{align-items:center}}
@media(max-width:390px){.heroImage{height:270px}.videoStage{padding:0 18px}.videoArrow{width:34px;height:34px}.podiumCard strong{font-size:.7rem}.podiumCard>span{font-size:.62rem}}
</style>