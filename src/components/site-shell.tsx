import { Outlet } from "react-router-dom"

export function SiteShell() {
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:shadow-pill focus:outline-none"
      >
        Skip to content
      </a>
      <Outlet />
    </div>
  )
}
