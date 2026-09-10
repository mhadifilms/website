import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const isReading = (path: string) => /^\/(writing(?:\/|$)|archives\/[^/]+\/[^/]+)/.test(path);

// Wait for the destination's actual content, not its lazy-loading placeholder.
export function ReadingNavigation() {
  const location = useLocation(), navigation = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const current = useRef<{key: string; path: string; hash: string; y: number} | null>(null);
  useLayoutEffect(() => {
    const previous = current.current;
    if (previous) positions.current.set(previous.key, previous.y);
    if (positions.current.size > 100) positions.current.delete(positions.current.keys().next().value!);
    const samePage = previous?.path === location.pathname;
    const targetY = navigation === "POP" ? positions.current.get(location.key) ?? 0 : samePage ? previous.y : 0;
    current.current = {key: location.key, path: location.pathname, hash: location.hash, y: targetY};
    if (!isReading(location.pathname)) return;
    const originalRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let finished = false;
    const remember = () => { if (finished && current.current) current.current.y = window.scrollY; };
    const stop = () => {
      finished = true;
      mutation.disconnect(); resize.disconnect(); clearTimeout(deadline);
    };
    const restore = () => {
      if (finished) return;
      const content = document.querySelector<HTMLElement>(`[data-reading-route="${CSS.escape(location.pathname.replace(/\/$/, ""))}"]`);
      if (!content) return;
      let anchor: HTMLElement | null = null;
      if (location.hash) {
        try { anchor = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* malformed fragment */ }
        if (!anchor) return;
      } else if (document.documentElement.scrollHeight - innerHeight < targetY) return;
      if (anchor) anchor.scrollIntoView({behavior:"instant", block:"start"});
      else window.scrollTo({top:targetY, behavior:"instant"});
      const focus = anchor || content.querySelector<HTMLElement>("h1") || content;
      if (!samePage || previous?.hash !== location.hash || navigation === "POP") {
        focus.setAttribute("tabindex", "-1"); focus.focus({preventScroll:true});
      }
      stop(); remember();
    };
    const mutation = new MutationObserver(restore), resize = new ResizeObserver(restore);
    const deadline = window.setTimeout(stop, 8000);
    const interrupt = () => { stop(); remember(); };
    if (!samePage) window.scrollTo({top:0, behavior:"instant"});
    mutation.observe(document.getElementById("root")!, {childList:true, subtree:true});
    resize.observe(document.documentElement);
    window.addEventListener("scroll", remember, {passive:true});
    window.addEventListener("wheel", interrupt, {passive:true, once:true});
    window.addEventListener("touchstart", interrupt, {passive:true, once:true});
    restore();
    return () => {
      stop();
      window.removeEventListener("scroll", remember);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      history.scrollRestoration = originalRestoration;
    };
  }, [location.key, location.pathname, location.hash, navigation]);
  return null;
}
