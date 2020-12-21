// Parse JSON string to an object in all cases, without throwing
const parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {};
    }
};

const createRandomString = (strLength) => {
    strLength = typeof(strLength) == "number" && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all possible characters that could go into the string
        const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789"

        // Start the final string
        let str = "";
        for (let i = 1; i <= strLength; i++) {
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter
        }
        return str;
    } else {
        return false;
    }
};

module.exports = { parseJsonToObject, createRandomString }