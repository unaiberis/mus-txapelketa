declare namespace svelte {
  namespace JSX {
    interface HTMLAttributes<T> {
      [key: string]: unknown;
    }
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

export {};
