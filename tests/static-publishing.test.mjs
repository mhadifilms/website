import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {loadPublication,publicationRoute,writingIndexRoute} from '../scripts/publishing-routes.mjs'
test('public build validates publication boundary and emits readable canonical pages',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'static-writing-'))
  t.after(()=>fs.rm(root,{recursive:true,force:true}))
  await fs.mkdir(path.join(root,'public/publishing'),{recursive:true})
  const post={id:'public',path:'/writing/a-finished-post',revision:2,snapshot:{title:'A finished post',subtitle:'The public version',html:'<p>Published words.</p>',text:'Published words.',date:'2026-09-10',tags:[],cover:'',coverAlt:''}}
  const file=path.join(root,'public/publishing/manifest.json')
  const save=()=>fs.writeFile(file,JSON.stringify({schema:1,posts:[post],managedPaths:[post.path]}))
  await save()
  const data=await loadPublication(root)
  const route=publicationRoute(data.posts[0])
  assert.equal(route.output,'writing/a-finished-post/index.html')
  assert.ok(route.prerenderHtml.includes('<p>Published words.</p>'))
  assert.equal(route.jsonLd.url,'https://mhadifilms.com/writing/a-finished-post')
  assert.ok(writingIndexRoute(data.posts).prerenderHtml.includes('A finished post'))
  post.snapshot.newsletter={subject:'private'};await save()
  await assert.rejects(()=>loadPublication(root),/Private fields/)
  delete post.snapshot.newsletter
  post.path='/../../private';await save()
  await assert.rejects(()=>loadPublication(root),/Invalid/)
})
