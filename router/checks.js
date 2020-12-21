const _data = require("../lib/data");
const helpers = require("../helpers");
const config = require("../config/config");
const { tokenRoute } = require("./tokens")

const checksRoute = {}

const checks = (data, cb) => {
    const method = data.method.toLowerCase();
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(method) !== -1) {
        checksRoute._checks[method](data, cb);
    } else {
        cb(405);
    }
};

// Container for all checks method
checksRoute._checks = {};

// Checks -post
// Required data:  protocol, url, method, successCodes, timeoutSeconds
checksRoute._checks.post = (data, cb) => {
    // Validate inputs
    const protocol = typeof(data.payload.protocol) == "string" && ["https", "http"].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == "string" && ["get", "post", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof(data.headers.token) == "string" ? data.headers.token : false;

        // lookup the user by reading the token
        _data.read("tokens", token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;

                // Lookup user
                _data.read("users", userPhone, (err, checkData) => {
                    if (!err && userData) {
                        const userChecks = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];
                        // Verify that the user has less than the number of max-checks-per-user
                        if (userChecks.length < config.maxChecks) {
                            // Create a random id for the checks
                            const checkId = helpers.createRandomString(20);

                            // Create the check object, and include user phone
                            const checkObject = {
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds
                            };

                            // Save the object
                            _data.create("checks", checkId, checkObject, err => {
                                if (!err) {
                                    // Add check id to user object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the object
                                    _data.update("users", userPhone, userData, err => {
                                        if (!err) {
                                            cb(200, checkObject);
                                        } else {
                                            cb(500, { Error: "Could not update user with new check " })
                                        }
                                    })
                                } else {
                                    cb(500, { Error: "Could not create the new check" });
                                }
                            })
                        } else {
                            cb(400, { Error: `The user has reached the maximum number of checks: ${config.maxChecks}` });
                        }
                    } else {
                        cb(403)
                    }
                });
            } else {
                cb(403, { Message: "UnAuthorized user" })
            }
        })

    } else {
        cb(400, { Error: "Missing required input(s), or input(s) are invalid " })
    }

}

// Checks - get
// Required Data checkId
checksRoute._checks.get = (data, cb) => {
    // Check that the phone number is valid
    const id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // read Check
        _data.read("checks", id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == "string" ? data.headers.token : false;
                // Verify that the given token is valid for the user assigned check
                tokenRoute._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // Return check data
                        cb(200, checkData);
                    } else {
                        cb(403)
                    }
                });
            } else {
                cb(404);
            }
        })
    } else {
        cb(404, { Error: "Missing required field" })
    }
};

// Checks - put
// Required Data  checkId, allows other optional data for updates
checksRoute._checks.put = (data, cb) => {
    const id = typeof(data.payload.id) == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    // Check for the optional field
    const protocol = typeof(data.payload.protocol) == "string" && ["https", "http"].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == "string" && ["get", "post", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    // Error if the Id is invalid
    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {

            _data.read("checks", id, (err, checkData) => {
                if (!err && checkData) {
                    const token = typeof(data.headers.token) == "string" ? data.headers.token : false;
                    // Verify that the given token is valid for the phone number
                    tokenRoute._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) checkData.protocol = protocol;
                            if (url) checkData.url = url;
                            if (method) checkData.method = method;
                            if (successCodes) checkData.successCodes = successCodes;
                            if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

                            // Store updates
                            _data.update("checks", id, checkData, err => {
                                if (!err) {
                                    cb(200)
                                } else {
                                    cb(500, { Error: "Could not update the check" })
                                }
                            })
                        } else {
                            cb(403, { Error: "Missing required header token / invalid token" })
                        }
                    });

                } else {
                    cb(400, { Error: "check Id does not exist" })
                }
            });
        } else {
            cb(400, { Error: "Missing Required Fields" })
        }
    } else {
        cb(400, { Error: "Missing Required Fields" })
    }
}

checksRoute._checks.delete = (data, cb) => {
    // Check that the phone number is valid
    const id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {

        _data.read("checks", id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == "string" ? data.headers.token : false;
                // Verify that the given token is valid for the phone number
                tokenRoute._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {

                        // Delete the check data
                        _data.delete("checks", id, err => {
                            if (!err) {
                                //Look up user
                                _data.read("users", checkData.userPhone, (err, userData) => {
                                    if (!err && userData) {
                                        const userChecks = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];

                                        // Remove the deleted check from the list of check
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // Resave the users data

                                            _data.update("users", checkData.userPhone, userData, (err) => {
                                                if (!err) {
                                                    cb(200);
                                                } else {
                                                    cb(500, { Error: "Could not update  the specified user record" })
                                                }
                                            })
                                        } else {
                                            cb(500, { Error: "Could not find the check on the user" })
                                        }

                                    } else {
                                        cb(500, { Error: "Could not find the user who created the check" });
                                    }
                                })
                            } else {
                                cb(500, { Error: " Could not delete the check data" })
                            }
                        });
                    } else {
                        cb(403, { Error: "Missing required header token / invalid token" })
                    }
                });
            } else {
                cb(400, { Error: "The specified checkID does not exit" })
            }
        });
    } else {
        cb(400, { Error: "Missing required field" })
    }
};

module.exports = {
    checks
}