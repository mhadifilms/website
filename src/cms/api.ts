import type {PublicPost} from './types'
export class ApiError extends Error {
  status:number
  constructor(message:string,status:number){super(message);this.status=status}
}
type Manifest={schema:number;posts:PublicPost[];managedPaths:string[]}
let pending:Promise<Manifest>|null=null
function manifest():Promise<Manifest> {
  if (!pending) pending=fetch('/publishing/manifest.json').then(async response=>{
    if(!response.ok)throw new ApiError('Writing is temporarily unavailable.',response.status)
    const value=await response.json()
    if(value.schema!==1||!Array.isArray(value.posts)||!Array.isArray(value.managedPaths))throw new ApiError('Invalid publication.',503)
    return value as Manifest
  }).catch(error=>{pending=null;throw error})
  return pending
}
export async function api<T>(route:string):Promise<T> {
  const data=await manifest()
  if(route==='/public/posts')return data.posts as T
  if(route==='/public/archive-index')return data as T
  const url=new URL(route,'https://mhadifilms.com')
  if(url.pathname==='/public/post') {
    const path=url.searchParams.get('path') || ''
    const post=data.posts.find(post=>post.path===path)
    if(post)return post as T
    throw new ApiError('This article is not published.',data.managedPaths.includes(path)?410:404)
  }
  throw new ApiError('This website is served by GitHub Pages.',404)
}
export const formatDate=(date:string)=>new Date(date).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})
