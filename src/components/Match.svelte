<script lang="ts">
  export let a: string;
  export let b: string;
  export let hasNext: boolean = false;
  export let scoreA: number | null = null;
  export let scoreB: number | null = null;

  function initials(name: string) {
    if (!name) return '';
    return name
      .split(' ')
      .map((p) => p[0] || '')
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
</script>

<div
  class="match-row card-board relative flex items-center justify-between gap-4 p-3 rounded-md transition"
  role="listitem"
  aria-label={`Match between ${a} and ${b}`}
  aria-live={scoreA !== null || scoreB !== null ? 'polite' : undefined}
>
  <div class="flex items-start gap-3 min-w-0">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3 min-w-0" aria-label={`Participant ${a}`}>
          <div class="w-8 h-8 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">{initials(a)}</div>
          <div class="min-w-0">
            <div class="font-medium text-slate-800 truncate">{a}</div>
          </div>
        </div>

        <div class="flex items-center gap-3 text-sm text-slate-500" aria-label={`Participant ${b}`}>
          <div class="w-8 h-8 bg-neutral-100 text-neutral-700 rounded-full flex items-center justify-center text-xs flex-shrink-0">{initials(b)}</div>
          <div class="truncate">{b}</div>
        </div>
      </div>
  </div>

  <div class="flex flex-col items-end gap-1 score-column" aria-live="polite">
    <span class="score-pill score-badge bg-neutral-100 text-neutral-700" class:winner={scoreA !== null && scoreB !== null && scoreA > scoreB} class:loser={scoreA !== null && scoreB !== null && scoreA < scoreB} aria-label={`Score ${a}`}>{scoreA ?? '-'}</span>
    <span class="score-pill score-badge bg-neutral-100 text-neutral-700" class:winner={scoreA !== null && scoreB !== null && scoreB > scoreA} class:loser={scoreA !== null && scoreB !== null && scoreB < scoreA} aria-label={`Score ${b}`}>{scoreB ?? '-'}</span>
  </div>

  {#if hasNext}
    <div class="absolute right-[-1.25rem] top-1/2 transform -translate-y-1/2" aria-hidden="true">
      <div class="w-4 h-0.5 bg-border-200"></div>
    </div>
  {/if}
</div>

<style>
  .match-row:focus-visible,
  .participant:focus-visible,
  .score-pill:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: 0.375rem;
  }

  .winner {
    font-weight: 600;
  }

  .loser {
    opacity: 0.6;
  }

  .score-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
  }
</style>
