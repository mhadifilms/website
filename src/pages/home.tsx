import { Link } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

import { PageTransition } from "@/components/page-transition"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { posts, projects, site } from "@/content/generated"
import { formatDate } from "@/lib/utils"

const principles = [
  "Static-first delivery",
  "CMS-managed content",
  "Owned shadcn components",
  "Reduced-motion aware animation",
]

export default function HomePage() {
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)
  const latestPosts = posts.slice(0, 3)

  return (
    <PageTransition>
      <section className="grid min-h-[72svh] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Badge className="mb-6 bg-background/70">Personal operating system</Badge>
          <motion.h1
            className="max-w-5xl font-display text-6xl font-semibold leading-[0.92] tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Film, software, and field notes with a little gravity.
          </motion.h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-muted-foreground">
            {site.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/work">
                Explore work
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/writing">Read writing</Link>
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
          <CardHeader>
            <div className="mb-8 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles className="size-6" />
            </div>
            <CardTitle>Built like a small studio archive.</CardTitle>
            <CardDescription>
              A personal site should be easy to edit, fast to load, and hard to confuse with a template.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {principles.map((principle) => (
              <div
                className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3 text-sm font-semibold"
                key={principle}
              >
                {principle}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Featured work</CardTitle>
            <CardDescription>CMS-backed project entries, ready for case studies.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {featuredProjects.map((project) => (
              <Link
                className="group rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:-translate-y-0.5 hover:border-foreground/30"
                key={project.slug}
                to="/work"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{project.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                  </div>
                  <span className="text-sm font-bold text-accent">{project.year}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest notes</CardTitle>
            <CardDescription>Markdown posts compiled into the static build.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {latestPosts.map((post) => (
              <Link
                className="group rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:-translate-y-0.5 hover:border-foreground/30"
                key={post.slug}
                to={`/writing/${post.slug}`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  {formatDate(post.date)}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.summary}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageTransition>
  )
}
