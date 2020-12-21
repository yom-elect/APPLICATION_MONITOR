// Dependencies
const _data = require("../lib/data");
const helpers = require("../helpers");

const tokenRoute = {}

const tokens = (data, cb) => {
    const method = data.method.toLowerCase();
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(method) !== -1) {
        tokenRoute._tokens[method](data, cb);
    } else {
        cb(405);
    }
}

// container for the Tokens sub-methods
tokenRoute._tokens = {};

// Tokens - post
// Required data: phone, password
tokenRoute._tokens.post = (data, cb) => {
    const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // lookup the user who matches the passed phone number
        _data.read("users", phone, (err, userData) => {
            if (!err && userData) {
                // hash and compare password with already hashed password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.password) {
                    // If valid, create a new token with random name, Set expiration date 1hour ahead
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 3600;
                    const tokenObject = {
                        phone,
                        tokenId,
                        expires
                    };

                    // Store the token
                    _data.create("tokens", tokenId, tokenObject, (err) => {
                        if (!err) {
                            cb(200, tokenObject);
                        } else {
                            cb(500, { Error: "Could not create the new token" })
                        }
                    });
                } else {
                    cb(400, { Error: "Password Mismatch for specified user" })
                }
            } else {
                cb(400, { Error: "Could not find the Specified user" })
            }
        })
    } else {
        cb(400, { Error: "Missing Required field(s)" })
    }
};
// Tokens - get
tokenRoute._tokens.get = (data, cb) => {
    // Check that the tokenId is valid
    const id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //Look up user
        _data.read("tokens", id, (err, tokenData) => {
            if (!err && data) {
                //Remove Password from returned payload
                cb(200, tokenData);
            } else {
                cb(404);
            }
        })
    } else {
        cb(404, { Error: "Missing required field" })
    }
};
// Tokens - put
// Required data : id, extend
tokenRoute._tokens.put = (data, cb) => {
    const id = typeof(data.payload.id) == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == "boolean" && data.payload.extend == true ? true : false;
    if (id && extend) {
        // Look up the token 
        _data.read("tokens", id, (err, tokenData) => {
            if (!err && tokenData) {
                // Check to the make sure the token isin't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration time by an hour
                    tokenData.expires = Date.now() + 1000 * 3600;

                    // Store the new updates
                    _data.update("tokens", id, tokenData, (err) => {
                        if (!err) {
                            cb(200);
                        } else {
                            cb(500, { Error: "Could not update token expiration" })
                        }
                    })
                } else {
                    cb(400, { Error: "This token already expired" })
                }
            } else {
                cb(400, { Error: "specified token doesn't exist" });
            }
        });
    } else {
        cb(400, { Error: "Missing required field(s) or invalid input" })
    }
};
// Tokens - delete
tokenRoute._tokens.delete = (data, cb) => {
    // Check that the phone number is valid
    const id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //Look up token
        _data.read("tokens", id, (err, data) => {
            if (!err && data) {
                _data.delete("tokens", id, (err) => {
                    if (!err) {
                        cb(200);
                    } else {
                        cb(500, { Error: "Could not delete the specified token" })
                    }
                })
            } else {
                cb(400, { Error: "Could not find the specified token" });
            }
        })
    } else {
        cb(400, { Error: "Missing required field" })
    }

}

// Verify if a given token id is currently valid for a given user
tokenRoute._tokens.verifyToken = (id, phone, cb) => {
    // lookup token
    _data.read("tokens", id, (err, tokenData) => {
        if (!err && tokenData) {
            // Check that the  tokens is for the given user and hasn't expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                cb(true);
            } else {
                cb(false);
            }
        } else {
            cb(false)
        }
    })
}


module.exports = { tokens, tokenRoute };