# Prerender Buddy for n8n

Read website health, crawler activity and AI visibility, and connect reviewed article workflows to your websites.

## Install

On self-hosted n8n, open Settings → Community Nodes → Install and enter `n8n-nodes-prerenderbuddy`. Add the Prerender Buddy node, create a Prerender Buddy API credential and choose your website and operation. n8n Cloud requires verification by n8n before the native package is installable.

Twelve actions cover evidence, article ideas, proposals, task status, generation, review, approval, delivery and schedule/cancel. For scheduled evidence reports, use n8n's Schedule Trigger. Article tasks run asynchronously; use a Wait step before polling.

## Connect your workspace

Developer API access is included in Starter, Growth and Pro. In PB, open your avatar menu → Developer API keys and create a dedicated key. Include `sites` for the website selector and only the scopes your workflow needs:

| Scope | Actions |
| --- | --- |
| `health` | Recorded website health |
| `visibility` | Recorded brand appearances and citations |
| `activity` | Recorded crawler visits |
| `content` | Ideas, task status and articles |
| `content:write` | Proposal preparation and confirmed draft generation |
| `content:publish` | Reviewed approval, delivery and scheduling |

Store the key in the platform credential store. Never put it in a workflow export. Website selection is limited to the key's workspace. The actions use PB's production API; evidence reads do not start fresh AI collections.

## Article workflow

List ideas → prepare a sourced proposal → poll its task → review the proposal and allowance → confirm generation → poll → read and review the article → approve its exact review hash → send a CMS draft, explicitly publish, or schedule publication.

All confirmation controls start off. Place a human approval step before generation and live publication. A prefilled `true` boolean does not itself represent a person reviewing the content. Generate uses one shared workspace article allowance. Retain `requestId` for proposal retries and `taskId` for generation retries; retain `reviewHash` only for the exact version reviewed. Follow `pollAfterSeconds` while processing.

To cancel a publication, run Schedule Approved Article with a blank publication time. A revoked API key stops publications scheduled with that key. Git release merges a content pull request; your website host still needs to deploy it.

## Help

- [Setup and workflow guide](https://prerenderbuddy.com/docs/automation-workflows)
- [Developer API documentation](https://prerenderbuddy.com/developer-api)
- [Live OpenAPI contract](https://api.prerenderbuddy.com/v1/developer/openapi.json)
- [Privacy policy](https://prerenderbuddy.com/privacy)
- Support: support@prerenderbuddy.com
