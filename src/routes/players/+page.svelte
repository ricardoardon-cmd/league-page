<script>
    import { onMount } from 'svelte';
    import Players from '$lib/Players/index.svelte';

    export let data;

    const { playersInfo } = data;

    const positionClasses = ['pos-QB', 'pos-RB', 'pos-WR', 'pos-TE', 'pos-K', 'pos-DEF'];

    const applyPositionColors = () => {
        document.querySelectorAll('.playerCard').forEach((card) => {
            const badge = card.querySelector('.positionBadge');
            const position = badge?.textContent?.trim();

            card.classList.remove(...positionClasses);
            badge?.classList.remove(...positionClasses);

            if (positionClasses.includes(`pos-${position}`)) {
                card.classList.add(`pos-${position}`);
                badge?.classList.add(`pos-${position}`);
            }
        });

        const modal = document.querySelector('.playerModal');
        const modalMeta = modal?.querySelector('.modalMeta');
        const modalPosition = modalMeta?.textContent?.trim().split(/\s|·/)[0];

        if (modal) {
            modal.classList.remove(...positionClasses);
            if (positionClasses.includes(`pos-${modalPosition}`)) {
                modal.classList.add(`pos-${modalPosition}`);
            }
        }
    };

    onMount(() => {
        applyPositionColors();

        const observer = new MutationObserver(() => {
            requestAnimationFrame(applyPositionColors);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => observer.disconnect();
    });
</script>

<div class="playersRoute">
    <Players {playersInfo} />
</div>

<style>
    .playersRoute {
        position: relative;
        z-index: 1;
    }

    :global(.pos-QB) { --pos-color: #ef4444; }
    :global(.pos-RB) { --pos-color: #22c55e; }
    :global(.pos-WR) { --pos-color: #3b82f6; }
    :global(.pos-TE) { --pos-color: #f59e0b; }
    :global(.pos-K) { --pos-color: #a855f7; }
    :global(.pos-DEF) { --pos-color: #64748b; }

    :global(.playerCard.pos-QB),
    :global(.playerCard.pos-RB),
    :global(.playerCard.pos-WR),
    :global(.playerCard.pos-TE),
    :global(.playerCard.pos-K),
    :global(.playerCard.pos-DEF) {
        position: relative;
        overflow: hidden;
        border-left: 4px solid var(--pos-color) !important;
    }

    :global(.playerCard.pos-QB::before),
    :global(.playerCard.pos-RB::before),
    :global(.playerCard.pos-WR::before),
    :global(.playerCard.pos-TE::before),
    :global(.playerCard.pos-K::before),
    :global(.playerCard.pos-DEF::before) {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(90deg, var(--pos-color), transparent 70%);
        opacity: .07;
    }

    :global(.playerCard > *) {
        position: relative;
        z-index: 1;
    }

    :global(.positionBadge.pos-QB),
    :global(.positionBadge.pos-RB),
    :global(.positionBadge.pos-WR),
    :global(.positionBadge.pos-TE),
    :global(.positionBadge.pos-K),
    :global(.positionBadge.pos-DEF) {
        color: var(--pos-color) !important;
        border-color: var(--pos-color) !important;
        background: color-mix(in srgb, var(--pos-color) 8%, transparent) !important;
    }

    :global(.playerModal.pos-QB .modalTop),
    :global(.playerModal.pos-RB .modalTop),
    :global(.playerModal.pos-WR .modalTop),
    :global(.playerModal.pos-TE .modalTop),
    :global(.playerModal.pos-K .modalTop),
    :global(.playerModal.pos-DEF .modalTop) {
        border-top: 4px solid var(--pos-color);
        background:
            linear-gradient(180deg, color-mix(in srgb, var(--pos-color) 10%, transparent), transparent 75%),
            var(--f3f3f3);
    }

    :global(.playerModal.pos-QB .modalMeta),
    :global(.playerModal.pos-RB .modalMeta),
    :global(.playerModal.pos-WR .modalMeta),
    :global(.playerModal.pos-TE .modalMeta),
    :global(.playerModal.pos-K .modalMeta),
    :global(.playerModal.pos-DEF .modalMeta) {
        color: var(--pos-color);
        opacity: 1;
    }
</style>
