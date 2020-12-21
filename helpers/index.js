// Dependencies
const { hash } = require("./passwordHelper");
const { parseJsonToObject, createRandomString } = require("./generalHelper");
const sendTwilioSms = require("./smsHelper");

const helpers = {};

helpers.hash = hash;
helpers.parseJsonToObject = parseJsonToObject;
helpers.createRandomString = createRandomString;
helpers.sendTwilioSms = sendTwilioSms;

// Export module
module.exports = helpers;