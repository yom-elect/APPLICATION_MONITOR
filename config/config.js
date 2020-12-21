/**
   Create and export configuration variables
 */

// Container for all the environment
let environments = {};

// Staging {default} environment
environments.staging = {
    httpPort: 4000,
    httpsPort: 4001,
    envName: "staging",
    hashingSecret: "thisIsASecret",
    maxChecks: 5,
    twilio: {
        accountSid: "AC899e81831a580dd93e4a723fa1d82364",
        authToken: "1e05251097e1697ea4392da998770740",
        fromPhone: "+12132618815"
    }
};

// Production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashingSecret: "thisIsAlsoASecret",
    maxChecks: 5
};

// Determine which environment was passed as a command line
const currentEnvironment = typeof(process.env.NODE_ENV) == "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Check that the current environment is one of the environment above, else use default environment
const environmentToExport = typeof(environments[currentEnvironment]) == "object" ? environments[currentEnvironment] : environments.staging;

// Export module
module.exports = environmentToExport;