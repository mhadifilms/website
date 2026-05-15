import { Link } from "react-router-dom"

import { PageTransition } from "@/components/page-transition"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <PageTransition>
      <div className="grid min-h-[55svh] place-items-center text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">404</p>
          <h1 className="mt-5 font-display text-6xl font-semibold tracking-[-0.05em]">
            Page drifted off frame.
          </h1>
          <Button asChild className="mt-8">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
