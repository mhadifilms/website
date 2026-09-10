import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LegacyArchive from "@/pages/archive-entry";
import { api, ApiError } from "./api";
import type { PublicPost } from "./types";
import WritingPage from "./public";
export default function NativeArchive() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const [result, setResult] = useState<{
    path: string;
    post?: PublicPost;
    withdrawn?: boolean;
    unavailable?: boolean;
  } | null>(null);
  useEffect(() => {
    let active = true;
    api<PublicPost>(`/public/post?path=${encodeURIComponent(pathname)}`)
      .then((post) => {
        if (active) setResult({ path: pathname, post });
      })
      .catch((error) => {
        if (active)
          setResult({
            path: pathname,
            withdrawn: error instanceof ApiError && error.status === 410,
            unavailable: !(error instanceof ApiError) || ![404,410].includes(error.status),
          });
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  if (!result || result.path !== pathname)
    return <div className="cms-loading">Opening article…</div>;
  if (result.unavailable) return <main id="content" data-reading-route={pathname} className="native-writing-page cms-empty"><h1>Writing is temporarily unavailable.</h1><p>Please try again in a moment.</p><button type="button" className="cms-button" onClick={() => window.location.reload()}>Try again</button></main>;
  if (result.post) return <WritingPage />;
  if (result.withdrawn)
    return (
      <main id="content" data-reading-route={pathname} className="cms-empty">
        <h1>This article is no longer published.</h1>
        <Link to="/writing">Browse more writing</Link>
      </main>
    );
  return <LegacyArchive />;
}
