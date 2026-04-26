import { motion, useMotionValue } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { MouseEventHandler, ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { chromeGlassRadiusCard, chromeGlassSurfaceClasses } from '../chromeGlass';

type Position = {
  x: number;
  y: number;
};

type GlassCardProps = {
  children: ReactNode;
  title?: string;
  className?: string;
  position?: Position;
  dragBoundaryRef?: RefObject<HTMLElement | null>;
  /** Called when the user clicks/taps inside the card or starts dragging — use to raise stacking order. */
  onActivate?: () => void;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onDragEnd?: (position: Position) => void;
};

/** Layout/shell only — no backdrop-filter here (avoids Chrome banding when paired with drag + animated height). */
const frameClasses = `pointer-events-auto relative isolate max-w-[calc(100vw-1.5rem)] overflow-hidden ${chromeGlassRadiusCard} text-slate-900 dark:text-slate-100`;

/** Opacity animates on this same layer (not an ancestor) so the frost fades; keep backdrop-filter in CSS so it always composites. */
const glassLayerClasses = `pointer-events-none absolute inset-0 z-0 overflow-hidden ${chromeGlassRadiusCard} ${chromeGlassSurfaceClasses}`;

const innerClasses = 'relative z-10 p-5';

/** Shared with the frosted layer so chrome/text fades with the glass (avoid animating opacity on a parent of backdrop-filter). */
const widgetPresenceFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};

export function GlassCard({
  children,
  title,
  className,
  position = { x: 0, y: 0 },
  dragBoundaryRef,
  onActivate,
  onContextMenu,
  onDragEnd,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const clampToBoundary = useCallback(() => {
    const cardEl = cardRef.current;
    const boundaryEl = dragBoundaryRef?.current;
    if (!cardEl || !boundaryEl) return;

    const boundaryRect = boundaryEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const currentX = x.get();
    const currentY = y.get();

    // Card rect already includes current transform, so derive base (x=0,y=0) box first.
    const baseLeft = cardRect.left - currentX;
    const baseTop = cardRect.top - currentY;
    const baseRight = baseLeft + cardRect.width;
    const baseBottom = baseTop + cardRect.height;

    const minX = boundaryRect.left - baseLeft;
    const maxX = boundaryRect.right - baseRight;
    const minY = boundaryRect.top - baseTop;
    const maxY = boundaryRect.bottom - baseBottom;

    const nextX = Math.min(Math.max(currentX, minX), maxX);
    const nextY = Math.min(Math.max(currentY, minY), maxY);
    if (nextX === currentX && nextY === currentY) return;

    x.set(nextX);
    y.set(nextY);
    onDragEndRef.current?.({ x: nextX, y: nextY });
  }, [dragBoundaryRef, x, y]);

  useEffect(() => {
    x.set(position.x);
    y.set(position.y);
  }, [position.x, position.y, x, y]);

  useEffect(() => {
    clampToBoundary();

    const boundaryEl = dragBoundaryRef?.current;
    const cardEl = cardRef.current;
    if (!boundaryEl || !cardEl) return;

    const handleResize = () => clampToBoundary();
    const ro = new ResizeObserver(handleResize);
    ro.observe(boundaryEl);
    ro.observe(cardEl);
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [clampToBoundary, dragBoundaryRef, position.x, position.y]);

  return (
    <motion.div
      ref={cardRef}
      drag
      dragConstraints={dragBoundaryRef}
      dragElastic={0}
      dragMomentum={false}
      initial={false}
      style={{ x, y }}
      onPointerDownCapture={() => onActivate?.()}
      onDragStart={() => onActivate?.()}
      onContextMenu={onContextMenu}
      onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
        onDragEndRef.current?.({
          x: x.get(),
          y: y.get(),
        });
      }}
      className={`${frameClasses} ${className ?? ''}`}
    >
      <motion.div className={glassLayerClasses} aria-hidden {...widgetPresenceFade} />
      <motion.div className={innerClasses} {...widgetPresenceFade}>
        {title ? <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-700/90 dark:text-slate-200/90">{title}</h2> : null}
        {children}
      </motion.div>
    </motion.div>
  );
}
