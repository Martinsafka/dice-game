import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DiceGame } from './DiceGame'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DiceGame />
  </StrictMode>,
)
