import { Link } from "react-router-dom"

import { PageTransition } from "@/components/page-transition"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { posts } from "@/content/generated"
import { formatDate } from "@/lib/utils"

export default function WritingPage() {
  return (
    <PageTransition>
      <div className="mb-10 max-w-3xl">
        <Badge>Writing</Badge>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">
          Notes with enough structure to keep publishing easy.
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Posts are Markdown files edited through Pages CMS and generated into typed static data before deploy.
        </p>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card className="transition hover:-translate-y-1" key={post.slug}>
            <CardContent className="p-6">
              <Link className="block" to={`/writing/${post.slug}`}>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  {formatDate(post.date)}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em]">
                  {post.title}
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{post.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
