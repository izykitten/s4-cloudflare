//
// Proxy MEGA S4 compatible API requests, sending notifications to a webhook
//
// Adapted from https://github.com/obezuk/worker-signed-s3-template

import { AwsClient } from 'aws4fetch'

const aws = new AwsClient({
    "accessKeyId": AWS_ACCESS_KEY_ID,
    "secretAccessKey": AWS_SECRET_ACCESS_KEY,
    "region": AWS_DEFAULT_REGION,
    "service": "s3"
});


addEventListener('fetch', function (event) {
    event.respondWith(handleRequest(event.request))
});

function isListBucketRequest(path) {

    if ("$path") {
        return path.length === 0;
    }
}

async function handleRequest(request) {

    // Only allow GET and HEAD methods
    if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    var url = new URL(request.url);
    // Remove leading slashes from path
    let path = url.pathname.replace(/^\//, '');
    // Remove trailing slashes
    path = path.replace(/\/$/, '');


    // Reject list bucket requests unless configuration allows it
    if (isListBucketRequest(path) && ALLOW_LIST_BUCKET !== "true") {
        return new Response(null, {
            status: 404,
            statusText: "Not Found"
        });
    }
    url.hostname = `${AWS_S3_BUCKET}.s3.${AWS_DEFAULT_REGION}.s4.mega.io`;
    var signedRequest = await aws.sign(url);
    console.log("Signed Request URL:", signedRequest.url);
    console.log("Hostname: ", signedRequest.hostname)
    console.log("Signed Request Method:", signedRequest.method);
    console.log("Signed Request Headers:", [...signedRequest.headers.entries()]);
    console.log("Signed Request Body:", signedRequest.body);
    console.log("Signed Request Mode:", signedRequest.mode);
    console.log("Signed Request Cache:", signedRequest.cache);
    return await fetch(signedRequest, { "cf": { "cacheEverything": true } });
}