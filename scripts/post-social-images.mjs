import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { postMeta } from '../shared/post-meta.js'

// Generated at publish time: no dynamic image service or JavaScript crawler needed.
export async function buildPostSocialImages(posts, distDir) {
  for (const post of posts) {
    const meta = postMeta(post.snapshot, post.path)
    const source = new URL(meta.image)
    if (source.origin !== 'https://mhadifilms.com') {
      throw new Error(`Export the cover locally before publishing: ${post.path}`)
    }
    const sourcePath = path.resolve(distDir, `.${decodeURIComponent(source.pathname)}`)
    if (!sourcePath.startsWith(`${path.resolve(distDir)}${path.sep}`)) throw new Error('Invalid cover path')
    const output = path.join(distDir, new URL(meta.socialImage).pathname)
    await fs.mkdir(path.dirname(output), {recursive:true})
    await sharp(sourcePath).rotate().resize(1200, 630, {
      fit:'contain', background:'#fffff6',
    }).flatten({background:'#fffff6'}).jpeg({quality:88, mozjpeg:true}).toFile(output)
  }
}
