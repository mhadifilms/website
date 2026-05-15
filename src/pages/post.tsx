import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { PageTransition } from "@/components/page-transition"
import { Prose } from "@/components/prose"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { posts } from "@/content/generated"
import { formatDate } from "@/lib/utils"

export default function PostPage() {
  const { slug } = useParams()
  const post = posts.find((item) => item.slug === slug)

  if (!post) {
    return (
      <PageTransition>
        <div className="max-w-2xl">
          <Badge>Missing note</Badge>
          <h1 className="mt-5 font-display text-5xl font-semibold">That post is not here.</h1>
          <Button asChild className="mt-8" variant="outline">
            <Link to="/writing">
              <ArrowLeft className="size-4" />
              Back to writing
            </Link>
          </Button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <article className="mx-auto max-w-3xl">
        <Button asChild variant="ghost">
          <Link to="/writing">
            <ArrowLeft className="size-4" />
            Writing
          </Link>
        </Button>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
          {formatDate(post.date)}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-7xl">
          {post.title}
        </h1>
        <p className="mt-6 text-xl leading-8 text-muted-foreground">{post.summary}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <Prose className="mt-12" html={post.html} />
      </article>
    </PageTransition>
  )
}
