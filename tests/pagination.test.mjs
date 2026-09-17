import {test} from 'node:test'
import assert from 'node:assert/strict'
import {collectionPage} from '../src/lib/collection-pagination.ts'
test('pagination bounds empty, partial, invalid and out-of-range pages',()=>{
 assert.deepEqual(collectionPage(0,1),{page:1,count:1,start:0,end:0})
 assert.deepEqual(collectionPage(32,6),{page:6,count:6,start:30,end:32})
 assert.deepEqual(collectionPage(32,99),collectionPage(32,6))
 for(const page of [0,-1,NaN,Infinity,1.5]) assert.deepEqual(collectionPage(32,page),collectionPage(32,1))
 assert.deepEqual(collectionPage(12,2),{page:2,count:2,start:6,end:12})
})
