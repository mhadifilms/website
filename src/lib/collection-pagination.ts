export const COLLECTION_PAGE_SIZE = 6

export function collectionPage(total: number, requested: number) {
  const count = Math.max(1, Math.ceil(total / COLLECTION_PAGE_SIZE))
  const page = Math.min(count, Math.max(1, Number.isSafeInteger(requested) ? requested : 1))
  const start = (page - 1) * COLLECTION_PAGE_SIZE
  return {page, count, start, end:Math.min(total, start + COLLECTION_PAGE_SIZE)}
}

export function focusCollectionPage(element: HTMLElement | null) {
  requestAnimationFrame(() => {
    element?.scrollIntoView({behavior:"instant", block:"start"})
    element?.focus({preventScroll:true})
  })
}
