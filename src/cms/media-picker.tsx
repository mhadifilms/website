import { useEffect, useState } from "react"
import { Upload, ImagePlus } from "lucide-react"
import { api, uploadImage } from "./api"
import type { Media } from "./types"
import { Modal } from "./modal"

export function MediaPicker({
  close,
  select,
  initialFile,
  selectLabel = "Insert image",
}: {
  close: () => void
  select: (media: Media, alt: string, caption: string) => void
  initialFile?: File
  selectLabel?: string
}) {
  const [items, setItems] = useState<Media[]>([]),
    [selected, setSelected] = useState<Media | null>(null)
  const [file, setFile] = useState<File | null>(initialFile || null),
    [alt, setAlt] = useState(""),
    [caption, setCaption] = useState("")
  const [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState("")
  useEffect(() => {
    api<Media[]>("/admin/media")
      .then(setItems)
      .catch((e) => setError(e.message))
  }, [])
  async function upload() {
    if (!file) return
    setProgress(0)
    setError("")
    try {
      const result = await uploadImage(file, setProgress)
      setSelected(result)
      setItems((current) => [result, ...current])
      setFile(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }
  return (
    <Modal
      title="Add an image"
      close={progress === null ? close : () => {}}
      wide
    >
      <div className="cms-upload">
        <Upload size={24} />
        <div>
          <label htmlFor="image-upload">Upload a photo</label>
          <p>
            JPEG, PNG, WebP, GIF, or AVIF. Up to 20 MB. GIFs become still
            images.
          </p>
        </div>
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          disabled={progress !== null}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null)
            setError("")
          }}
        />
        {file && (
          <button
            className="cms-button"
            disabled={progress !== null}
            onClick={() => void upload()}
          >
            {progress === null
              ? `Upload ${file.name}`
              : progress === 100
                ? "Preparing image…"
                : `Uploading ${progress}%`}
          </button>
        )}
        {progress !== null && (
          <progress
            value={progress}
            max={100}
            aria-label="Image upload progress"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="cms-error">
          {error}
        </p>
      )}
      {items.length > 0 && (
        <div className="cms-media-grid">
          {items.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected?.id === item.id}
              className="cms-media-tile"
              onClick={() => setSelected(item)}
            >
              <img src={item.url} alt={item.name} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="cms-fields">
          <label>
            Describe the image
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Alt text for people using screen readers"
            />
          </label>
          <label>
            Caption <span>(optional)</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="cms-modal-actions">
        <button
          className="cms-button"
          disabled={progress !== null}
          onClick={close}
        >
          Cancel
        </button>
        <button
          className="cms-button cms-primary"
          disabled={!selected || progress !== null}
          onClick={() => selected && select(selected, alt, caption)}
        >
          <ImagePlus size={17} /> {selectLabel}
        </button>
      </div>
    </Modal>
  )
}
