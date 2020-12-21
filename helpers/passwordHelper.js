// Dependencies
const crypto = require("crypto");
const config = require("../config/config")

// Create a SHA256 hash
const hash = (str) => {
    if (typeof(str) == "string" && str.length > 0) {
        const hash = crypto.createHmac("sha256", config.hashingSecret).update(str).digest("hex");
        return hash;
    } else {
        return false
    }
}


module.exports = {
    hash,
}