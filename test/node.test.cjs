const test=require('node:test');const assert=require('node:assert/strict');
const {PrerenderBuddy}=require('../dist/nodes/PrerenderBuddy/PrerenderBuddy.node.js');
const {PrerenderBuddyApi}=require('../dist/credentials/PrerenderBuddyApi.credentials.js');
const {operations}=require('../operations.cjs');
const id='11111111-1111-4111-8111-111111111111';
function context(input,onRequest){return {getInputData:()=>[{json:{}}],getNodeParameter:(key,index,fallback)=>input[key]??fallback,continueOnFail:()=>false,getNode:()=>({name:'PB',type:'prerenderBuddy',typeVersion:1,position:[0,0],parameters:{}}),helpers:{httpRequestWithAuthentication:async(name,req)=>{assert.equal(name,'prerenderBuddyApi');return onRequest(req);}}};}
test('native n8n metadata exposes matching operations and scoped credential storage',()=>{
 const node=new PrerenderBuddy();assert.deepEqual(node.description.properties[0].options.map(op=>op.value),operations.map(op=>op.key));
 assert.equal(node.description.credentials[0].name,'prerenderBuddyApi');
 for(const field of node.description.properties.filter(p=>p.type==='boolean'))assert.equal(field.default,false);
 const credential=new PrerenderBuddyApi();assert.equal(credential.properties[0].typeOptions.password,true);assert.equal(credential.test.request.url,'/sites');
});
test('native execution preserves task retry IDs and reviewed content hashes',async()=>{
 const node=new PrerenderBuddy();const requests=[];
 const run=input=>node.execute.call(context(input,req=>{requests.push(req);return {taskId:id};}));
 const result=await run({operation:'prepare_article',siteId:id,promptId:id,requestId:id});
 assert.equal(result[0][0].json.taskId,id);assert.equal(result[0][0].pairedItem.item,0);assert.equal(requests[0].body.requestId,id);
 await run({operation:'approve_article',siteId:id,draftId:id,reviewHash:'a'.repeat(64),confirmReview:true});
 assert.equal(requests[1].body.reviewHash,'a'.repeat(64));
 await run({operation:'schedule_article',siteId:id,draftId:id,reviewHash:'a'.repeat(64),confirmSchedule:true});
 assert.equal(requests[2].method,'PUT');assert.equal(requests[2].body.scheduledFor,null);
});
test('unconfirmed generation/publication and invalid IDs never make HTTP requests',async()=>{
 const node=new PrerenderBuddy();let requests=0;
 for(const input of [{operation:'health',siteId:'../billing'},{operation:'generate_article',siteId:id,taskId:id,confirmGeneration:false},{operation:'deliver_article',siteId:id,draftId:id,reviewHash:'a'.repeat(64),requestedStatus:'publish',confirmPublish:false}]){
  await assert.rejects(node.execute.call(context(input,()=>{requests++;return {};})));
 }
 assert.equal(requests,0);
});
test('website dropdown returns names and IDs from the authenticated workspace',async()=>{
 const node=new PrerenderBuddy();const ctx=context({},req=>{assert.equal(req.url,'https://api.prerenderbuddy.com/v1/developer/sites');return {sites:[{id,domain:'garden.example',name:'Garden Journal'}]};});
 const choices=await node.methods.loadOptions.getSites.call(ctx);
 assert.deepEqual(choices,[{name:'Garden Journal (garden.example)',value:id}]);
});
