import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import FinalMap from './FinalMap.tsx'

const Page = window.location.pathname === '/final' ? FinalMap : App

createRoot(document.getElementById('root')!).render(<Page />)
