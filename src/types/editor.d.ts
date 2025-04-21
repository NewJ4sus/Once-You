declare module '@editorjs/link' {
  export default class Link {
    constructor(config: any);
  }
}

declare module '@editorjs/marker' {
  export default class Marker {
    constructor(config: any);
  }
}

declare module '@editorjs/checklist' {
  export default class Checklist {
    constructor(config: any);
  }
}

declare module '@editorjs/embed' {
  export default class Embed {
    constructor(config: any);
  }
}

export interface EditorBlock {
  id: string;
  type: string;
  data: {
    text?: string;
    level?: number;
    items?: string[];
    content?: string[][];
    caption?: string;
    url?: string;
    service?: string;
    embed?: string;
    html?: string;
    [key: string]: any;
  };
}

export interface EditorContent {
  time: number;
  blocks: EditorBlock[];
  version: string;
}

export interface EditorConfig {
  holder: string | HTMLElement;
  tools: {
    [key: string]: {
      class: any;
      inlineToolbar?: boolean;
      config?: {
        [key: string]: any;
      };
    };
  };
  data?: EditorContent;
  placeholder?: string;
  onReady?: () => void;
}

export interface EditorInstance {
  isReady: Promise<void>;
  save: () => Promise<EditorContent>;
  destroy: () => Promise<void>;
  render: (data: EditorContent) => Promise<void>;
} 