export type DocumentNode = {type?:string;attrs?:Record<string,unknown>;content?:DocumentNode[];text?:string}
export type Snapshot = {
  seo?: {title:string;description:string};
  title:string;subtitle:string;slug:string;format:"essay"|"note"|"photo-set"|"video";date:string;tags:string[];project:string;
  cover:string;coverAlt:string;document:DocumentNode;html:string;text:string;
}
export type PublicPost = {id:string;path:string;revision:number;snapshot:Snapshot}
