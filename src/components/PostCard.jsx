import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { formatDate, getReadingTime } from '../lib/posts'

export default function PostCard({ post, index = 0, viewMode = 'grid', isFeatured = false }) {
  if (viewMode === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 + index * 0.06 }}
        className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500/5 via-slate-900 to-indigo-500/5 opacity-0 transition duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -inset-px rounded-xl border border-slate-800/60 ring-1 ring-white/5" />
        <Link to={`/writings/${post.slug}`} className="relative flex gap-4">
          {post.thumbnail && (
            <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-slate-800">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              {post.tags && post.tags.length > 0 && (
                <span className="tracking-[0.16em] uppercase text-slate-500">
                  {post.tags[0]}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span>{formatDate(post.date)}</span>
                <span className="text-slate-700">•</span>
                <span>{getReadingTime(post.content)}</span>
              </div>
            </div>
            <h3 className="text-base font-semibold text-slate-50 group-hover:text-white transition-colors">
              {post.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-300 line-clamp-2">{post.excerpt}</p>
          </div>
        </Link>
      </motion.article>
    )
  }

  // Featured layout: thumbnail on left, content on right
  if (isFeatured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 + index * 0.06 }}
        whileHover={{ y: -6, scale: 1.005 }}
        className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500/5 via-slate-900 to-indigo-500/5 opacity-0 transition duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -inset-px rounded-xl sm:rounded-2xl border border-slate-800/60 ring-1 ring-white/5" />
        <Link to={`/writings/${post.slug}`} className="relative flex flex-col md:flex-row">
          {post.thumbnail && (
            <div className="flex-shrink-0 w-full md:w-80 h-64 md:h-auto overflow-hidden bg-slate-800">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
              {post.tags && post.tags.length > 0 && (
                <span className="tracking-[0.16em] uppercase text-slate-500">
                  {post.tags[0]}
                </span>
              )}
              <div className="flex items-center gap-2 text-slate-400">
                <span>{formatDate(post.date)}</span>
                <span className="text-slate-700">•</span>
                <span>{getReadingTime(post.content)}</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-50 group-hover:text-white transition-colors">
              {post.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              {post.excerpt}
            </p>
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] bg-emerald-400/10 text-emerald-200">
                Published
              </span>
              <span className="text-slate-100 text-sm">Read →</span>
            </div>
          </div>
        </Link>
      </motion.article>
    )
  }

  // Regular grid layout: thumbnail on top
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.06 }}
      whileHover={{ y: -6, scale: 1.005 }}
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500/5 via-slate-900 to-indigo-500/5 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -inset-px rounded-xl sm:rounded-2xl border border-slate-800/60 ring-1 ring-white/5" />
      
      {post.thumbnail && (
        <Link to={`/writings/${post.slug}`} className="block">
          <div className="w-full h-48 overflow-hidden bg-slate-800">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      
      <div className="p-3 sm:p-4 flex h-full flex-col gap-1.5 sm:gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-[10px] sm:text-xs text-slate-400">
          {post.tags && post.tags.length > 0 && (
            <span className="tracking-[0.16em] uppercase text-slate-500">
              {post.tags[0]}
            </span>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <span>{formatDate(post.date)}</span>
            <span className="text-slate-700">•</span>
            <span>{getReadingTime(post.content)}</span>
          </div>
        </div>
        <Link to={`/writings/${post.slug}`}>
          <h3 className="text-sm sm:text-base font-semibold text-slate-50 group-hover:text-white transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="text-xs leading-relaxed text-slate-300">
          {post.excerpt}
        </p>
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-1.5 text-xs text-slate-200">
          <span className="rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] inline-block w-fit bg-emerald-400/10 text-emerald-200">
            Published
          </span>
          <Link
            to={`/writings/${post.slug}`}
            className="text-slate-100 underline-offset-4 transition-colors hover:text-white hover:underline text-xs"
          >
            Read
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
