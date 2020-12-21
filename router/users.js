// Dependencies
const _data = require("../lib/data");
const helpers = require("../helpers");
const { tokenRoute } = require("./tokens");

const userRoute = {}

const users = (data, cb) => {
    const method = data.method.toLowerCase();
    const acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(method) !== -1) {
        userRoute._users[method](data, cb);
    } else {
        cb(405);
    }
}

// container for the users sub-methods
userRoute._users = {};

//@TODO Authenticate users to carry out tasks
// Users - post
userRoute._users.post = (data, cb) => {
    const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == "boolean" && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // checking User doesn't already exit
        _data.read("users", phone, (err, data) => {
            if (err) {
                // Hash the  password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    // create the user object 
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        password: hashedPassword,
                        tosAgreement
                    };
                    _data.create("users", phone, userObject, (err) => {
                        if (!err) {
                            cb(200)
                        } else {
                            console.log(err);
                            cb(500, { Error: "Could not create the new user" });
                        }
                    })
                } else {
                    cb(500, { Error: "Something Went wrong hashing user info" })
                }
            } else {
                // User already exists
                cb(400, { Error: "a user with that phone number already exists" });
            }
        })
    } else {
        cb(400, { Error: "Missing Required fields" });
    }
};
// Users - get
userRoute._users.get = (data, cb) => {
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == "string" && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

        const token = typeof(data.headers.token) == "string" ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        tokenRoute._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                //Look up user
                _data.read("users", phone, (err, data) => {
                    if (!err && data) {
                        //Remove Password from returned payload
                        delete data.password
                        cb(200, data)
                    } else {
                        cb(404);
                    }
                })

            } else {
                cb(403, { Error: "Missing required header token / invalid token" })
            }
        });
    } else {
        cb(404, { Error: "Missing required field" })
    }
};
// Users - put
userRoute._users.put = (data, cb) => {
    const phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;

    // Check for the optional field
    const firstName = typeof(data.payload.firstName) == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (phone) {


        if (firstName || lastName || password) {

            const token = typeof(data.headers.token) == "string" ? data.headers.token : false;
            // Verify that the given token is valid for the phone number
            tokenRoute._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    // Lookup user
                    _data.read("users", phone, (err, userData) => {
                        if (!err && userData) {
                            // Update the field necessary
                            if (firstName) userData.firstName = firstName;
                            if (lastName) userData.lastName = lastName;
                            if (password) userData.password = helpers.hash(password);

                            // store the new updates
                            _data.update("users", phone, userData, (err) => {
                                if (!err) {
                                    cb(200);
                                } else {
                                    console.log(err)
                                    cb(500, { Error: "could not update the user" })
                                }
                            })
                        } else {
                            cb(400, { Error: "The specified user does not exist" })
                        }
                    })
                } else {
                    cb(403, { Error: "Missing required header token / invalid token" })
                }
            });

        } else {
            cb(400, { Error: "Missing Required Fields" })
        }
    } else {
        cb(400, { Error: "Missing Required Fields" })
    }


};
// Users - delete
userRoute._users.delete = (data, cb) => {
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == "string" && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

        const token = typeof(data.headers.token) == "string" ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        tokenRoute._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                //Look up user
                _data.read("users", phone, (err, userData) => {
                    if (!err && userData) {
                        _data.delete("users", phone, (err) => {
                            if (!err) {
                                // Delete each of the checks attached to a user
                                const userChecks = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];
                                const checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    const checksDeleted = 0;
                                    const deletionErrors = false;
                                    // Loop through the checks

                                    userChecks.forEach(checkId => {
                                        // Delete the check\
                                        _data.delete("checks", checkId, err => {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    cb(200)
                                                } else {
                                                    cb(500, { Error: "Error encounted while trying to delete checks assigned to user, checks might not be deleted successfully" })
                                                }
                                            }
                                        })
                                    })
                                } else {
                                    cb(200)
                                }
                            } else {
                                cb(500, { Error: "Could not delete the specified user" })
                            }
                        })
                    } else {
                        cb(400, { Error: "Could not find the specified user" });
                    }
                })
            } else {
                cb(403, { Error: "Missing required header token / invalid token" })
            }
        });

    } else {
        cb(400, { Error: "Missing required field" })
    }
}

module.exports = users;