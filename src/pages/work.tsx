import { ArrowUpRight } from "lucide-react"

import { PageTransition } from "@/components/page-transition"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { projects } from "@/content/generated"

export default function WorkPage() {
  return (
    <PageTransition>
      <div className="mb-10 max-w-3xl">
        <Badge>Work</Badge>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">
          Projects, systems, and selected artifacts.
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Add portfolio entries in Pages CMS. The build turns them into typed content with no runtime CMS dependency.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project) => (
          <Card className="overflow-hidden transition hover:-translate-y-1" key={project.slug}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.summary}</CardDescription>
                </div>
                <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">
                  {project.year}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              {project.href ? (
                <a
                  className="inline-flex items-center gap-2 text-sm font-bold text-accent"
                  href={project.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open project
                  <ArrowUpRight className="size-4" />
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
