export default function TagFilter({ tags, selectedTag, onTagSelect }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onTagSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selectedTag === null
            ? 'bg-slate-700 text-slate-50'
            : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagSelect(tag)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedTag === tag
              ? 'bg-slate-700 text-slate-50'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
