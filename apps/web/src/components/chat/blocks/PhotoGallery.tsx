"use client";

import { useEffect, useRef, useState } from "react";
import type { PhotoGalleryBlock } from "@solane/shared";

const CARD = 256;
const GAP = 12;
const SWIPE_THRESHOLD = 55;

export function PhotoGallery({ block }: { block: PhotoGalleryBlock }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, delta: 0 });

  const offsetFor = (i: number) => -(i * (CARD + GAP));

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = "transform .35s cubic-bezier(.22,.9,.35,1)";
    track.style.transform = `translateX(${offsetFor(index)}px)`;
  }, [index]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, startX: e.clientX, delta: 0 };
    const track = trackRef.current;
    if (track) track.style.transition = "none";

    const onMove = (ev: PointerEvent) => {
      if (!drag.current.active) return;
      drag.current.delta = ev.clientX - drag.current.startX;
      if (track) track.style.transform = `translateX(${offsetFor(index) + drag.current.delta}px)`;
    };
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const { delta } = drag.current;
      if (delta < -SWIPE_THRESHOLD && index < block.photos.length - 1) {
        setIndex(index + 1);
      } else if (delta > SWIPE_THRESHOLD && index > 0) {
        setIndex(index - 1);
      } else if (track) {
        track.style.transition = "transform .35s cubic-bezier(.22,.9,.35,1)";
        track.style.transform = `translateX(${offsetFor(index)}px)`;
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="-mx-[22px]">
      <div className="gal-wrap" onPointerDown={onPointerDown}>
        <div className="gal-track" ref={trackRef}>
          {block.photos.map((photo, i) => (
            <figure key={i} className="gal-item m-0">
              <div className="gal-imgbox">
                <div className="gal-img" style={{ backgroundImage: `url(${photo.url})` }} />
                <span className={`gal-tag ${photo.source === "review" ? "mint" : "neonc"}`}>
                  {photo.source === "review" ? "Guest" : "Menu"}
                </span>
              </div>
              {photo.caption && <figcaption className="gal-cap">{photo.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
      <div className="dots">
        {block.photos.map((_, i) => (
          <button key={i} className={`dot ${i === index ? "on" : ""}`} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
