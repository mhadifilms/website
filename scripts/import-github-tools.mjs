import fs from "node:fs/promises"
import path from "node:path"

// Generates archive entries for M Hadi's open-source GitHub projects under the
// Creative Tools series. Kept in its own folder (content/archives/github) so
// the daily sync-archives job never touches them. Blurbs are written by hand
// from each repo's real description. Re-run: node scripts/import-github-tools.mjs
const root = process.cwd()
const outDir = path.join(root, "content", "archives", "github")
const USER = "mhadifilms"

const TOOLS = [
  {
    repo: "dvr",
    title: "dvr — DaVinci Resolve automation",
    dek: "A CLI, Python library, and MCP server for automating DaVinci Resolve.",
    homepage: "https://mhadifilms.github.io/dvr",
    body:
      "dvr is a command-line tool, Python library, and MCP server for DaVinci Resolve. It lets you script editing, color, and delivery, and lets AI assistants drive Resolve directly through the Model Context Protocol, so the repetitive timeline and render work that usually eats an edit day can be automated instead of clicked through by hand.",
  },
  {
    repo: "trailerdb",
    title: "trailerdb — The Trailer Database",
    dek: "An open database of movie trailers across every film and language.",
    homepage: "https://trailerdb.org",
    body:
      "trailerdb is an open database of movie trailers: every trailer, every movie, every language, with more than 300,000 trailers indexed. It grew out of wanting one searchable source for reference and research when studying how films cut and sell themselves.",
  },
  {
    repo: "arc-exporter",
    title: "arc-exporter",
    dek: "Export your Arc browser content to import into other browsers.",
    body:
      "arc-exporter pulls saved content out of the Arc browser so you can import it into another browser without losing spaces, pinned tabs, and links. It was built as a small safety net after Arc's future got uncertain, for anyone who had made Arc their home.",
  },
  {
    repo: "autoneat",
    title: "autoneat",
    dek: "Batch auto-profiling between DaVinci Resolve and Neat Video.",
    body:
      "autoneat wires DaVinci Resolve into Neat Video for batch auto-profiling, so noise reduction can be applied across many clips without hand-building a profile for each one. It is a production-speed tool for cleaning up grainy footage at scale.",
  },
  {
    repo: "cropaway",
    title: "cropaway",
    dek: "An all-in-one desktop tool for cropping, masking, and segmenting video.",
    body:
      "cropaway is an all-in-one desktop app for cropping, masking, and segmenting videos. It folds the fiddly reframing and masking steps most editors bounce between separate tools for into a single focused workspace.",
  },
  {
    repo: "chorus",
    title: "chorus",
    dek: "Stream system audio to multiple output devices at once.",
    body:
      "chorus streams system audio to multiple output devices simultaneously, with independent settings per device. It is for filling a room, or a shoot, with synced sound across several speakers without extra hardware or a mixing desk.",
  },
  {
    repo: "swifteditor",
    title: "swifteditor",
    dek: "An open-source, Swift-native video editor for macOS.",
    body:
      "swifteditor is an open-source, Swift-native video editor for macOS, built as both a usable tool and a research project into what a fast, truly native editing app can feel like. It is an experiment in cutting without the weight of a full legacy NLE.",
  },
  {
    repo: "Clean-Subtitles",
    title: "Clean Subtitles",
    dek: "Generate SRT files with clean, customizable line lengths.",
    body:
      "Clean Subtitles is a simple way to generate SRT files with customizable line lengths and character counts, so captions break cleanly and read well on screen instead of following whatever line breaks an auto-transcriber happened to choose.",
  },
  {
    repo: "quire",
    title: "quire",
    dek: "A reflowable-EPUB pipeline for image-heavy or garbled PDFs.",
    body:
      "quire is a reflowable-EPUB conversion pipeline for image-heavy or mojibake-laden PDFs. It rebuilds messy or scanned documents into clean, readable ebooks with selectable, reflowing text instead of frozen page images you have to pinch and zoom.",
  },
  {
    repo: "speedup",
    title: "speedup",
    dek: "Blazing-fast file transfer over UDP with fountain codes.",
    body:
      "speedup is a fast file-transfer tool built on UDP with fountain codes and rate-based congestion control. It is designed to move large media files across networks faster and more resiliently than traditional TCP transfers, even on lossy connections.",
  },
  {
    repo: "Checksum",
    title: "Checksum",
    dek: "Folder and file copying that verifies against corruption.",
    body:
      "Checksum is a simple, easy-to-use folder and file copying tool that verifies every copy to catch the silent corruption that can creep into large media transfers. It is the safety check you want before wiping a camera card or archiving a shoot.",
  },
  {
    repo: "fontiac",
    title: "fontiac",
    dek: "A minimalist, AI-assisted font finder and organizer.",
    body:
      "fontiac is a modern, minimalistic font finder and organizer with AI assistance for surfacing the right typeface. It is built for quickly browsing, previewing, and organizing a growing font library without the usual clutter of a font manager.",
  },
  {
    repo: "markitdown",
    title: "markitdown",
    dek: "Convert any text to clean Markdown, HTML, or plain text with AI.",
    body:
      "markitdown uses AI to convert any text into clean Markdown, HTML, or plain text. It is a small utility for turning pasted, messy, or richly formatted content into consistent, portable markup in a couple of clicks.",
  },
]

function frontmatter(fields, body) {
  const order = ["slug", "platform", "category", "project", "format", "entryType", "title", "dek", "date", "href", "image", "summary", "role", "featured"]
  const lines = ["---"]
  for (const key of order) {
    const value = fields[key]
    if (value === undefined || value === "") continue
    lines.push(`${key}: ${JSON.stringify(value)}`)
  }
  lines.push("---", "", body.trim(), "")
  return lines.join("\n")
}

async function run() {
  await fs.mkdir(outDir, { recursive: true })
  for (const file of await fs.readdir(outDir).catch(() => [])) {
    if (file.endsWith(".md")) await fs.unlink(path.join(outDir, file))
  }

  let count = 0
  for (const tool of TOOLS) {
    const repoUrl = `https://github.com/${USER}/${tool.repo}`
    const bodyParts = [tool.body]
    if (tool.homepage) bodyParts.push(`Live at [${tool.homepage.replace(/^https?:\/\//, "")}](${tool.homepage}).`)
    bodyParts.push(`[See the build on GitHub](${repoUrl})`)

    const fields = {
      slug: tool.repo.toLowerCase(),
      platform: "Website",
      category: "Tools",
      project: "creative-tools",
      format: "tool",
      entryType: "Tool",
      title: tool.title,
      dek: tool.dek,
      date: "2026-06-01",
      href: repoUrl,
      image: `https://opengraph.githubassets.com/1/${USER}/${tool.repo}`,
      summary: tool.dek,
    }

    await fs.writeFile(path.join(outDir, `${tool.repo.toLowerCase()}.md`), frontmatter(fields, bodyParts.join("\n\n")))
    count++
    console.log(`+ ${fields.slug}  ${tool.title}`)
  }

  console.log(`\nImported ${count} GitHub tools into ${path.relative(root, outDir)}`)
}

run()
