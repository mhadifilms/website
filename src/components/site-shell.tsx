import { NavLink, Outlet } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"

import { site } from "@/content/generated"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Index" },
  { href: "/work", label: "Work" },
  { href: "/writing", label: "Writing" },
  { href: "/about", label: "About" },
]

export function SiteShell() {
  return (
    <div className="min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(198,124,78,0.22),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(48,79,82,0.22),transparent_28%),linear-gradient(135deg,rgba(255,252,245,1),rgba(238,231,216,1))]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(17,16,13,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(17,16,13,0.14)_1px,transparent_1px)] [background-size:42px_42px]" />

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <NavLink to="/" className="group inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-foreground text-sm font-black text-background">
              MH
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-bold">{site.name}</span>
              <span className="block text-xs text-muted-foreground">{site.role}</span>
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 rounded-full border border-border/80 bg-background/70 p-1 shadow-soft">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground transition sm:px-4",
                    isActive && "bg-foreground text-background shadow-soft",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Built for fast static delivery, CMS edits, and long-term ownership.</p>
        <div className="flex flex-wrap gap-4">
          {site.socials.map((link) => (
            <a
              key={link.href}
              className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-accent"
              href={link.href}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
              <ArrowUpRight className="size-3.5" />
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
