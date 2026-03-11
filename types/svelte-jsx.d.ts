declare namespace svelte {
  namespace JSX {
    interface HTMLAttributes<T> {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
