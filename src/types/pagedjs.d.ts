declare module "pagedjs" {
  export class Previewer {
    preview(content: string, stylesheets: Array<Record<string, string>>, target: HTMLElement): Promise<{ total: number }>;
    chunker: { destroy(): void };
    polisher: { destroy(): void };
  }
}
