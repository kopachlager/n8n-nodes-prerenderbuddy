import type { IExecuteFunctions, INodeType, INodeTypeDescription, INodeProperties, INodeExecutionData, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { operations as rawOperations, buildRequest } from '../../operations.cjs';
interface Operation {key:string;label:string;description:string;method:'GET'|'POST'|'PUT';path:string;fields:{key:string;label:string;type:string;required:boolean;choices?:string[]}[]}
const operations=rawOperations as unknown as Operation[];
const fields:INodeProperties[]=operations.flatMap(op=>op.fields.map(f=>({
 displayName:f.label,name:f.key,type:f.type==='boolean'?'boolean':f.choices || f.key==='siteId'?'options':'string',...(f.key==='siteId'?{typeOptions:{loadOptionsMethod:'getSites'}}:{}),default:f.type==='boolean'?false:f.choices?.[0]||'',required:f.required,displayOptions:{show:{operation:[op.key]}},...(f.choices?{options:f.choices.map(value=>({name:value,value}))}:{}),
})));
export class PrerenderBuddy implements INodeType {
 description:INodeTypeDescription={displayName:'Prerender Buddy',name:'prerenderBuddy',icon:{light:'file:../../assets/prerenderbuddy.svg',dark:'file:../../assets/prerenderbuddy-dark.svg'},subtitle:'={{$parameter["operation"]}}',usableAsTool:true,group:['transform'],version:1,description:'Read website evidence and prepare, review and publish articles with explicit approval',defaults:{name:'Prerender Buddy'},inputs:[NodeConnectionTypes.Main],outputs:[NodeConnectionTypes.Main],credentials:[{name:'prerenderBuddyApi',required:true}],properties:[{displayName:'Operation',name:'operation',type:'options',noDataExpression:true,default:'health',options:operations.map(op=>({name:op.label,value:op.key,description:op.description}))},...fields]};
 methods={loadOptions:{async getSites(this:ILoadOptionsFunctions):Promise<INodePropertyOptions[]>{
  const data=await this.helpers.httpRequestWithAuthentication.call(this,'prerenderBuddyApi',{url:'https://api.prerenderbuddy.com/v1/developer/sites',method:'GET',json:true,timeout:30000});
  return (data.sites || []).map((site:{id:string;domain:string;name?:string})=>({name:site.name?`${site.name} (${site.domain})`:site.domain,value:site.id}));
 }}};
 async execute(this:IExecuteFunctions):Promise<INodeExecutionData[][]>{
  const items=this.getInputData();const output:INodeExecutionData[]=[];
  for(let index=0;index<items.length;index++){
   try{
    const key=this.getNodeParameter('operation',index) as string;
    const op=operations.find(item=>item.key===key);if(!op)throw new NodeOperationError(this.getNode(),'Choose a supported PB operation.',{itemIndex:index});
    const input=Object.fromEntries(op.fields.map(f=>[f.key,this.getNodeParameter(f.key,index,f.type==='boolean'?false:'')]));
    const req=buildRequest(op,input);
    const result=await this.helpers.httpRequestWithAuthentication.call(this,'prerenderBuddyApi',{url:'https://api.prerenderbuddy.com/v1/developer'+req.path,method:op.method,json:true,timeout:30000,...(req.body?{body:req.body}:{})});
    output.push({json:result,pairedItem:{item:index}});
   }catch(error){
    if(this.continueOnFail()){output.push({json:{error:error instanceof Error?error.message:'PB request failed.'},pairedItem:{item:index}});continue;}
    throw new NodeOperationError(this.getNode(),error instanceof Error?error:new Error('PB request failed.'),{itemIndex:index});
   }
  }
  return [output];
 }
}
