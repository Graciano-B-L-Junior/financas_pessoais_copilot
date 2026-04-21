import Sidebar from './Sidebar'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'
import { useReducedMotion } from 'framer-motion'

/**
 * Layout compartilhado — sidebar + área principal com page transition.
 * @param {{ children: import('react').ReactNode }} props
 */
export default function AppLayout({ children }) {
  const reduce = useReducedMotion()

  return (
    <div className="flex h-screen overflow-hidden bg-bg-page">
      <Sidebar />
      <motion.main
        variants={reduce ? {} : pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex-1 overflow-y-auto p-6"
        id="main-content"
      >
        {children}
      </motion.main>
    </div>
  )
}
