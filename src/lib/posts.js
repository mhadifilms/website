import { marked } from 'marked'
import postsIndex from './posts-index.json'

/**
 * Get all published posts
 * @returns {Array} Array of post objects with metadata
 */
export function getAllPosts() {
  return postsIndex || []
}

/**
 * Get a single post by slug
 * @param {string} slug - Post slug
 * @returns {Object|null} Post object or null if not found
 */
export function getPostBySlug(slug) {
  return postsIndex.find((post) => post.slug === slug) || null
}

/**
 * Get posts filtered by tag
 * @param {string} tag - Tag to filter by
 * @returns {Array} Array of posts with the specified tag
 */
export function getPostsByTag(tag) {
  return postsIndex.filter((post) => post.tags && post.tags.includes(tag))
}

/**
 * Get all unique tags from all posts
 * @returns {Array} Array of unique tag strings
 */
export function getAllTags() {
  const tags = new Set()
  postsIndex.forEach((post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
}

/**
 * Search posts by query string
 * @param {string} query - Search query
 * @returns {Array} Array of matching posts
 */
export function searchPosts(query) {
  if (!query || query.trim() === '') {
    return getAllPosts()
  }

  const lowerQuery = query.toLowerCase()
  return postsIndex.filter((post) => {
    const titleMatch = post.title?.toLowerCase().includes(lowerQuery)
    const excerptMatch = post.excerpt?.toLowerCase().includes(lowerQuery)
    const contentMatch = post.content?.toLowerCase().includes(lowerQuery)
    const tagMatch = post.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))

    return titleMatch || excerptMatch || contentMatch || tagMatch
  })
}

/**
 * Render markdown content to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} HTML string
 */
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  return marked.parse(markdown)
}

/**
 * Get formatted date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "Jan 2025")
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  
  return `${month} ${year}`
}

/**
 * Estimate reading time for a post
 * @param {string} content - Post content
 * @returns {string} Reading time estimate (e.g., "5 min read")
 */
export function getReadingTime(content) {
  if (!content) return '1 min read'
  
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  
  return `${minutes} min read`
}
