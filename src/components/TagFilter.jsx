export default function TagFilter({ tags, selectedTag, onTagSelect }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onTagSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selectedTag === null
            ? 'bg-purple-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
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
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
