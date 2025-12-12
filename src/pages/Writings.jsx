import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import TagFilter from '../components/TagFilter'
import PostCard from '../components/PostCard'
import ViewToggle from '../components/ViewToggle'
import SubscribeForm from '../components/SubscribeForm'
import { getAllPosts, getAllTags, searchPosts, getPostsByTag } from '../lib/posts'

export default function Writings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  const allPosts = getAllPosts()
  const allTags = getAllTags()
  const latestPost = allPosts.length > 0 ? allPosts[0] : null

  const filteredPosts = useMemo(() => {
    let posts = allPosts

    // Apply tag filter
    if (selectedTag) {
      posts = getPostsByTag(selectedTag)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      posts = searchPosts(searchQuery.trim()).filter((post) => {
        if (selectedTag) {
          return post.tags && post.tags.includes(selectedTag)
        }
        return true
      })
    }

    return posts
  }, [searchQuery, selectedTag, allPosts])

  // Determine if latest post should be shown as featured
  const showLatestAsFeatured = latestPost && !searchQuery && !selectedTag
  
  // Get posts to display (exclude latest if showing as featured)
  const postsToDisplay = showLatestAsFeatured 
    ? filteredPosts.filter(p => p.slug !== latestPost.slug)
    : filteredPosts

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full text-left break-words max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a
              href="https://mhadi.tv"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Home
            </a>
            <Link
              to="/about"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-50 mb-4">
          Creative Chaos
        </h1>
        <p className="text-lg sm:text-xl leading-relaxed text-slate-400 mb-3">
          A something-monthly newsletter about the chaos of attempting to be a creator.
        </p>
        <p className="text-sm text-slate-500 mb-4">
          By Muhammad Hadi Yusufali
        </p>

        {/* Subscribe Form - Less Intrusive */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <SubscribeForm />
        </motion.div>
      </motion.div>

      {/* Latest Article - Featured */}
      {showLatestAsFeatured && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-slate-50 mb-6">Latest</h2>
          <PostCard post={latestPost} index={0} viewMode="grid" isFeatured={true} />
        </motion.div>
      )}

      {/* Posts Section */}
      {allPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-slate-800 pt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-50">
              {searchQuery || selectedTag ? 'Search Results' : 'All Posts'}
            </h2>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>

          <div className="space-y-6 mb-8">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <TagFilter
              tags={allTags}
              selectedTag={selectedTag}
              onTagSelect={setSelectedTag}
            />
          </div>

          {postsToDisplay.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {postsToDisplay.map((post, index) => (
                  <PostCard key={post.slug} post={post} index={index} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {postsToDisplay.map((post, index) => (
                  <PostCard key={post.slug} post={post} index={index} viewMode="list" />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                {searchQuery || selectedTag
                  ? 'No posts found matching your criteria.'
                  : 'No posts available yet.'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
