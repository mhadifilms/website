import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string
  children: ReactNode
  close: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`cms-modal ${wide ? "cms-modal-wide" : ""}`}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      aria-label={title}
    >
      <div className="cms-modal-heading">
        <h2>{title}</h2>
        <button className="cms-icon" onClick={close} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
