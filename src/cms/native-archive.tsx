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
          });
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  if (!result || result.path !== pathname)
    return <div className="cms-loading">Opening article…</div>;
  if (result.post) return <WritingPage />;
  if (result.withdrawn)
    return (
      <main className="cms-empty">
        <h1>This article is no longer published.</h1>
        <Link to="/writing">Browse more writing</Link>
      </main>
    );
  return <LegacyArchive />;
}
