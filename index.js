import { AwsClient } from 'aws4fetch'

const aws = new AwsClient({
    "accessKeyId": AWS_ACCESS_KEY_ID,
    "secretAccessKey": AWS_SECRET_ACCESS_KEY,
    "region": AWS_DEFAULT_REGION
});

addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
    var url = new URL(request.url);
    url.hostname = AWS_S3_BUCKET;
    var signedRequest = await aws.sign(url);
    return await fetch(signedRequest, { "cf": { "cacheEverything": true } });
}