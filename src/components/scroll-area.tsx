"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type Axis = "x" | "y" | "both";

export function ScrollArea({
  children,
  axis = "both",
  className = "",
  xGutter = "pt-3 pb-1",
  compact = false,
}: {
  children: ReactNode;
  axis?: Axis;
  className?: string;
  xGutter?: string;
  compact?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    sl: 0,
    st: 0,
    sw: 1,
    sh: 1,
    cw: 1,
    ch: 1,
  });

  const measure = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;
    setMetrics({
      sl: node.scrollLeft,
      st: node.scrollTop,
      sw: node.scrollWidth,
      sh: node.scrollHeight,
      cw: node.clientWidth,
      ch: node.clientHeight,
    });
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    node.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const showX = (axis === "x" || axis === "both") && metrics.sw > metrics.cw + 2;
  const showY = (axis === "y" || axis === "both") && metrics.sh > metrics.ch + 2;
  const overflowClass =
    axis === "x"
      ? "overflow-x-auto overflow-y-hidden"
      : axis === "y"
        ? "overflow-y-auto overflow-x-hidden"
        : "overflow-auto";

  return (
    <div className={`flex min-h-0 min-w-0 flex-col ${className}`}>
      <div className="flex min-h-0 min-w-0 flex-1">
        <div
          ref={viewportRef}
          className={`no-native-scrollbar flex min-h-0 min-w-0 flex-1 flex-col ${overflowClass}`}
        >
          {children}
        </div>
        {showY ? (
          <div className={`hidden shrink-0 md:block ${compact ? "py-2 pl-3 pr-1" : "py-2 pl-5 pr-3"}`}>
            <Scrollbar
              orientation="y"
              scroll={metrics.st}
              content={metrics.sh}
              viewport={metrics.ch}
              onScroll={(value) => {
                if (viewportRef.current) viewportRef.current.scrollTop = value;
              }}
            />
          </div>
        ) : null}
      </div>
      {showX ? (
        <div className={`shrink-0 px-4 ${xGutter}`}>
          <Scrollbar
            orientation="x"
            scroll={metrics.sl}
            content={metrics.sw}
            viewport={metrics.cw}
            onScroll={(value) => {
              if (viewportRef.current) viewportRef.current.scrollLeft = value;
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Scrollbar({
  orientation,
  scroll,
  content,
  viewport,
  onScroll,
}: {
  orientation: "x" | "y";
  scroll: number;
  content: number;
  viewport: number;
  onScroll: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; start: number } | null>(null);
  const horizontal = orientation === "x";
  const thumbRatio = Math.min(1, viewport / content);
  const offsetRatio = content <= 0 ? 0 : scroll / content;

  function clientPos(event: PointerEvent | ReactPointerEvent) {
    return horizontal ? event.clientX : event.clientY;
  }

  function scrollFromPointer(client: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const trackSize = horizontal ? rect.width : rect.height;
    const thumbSize = trackSize * thumbRatio;
    const start = horizontal ? rect.left : rect.top;
    const maxThumb = Math.max(1, trackSize - thumbSize);
    const maxScroll = Math.max(0, content - viewport);
    const next = ((client - start - thumbSize / 2) / maxThumb) * maxScroll;
    onScroll(Math.max(0, Math.min(maxScroll, next)));
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const onThumb = (event.target as HTMLElement).dataset.thumb === "true";
    if (onThumb) {
      drag.current = { pointer: clientPos(event), start: scroll };
    } else {
      scrollFromPointer(clientPos(event));
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const trackSize = horizontal ? rect.width : rect.height;
    const thumbSize = trackSize * thumbRatio;
    const maxThumb = Math.max(1, trackSize - thumbSize);
    const maxScroll = Math.max(0, content - viewport);
    const delta = clientPos(event) - drag.current.pointer;
    onScroll(
      Math.max(0, Math.min(maxScroll, drag.current.start + (delta / maxThumb) * maxScroll)),
    );
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={
        horizontal
          ? "relative h-1.5 w-full cursor-pointer rounded-full bg-line"
          : "relative h-full w-1.5 shrink-0 cursor-pointer rounded-full bg-line"
      }
    >
      <div
        data-thumb="true"
        className={
          horizontal
            ? "absolute top-0 h-1.5 rounded-full bg-accent/70 hover:bg-accent"
            : "absolute left-0 w-1.5 rounded-full bg-accent/70 hover:bg-accent"
        }
        style={
          horizontal
            ? { width: `${thumbRatio * 100}%`, left: `${offsetRatio * 100}%` }
            : { height: `${thumbRatio * 100}%`, top: `${offsetRatio * 100}%` }
        }
      />
    </div>
  );
}
