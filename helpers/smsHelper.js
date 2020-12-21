// Send a SMS message via Twilio

const config = require("../config/config")
const https = require("https");
const queryString = require("querystring");

const sendTwilioSms = (phone, msg, cb) => {
    // Validate Parameters
    phone = typeof(phone) == "string" && phone.trim().length > 0 ? phone.trim() : false;
    msg = typeof(msg) == "string" && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim() : false;

    if (phone && msg) {
        // Configure the request payload
        const payload = {
            From: config.twilio.fromPhone,
            To: '+234' + phone,
            Body: msg
        };

        const stringPayload = queryString.stringify(payload);

        // Configure the request details
        const requestDetails = {
            protocol: "https:",
            hostname: "aoi.twilio.com",
            method: "POST",
            path: "/2010-04-01/Accounts" + config.twilio.accountSid + "/Messages.json",
            auth: config.twilio.accountSid + ":" + config.twilio.authToken,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(stringPayload)
            }
        };

        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode;
            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                cb(false)
            } else {
                cb("Status code returned was" + status)
            }
        });

        // Bind to an error event so it doesn't get thrown
        req.on("error", (err) => {
            cb(err);
        });

        // Add the payload
        req.write(stringPayload);

        //End Request
        req.end();

    } else {
        cb(400, { Error: "Given parameters were missing or invalid" })
    }
};

module.exports = sendTwilioSms