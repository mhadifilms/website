import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LuArrowUpRight } from 'react-icons/lu'

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full text-left break-words relative z-10"
      style={{ position: 'relative' }}
    >
      <motion.h1
        className="text-base sm:text-lg md:text-xl font-semibold tracking-tight text-slate-50"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Writing my story as you read it.
      </motion.h1>
      <motion.p
        className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Hi, I&apos;m M Hadi.
      </motion.p>
      <motion.p
        className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        I&apos;m a creative director focused on sharing the extraordinary stories of
        ordinary people.
      </motion.p>
      <motion.p
        className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        With over 7 years of experience, I currently work as Head of Services for{' '}
        <a
          href="https://sync.so/"
          className="text-slate-100 underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          sync.so
        </a>
        , visually dubbing content for Hollywood&apos;s biggest studios.
      </motion.p>
      <motion.p
        className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        I&apos;ve had the privilege of learning from UCLA professors and Emmy-winning
        filmmakers, contributing to hundreds of projects with 1M+ views and
        international recognition.
      </motion.p>
      <motion.p
        className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        Check out my films and photography at{' '}
        <a
          href="https://awaiten.com"
          className="text-slate-100 underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          awaiten.com
        </a>
      </motion.p>
      <motion.div
        className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 text-slate-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <a
          href="https://linkedin.com"
          className="hover:text-slate-50 transition-colors text-xs sm:text-sm"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
        <span className="text-slate-600">•</span>
        <a
          href="https://github.com"
          className="hover:text-slate-50 transition-colors text-xs sm:text-sm"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <span className="text-slate-600">•</span>
        <a
          href="mailto:hello@awaiten.com"
          className="hover:text-slate-50 transition-colors text-xs sm:text-sm"
        >
          Email
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.48 }}
      >
        <Link
          to="/writings"
          className="group relative mt-6 sm:mt-8 md:mt-10 block overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3 sm:p-4 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_-48px_rgba(0,0,0,0.9)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 opacity-0 transition duration-500 group-hover:opacity-100" />
          <div className="pointer-events-none absolute -inset-px rounded-xl sm:rounded-2xl border border-slate-800/70 ring-1 ring-white/5" />
          <div className="relative flex items-start justify-between gap-2 sm:gap-3">
            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500">Writings</p>
              <h2 className="text-sm sm:text-base font-semibold text-slate-50">Creative Chaos</h2>
              <p className="text-xs text-slate-300">
                A something-monthly newsletter about the chaos of attempting to be a creator.
              </p>
            </div>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center text-slate-100 transition group-hover:translate-x-1 group-hover:text-white">
              <LuArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span className="sr-only">Go to writings</span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  )
}
