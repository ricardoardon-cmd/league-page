<script>
    export let data = [];

    const width = 900;
    const height = 320;
    const padding = {
        top: 34,
        right: 34,
        bottom: 52,
        left: 62
    };

    $: cleanData = (data || [])
        .filter(
            (item) =>
                Number.isFinite(Number(item?.year)) &&
                Number.isFinite(Number(item?.averagePPG))
        )
        .map((item) => ({
            ...item,
            year: Number(item.year),
            averagePPG: Number(item.averagePPG)
        }))
        .sort((a, b) => a.year - b.year);

    $: values = cleanData.map((item) => item.averagePPG);

    $: rawMin = values.length ? Math.min(...values) : 0;
    $: rawMax = values.length ? Math.max(...values) : 1;

    $: yPadding = Math.max(5, (rawMax - rawMin) * 0.18);
    $: yMin = Math.floor((rawMin - yPadding) / 5) * 5;
    $: yMax = Math.ceil((rawMax + yPadding) / 5) * 5;
    $: yRange = Math.max(1, yMax - yMin);

    $: plotWidth = width - padding.left - padding.right;
    $: plotHeight = height - padding.top - padding.bottom;

    const getX = (index, length) => {
        if (length <= 1) {
            return padding.left + plotWidth / 2;
        }

        return padding.left + (index / (length - 1)) * plotWidth;
    };

    const getY = (value) =>
        padding.top +
        plotHeight -
        ((value - yMin) / yRange) * plotHeight;

    $: points = cleanData
        .map(
            (item, index) =>
                `${getX(index, cleanData.length)},${getY(item.averagePPG)}`
        )
        .join(' ');

    $: yTicks = Array.from({ length: 5 }, (_, index) => {
        const value = yMin + (yRange * index) / 4;

        return {
            value: Math.round(value * 10) / 10,
            y: getY(value)
        };
    }).reverse();
</script>

<style>
    .historyCard {
        width: 95%;
        max-width: 1000px;
        margin: 28px auto 34px;
        overflow: hidden;
        border: 1px solid var(--ccc);
        border-radius: 16px;
        background: var(--fff);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    .historyHeader {
        padding: 18px 20px 4px;
        text-align: center;
    }

    .historyEyebrow {
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.55;
    }

    .historyTitle {
        margin-top: 4px;
        font-size: 1.05rem;
        font-weight: 800;
    }

    .historySubtitle {
        margin-top: 5px;
        font-size: 0.76rem;
        opacity: 0.62;
    }

    .chartScroll {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
    }

    svg {
        display: block;
        width: 100%;
        min-width: 620px;
        height: auto;
    }

    .gridLine {
        stroke: var(--ccc);
        stroke-width: 1;
        opacity: 0.55;
    }

    .axisLabel {
        fill: currentColor;
        font-size: 12px;
        opacity: 0.6;
    }

    .yearLabel {
        fill: currentColor;
        font-size: 12px;
        font-weight: 700;
        opacity: 0.72;
    }

    .trendLine {
        fill: none;
        stroke: var(--blueOne);
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .trendPoint {
        fill: var(--fff);
        stroke: var(--blueOne);
        stroke-width: 4;
    }

    .pointValue {
        fill: currentColor;
        font-size: 12px;
        font-weight: 800;
    }

    @media (max-width: 700px) {
        .historyCard {
            width: 98%;
            margin: 22px auto 24px;
        }

        .historyHeader {
            padding: 16px 12px 2px;
        }

        .historyTitle {
            font-size: 0.95rem;
        }

        .historySubtitle {
            font-size: 0.7rem;
        }

        svg {
            min-width: 560px;
        }
    }
</style>

<div class="historyCard">
    <div class="historyHeader">
        <div class="historyEyebrow">League Trend</div>
        <div class="historyTitle">📈 League Scoring History</div>
        <div class="historySubtitle">
            Average regular-season points per team per game
        </div>
    </div>

    {#if cleanData.length > 1}
        <div class="chartScroll">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="League scoring history by season"
            >
                {#each yTicks as tick}
                    <line
                        class="gridLine"
                        x1={padding.left}
                        x2={width - padding.right}
                        y1={tick.y}
                        y2={tick.y}
                    />
                    <text
                        class="axisLabel"
                        x={padding.left - 12}
                        y={tick.y + 4}
                        text-anchor="end"
                    >
                        {tick.value}
                    </text>
                {/each}

                <polyline
                    class="trendLine"
                    points={points}
                />

                {#each cleanData as item, index}
                    <g>
                        <circle
                            class="trendPoint"
                            cx={getX(index, cleanData.length)}
                            cy={getY(item.averagePPG)}
                            r="6"
                        >
                            <title>
                                {item.year}: {item.averagePPG} average PPG
                            </title>
                        </circle>

                        <text
                            class="pointValue"
                            x={getX(index, cleanData.length)}
                            y={getY(item.averagePPG) - 13}
                            text-anchor="middle"
                        >
                            {item.averagePPG}
                        </text>

                        <text
                            class="yearLabel"
                            x={getX(index, cleanData.length)}
                            y={height - 22}
                            text-anchor="middle"
                        >
                            {item.year}
                        </text>
                    </g>
                {/each}
            </svg>
        </div>
    {/if}
</div>
