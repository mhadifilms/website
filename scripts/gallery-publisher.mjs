import express from "express"
import multer from "multer"
import sharp from "sharp"
import matter from "gray-matter"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { promisify } from "node:util"
import { execFile as execFileCallback } from "node:child_process"

const execFile = promisify(execFileCallback)
const root = path.resolve(import.meta.dirname, "..")
const archiveDir = path.join(root, "content/archives/photography")
const bucket = "awaiten-cdn"
const cdn = "https://cdn.awaiten.com"
const port = Number(process.env.GALLERY_PORT || 4179)
const token = randomBytes(24).toString("hex")
const app = express()
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 40 * 1024 * 1024, files: 150 } })
let busy = false

const slugify = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
const transformed = (key, width, quality) => `${cdn}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${key.split("/").map(encodeURIComponent).join("/")}`

async function command(file, args, timeout = 120000) {
  try { return await execFile(file, args, { cwd: root, timeout, maxBuffer: 1024 * 1024 }) }
  catch (error) { throw new Error(`${file} failed: ${(error.stderr || error.message).trim().slice(0, 500)}`, { cause: error }) }
}

async function verifyCdn(key, bytes) {
  const url = `${cdn}/${key.split("/").map(encodeURIComponent).join("/")}`
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) })
      if (response.ok && Number(response.headers.get("content-length")) === bytes && response.headers.get("content-type")?.startsWith("image/")) return
    } catch { /* The public domain may briefly lag the upload. */ }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
  }
  throw new Error(`Uploaded ${key}, but could not verify it through ${cdn}. The gallery was not published.`)
}

async function cleanMain() {
  const branch = (await command("git", ["branch", "--show-current"])).stdout.trim()
  if (branch !== "main") throw new Error("Switch the website repository to main before publishing.")
  if ((await command("git", ["status", "--porcelain"])).stdout.trim()) throw new Error("The website repository has unfinished changes. Publish or set them aside first.")
}

async function inspectPhotos(files, slug, suffix = "") {
  const photos = []
  for (const [index, file] of files.entries()) {
    let meta
    try { meta = await sharp(file.path, { limitInputPixels: 100_000_000 }).metadata() }
    catch { throw new Error(`${file.originalname} is not a readable photo.`) }
    const ext = { jpeg:"jpg",png:"png",webp:"webp",avif:"avif" }[meta.format]
    if (!ext || !meta.width || !meta.height) throw new Error(`${file.originalname} must be JPEG, PNG, WebP, or AVIF.`)
    const key = `images/gallery/mhadifilms/${slug}/${suffix}${String(index + 1).padStart(3, "0")}.${ext}`
    photos.push({ key, path:file.path, bytes:file.size, width:meta.width, height:meta.height, type:ext === "jpg" ? "image/jpeg" : `image/${ext}` })
  }
  return photos
}

async function uploadPhotos(photos) {
  for (const photo of photos) {
    await command("wrangler", ["r2","object","put",`${bucket}/${photo.key}`,`--file=${photo.path}`,`--content-type=${photo.type}`,"--remote","--force"], 180000)
    await verifyCdn(photo.key, photo.bytes)
  }
}

async function finishPublication(destination, message, previous = null) {
  try { await command("npm",["run","build"],180000) }
  catch(error){
    if(previous === null) await fs.rm(destination,{force:true})
    else await fs.writeFile(destination,previous)
    await command("git",["restore","--","src/content/generated.ts","src/content/archive-bodies.ts"])
    throw error
  }
  await command("git",["add","--",path.relative(root,destination),"src/content/generated.ts","src/content/archive-bodies.ts"])
  await command("git",["commit","-m",message])
  await command("git",["push","origin","main"],180000)
}

function html() {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New photography gallery</title><style>
  :root{font:16px/1.5 system-ui,sans-serif;color:#252522;background:#f7f6f2}*{box-sizing:border-box}body{max-width:880px;margin:auto;padding:42px 24px 100px}h1{font:normal clamp(38px,7vw,68px)/1.05 Georgia,serif;letter-spacing:-.04em;margin:0 0 12px}p{color:#5d5c56}form{display:grid;gap:20px;margin-top:36px}label{display:grid;gap:7px;font-weight:600}input,textarea,select{font:inherit;border:1px solid #c9c8c0;border-radius:5px;padding:12px;background:white;width:100%}textarea{min-height:120px}input[type=file]{border-style:dashed;padding:22px}.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}.photo{background:white;border:1px solid #ddd;padding:7px;border-radius:5px}.photo img{width:100%;aspect-ratio:3/2;object-fit:contain;background:#eee}.photo small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.photo button{width:48%;margin-top:5px}button{font:inherit;cursor:pointer;border:1px solid #262621;border-radius:5px;background:white;padding:10px}button.primary{background:#252522;color:white;padding:15px 22px;font-weight:700}button:disabled{opacity:.5;cursor:wait}#status{white-space:pre-wrap;background:#e9eee7;padding:15px;border-radius:5px;display:none}#status.error{background:#f6e1db}a{color:inherit}@media(max-width:650px){.row{grid-template-columns:1fr}}
  </style><main><p><a href="/add">Add photos to an existing gallery →</a></p><h1>New photography gallery</h1><p>Choose photos, set their order and cover, then publish. Originals go to your Cloudflare bucket; the site stores only the gallery record. Your selected files are removed from this computer's temporary upload area when the request finishes.</p><form id="form"><label>Gallery title<input name="title" required maxlength="140" placeholder="A day in New York"></label><div class="row"><label>Date<input name="date" required type="date"></label><label>Collection<select name="project"><option value="mhadi-photography">M Hadi Photography</option><option value="awaiten-photography">Awaiten Photography</option></select></label></div><label>Short introduction<input name="dek" required maxlength="260" placeholder="A few words shown above the photographs"></label><label>About this collection<textarea name="body" required minlength="180" placeholder="Tell the story behind this collection (at least 180 characters)."></textarea></label><label>Credits (optional)<textarea name="credits" style="min-height:70px"></textarea></label><label><span>Photos (JPEG, PNG, WebP, or AVIF; 40 MB each)</span><input id="files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple required></label><div id="photos" class="photos"></div><label><span><input name="unlisted" type="checkbox" style="width:auto"> Unlisted (direct link only)</span></label><button class="primary" id="publish" type="submit">Publish gallery</button><p id="status" role="status"></p></form></main><script>
  const token=${JSON.stringify(token)};const form=document.querySelector('#form'),files=document.querySelector('#files'),photos=document.querySelector('#photos'),status=document.querySelector('#status'),publish=document.querySelector('#publish');let selected=[],cover=0;form.date.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  function render(){photos.replaceChildren();selected.forEach((file,index)=>{const card=document.createElement('div');card.className='photo';const img=document.createElement('img');img.src=URL.createObjectURL(file);img.onload=()=>URL.revokeObjectURL(img.src);const name=document.createElement('small');name.textContent=file.name;const radio=document.createElement('input');radio.type='radio';radio.name='cover';radio.checked=cover===index;radio.onchange=()=>cover=index;const label=document.createElement('label');label.textContent='Cover';label.style.display='inline';label.prepend(radio);const up=document.createElement('button');up.type='button';up.textContent='↑';up.disabled=index===0;up.onclick=()=>{[selected[index-1],selected[index]]=[selected[index],selected[index-1]];if(cover===index)cover=index-1;else if(cover===index-1)cover=index;render()};const down=document.createElement('button');down.type='button';down.textContent='↓';down.disabled=index===selected.length-1;down.onclick=()=>{[selected[index+1],selected[index]]=[selected[index],selected[index+1]];if(cover===index)cover=index+1;else if(cover===index+1)cover=index;render()};card.append(img,name,label,document.createElement('br'),up,down);photos.append(card)})}
  files.onchange=()=>{selected=[...files.files];cover=0;render()};form.onsubmit=async(event)=>{event.preventDefault();if(!selected.length)return;publish.disabled=true;status.style.display='block';status.className='';status.textContent='Uploading photos, checking them on the CDN, building the site, and publishing. Keep this page open.';const data=new FormData(form);data.delete('cover');data.set('coverIndex',String(cover));selected.forEach(file=>data.append('photos',file,file.name));try{const response=await fetch('/api/publish',{method:'POST',headers:{'X-Gallery-Token':token},body:data});const result=await response.json();if(!response.ok)throw new Error(result.error);status.innerHTML='Sent for deployment: <a href="'+result.url+'" target="_blank" rel="noopener">'+result.url+'</a>. The page will appear when GitHub Pages finishes.';form.reset();selected=[];render()}catch(error){status.className='error';status.textContent=error.message||String(error)}finally{publish.disabled=false}};
  </script></html>`
}

app.get("/", (_req, res) => res.type("html").send(html()))
app.get("/add", (_req,res) => res.type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Add gallery photos</title><style>body{max-width:760px;margin:auto;padding:40px 24px 100px;background:#f7f6f2;color:#252522;font:16px/1.5 system-ui,sans-serif}h1{font:normal clamp(38px,7vw,62px)/1.1 Georgia,serif}form{display:grid;gap:20px}label{display:grid;gap:7px;font-weight:600}input,select{font:inherit;padding:12px;background:white;border:1px solid #bbb;border-radius:5px}input[type=file]{border-style:dashed}button{background:#252522;color:white;border:0;border-radius:5px;padding:15px;font:inherit;cursor:pointer}button:disabled{opacity:.5}#status{white-space:pre-wrap}a{color:inherit}</style><p><a href="/">← New gallery</a></p><h1>Add photos to a gallery</h1><p>New photos are appended in the order you select them. Originals go to Cloudflare; the site stores their links and dimensions.</p><form id="form"><label>Gallery<select name="slug" id="gallery" required></select></label><label>Photo group (optional)<input name="group" id="group" list="groups" placeholder="All photos only"><datalist id="groups"></datalist></label><label>Photos<input id="files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple required></label><label><span><input type="checkbox" name="makeCover"> Use the first new photo as the gallery cover</span></label><button id="submit">Add photos and publish</button><p id="status" role="status"></p></form><script>
const token=${JSON.stringify(token)},form=document.querySelector('#form'),gallery=document.querySelector('#gallery'),groups=document.querySelector('#groups'),status=document.querySelector('#status'),submit=document.querySelector('#submit');let entries=[];fetch('/api/galleries').then(r=>r.json()).then(data=>{entries=data;gallery.replaceChildren();data.forEach(item=>{const option=document.createElement('option');option.value=item.slug;option.textContent=item.title+' ('+item.count+' photos)';gallery.append(option)});gallery.onchange=()=>{groups.replaceChildren();(entries.find(x=>x.slug===gallery.value)?.groups||[]).forEach(name=>{const option=document.createElement('option');option.value=name;groups.append(option)})};gallery.onchange()}).catch(e=>status.textContent=e.message);form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;status.textContent='Uploading photos, checking the CDN, building the site, and publishing. Keep this page open.';try{const data=new FormData(form);for(const file of document.querySelector('#files').files)data.append('photos',file,file.name);const response=await fetch('/api/add',{method:'POST',headers:{'X-Gallery-Token':token},body:data});const result=await response.json();if(!response.ok)throw new Error(result.error);status.innerHTML='Sent for deployment: <a href="'+result.url+'" target="_blank" rel="noopener">'+result.url+'</a>. The page will appear when GitHub Pages finishes.';form.reset()}catch(error){status.textContent=error.message||String(error)}finally{submit.disabled=false}};
</script></html>`))
app.get("/api/galleries", async (_req,res) => {
  const names = (await fs.readdir(archiveDir)).filter(name=>name.endsWith(".md"))
  const entries = await Promise.all(names.map(async name => {const { data } = matter(await fs.readFile(path.join(archiveDir,name),"utf8"));return {slug:data.slug,title:data.title,count:data.gallery?.length||0,groups:Object.keys(data.galleryCategories||{})}}))
  res.json(entries.sort((a,b)=>a.title.localeCompare(b.title)))
})
app.post("/api/add", (req,res,next) => req.get("X-Gallery-Token") === token ? next() : res.status(403).json({error:"Open the gallery publisher page and try again."}), upload.array("photos",150), async(req,res)=>{
  const files=req.files||[]
  try {
    if(busy)throw new Error("Another gallery is publishing. Wait for it to finish.")
    busy=true
    const slug=String(req.body.slug||""),group=String(req.body.group||"").trim()
    if(!/^[a-z0-9-]{1,100}$/.test(slug)||!files.length||files.length>150)throw new Error("Choose a gallery and 1–150 photos.")
    if(group.length>80||/[<>]/.test(group))throw new Error("Use a shorter, plain-text group name.")
    const destination=path.join(archiveDir,`${slug}.md`)
    const source=await fs.readFile(destination,"utf8")
    const parsed=matter(source)
    if(parsed.data.category!=="Photography"||!Array.isArray(parsed.data.gallery))throw new Error("This is not an editable photography gallery.")
    await cleanMain()
    const suffix=`added-${Date.now()}-${randomBytes(3).toString("hex")}-`
    const photos=await inspectPhotos(files,slug,suffix)
    await uploadPhotos(photos)
    const gallery=photos.map(photo=>transformed(photo.key,1800,82))
    parsed.data.gallery.push(...gallery)
    parsed.data.galleryDimensions=[...(parsed.data.galleryDimensions||[]),...photos.map(photo=>[photo.width,photo.height])]
    if(group){parsed.data.galleryCategories ||= {};parsed.data.galleryCategories[group] ||= [];parsed.data.galleryCategories[group].push(...gallery)}
    if(req.body.makeCover==="on")parsed.data.image=transformed(photos[0].key,640,75)
    await fs.writeFile(destination,matter.stringify(parsed.content,parsed.data))
    await finishPublication(destination,`Add photos to gallery: ${parsed.data.title}`,source)
    res.json({url:`https://mhadifilms.com/archives/photography/${slug}`})
  }catch(error){res.status(400).json({error:error.message||"Publishing failed."})}
  finally{busy=false;await Promise.all(files.map(file=>fs.rm(file.path,{force:true})))}
})
app.post("/api/publish", (req, res, next) => req.get("X-Gallery-Token") === token ? next() : res.status(403).json({ error: "Open the gallery publisher page and try again." }), upload.array("photos", 150), async (req, res) => {
  const files = req.files || []
  try {
    if (busy) throw new Error("Another gallery is publishing. Wait for it to finish.")
    busy = true
    const title = String(req.body.title || "").trim(), slug = slugify(title)
    const dek = String(req.body.dek || "").trim(), body = String(req.body.body || "").trim()
    const date = String(req.body.date || "")
    const project = String(req.body.project || "")
    const coverIndex = Number(req.body.coverIndex)
    if (!title || !slug || dek.length < 8 || body.replace(/<[^>]*>/g, "").length < 180) throw new Error("Add a title, introduction, and at least 180 characters about the collection.")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new Error("Choose a valid date.")
    if (!['mhadi-photography','awaiten-photography'].includes(project)) throw new Error("Choose a valid collection.")
    if (!files.length || files.length > 150 || !Number.isInteger(coverIndex) || coverIndex < 0 || coverIndex >= files.length) throw new Error("Choose 1–150 photos and a cover.")
    const destination = path.join(archiveDir, `${slug}.md`)
    if (await fs.stat(destination).catch(() => null)) throw new Error("A gallery already uses this title. Choose a distinct title.")
    await cleanMain()
    const photos = await inspectPhotos(files,slug)
    await uploadPhotos(photos)
    const gallery = photos.map(photo => transformed(photo.key,1800,82))
    const image = transformed(photos[coverIndex].key,640,75)
    const data = { slug,title,platform:"Website",category:"Photography",format:"photo-set",entryType:"Photo",project,dek,summary:dek,image,href:`https://mhadifilms.com/archives/photography/${slug}`,date,unlisted:req.body.unlisted === "on",credits:String(req.body.credits || "").trim(),gallery,galleryDimensions:photos.map(photo=>[photo.width,photo.height]) }
    await fs.writeFile(destination,matter.stringify(body + "\n",data))
    await finishPublication(destination,`Add photography gallery: ${title}`)
    res.json({ url:`https://mhadifilms.com/archives/photography/${slug}` })
  } catch (error) { res.status(400).json({ error:error.message || "Publishing failed." }) }
  finally { busy=false; await Promise.all(files.map(file=>fs.rm(file.path,{force:true}))) }
})

app.listen(port,"127.0.0.1",(error)=>{
  if(error){console.error(`Could not start gallery publisher: ${error.message}`);process.exitCode=1;return}
  console.log(`Gallery publisher: http://127.0.0.1:${port}`)
})
