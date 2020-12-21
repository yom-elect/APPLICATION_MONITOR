/**
  Primary file for Api
*/

// Dependencies
const http = require("http");
const https = require("https")
const config = require("./config/config");
const unifiedServer = require("./utils/serverFunction");
const fs = require("fs");

const helpers = require("./helpers")

helpers.sendTwilioSms("7033382402", "Hello dear", (err) => {
    console.log("This was the error", err)
})

// Instantiate Http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start HTTP server to listen on Port 
httpServer.listen(config.httpPort, () => {
    console.log("Server Environment:", config.envName, "Listening on", config.httpPort)
});

const httpsServerOptions = {
    key: fs.readFileSync("./https/key.pem"),
    cert: fs.readFileSync("./https/cert.pem"),
}

// Instantiate HTTPS server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});

// Start HTTPS Server to listen on Port
httpsServer.listen(config.httpsPort, () => {
    console.log("Server Environment:", config.envName, "Listening on", config.httpsPort)
});