declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      [name: string]: any;
    }

    // Provide permissive typings for intrinsic elements and common Astro client directives
    interface IntrinsicElements {
      [elemName: string]: any;
      script: { 'client:load'?: boolean; 'client:idle'?: boolean; 'client:visible'?: boolean; 'client:media'?: string; [k: string]: any };
      slot: any;
      // Add common HTML elements to help the language server
      div: any;
      span: any;
      header: any;
      main: any;
      section: any;
      footer: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      a: any;
      ul: any;
      li: any;
      button: any;
      input: any;
      form: any;
    }
  }
}

export {};
