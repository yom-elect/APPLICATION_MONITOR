/**
 * Request Handlers
 */
const ping = require("./ping")
const users = require("./users");
const { tokens } = require("./tokens")
const { checks } = require("./checks")
    // Define the handler
const handlers = {};

handlers.notFound = function(data, cb) {
    cb(404);
};
// Users handler
handlers.users = users;

// Token handler
handlers.tokens = tokens;

// Checks handler
handlers.checks = checks;

// Ping handler
handlers.ping = ping;

// Define a request handler
const router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
};

module.exports = {
    handlers,
    router
}