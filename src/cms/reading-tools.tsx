import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, Check, Link as LinkIcon } from "lucide-react";

export function ReadingTools({ title }: { title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const article = document.getElementById("article");
    if (!article) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)));
      track.current?.style.setProperty("--reading-progress", String(progress));
      track.current?.setAttribute("data-started", String(rect.top < -180));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule); resize.observe(article);
    window.addEventListener("scroll", schedule, {passive:true});
    window.addEventListener("resize", schedule); update();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
      setMessage("Link copied");
    } catch { setMessage("Copy the address from your browser to share this post."); }
  }
  return <div className="reading-tools" ref={track}>
    <div className="reading-progress" aria-hidden="true" />
    <Link to="/writing" aria-label="Back to writing"><ArrowLeft size={18}/></Link>
    <span className="reading-current" title={title}>{title}</span>
    <button type="button" onClick={copyLink} aria-label="Copy link to this post">
      {message === "Link copied" ? <Check size={16}/> : <LinkIcon size={16}/>}
      <span>{message === "Link copied" ? "Copied" : "Copy link"}</span>
    </button>
    <button type="button" className="reading-top" aria-label="Back to top" onClick={() => {
      window.scrollTo({top:0, behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
      document.querySelector<HTMLElement>(".native-post h1")?.focus({preventScroll:true});
    }}><ArrowUp size={17}/></button>
    <span className="reading-status" role="status">{message}</span>
  </div>;
}
