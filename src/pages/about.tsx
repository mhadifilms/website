import { Mail } from "lucide-react"

import { PageTransition } from "@/components/page-transition"
import { Prose } from "@/components/prose"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { pages, site } from "@/content/generated"

export default function AboutPage() {
  const about = pages.find((page) => page.slug === "about")

  return (
    <PageTransition>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Badge>About</Badge>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-7xl">
            A durable home for the work between projects.
          </h1>
        </div>
        <Card>
          <CardContent className="p-8">
            {about ? (
              <Prose html={about.html} />
            ) : (
              <p className="text-muted-foreground">Add `content/pages/about.md` in the CMS.</p>
            )}
            <Button asChild className="mt-8">
              <a href={`mailto:${site.email}`}>
                <Mail className="size-4" />
                {site.email}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
