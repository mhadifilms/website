import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full text-left break-words max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a
              href="https://mhadi.tv"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Home
            </a>
            <Link
              to="/writings"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Writings
            </Link>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-50 mb-8">
          About
        </h1>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-300">
          <p>
            Hi, I&apos;m M Hadi.
          </p>
          <p>
            I&apos;m a creative director focused on sharing the extraordinary stories of
            ordinary people.
          </p>
          <p>
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
          </p>
          <p>
            I&apos;ve had the privilege of learning from UCLA professors and Emmy-winning
            filmmakers, contributing to hundreds of projects with 1M+ views and
            international recognition.
          </p>
          <p>
            Check out my films and photography at{' '}
            <a
              href="https://awaiten.com"
              className="text-slate-100 underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              awaiten.com
            </a>
          </p>
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 mb-4">Connect:</p>
            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <a
                href="https://linkedin.com"
                className="hover:text-slate-50 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://github.com"
                className="hover:text-slate-50 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="mailto:hello@awaiten.com"
                className="hover:text-slate-50 transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

