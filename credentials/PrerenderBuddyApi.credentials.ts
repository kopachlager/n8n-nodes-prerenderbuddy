import type { ICredentialType, INodeProperties, IAuthenticateGeneric, ICredentialTestRequest } from 'n8n-workflow';
export class PrerenderBuddyApi implements ICredentialType {
 name='prerenderBuddyApi';displayName='Prerender Buddy API';documentationUrl='https://prerenderbuddy.com/docs/automation-workflows';
 icon:ICredentialType['icon']={light:'file:../assets/prerenderbuddy.svg',dark:'file:../assets/prerenderbuddy-dark.svg'};
 properties:INodeProperties[]=[{displayName:'Developer API Key',name:'apiKey',type:'string',typeOptions:{password:true},default:'',required:true,description:'Use a dedicated PB key with sites and the action scopes you need. Article generation needs content:write; approval/publishing needs content:publish.'}];
 authenticate:IAuthenticateGeneric={type:'generic',properties:{headers:{Authorization:'=Bearer {{$credentials.apiKey}}'}}};
 test:ICredentialTestRequest={request:{baseURL:'https://api.prerenderbuddy.com/v1/developer',url:'/sites',method:'GET'}};
}
