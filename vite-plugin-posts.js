import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname, basename, extname } from 'path'
import matter from 'gray-matter'

/**
 * Vite plugin to process markdown posts at build time
 * Generates a JSON index file with all post metadata
 */
export default function vitePluginPosts() {
  return {
    name: 'vite-plugin-posts',
    async buildStart() {
      const postsDir = join(process.cwd(), 'content', 'posts')
      const outputDir = join(process.cwd(), 'src', 'lib')
      const outputFile = join(outputDir, 'posts-index.json')

      try {
        // Read all markdown files from posts directory
        const files = await readdir(postsDir)
        const markdownFiles = files.filter((file) => extname(file) === '.md')

        // Process each markdown file
        const posts = await Promise.all(
          markdownFiles.map(async (file) => {
            const filePath = join(postsDir, file)
            const fileContent = await readFile(filePath, 'utf-8')
            const { data, content } = matter(fileContent)

            // Generate slug from filename
            const slug = basename(file, '.md')

            // Only include published posts
            if (!data.published) {
              return null
            }

            return {
              slug,
              title: data.title || '',
              date: data.date || '',
              tags: Array.isArray(data.tags) ? data.tags : [],
              excerpt: data.excerpt || '',
              thumbnail: data.thumbnail || null,
              published: data.published || false,
              // Store content for runtime processing
              content: content.trim(),
            }
          })
        )

        // Filter out null values (unpublished posts)
        const publishedPosts = posts.filter((post) => post !== null)

        // Sort by date (newest first)
        publishedPosts.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateB - dateA
        })

        // Ensure output directory exists
        await mkdir(outputDir, { recursive: true })

        // Write JSON index file
        await writeFile(outputFile, JSON.stringify(publishedPosts, null, 2), 'utf-8')

        console.log(`✓ Processed ${publishedPosts.length} published posts`)
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn(`Posts directory not found: ${postsDir}`)
          // Create empty index if directory doesn't exist
          await mkdir(outputDir, { recursive: true })
          await writeFile(outputFile, JSON.stringify([], null, 2), 'utf-8')
        } else {
          console.error('Error processing posts:', error)
          throw error
        }
      }
    },
  }
}
