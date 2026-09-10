import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
type Photo = { src: string; alt: string; caption: string };
const RenderedBody = memo(function RenderedBody({
  html,
  bodyRef,
  onOpen,
}: {
  html: string;
  bodyRef: RefObject<HTMLDivElement | null>;
  onOpen: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      ref={bodyRef}
      className="post-prose"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={onOpen}
    />
  );
});
export function ArticleMedia({ html, cover }: { html: string; cover?: {src:string; alt:string} }) {
  const body = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLElement | null>(null);
  const swipeStart = useRef<{x:number;y:number} | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]),
    [index, setIndex] = useState(0);
  useEffect(() => {
    const entries = [
      ...(body.current?.querySelectorAll<HTMLImageElement>(
        "img[data-motion-poster]",
      ) || []),
    ].map((img) => {
      const source = img.src,
        poster = img.dataset.motionPoster || source,
        button = document.createElement("button");
      button.type = "button";
      button.className = "post-animation-toggle";
      button.textContent = "Play animation";
      button.setAttribute("aria-pressed", "false");
      img.src = poster;
      button.onclick = () => {
        const playing = button.getAttribute("aria-pressed") === "true";
        img.src = playing ? poster : source;
        button.textContent = playing ? "Play animation" : "Pause animation";
        button.setAttribute("aria-pressed", String(!playing));
      };
      img.after(button);
      return { button, img, source };
    });
    return () =>
      entries.forEach(({ button, img, source }) => {
        button.remove();
        img.src = source;
      });
  }, [html]);
  useEffect(() => {
    const buttons = [...(body.current?.querySelectorAll<HTMLImageElement>("figure.post-image img") || [])]
      .filter((img) => !img.closest("a,button"))
      .map((img) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "post-image-open";
        button.setAttribute("aria-label", `Enlarge image${img.alt ? `: ${img.alt}` : ""}`);
        img.before(button); button.append(img);
        return {button,img};
      });
    return () => buttons.forEach(({button,img}) => { button.before(img); button.remove(); });
  }, [html]);
  const photo = photos[index];
  const isOpen = Boolean(photo);
  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = overflow; };
  }, [isOpen]);
  useEffect(() => {
    if (photo && !dialog.current?.open) dialog.current?.showModal();
  }, [photo]);
  function close() {
    dialog.current?.close();
    setPhotos([]);
    trigger.current?.focus();
  }
  const openImage = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[data-gallery-image]",
    );
    if (!target) {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button.post-image-open");
      const img = button?.querySelector("img");
      if (button && img) {
        trigger.current = button;
        setPhotos([{src:img.currentSrc || img.src, alt:img.alt, caption:button.closest("figure")?.querySelector("figcaption")?.textContent || ""}]);
        setIndex(0);
      }
      return;
    }
    event.preventDefault();
    trigger.current = target;
    const figure = target.closest("figure"),
      links = [
        ...(figure?.querySelectorAll<HTMLAnchorElement>(
          "a[data-gallery-image]",
        ) || []),
      ];
    setPhotos(
      links.map((link) => ({
        src: link.href,
        alt: link.querySelector("img")?.alt || "",
        caption: figure?.querySelector("figcaption")?.textContent || "",
      })),
    );
    setIndex(links.indexOf(target));
  }, []);
  return (
    <>
      {cover && <figure className="post-cover"><button type="button" className="post-image-open" aria-label={`Enlarge cover image: ${cover.alt}`} onClick={(event) => {
        trigger.current = event.currentTarget; setPhotos([{...cover, caption:""}]); setIndex(0);
      }}><img src={cover.src} alt={cover.alt} fetchPriority="high" decoding="async" /></button></figure>}
      <RenderedBody html={html} bodyRef={body} onOpen={openImage} />
      <dialog
        ref={dialog}
        className="post-lightbox"
        aria-label="Image viewer"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onTouchStart={(event) => {const touch=event.touches[0]; swipeStart.current = touch ? {x:touch.clientX,y:touch.clientY} : null;}}
        onTouchEnd={(event) => {
          if (swipeStart.current !== null && photos.length > 1) {
            const distance = (event.changedTouches[0]?.clientX ?? swipeStart.current.x) - swipeStart.current.x;
            const vertical = (event.changedTouches[0]?.clientY ?? swipeStart.current.y) - swipeStart.current.y;
            if (Math.abs(distance) > 60 && Math.abs(distance) > Math.abs(vertical)) setIndex(i => (i + (distance < 0 ? 1 : photos.length - 1)) % photos.length);
          }
          swipeStart.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setIndex((i) => (i + 1) % photos.length);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setIndex((i) => (i + photos.length - 1) % photos.length);
          }
        }}
      >
        {photo && (
          <>
            <div className="post-lightbox-toolbar">
              <p aria-live="polite">
                Image {index + 1} of {photos.length}
              </p>
              <button
                type="button"
                autoFocus
                aria-label="Close image viewer"
                onClick={close}
              >
                <X />
              </button>
            </div>
            <figure>
              <img key={photo.src} src={photo.src} alt={photo.alt} />
              {(photo.caption || photo.alt) && (
                <figcaption>{photo.caption || photo.alt}</figcaption>
              )}
            </figure>
            {photos.length > 1 && (
              <div className="post-lightbox-controls">
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() =>
                    setIndex((i) => (i + photos.length - 1) % photos.length)
                  }
                >
                  <ChevronLeft /> Previous
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => setIndex((i) => (i + 1) % photos.length)}
                >
                  Next <ChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
