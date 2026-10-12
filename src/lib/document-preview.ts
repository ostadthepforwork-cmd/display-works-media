import type { Previewer } from "pagedjs";

const PAGE_STYLES = `
  @page { size: A4 portrait; margin: var(--doc-header-margin, 58mm) 12mm 15mm;
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
    const header = content.querySelector<HTMLElement>(".doc-head");
    const sourceHeader = source.querySelector<HTMLElement>(".doc-head");
    const reference = source.querySelector(".doc-meta-row span:last-child")?.textContent;
    if (header && reference) {
      const documentNumber = document.createElement("div");
      documentNumber.className = "doc-repeated-reference";
      documentNumber.textContent = reference;
      header.querySelector(".doc-title")?.appendChild(documentNumber);
    }
    const headerMargin = sourceHeader ? Math.ceil(sourceHeader.offsetHeight * 25.4 / 96 + 12) : 18;
    header?.remove();
    // Reserve the page margin for the footer, outside the paginated content.
    const footer = content.querySelector(".doc-footer");
    footer?.remove();
    previewer = new Previewer();
    const pageStyles = PAGE_STYLES.replace("var(--doc-header-margin, 58mm)", `${headerMargin}mm`);
    await previewer.preview(content.outerHTML, [{ [window.location.href]: pageStyles }], target);
    if (!active) return;
    const sheets = target.querySelectorAll(".pagedjs_sheet");
    sheets.forEach((sheet, index) => {
      if (header) {
        const repeatedHeader = document.createElement("div");
        repeatedHeader.className = "doc-repeated-header";
        repeatedHeader.appendChild(header.cloneNode(true));
        sheet.appendChild(repeatedHeader);
      }
      const repeatedFooter = document.createElement("div");
      repeatedFooter.className = "doc-repeated-footer";
      if (footer) repeatedFooter.appendChild(footer.cloneNode(true));
      const pageNumber = document.createElement("span");
      pageNumber.className = "doc-page-number";
      pageNumber.textContent = `${index + 1} / ${sheets.length}`;
      repeatedFooter.appendChild(pageNumber);
      sheet.appendChild(repeatedFooter);
    });
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
