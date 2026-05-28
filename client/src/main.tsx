import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import FinalMap from './FinalMap.tsx'
import SpellsPage from './SpellsPage.tsx'
import TestPage from './TestPage.tsx'

const path = window.location.pathname
const Page =
  path === '/final'  ? FinalMap  :
  path === '/spells' ? SpellsPage :
  path === '/test'   ? TestPage  :
  App

createRoot(document.getElementById('root')!).render(<Page />)
