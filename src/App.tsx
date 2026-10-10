import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BottomNav, SideNav, TABS, type TabId } from './components/Nav'
import Home from './screens/Home'
import { Closet, Fitness, Goals, Week } from './screens/Placeholders'
import StyleGuide from './screens/StyleGuide'

type Route = TabId | 'style'
const ROUTES: Route[] = [...TABS.map((t) => t.id), 'style']

function readHash(): Route {
  const h = window.location.hash.replace('#/', '').replace('#', '') as Route
  return ROUTES.includes(h) ? h : 'home'
}

export default function App() {
  const [route, setRoute] = useState<Route>(readHash)

  useEffect(() => {
    const onHash = () => setRoute(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (r: Route) => {
    window.location.hash = `/${r}`
    window.scrollTo({ top: 0 })
  }

  const screen = {
    home: <Home onOpenStyle={() => go('style')} />,
    week: <Week />,
    goals: <Goals />,
    fitness: <Fitness />,
    closet: <Closet />,
    style: <StyleGuide onBack={() => go('home')} />,
  }[route]

  return (
    <div className="flex min-h-full">
      <SideNav active={route} onSelect={go} />
      <main className="min-w-0 flex-1 px-4 pb-28 md:px-10 md:pb-12 md:pt-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {screen}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav active={route} onSelect={go} />
    </div>
  )
}
