// One contract consumed by the platform-specific adapters. No credentials or runtime state.
const field=(key,label,type='string',required=true)=>({key,label,type,required});
const site=field('siteId','PB website ID');
const draft=field('draftId','Article ID');
const task=field('taskId','Article task ID');
const review=field('reviewHash','Reviewed article version (reviewHash)');
const operations=[
 ['health','Get Website Health','GET','/sites/{siteId}/health',[site]],
 ['visibility','Get AI Visibility','GET','/sites/{siteId}/visibility',[site]],
 ['crawler_activity','Get Crawler Activity','GET','/sites/{siteId}/crawler-activity',[site]],
 ['content','Get Article Status','GET','/sites/{siteId}/content',[site]],
 ['article_ideas','List Article Ideas','GET','/sites/{siteId}/content/ideas',[site]],
 ['prepare_article','Prepare Article Proposal','POST','/sites/{siteId}/content/proposals',[site,field('requestId','Stable request UUID (reuse on retry)'),field('promptId','Tracked question ID'),field('sourceJobId','Recorded collection ID','string',false),field('note','Brief notes','string',false)]],
 ['article_task','Get Article Task','GET','/sites/{siteId}/content/tasks/{taskId}',[site,task]],
 ['generate_article','Generate Article Draft','POST','/sites/{siteId}/content/tasks/{taskId}/generate',[site,task,field('confirmGeneration','I approve this proposal and use of one draft allowance','boolean')]],
 ['review_article','Get Article for Review','GET','/sites/{siteId}/content/drafts/{draftId}',[site,draft]],
 ['approve_article','Approve Reviewed Article','POST','/sites/{siteId}/content/drafts/{draftId}/approve',[site,draft,review,field('confirmReview','I reviewed and approve this exact article version','boolean')]],
 ['deliver_article','Send Approved Article','POST','/sites/{siteId}/content/drafts/{draftId}/deliver',[site,draft,review,{...field('requestedStatus','Destination status'),choices:['draft','publish']},field('confirmPublish','I authorize live CMS publication / Git release','boolean',false)]],
 ['schedule_article','Schedule Approved Article','PUT','/sites/{siteId}/content/drafts/{draftId}/schedule',[site,draft,review,field('scheduledFor','ISO publication time with offset; blank cancels','string',false),field('timezone','IANA timezone (for example Europe/London)','string',false),field('confirmSchedule','I authorize this publication schedule or cancellation','boolean')]],
].map(([key,label,method,path,fields])=>({key,label,method,path,fields,description:{
 health:'Read recorded health findings.',visibility:'Read recorded brand mentions and citations; no new AI collection.',crawler_activity:'Read crawler visits; visits are separate from AI mentions.',content:'Read article metadata.',article_ideas:'List ideas from retained tracking evidence; no draft allowance is used.',prepare_article:'Prepare a sourced proposal asynchronously. Reuse requestId on retries. No draft allowance is used.',article_task:'Read task status, proposal, draft and allowance. Wait pollAfterSeconds before polling again.',generate_article:'Only after proposal review and explicit consent. Uses one shared workspace draft allowance; saves an unapproved draft.',review_article:'Read article text, reviewHash and publishing context. Review this version before approval.',approve_article:'Approve the exact reviewed version; stale versions fail.',deliver_article:'Send an approved article as CMS draft or explicitly publish / merge its Git review. Git release does not confirm website deployment.',schedule_article:'Schedule the approved version, or cancel with a blank date. Publication stops if this API key is revoked.'
}[key]}));
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function buildRequest(operation,input){
 for(const f of operation.fields){
  const value=input[f.key];
  if(f.required && (value===undefined || value===null || value===''))throw new Error(`${f.label} is required.`);
  if(value!==undefined && value!==null && value!=='' && (f.key.endsWith('Id') && !uuid.test(value)))throw new Error(`${f.label} must be a UUID.`);
  if(f.type==='boolean' && value!==undefined && value!==true && value!==false)throw new Error(`${f.label} must be a boolean.`);
  if(f.choices && !f.choices.includes(value))throw new Error(`${f.label} is invalid.`);
 }
 if(input.reviewHash!==undefined && !/^[a-f0-9]{64}$/.test(input.reviewHash))throw new Error('Use the reviewHash of the exact article version reviewed.');
 for(const name of ['confirmGeneration','confirmReview','confirmSchedule'])if(operation.fields.some(f=>f.key===name) && input[name]!==true)throw new Error('Explicit review/confirmation is required.');
 if(operation.key==='deliver_article' && input.requestedStatus==='publish' && input.confirmPublish!==true)throw new Error('Live publication requires explicit confirmation.');
 const path=operation.path.replace(/\{(\w+)\}/g,(_,key)=>encodeURIComponent(input[key]));
 const pathFields=[...operation.path.matchAll(/\{(\w+)\}/g)].map(m=>m[1]);
 const body=Object.fromEntries(operation.fields.filter(f=>!pathFields.includes(f.key) && input[f.key]!==undefined && input[f.key]!=='').map(f=>[f.key,input[f.key]]));
 if(operation.key==='schedule_article'){body.scheduledFor=input.scheduledFor || null;body.timezone=input.timezone || 'UTC';}
 return {path,method:operation.method,body:operation.method==='GET'?undefined:body};
}
module.exports={operations,buildRequest};
