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

    let originalPath = path;
    let tryHtml = false;
    let isRoot = url.pathname === "/" || path === "";
    let isDir = !isRoot && url.pathname.endsWith("/");

    if (isRoot) {
        path = "index.html";
    } else if (isDir) {
        path = path + "/index.html";
    } else if (!path.includes('.')) {
        // If no extension, try .html
        path = path + ".html";
        tryHtml = true;
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
    console.log("Requesting S3 URL:", url.toString());
    var signedRequest = await aws.sign(url);
    console.log("Signed S3 URL:", signedRequest.url);
    let response = await fetch(signedRequest, { "cf": { "cacheEverything": true } });

    // If not found and we tried .html, try as directory index.html (but not for root)
    if (response.status === 404 && tryHtml && originalPath !== "") {
        url.pathname = "/" + originalPath + "/index.html";
        console.log("Fallback to S3 URL:", url.toString());
        signedRequest = await aws.sign(url);
        console.log("Signed fallback S3 URL:", signedRequest.url);
        response = await fetch(signedRequest, { "cf": { "cacheEverything": true } });
    }

    // If still not found, try to serve 404.html
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