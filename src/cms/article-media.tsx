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
export function ArticleMedia({ html }: { html: string }) {
  const body = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLElement | null>(null);
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
  const photo = photos[index];
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
    if (!target) return;
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
              <img src={photo.src} alt={photo.alt} />
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
