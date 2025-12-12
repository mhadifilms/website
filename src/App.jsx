import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { LuArrowUpRight } from 'react-icons/lu'
import Home from './pages/Home'
import Writings from './pages/Writings'
import Post from './pages/Post'
import About from './pages/About'

function App() {
  const location = useLocation()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const hoverX = useSpring(pointerX, { stiffness: 140, damping: 18, mass: 0.4 })
  const hoverY = useSpring(pointerY, { stiffness: 140, damping: 18, mass: 0.4 })
  
  const isWritingsPage = location.pathname.startsWith('/writings')
  const isPostPage = location.pathname.startsWith('/writings/') && location.pathname !== '/writings'
  const isAboutPage = location.pathname === '/about'

  // Mouse-following glow offsets (responsive)
  const glowX = useSpring(useTransform(mouseX, (v) => v * 200), {
    stiffness: 120,
    damping: 18,
    mass: 0.4,
  })
  const glowY = useSpring(useTransform(mouseY, (v) => v * 200), {
    stiffness: 120,
    damping: 18,
    mass: 0.4,
  })

  // Bloom dynamics for the dot field
  const bloomStrength = useSpring(0, {
    stiffness: 90,
    damping: 22,
    mass: 0.8,
    restDelta: 0.0006,
    restSpeed: 0.0006,
    delay: 0.06,
  })
  const bloomRadius = useTransform(bloomStrength, [0, 1], [70, 150])
  const bloomFalloff = useTransform(bloomStrength, [0, 1], [120, 220])
  const bloomSize = useTransform(bloomStrength, [0, 1], [1.6, 5.4])
  const bloomOpacity = useTransform(bloomStrength, [0, 1], [0, 0.6])
  const bloomGlow = useTransform(bloomStrength, [0, 1], [0, 0.48])

  const highlightMask = useMotionTemplate`radial-gradient(circle at ${hoverX}px ${hoverY}px, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.12) ${bloomRadius}px, rgba(255,255,255,0) ${bloomFalloff}px)`
  const bloomSizePx = useMotionTemplate`${bloomSize}px`
  const bloomFilter = useMotionTemplate`drop-shadow(0 0 20px rgba(220,235,255, ${bloomGlow})) blur(0.25px)`

  const handleMouseMove = (event) => {
    const { currentTarget, clientX, clientY } = event
    const rect = currentTarget.getBoundingClientRect()
    const relX = (clientX - (rect.left + rect.width / 2)) / rect.width
    const relY = (clientY - (rect.top + rect.height / 2)) / rect.height
    mouseX.set(relX)
    mouseY.set(relY)
    pointerX.set(clientX - rect.left)
    pointerY.set(clientY - rect.top)
    bloomStrength.set(1)
  }

  const handleMouseLeave = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    mouseX.set(0)
    mouseY.set(0)
    pointerX.set(rect.width / 2)
    pointerY.set(rect.height / 2)
    bloomStrength.set(0)
  }

  return (
    <div className="dark">
      <div
        className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-foreground flex justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100vw', minWidth: '100vw', position: 'relative', isolation: 'isolate' }}
      >
        {/* Single configurable dot field with cursor bloom */}
        <div className="pointer-events-none fixed inset-0 select-none" style={{ width: '100vw', height: '100vh', top: 0, left: 0, right: 0, bottom: 0 }}>
          <motion.div
            className="absolute inset-0 mix-blend-screen"
            animate={{
              '--dot-size': ['1.35px', '1.7px', '1.35px'],
              '--dot-opacity': [0.32, 0.46, 0.32],
              filter: [
                'drop-shadow(0 0 12px rgba(110,140,200,0.035))',
                'drop-shadow(0 0 18px rgba(110,140,200,0.08))',
                'drop-shadow(0 0 12px rgba(110,140,200,0.035))',
              ],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
            style={{
              '--dot-color': '186,202,224',
              '--dot-opacity': 0.38,
              '--dot-size': '1.35px',
              backgroundImage:
                'radial-gradient(circle, rgba(var(--dot-color), var(--dot-opacity)) var(--dot-size), transparent calc(var(--dot-size) + 1px))',
              backgroundSize: '12px 12px',
              opacity: 0.78,
              transform: 'translateZ(0)',
              filter: 'drop-shadow(0 0 14px rgba(110,140,200,0.045))',
            }}
          />

          {/* Cursor-driven bloom mask */}
          <motion.div
            className="absolute inset-0 mix-blend-screen pointer-events-none"
            style={{
              '--dot-size': bloomSizePx,
              '--dot-color': '220,235,255',
              '--dot-opacity': bloomOpacity,
              backgroundImage:
                'radial-gradient(circle, rgba(var(--dot-color), var(--dot-opacity)) var(--dot-size), transparent calc(var(--dot-size) + 2px))',
              backgroundSize: '12px 12px',
              WebkitMaskImage: highlightMask,
              maskImage: highlightMask,
              filter: bloomFilter,
            }}
          />

          {/* Soft center dimmer to keep focus on content */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-multiply"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(6,10,20,0.52) 0%, rgba(6,10,20,0.36) 30%, rgba(6,10,20,0.14) 50%, rgba(6,10,20,0) 70%)',
            }}
          />

          {/* Mouse-following glow */}
          <motion.div
            className="absolute inset-0 mix-blend-screen pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.14) 30%, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0) 70%)',
              x: glowX,
              y: glowY,
            }}
          />
        </div>

        {/* Dark diagonals to keep the center clean */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              'linear-gradient(115deg, rgba(6,10,20,0.96) 0%, rgba(6,10,20,0.78) 40%, rgba(6,10,20,0.96) 100%)',
            width: '100vw',
            height: '100vh',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <main
          className={`relative z-50 mx-auto flex w-full justify-center px-4 sm:px-6 lg:px-8 ${
            isWritingsPage || isPostPage || isAboutPage
              ? 'max-w-6xl py-8 sm:py-12 md:py-16 items-start'
              : 'max-w-2xl lg:max-w-3xl min-h-[calc(100vh-2rem)] sm:min-h-[674px] items-center py-8 sm:py-0'
          }`}
          style={{ margin: '0 auto', position: 'relative', isolation: 'isolate' }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writings" element={<Writings />} />
            <Route path="/writings/:slug" element={<Post />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
