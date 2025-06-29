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
    const userAgent = request.headers.get("user-agent") || "";
    const url = new URL(request.url);
    let originalPath = url.pathname;
    // Allow root path ("/"), "/robots.txt" to be viewed by anyone
    if (!(originalPath === "/" || originalPath === "" || originalPath === "/robots.txt") && !userAgent.includes("UnityPlayer") && !userAgent.includes("VRChat")) {
        return await serve403();
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    let s3Key;

    // Normalize path
    if (originalPath === "/" || originalPath === "") {
        s3Key = "index.html";
    } else if (originalPath === "/404" || originalPath === "/404.html") {
        s3Key = "404.html";
    } else if (originalPath.endsWith("/")) {
        s3Key = originalPath.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
    } else if (!originalPath.split("/").pop().includes('.')) {
        // No extension: try .html, then /index.html
        s3Key = originalPath.replace(/^\//, "") + ".html";
        let response = await fetchS3(s3Key);
        if (response.status === 404) {
            s3Key = originalPath.replace(/^\//, "") + "/index.html";
            response = await fetchS3(s3Key);
            if (response.status === 404) {
                return await serve404();
            }
        }
        return response;
    } else {
        s3Key = originalPath.replace(/^\//, "");
    }

    let response = await fetchS3(s3Key);
    if (response.status === 404) {
        return await serve404();
    }
    return response;
}

async function fetchS3(s3Key) {
    const s3Url = new URL("https://" + `${AWS_S3_BUCKET}.s3.${AWS_DEFAULT_REGION}.s4.mega.io/` + s3Key);
    console.log("Requesting S3 URL:", s3Url.toString());
    const signedRequest = await aws.sign(s3Url);
    // Determine if the file is a video by extension
    const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".m4v", ".mpg", ".mpeg"];
    const isVideo = videoExtensions.some(ext => s3Key.toLowerCase().endsWith(ext));
    let response = await fetch(signedRequest, { "cf": { "cacheEverything": !isVideo } });
    if (isVideo) {
        // Remove any cache headers and set no-store
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        newHeaders.delete("Expires");
        newHeaders.delete("Pragma");
        return new Response(response.body, { status: response.status, headers: newHeaders });
    }
    return response;
}

async function serve404() {
    const s3Url = new URL("https://" + `${AWS_S3_BUCKET}.s3.${AWS_DEFAULT_REGION}.s4.mega.io/404.html`);
    const signedRequest = await aws.sign(s3Url);
    const response = await fetch(signedRequest, { "cf": { "cacheEverything": true } });
    if (response.status === 200) {
        return new Response(response.body, { status: 404, headers: response.headers });
    }
    return new Response("Not Found", { status: 404 });
}

async function serve403() {
    const s3Url = new URL("https://" + `${AWS_S3_BUCKET}.s3.${AWS_DEFAULT_REGION}.s4.mega.io/403.html`);
    const signedRequest = await aws.sign(s3Url);
    const response = await fetch(signedRequest, { "cf": { "cacheEverything": true } });
    if (response.status === 200) {
        return new Response(response.body, { status: 403, headers: response.headers });
    }
    return new Response("Forbidden!", { status: 403 });
}