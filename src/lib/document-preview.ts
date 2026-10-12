import type { Previewer } from "pagedjs";

const PAGE_STYLES = `
  @page { size: A4 portrait; margin: 18mm 12mm 15mm;
    @bottom-center { content: counter(page) " / " counter(pages); font: 8pt Arial; color: #64748b; }
  }
  .doc-paged-document { font-family: Sarabun, Prompt, Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
  .doc-paged-document .doc-main { display: block; }
  .doc-paged-document tr, .doc-paged-document .doc-bottom, .doc-paged-document .doc-signatures { break-inside: avoid; }
  .doc-paged-document thead { display: table-header-group; }
`;

// Only clone the already sanitized customer document, never admin state.
export function prepareDocumentPreview(source: HTMLElement) {
  const shell = source.parentElement!;
  const target = document.createElement("div");
  target.className = "doc-paged-preview";
  target.setAttribute("aria-label", "A4 document pages");
  shell.appendChild(target);
  let active = true;
  let previewer: Previewer | undefined;
  const dispose = () => {
    // Pagination can fail before Paged.js creates its page/style elements.
    try { previewer?.chunker.destroy(); } catch {}
    try { previewer?.polisher.destroy(); } catch {}
  };
  const ready = (async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(source.querySelectorAll("img")).map(img => img.decode().catch(() => {})));
    if (!active) return;
    const paged = await import("pagedjs");
    const Previewer = paged.Previewer || (window as Window & { Paged?: typeof paged }).Paged?.Previewer;
    if (!Previewer) throw new Error("Paged.js browser engine unavailable");
    if (!active) return;
    const content = source.cloneNode(true) as HTMLElement;
    content.className = "doc-paged-document";
    previewer = new Previewer();
    await previewer.preview(content.outerHTML, [{ [window.location.href]: PAGE_STYLES }], target);
    if (!active) return;
    source.classList.add("doc-preview-source");
    document.documentElement.dataset.docPaginated = "true";
    target.dataset.ready = "true";
  })().catch(error => {
    console.error("Document pagination failed", error);
    target.remove();
    dispose();
    throw error;
  });

  return {
    ready,
    destroy() {
      active = false;
      source.classList.remove("doc-preview-source");
      delete document.documentElement.dataset.docPaginated;
      target.remove();
      dispose();
    },
  };
}
