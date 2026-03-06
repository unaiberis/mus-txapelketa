<script>
  export let label = 'Action';
  export let href = '#';
  export let variant = 'primary';
</script>

{#if variant === 'primary'}
  <a class="btn btn-primary" href={href} on:click|preventDefault={() => { /* navigation handled by page */ }}>
    {label}
  </a>
{:else}
  <a class="btn btn-ghost" href={href}>{label}</a>
{/if}

<style>
  .btn { text-decoration: none; display:inline-flex; align-items:center; gap:0.5rem; }
  .btn-primary { background: var(--color-hero-accent); color: white; padding: 0.6rem 1rem; border-radius:6px; }
  .btn-ghost { background: transparent; color: color-mix(in srgb, var(--color-ui) 92%, var(--color-primary) 8%); padding:0.5rem 0.9rem; border-radius:6px; border:1px solid rgba(255,255,255,0.06); }
  .btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--color-hero-accent) 75%, white 25%); outline-offset:3px; }
</style>
