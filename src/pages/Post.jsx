import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getPostBySlug, formatDate, getReadingTime, renderMarkdown } from '../lib/posts'

export default function Post() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="w-full text-center py-12">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Post not found</h1>
        <Link
          to="/writings"
          className="text-purple-600 hover:text-purple-700 underline underline-offset-4"
        >
          Back to Writings
        </Link>
      </div>
    )
  }

  const htmlContent = renderMarkdown(post.content)

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-3xl mx-auto text-left break-words"
    >
      <Link
        to="/writings"
        className="inline-flex items-center text-xs text-slate-600 hover:text-purple-600 mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Writings
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-600">
          {post.tags && post.tags.length > 0 && (
            <>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 uppercase tracking-[0.12em]"
                >
                  {tag}
                </span>
              ))}
              <span className="text-slate-400">•</span>
            </>
          )}
          <span>{formatDate(post.date)}</span>
          <span className="text-slate-400">•</span>
          <span>{getReadingTime(post.content)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-sm sm:text-base leading-relaxed text-slate-700">
            {post.excerpt}
          </p>
        )}
      </header>

      <div
        className="markdown-content text-sm sm:text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </motion.article>
  )
}
