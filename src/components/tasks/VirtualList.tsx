import React, { useEffect, useRef, useState } from "react";

/* Dependency-free fixed-height virtual list. Only visible rows mount, so it
 * handles 100k+ items. Calls onReachEnd near the bottom for infinite loading. */
interface Props<T> {
  items: T[];
  rowHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onReachEnd?: () => void;
}

export function VirtualList<T>({ items, rowHeight, renderRow, overscan = 8, className, onReachEnd }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.clientHeight || 600);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = items.length;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visible = Math.ceil(height / rowHeight) + overscan * 2;
  const end = Math.min(total, start + visible);
  const slice = items.slice(start, end);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    if (onReachEnd && el.scrollHeight - el.scrollTop - el.clientHeight < rowHeight * 6) onReachEnd();
  };

  return (
    <div ref={ref} className={className} style={{ overflowY: "auto" }} onScroll={onScroll}>
      <div style={{ height: total * rowHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {slice.map((item, i) => (
            <div key={start + i} style={{ height: rowHeight }}>
              {renderRow(item, start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
