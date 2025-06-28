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

    // Directory or root request: serve index.html
    let originalPath = path;
    if (url.pathname.endsWith("/") || path === "") {
        path = path + (path ? "/" : "") + "index.html";
    }

    // Reject list bucket requests unless configuration allows it
    if (isListBucketRequest(originalPath) && ALLOW_LIST_BUCKET !== "true") {
        return new Response(null, {
            status: 404,
            statusText: "Not Found"
        });
    }
    url.hostname = `${AWS_S3_BUCKET}.s3.${AWS_DEFAULT_REGION}.s4.mega.io`;
    url.pathname = "/" + path;
    var signedRequest = await aws.sign(url);
    let response = await fetch(signedRequest, { "cf": { "cacheEverything": true } });

    // If not found, try to serve 404.html
    if (response.status === 404 && path !== "404.html") {
        url.pathname = "/404.html";
        signedRequest = await aws.sign(url);
        response = await fetch(signedRequest, { "cf": { "cacheEverything": true } });
        if (response.status === 200) {
            return new Response(response.body, { status: 404, headers: response.headers });
        }
    }
    return response;
}