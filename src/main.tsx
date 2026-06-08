import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MotionConfig } from "framer-motion"
import { BrowserRouter } from "react-router-dom"

import App from "@/App"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
