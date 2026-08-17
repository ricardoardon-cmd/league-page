<script>
    let activeYear = 2026;
    let activeFilter = 'All';
    let activeVideo = 0;

    const years = [2026, 2025, 2024, 2023, '2022-legacy'];
    const filters = ['All', 'Draft Day', 'Punishment'];

    const videosByYear = {
        2026: [],
        2025: [
            { id: 'QDbLYQWL9Uc', title: 'Combine 2025 pt1' },
            { id: 'IqcXkIwQKNg', title: 'Combine 2025 pt2' },
            { id: 'UaWTUPAhAPQ', title: 'Combine 2025 pt3' },
            { id: 'saPK13MCYq0', title: 'Combine 2025 pt4' },
            { id: 'PgUK4bmnt_M', title: 'Combine 2025 pt5' },
            { id: '97Z13uwFJc0', title: 'Combine 2025 pt6' },
            { id: 'AkK_nKafvt4', title: 'Combine 2025 pt7' },
            { id: 'ku7TOkLlAN8', title: 'Combine 2025 pt8' }
        ],
        2024: [],
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
.archivePage{max-width:1120px;margin:0 auto;padding:22px 18px 80px;box-sizing:border-box}.yearNav{position:sticky;top:0;z-index:20;display:flex;justify-content:center;align-items:center;gap:12px;margin:0 auto 20px;padding:9px 10px;border:1px solid var(--ccc);border-radius:16px;background:var(--fff);box-shadow:0 5px 18px rgba(0,0,0,.08)}.yearNavLabel{font-size:.66rem;font-weight:900;letter-spacing:1px;text-transform:uppercase;opacity:.5}.yearButtons{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}.yearButtons::-webkit-scrollbar{display:none}.yearButtons button{min-width:66px;padding:8px 14px;border:1px solid var(--ccc);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer}.yearButtons button.active{background:var(--blueOne);border-color:var(--blueOne);color:#fff}.hero{text-align:center}.eyebrow,.videoHeading small,.combineHeading small,.galleryHeader small,.legacyEmpty small{font-size:.68rem;font-weight:900;letter-spacing:1.5px;opacity:.55}.hero h1,.emptySeason h1{font-size:3.4rem;margin:7px 0 18px}.heroImage{height:460px;border-radius:24px;overflow:hidden;border:1px solid var(--ccc);box-shadow:0 14px 40px rgba(0,0,0,.18)}.heroImage img{width:100%;height:100%;object-fit:cover}.videoSection,.combineSection,.gallerySection,.emptySeason,.mediaComingSoon,.legacyEmpty{border:1px solid var(--ccc);border-radius:20px;background:var(--fff);padding:24px;margin-top:18px}.videoHeading h2,.combineHeading h2,.galleryHeader h2{margin:3px 0 0}.videoHeading h2,.galleryHeader h2{font-size:1.5rem;line-height:1.1}.videoHeading,.combineHeading,.galleryHeader{display:flex;justify-content:space-between;align-items:end;gap:12px}.videoHeading>span,.combineHeading>span,.galleryHeader>span{font-size:.7rem;opacity:.55}.videoCarousel{position:relative;margin-top:18px}.videoStage{max-width:820px;margin:0 auto}.videoEmbed{aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;border:1px solid #30404b}.videoEmbed iframe{width:100%;height:100%;display:block}.videoTitle{text-align:center;margin-top:10px;font-size:.86rem;font-weight:800}.videoArrow{position:absolute;top:calc(50% - 24px);z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid var(--ccc);background:rgba(10,10,10,.82);color:#fff;font-size:2rem;line-height:1;cursor:pointer}.videoArrow.left{left:8px}.videoArrow.right{right:8px}.videoDots{display:flex;justify-content:center;gap:8px;margin-top:13px}.videoDots button{width:9px;height:9px;padding:0;border:0;border-radius:50%;background:var(--ccc);cursor:pointer}.videoDots button.active{width:24px;border-radius:999px;background:var(--blueOne)}.swipeHint{text-align:center;margin-top:8px;font-size:.66rem;opacity:.5}.podium{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.podiumCard{position:relative;text-align:center;padding:14px 8px 12px;border:1px solid var(--ccc);border-radius:15px;background:var(--f3f3f3)}.podiumCard.place-1{transform:translateY(-5px);border-color:#d6a700;box-shadow:0 6px 16px rgba(214,167,0,.12)}.podiumMedal{font-size:1.55rem}.podiumPlace{position:absolute;top:8px;right:10px;font-size:.65rem;font-weight:900;opacity:.5}.podiumCard strong{display:block;margin-top:3px;font-size:.9rem}.podiumCard>span{display:block;margin-top:4px;font-size:.75rem;font-weight:800;opacity:.72}.combineList{margin-top:12px;border:1px solid var(--ccc);border-radius:14px;overflow:hidden}.combineRow{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--ccc)}.combineRow:last-child{border-bottom:0}.combinePlace{font-size:.72rem;font-weight:900;opacity:.5}.combineRow strong{font-size:.8rem}.combineTime{font-size:.78rem;font-variant-numeric:tabular-nums;font-weight:850}.filters{display:flex;gap:8px;margin:18px 0;overflow:auto}.filters button{border:1px solid var(--ccc);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font-weight:800;white-space:nowrap}.filters button.active{background:#078dcc;color:#fff;border-color:#078dcc}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.gallery figure{margin:0;position:relative;min-height:320px;border-radius:16px;overflow:hidden;background:#111}.gallery img{position:absolute;width:100%;height:100%;object-fit:cover}.gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:45px 14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff;display:flex;flex-direction:column}.gallery figcaption span{font-size:.58rem;text-transform:uppercase;letter-spacing:1px;color:#5cc8ff;font-weight:900}.gallery figcaption strong{margin-top:3px}.comingSoon{margin-top:14px;padding:14px;border-radius:12px;background:var(--f3f3f3);font-size:.76rem;line-height:1.5;opacity:.7}.mediaComingSoon{text-align:center;font-size:.8rem;opacity:.65}.emptySeason,.legacyEmpty{text-align:center;padding:36px 24px}.emptySeason .emptyIcon,.legacyEmpty .emptyIcon{font-size:3rem;margin:0 0 8px}.emptySeason h2,.legacyEmpty h2{margin:5px 0 0}.emptySeason p,.legacyEmpty p{max-width:540px;margin:10px auto 0;line-height:1.6;opacity:.65}
@media(max-width:700px){.archivePage{padding:12px 10px 55px}.yearNav{justify-content:flex-start;gap:8px;margin-bottom:14px;padding:7px 8px;border-radius:14px}.yearNavLabel{padding-left:4px}.yearButtons{flex:1}.yearButtons button{min-width:62px;padding:7px 12px;font-size:.72rem}.hero h1,.emptySeason h1{font-size:2.5rem;margin-bottom:14px}.heroImage{height:340px;border-radius:18px}.videoSection,.combineSection,.gallerySection,.emptySeason,.mediaComingSoon,.legacyEmpty{padding:16px;border-radius:16px}.videoSection{padding-left:10px;padding-right:10px}.videoHeading,.combineHeading,.galleryHeader{padding:0 6px;align-items:start}.videoHeading h2,.galleryHeader h2{font-size:1.15rem;line-height:1.05}.videoArrow{width:38px;height:38px;font-size:1.65rem;top:calc(50% - 27px)}.videoArrow.left{left:3px}.videoArrow.right{right:3px}.videoStage{padding:0 22px}.videoEmbed{border-radius:13px}.combineSection{padding:14px 10px}.combineHeading h2{font-size:1.35rem}.podium{gap:6px;margin-top:16px}.podiumCard{padding:12px 5px 10px;border-radius:13px}.podiumCard.place-1{transform:translateY(-4px)}.podiumMedal{font-size:1.35rem}.podiumPlace{top:6px;right:7px;font-size:.58rem}.podiumCard strong{font-size:.78rem}.podiumCard>span{font-size:.66rem}.combineList{margin-top:9px}.combineRow{padding:9px 10px}.combineRow strong{font-size:.76rem}.combineTime{font-size:.75rem}.gallery{grid-template-columns:1fr}.gallery figure{min-height:360px}.mediaComingSoon{padding:12px}}
</style>