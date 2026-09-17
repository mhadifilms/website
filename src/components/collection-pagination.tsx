import { ChevronLeft, ChevronRight } from "lucide-react"
import "./collection-pagination.css"

export function CollectionPagination({page, count, onChange, position}: {
  page:number; count:number; onChange:(page:number)=>void; position:"top"|"bottom"
}) {
  if (count <= 1) return null
  return <nav className="collection-pagination" aria-label={`Pages (${position})`}>
    <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={17} aria-hidden="true" /> Previous</button>
    <label><span className="sr-only">Choose page</span><select value={page} onChange={e => onChange(Number(e.target.value))}>
      {Array.from({length:count}, (_, i) => <option key={i+1} value={i+1}>Page {i+1} of {count}</option>)}
    </select></label>
    <button type="button" disabled={page === count} onClick={() => onChange(page + 1)}>Next <ChevronRight size={17} aria-hidden="true" /></button>
  </nav>
}

