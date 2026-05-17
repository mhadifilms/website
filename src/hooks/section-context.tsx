import { createContext, useContext } from "react"

import type { SectionDescriptor } from "./use-section-router"

export type SectionContextValue = {
  sections: SectionDescriptor[]
  activeId: string
  register: (id: string, element: HTMLElement | null) => void
  scrollToId: (id: string, options?: { behavior?: ScrollBehavior }) => void
}

export const SectionContext = createContext<SectionContextValue | null>(null)

export function useSectionContext(): SectionContextValue | null {
  return useContext(SectionContext)
}
