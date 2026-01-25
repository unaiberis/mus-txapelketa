<script lang="ts">
  export let a: string;
  export let b: string;
  export let hasNext: boolean = false;
</script>

<div class="relative py-2 border border-slate-100 rounded bg-white shadow-sm">
  <div class="px-2 py-1">
    <div class="font-medium text-slate-800 text-sm">{a}</div>
    <div class="text-xs text-slate-500 mt-1">{b}</div>
  </div>

  {#if hasNext}
    <!-- Smaller horizontal connector to next round -->
    <div class="absolute right-[-1rem] top-1/2 transform -translate-y-1/2">
      <div class="w-4 h-0.5 bg-slate-300"></div>
    </div>
  {/if}
</div>
