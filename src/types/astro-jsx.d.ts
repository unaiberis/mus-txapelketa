declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      [name: string]: unknown;
    }

    // Provide permissive typings for intrinsic elements and common Astro client directives
    interface IntrinsicElements {
      [elemName: string]: unknown;
      script: { 'client:load'?: boolean; 'client:idle'?: boolean; 'client:visible'?: boolean; 'client:media'?: string; [k: string]: unknown };
      slot: unknown;
      // Add common HTML elements to help the language server
      div: unknown;
      span: unknown;
      header: unknown;
      main: unknown;
      section: unknown;
      footer: unknown;
      h1: unknown;
      h2: unknown;
      h3: unknown;
      p: unknown;
      a: unknown;
      ul: unknown;
      li: unknown;
      button: unknown;
      input: unknown;
      form: unknown;
    }
  }
}

export {};
