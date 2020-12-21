// All the server logic commmon for both http and https
const { StringDecoder } = require("string_decoder");
const url = require("url");
const { handlers, router } = require("../router")
const helpers = require("../helpers");

const unifiedServer = (req, res) => {
    // Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    //Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "");

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the http Method
    const method = req.method.toUpperCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload if any
    const decoder = new StringDecoder("utf8");
    let buffer = "";
    req.on("data", (data) => {
        buffer += decoder.write(data)
    });
    req.on("end", () => {
        buffer += decoder.end();

        // Choose the handler this request should go to. if none is found use the Not found route
        const choosenHandler = typeof(router[trimmedPath]) !== "undefined" ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            "payload": helpers.parseJsonToObject(buffer)
        }

        // Route the request to the handler specified in the router
        choosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to  200
            statusCode = typeof(statusCode) == "number" ? statusCode : 200;

            // Use the Payload called back by the handler, or default to an empty object
            payload = typeof(payload) == "object" ? payload : {};

            // Convert the payload to a string 
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log("Return this response", statusCode, payloadString);
        })
    });


}

module.exports = unifiedServer;