/* Toolbox 2.9: read-only legacy document metadata inspection.
   No writes, deletions, or automatic migration. */
(function(root){
'use strict';
const KEY='toolbox2-document-records-v1';
function inspectMetadata(storage){
 const raw=storage.getItem(KEY);
 if(raw===null)return {present:false,count:0,ids:[]};
 let records;
 try{records=JSON.parse(raw)}catch{throw Error('Invalid legacy document JSON')}
 if(!Array.isArray(records))throw Error('Unexpected legacy document format');
 const ids=new Set();
 for(const record of records){
  if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.id!=='string'||!record.id||ids.has(record.id))throw Error('Invalid or duplicate legacy document ID');
  ids.add(record.id);
 }
 return {present:true,count:records.length,ids:[...ids]};
}
const api=Object.freeze({inspectMetadata});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxMigrationPreflight=api;
})(typeof globalThis!=='undefined'?globalThis:this);
