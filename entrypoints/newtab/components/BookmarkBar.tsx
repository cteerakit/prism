import { motion } from 'framer-motion';
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { browser as wxtBrowser } from 'wxt/browser';
import type { Browser } from 'wxt/browser';

import { chromeGlassRadiusBar, chromeGlassSurfaceClasses, liquidGlassRadiusControl } from '../chromeGlass';

type BookmarkNode = Browser.bookmarks.BookmarkTreeNode;
type BookmarksApi = NonNullable<typeof wxtBrowser.bookmarks>;

export type BookmarkBarTheme = {
  accentText: string;
  accentSoftBg: string;
  accentSoftBorder: string;
};

/** Top strip: slide only on the shell — frosted layer + chrome fade separately (same pattern as `GlassCard`). */
const bookmarkBarMotionVariants = {
  initial: { y: -14, transition: { duration: 0.16, ease: 'easeOut' as const } },
  animate: { y: 0, transition: { duration: 0.16, ease: 'easeOut' as const } },
  exit: { y: -12, transition: { duration: 0.16, ease: 'easeOut' as const } },
};

const bookmarkBarPresenceFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};

function getBookmarksApi(): BookmarksApi | null {
  // Prefer extension API handles that work in extension pages.
  if (wxtBrowser?.bookmarks) return wxtBrowser.bookmarks as unknown as BookmarksApi;
  if (typeof browser !== 'undefined' && browser?.bookmarks) return browser.bookmarks as unknown as BookmarksApi;
  const chromeApi = (globalThis as typeof globalThis & { chrome?: { bookmarks?: unknown } }).chrome?.bookmarks;
  if (chromeApi) return chromeApi as BookmarksApi;
  const runtime = globalThis as typeof globalThis & {
    browser?: { bookmarks?: BookmarksApi };
    chrome?: { bookmarks?: BookmarksApi };
  };
  return runtime.browser?.bookmarks ?? runtime.chrome?.bookmarks ?? null;
}

function bookmarkBarFolderId(api: BookmarksApi): string {
  const idAwareApi = api as BookmarksApi & { BOOKMARK_BAR_FOLDER_ID?: string };
  // Chrome keeps this folder id stable, but we still read from the API when available.
  // Fallback keeps the bar usable on implementations that omit this constant.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return typeof idAwareApi.BOOKMARK_BAR_FOLDER_ID === 'string' ? idAwareApi.BOOKMARK_BAR_FOLDER_ID : '1';
}

async function loadBookmarkBarTopLevel(api: BookmarksApi): Promise<BookmarkNode[]> {
  const id = bookmarkBarFolderId(api);
  const tree = await api.getSubTree(id);
  return tree[0]?.children ?? [];
}

function safePageUrl(href: string): URL | null {
  try {
    const u = new URL(href);
    if (u.protocol === 'javascript:' || u.protocol === 'data:' || u.protocol === 'file:') return null;
    return u;
  } catch {
    return null;
  }
}

/** URL key Chrome’s favicon service expects (fragment-free document URL). */
function pageUrlForFavicon(href: string): string | null {
  const u = safePageUrl(href);
  if (!u) return null;
  u.hash = '';
  return u.href;
}

/**
 * Same pipeline as Chrome UI: MV3 `/_favicon/` reads from the browser favicon database.
 * Official samples use `size=32` for toolbar UI (then scale down); `16` is a fallback.
 * @see https://developer.chrome.com/docs/extensions/how-to/ui/favicons
 */
function extensionFaviconUrl(href: string, size: 16 | 32): string | null {
  const pageUrl = pageUrlForFavicon(href);
  if (!pageUrl) return null;
  try {
    const getUrl = wxtBrowser.runtime.getURL as (path: string) => string;
    const u = new URL(getUrl('/_favicon/'));
    u.searchParams.set('pageUrl', pageUrl);
    u.searchParams.set('size', String(size));
    return u.toString();
  } catch {
    return null;
  }
}

function googleDomainFaviconUrl(href: string): string | null {
  const u = safePageUrl(href);
  if (!u?.hostname) return null;
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(u.hostname)}`;
}

type FaviconStage = 0 | 1 | 2 | 3;

function BookmarkFavicon({ href }: { href: string }) {
  const ext32 = extensionFaviconUrl(href, 32);
  const ext16 = extensionFaviconUrl(href, 16);
  const googleSrc = googleDomainFaviconUrl(href);

  const initialStage = (): FaviconStage => {
    if (ext32) return 0;
    if (ext16) return 1;
    if (googleSrc) return 2;
    return 3;
  };

  const [stage, setStage] = useState<FaviconStage>(initialStage);

  useEffect(() => {
    setStage(initialStage());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derive from href
  }, [href, ext32, ext16, googleSrc]);

  const src = stage === 0 ? ext32 : stage === 1 ? ext16 : stage === 2 ? googleSrc : null;

  if (stage === 3 || !src) {
    return <Bookmark className="size-4 shrink-0 text-slate-200/90" aria-hidden />;
  }

  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      draggable={false}
      className="size-4 shrink-0 object-contain [image-rendering:-webkit-optimize-contrast]"
      loading="lazy"
      decoding="async"
      onError={() => {
        setStage((s) => {
          if (s === 0) return ext16 ? 1 : googleSrc ? 2 : 3;
          if (s === 1) return googleSrc ? 2 : 3;
          return 3;
        });
      }}
    />
  );
}

function Separator({ vertical }: { vertical?: boolean }) {
  return (
    <span
      className={
        vertical
          ? 'mx-1 inline-block h-4 w-px shrink-0 bg-white/25 shadow-[1px_0_0_rgba(0,0,0,0.18)]'
          : 'my-1 block h-px bg-white/20 shadow-[0_1px_0_rgba(0,0,0,0.18)]'
      }
      aria-hidden
    />
  );
}

function BookmarkLink({
  node,
  className,
  style,
  inMenu,
}: {
  node: BookmarkNode;
  className?: string;
  style?: CSSProperties;
  inMenu?: boolean;
}) {
  const url = node.url ?? '';
  const name = node.title?.trim() ?? '';
  const showLabel = name.length > 0;

  return (
    <a
      href={url}
      className={`${inMenu ? 'inline-flex items-center gap-2' : 'inline-flex max-w-[12rem] items-center'} ${showLabel ? 'gap-1.5' : 'gap-0'} ${className ?? ''}`}
      style={style}
      title={url || undefined}
      aria-label={showLabel ? undefined : url || 'Bookmark'}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <BookmarkFavicon href={url} />
      {showLabel ? (
        <span className="min-w-0 truncate">{name}</span>
      ) : null}
    </a>
  );
}

function BookmarkFolder({
  node,
  depth,
  theme,
  inMenu,
}: {
  node: BookmarkNode;
  depth: number;
  theme: BookmarkBarTheme;
  inMenu?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPopoverStyle({});
      return;
    }

    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = 6;
      const maxH = Math.min(window.innerHeight * 0.85, 560);
      // Bar-level folder: at least as wide as the chip. Nested folders: width comes from content
      // (`width: max-content` on the panel), not from the trigger (folder rows are `w-full` in the parent).
      const minWBar = Math.max(176, rect.width);
      let top: number;
      let left: number;

      if (!inMenu) {
        top = rect.bottom + pad;
        left = rect.left;
        if (top + maxH > window.innerHeight - 8) {
          top = Math.max(8, rect.top - maxH - pad);
        }
      } else {
        top = rect.top;
        left = rect.right + pad;
        const guessW = 240;
        if (left + guessW > window.innerWidth - 8) {
          left = Math.max(8, rect.left - guessW - pad);
        }
        if (top + maxH > window.innerHeight - 8) {
          top = Math.max(8, window.innerHeight - maxH - 8);
        }
      }

      const clampW = inMenu ? 280 : minWBar;
      left = Math.max(8, Math.min(left, window.innerWidth - clampW - 8));

      setPopoverStyle({
        position: 'fixed',
        top,
        left,
        ...(inMenu ? { width: 'fit-content' } : { minWidth: minWBar }),
        maxHeight: maxH,
        zIndex: 60 + depth,
      });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, inMenu, depth]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const t = event.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const title = node.title?.trim() || 'Folder';

  const buttonClass =
    (inMenu
      ? 'flex w-full max-w-none items-center justify-between gap-2 '
      : 'inline-flex max-w-[12rem] shrink-0 items-center ') +
    'gap-0.5 truncate rounded-md px-2 py-1 text-left text-sm text-slate-100/90 transition hover:bg-white/15';

  const menuPanel =
    open && node.children?.length ? (
      <div
        ref={popoverRef}
        data-bookmark-folder-popover=""
        className={`${liquidGlassRadiusControl} ${chromeGlassSurfaceClasses} hide-scrollbar overflow-y-auto box-border`}
        style={{
          ...popoverStyle,
          boxSizing: 'border-box',
        }}
      >
        {/* Grid column width = widest row; avoids `w-full` rows stretching fixed popovers to the viewport. */}
        <div
          className={`grid grid-cols-1 gap-px py-1 min-w-[11rem] max-w-[min(100vw-1rem,42rem)] ${
            inMenu ? 'w-max justify-items-stretch' : 'w-full'
          }`}
        >
          {node.children.map((child) => (
            <BookmarkBarItem key={child.id} node={child} depth={depth + 1} theme={theme} inMenu={true} />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className={`${depth === 0 && !inMenu ? 'shrink-0' : inMenu ? 'w-full' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={buttonClass}
        style={{ color: theme.accentText }}
        title={title}
        aria-expanded={open}
      >
        <span className="truncate">{title}</span>
        <ChevronDown className={`size-3.5 shrink-0 opacity-75 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}

function isBookmarkSeparator(node: BookmarkNode): boolean {
  return (node as BookmarkNode & { type?: string }).type === 'separator';
}

function BookmarkBarItem({
  node,
  depth,
  theme,
  inMenu,
}: {
  node: BookmarkNode;
  depth: number;
  theme: BookmarkBarTheme;
  inMenu?: boolean;
}) {
  if (isBookmarkSeparator(node)) {
    return inMenu ? <Separator /> : <Separator vertical />;
  }

  const hasChildren = Boolean(node.children && node.children.length > 0);
  if (!node.url && hasChildren) {
    return <BookmarkFolder node={node} depth={depth} theme={theme} inMenu={inMenu} />;
  }

  if (node.url) {
    const base =
      'truncate rounded-md px-2 py-1 text-sm text-slate-100/90 transition hover:bg-white/15';
    if (inMenu) {
      return (
        <BookmarkLink
          node={node}
          inMenu
          className={`block text-left ${base}`}
          style={{ color: theme.accentText }}
        />
      );
    }
    return (
      <BookmarkLink
        node={node}
        className={`shrink-0 ${base}`}
        style={{
          color: theme.accentText,
          borderColor: theme.accentSoftBorder,
        }}
      />
    );
  }

  return null;
}

export function BookmarkBar({ theme }: { theme: BookmarkBarTheme }) {
  const [nodes, setNodes] = useState<BookmarkNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [isGrabDragging, setIsGrabDragging] = useState(false);

  const grabPointerId = useRef<number | undefined>(undefined);
  const grabStartX = useRef(0);
  const grabStartScrollLeft = useRef(0);
  const grabDragActive = useRef(false);
  const suppressNextClick = useRef(false);

  const updateScrollOverflow = useCallback(() => {
    const el = scrollRowRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setHasHorizontalOverflow(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const endGap = 2;
    setCanScrollLeft(scrollLeft > endGap);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - endGap);
    setHasHorizontalOverflow(scrollWidth > clientWidth + endGap);
  }, []);

  const onScrollRowPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element | null;
    // Do not start horizontal grab-scrolling from interactive controls.
    // Otherwise folder buttons/links can lose their click after slight pointer movement.
    if (target?.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    const el = scrollRowRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    grabPointerId.current = e.pointerId;
    grabStartX.current = e.clientX;
    grabStartScrollLeft.current = el.scrollLeft;
    grabDragActive.current = false;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onScrollRowPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (grabPointerId.current !== e.pointerId) return;
    const el = scrollRowRef.current;
    if (!el) return;
    const dx = e.clientX - grabStartX.current;
    if (!grabDragActive.current) {
      if (Math.abs(dx) < 6) return;
      grabDragActive.current = true;
      setIsGrabDragging(true);
    }
    el.scrollLeft = grabStartScrollLeft.current - dx;
    e.preventDefault();
  }, []);

  const endScrollRowGrab = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (grabPointerId.current !== e.pointerId) return;
    const el = scrollRowRef.current;
    const didDrag = grabDragActive.current;
    grabPointerId.current = undefined;
    grabDragActive.current = false;
    setIsGrabDragging(false);
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (didDrag) {
      suppressNextClick.current = true;
    }
  }, []);

  const onScrollRowClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressNextClick.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressNextClick.current = false;
  }, []);

  const scrollFadeMask = useMemo((): CSSProperties | undefined => {
    if (!canScrollLeft && !canScrollRight) return undefined;
    const w = '2.75rem';
    let gradient: string;
    if (canScrollLeft && canScrollRight) {
      gradient = `linear-gradient(to right, transparent 0%, black ${w}, black calc(100% - ${w}), transparent 100%)`;
    } else if (canScrollLeft) {
      gradient = `linear-gradient(to right, transparent 0%, black ${w})`;
    } else {
      gradient = `linear-gradient(to right, black calc(100% - ${w}), transparent 100%)`;
    }
    return {
      WebkitMaskImage: gradient,
      maskImage: gradient,
    };
  }, [canScrollLeft, canScrollRight]);

  const refresh = useCallback(() => {
    const api = getBookmarksApi();
    if (!api) {
      setError('Bookmarks API is unavailable in this context');
      setNodes([]);
      return;
    }
    void loadBookmarkBarTopLevel(api)
      .then((list) => {
        setNodes(list);
        setError(null);
      })
      .catch(() => {
        setError('Could not load bookmarks');
        setNodes([]);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    const api = getBookmarksApi();
    if (!api) return;
    api.onCreated.addListener(onChange);
    api.onRemoved.addListener(onChange);
    api.onChanged.addListener(onChange);
    api.onMoved.addListener(onChange);
    return () => {
      api.onCreated.removeListener(onChange);
      api.onRemoved.removeListener(onChange);
      api.onChanged.removeListener(onChange);
      api.onMoved.removeListener(onChange);
    };
  }, [refresh]);

  useLayoutEffect(() => {
    updateScrollOverflow();
    const el = scrollRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollOverflow());
    ro.observe(el);
    window.addEventListener('resize', updateScrollOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScrollOverflow);
    };
  }, [updateScrollOverflow, nodes, error]);

  return (
    <motion.header
      variants={bookmarkBarMotionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`pointer-events-auto fixed left-2 right-2 top-2 z-40 isolate overflow-hidden ${chromeGlassRadiusBar} px-3 py-1.5`}
    >
      <motion.div
        className={`pointer-events-none absolute inset-0 z-0 ${chromeGlassRadiusBar} ${chromeGlassSurfaceClasses}`}
        aria-hidden
        {...bookmarkBarPresenceFade}
      />
      <motion.div className="relative z-10 min-h-8" {...bookmarkBarPresenceFade}>
      <div className="relative min-h-8">
        <div
          ref={scrollRowRef}
          onScroll={updateScrollOverflow}
          onPointerDownCapture={onScrollRowPointerDown}
          onPointerMove={onScrollRowPointerMove}
          onPointerUp={endScrollRowGrab}
          onPointerCancel={endScrollRowGrab}
          onLostPointerCapture={endScrollRowGrab}
          onDragStartCapture={(e) => {
            if (hasHorizontalOverflow) e.preventDefault();
          }}
          onClickCapture={onScrollRowClickCapture}
          style={scrollFadeMask}
          className={`hide-scrollbar flex min-h-8 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden ${
            hasHorizontalOverflow
              ? `${isGrabDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`
              : ''
          }`}
        >
          {error ? (
            <p className="px-2 text-xs text-amber-200/90">{error}</p>
          ) : nodes.length === 0 ? (
            <p className="px-2 text-xs text-slate-300/80">No bookmarks in your bookmarks bar yet.</p>
          ) : (
            nodes.map((node) => <BookmarkBarItem key={node.id} node={node} depth={0} theme={theme} />)
          )}
        </div>
        {canScrollLeft ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-start pl-1"
            aria-hidden
          >
            <ChevronLeft className="size-4 shrink-0 text-slate-100/90 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
          </div>
        ) : null}
        {canScrollRight ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end pr-1"
            aria-hidden
          >
            <ChevronRight className="size-4 shrink-0 text-slate-100/90 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
          </div>
        ) : null}
      </div>
      </motion.div>
    </motion.header>
  );
}
