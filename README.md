# Cloudflare Worker for MEGA S4

Provide access S4 buckets via a Cloudflare Worker, so that objects in the bucket may only be publicly accessed via S4. 

## Prerequisites

Make sure you have Git and Node.js installed before proceeding.

## Wrangler

To generate using [wrangler](https://github.com/cloudflare/wrangler)

```
git clone https://github.com/meganz/s4-cloudflare  s4-cloudflare
```
```
cd s4-cloudflare
```
Install wrangler and the rest of the dependencies

```
npm install
```

## Worker Configuration

AWS_ACCESS_KEY_ID = "your S4 access key id".
AWS_SECRET_ACCESS_KEY = "your S4 secret access key".
AWS_DEFAULT_REGION = "Prefered Region" # By default g".
AWS_S3_BUCKET = "YOUR-BUCKET".
routes = [
  { pattern = "YOUR-CUSTOM-DOMAIN", custom_domain = true }
].

#### Optional configs

if you want to allow clients to list objects, otherwise false.
ALLOW_LIST_BUCKET = "true".

## Deploy

Must be logged in to his cloudflare account.
```
npx wrangler deploy
```


## Serverless

To deploy using serverless add a [`serverless.yml`](https://serverless.com/framework/docs/providers/cloudflare/) file.