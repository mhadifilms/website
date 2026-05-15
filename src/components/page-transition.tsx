import { motion } from "framer-motion"
import type { ReactNode } from "react"

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
      exit={{ opacity: 0, y: 12 }}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  )
}
