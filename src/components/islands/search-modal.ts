/* global HTMLElement, setTimeout, clearTimeout, console, document, window, HTMLDialogElement, HTMLInputElement, HTMLButtonElement, requestAnimationFrame */
import { escapeHtml, formatBreadcrumb, sanitizeSearchExcerpt } from '../../utils/browser-strings';

interface SearchModalConfig {
  i18n: Record<string, string>;
  pagefindScript: string;
}

interface PagefindSearchData {
  url: string;
  excerpt?: string;
  meta?: { title?: string };
}

interface PagefindResult {
  data: () => Promise<PagefindSearchData>;
}

interface PagefindModule {
  init?: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  search: (term: string) => Promise<{ results: PagefindResult[] } | null>;
}

let pagefindModule: PagefindModule | null = null;
let loadPromise: Promise<PagefindModule> | null = null;
let pagefindScript = '';
let i18n: Record<string, string> = {};
let searchToken = 0;
let highlightIdx = -1;
let resultLinks: HTMLElement[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let modalConfigKey = '';

function loadPagefind() {
  if (pagefindModule) return Promise.resolve(pagefindModule);
  if (loadPromise) return loadPromise;
  loadPromise = import(/* @vite-ignore */ pagefindScript)
    .then(async (mod) => {
      if (typeof mod.init === 'function') await mod.init();
      pagefindModule = mod;
      return mod;
    })
    .catch((err) => {
      console.error('Failed to load Pagefind', err);
      loadPromise = null;
      throw err;
    });
  return loadPromise;
}

function searchIcon(extraPath = '') {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>${extraPath}</svg>`;
}

function idleHtml() {
  return `<div class="px-5 py-12 text-center">
    <div class="bg-base-200 text-base-content mx-auto flex h-10 w-10 items-center justify-center rounded-none" aria-hidden="true">
      ${searchIcon()}
    </div>
    <p class="text-base-content mt-3 text-sm">${escapeHtml(i18n.typeToStart)}</p>
  </div>`;
}

function createDialog() {
  const dialog = document.createElement('dialog');
  dialog.dataset.searchModal = '';
  dialog.dataset.searchConfigKey = modalConfigKey;
  dialog.className = 'modal sm:modal-middle';
  dialog.setAttribute('aria-label', i18n.title || 'Search');
  dialog.innerHTML = `
    <div class="modal-box bg-base-100 border-base-300 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden border p-0 shadow-2xl sm:rounded-none">
      <div class="border-base-300 flex items-center gap-3 border-b px-4 py-3 sm:px-5 sm:py-3.5">
        <span class="text-base-content shrink-0" aria-hidden="true">${searchIcon()}</span>
        <input
          type="search"
          data-search-input
          class="text-base-content placeholder:text-base-content min-w-0 flex-1 border-0 bg-transparent text-base font-medium outline-none focus:ring-0"
          placeholder="${escapeHtml(i18n.placeholder)}"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="${escapeHtml(i18n.placeholder)}"
        />
        <button
          type="button"
          data-search-clear
          class="text-base-content hover:bg-base-200 hover:text-base-content hidden h-7 items-center rounded-none px-2 text-xs font-medium transition"
          aria-label="${escapeHtml(i18n.clearLabel)}"
        >
          ${escapeHtml(i18n.clearLabel)}
        </button>
        <form method="dialog" class="shrink-0">
          <button
            class="text-base-content hover:bg-base-200 hover:text-base-content inline-flex h-7 w-7 items-center justify-center rounded-none transition"
            aria-label="${escapeHtml(i18n.closeLabel)}"
            title="${escapeHtml(i18n.closeLabel)}"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </form>
      </div>

      <div data-search-results class="min-h-0 flex-1 overflow-y-auto">${idleHtml()}</div>

      <div class="border-base-300 bg-base-200/60 text-base-content flex items-center justify-between gap-3 border-t px-4 py-2 text-[0.7rem] sm:px-5">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5">
            <kbd class="kbd kbd-xs">&uarr;</kbd><kbd class="kbd kbd-xs">&darr;</kbd>
            <span>${escapeHtml(i18n.hintNavigate)}</span>
          </span>
          <span class="hidden items-center gap-1.5 sm:inline-flex">
            <kbd class="kbd kbd-xs">&#x21b5;</kbd>
            <span>${escapeHtml(i18n.hintSelect)}</span>
          </span>
        </div>
        <span class="inline-flex items-center gap-1.5">
          <kbd class="kbd kbd-xs">Esc</kbd>
          <span class="hidden sm:inline">${escapeHtml(i18n.closeLabel)}</span>
        </span>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>`;
  document.body.append(dialog);
  bindDialog(dialog);
  return dialog;
}

function renderState(container: HTMLElement, html: string) {
  container.innerHTML = html;
  resultLinks = Array.from(container.querySelectorAll<HTMLElement>('[data-search-result-link]'));
  highlightIdx = resultLinks.length > 0 ? 0 : -1;
  updateHighlight();
}

function renderIdle(container: HTMLElement) {
  renderState(container, idleHtml());
}

function renderSearching(container: HTMLElement) {
  renderState(
    container,
    `<div class="px-5 py-12 text-center">
      <p class="text-base-content inline-flex items-center gap-2 text-sm">
        <span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
        ${escapeHtml(i18n.searching)}
      </p>
    </div>`,
  );
}

function renderNoResults(container: HTMLElement, term: string) {
  renderState(
    container,
    `<div class="px-5 py-12 text-center">
      <div class="bg-base-200 text-base-content mx-auto flex h-10 w-10 items-center justify-center rounded-none" aria-hidden="true">
        ${searchIcon('<path d="M8 11h6"/>')}
      </div>
      <p class="text-base-content mt-3 text-sm">
        ${escapeHtml(i18n.noResultsFor)}
        <span class="text-base-content font-semibold">"${escapeHtml(term)}"</span>
      </p>
    </div>`,
  );
}

function renderResults(container: HTMLElement, results: PagefindSearchData[]) {
  const count = results.length;
  const label = count === 1 ? i18n.resultsCountOne : i18n.resultsCount;
  const items = results
    .map((r, idx) => {
      const title = escapeHtml(r.meta?.title || r.url);
      const crumb = escapeHtml(formatBreadcrumb(r.url, window.location.origin));
      const excerpt = sanitizeSearchExcerpt(r.excerpt || '');
      return `<li>
        <a
          data-search-result-link
          data-idx="${idx}"
          href="${escapeHtml(r.url)}"
          class="search-result group block px-4 py-3 sm:px-5"
        >
          <div class="text-base-content group-hover:text-primary flex items-center gap-1.5 text-[0.7rem] tracking-wide uppercase">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            <span class="truncate">${crumb}</span>
          </div>
          <h3 class="text-base-content group-hover:text-primary mt-0.5 text-[0.95rem] leading-snug font-semibold">${title}</h3>
          <p class="text-base-content mt-1 line-clamp-2 text-[0.825rem] leading-snug">${excerpt}</p>
        </a>
      </li>`;
    })
    .join('');

  renderState(
    container,
    `<div>
      <div class="text-base-content border-base-300 border-b px-4 py-2 text-[0.7rem] tracking-wide uppercase sm:px-5">
        ${count} ${escapeHtml(label)}
      </div>
      <ul class="divide-base-300 divide-y" role="listbox">${items}</ul>
    </div>`,
  );
}

function updateHighlight() {
  resultLinks.forEach((link, idx) => {
    if (idx === highlightIdx) {
      link.setAttribute('data-active', 'true');
      link.setAttribute('aria-selected', 'true');
      link.scrollIntoView({ block: 'nearest' });
    } else {
      link.removeAttribute('data-active');
      link.setAttribute('aria-selected', 'false');
    }
  });
}

function moveHighlight(delta: number) {
  if (resultLinks.length === 0) return;
  highlightIdx = (highlightIdx + delta + resultLinks.length) % resultLinks.length;
  updateHighlight();
}

function activateHighlight() {
  if (highlightIdx < 0 || !resultLinks[highlightIdx]) return false;
  resultLinks[highlightIdx].click();
  return true;
}

function bindDialog(dialog: HTMLDialogElement) {
  if (dialog.dataset.searchBound === 'true') return;
  dialog.dataset.searchBound = 'true';

  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]');
  const clearBtn = dialog.querySelector<HTMLButtonElement>('[data-search-clear]');
  const results = dialog.querySelector<HTMLElement>('[data-search-results]');
  if (!input || !clearBtn || !results) return;

  function reset() {
    input!.value = '';
    clearBtn!.classList.add('hidden');
    clearBtn!.classList.remove('inline-flex');
    renderIdle(results!);
    searchToken++;
  }

  async function runSearch(term: string) {
    const myToken = ++searchToken;
    try {
      const pf = await loadPagefind();
      if (myToken !== searchToken) return;
      renderSearching(results!);
      const search = await pf.search(term);
      if (myToken !== searchToken) return;
      if (!search || !search.results || search.results.length === 0) {
        renderNoResults(results!, term);
        return;
      }
      const top = search.results.slice(0, 12);
      const data = await Promise.all(top.map((result) => result.data()));
      if (myToken !== searchToken) return;
      renderResults(results!, data);
    } catch (err) {
      console.error(err);
      renderState(
        results!,
        `<p class="text-error px-5 py-6 text-sm">Search index not available. Run <code class="bg-base-200 rounded-none px-1">bun run build</code>.</p>`,
      );
    }
  }

  function onInput() {
    const term = input!.value.trim();
    if (term) {
      clearBtn!.classList.remove('hidden');
      clearBtn!.classList.add('inline-flex');
    } else {
      clearBtn!.classList.add('hidden');
      clearBtn!.classList.remove('inline-flex');
    }
    clearTimeout(debounceTimer);
    if (!term) {
      searchToken++;
      renderIdle(results!);
      return;
    }
    debounceTimer = setTimeout(() => runSearch(term), 140);
  }

  input.addEventListener('input', onInput);

  clearBtn.addEventListener('click', () => {
    reset();
    input!.focus();
  });

  dialog.addEventListener('close', reset);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === 'Enter' && activateHighlight()) {
      event.preventDefault();
    }
  });
}

function getDialog() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-search-modal]');
  if (!dialog) return createDialog();
  if (dialog.dataset.searchConfigKey !== modalConfigKey) {
    dialog.remove();
    return createDialog();
  }
  return dialog;
}

export function openSearchModal(config: SearchModalConfig) {
  if (pagefindScript && pagefindScript !== config.pagefindScript) {
    pagefindModule = null;
    loadPromise = null;
  }
  i18n = config.i18n;
  pagefindScript = config.pagefindScript;
  modalConfigKey = JSON.stringify(config);

  const dialog = getDialog();
  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]');
  if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  else dialog.setAttribute('open', '');

  loadPagefind().catch(() => {});
  requestAnimationFrame(() => input?.focus());
}
