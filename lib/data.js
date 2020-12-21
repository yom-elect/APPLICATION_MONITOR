/**
  Storing and editing data
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("../helpers");

// Container for the module (to be exported)
const lib = {};

lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file
lib.create = (dir, file, data, cb) => {

    fs.mkdirSync(lib.baseDir + dir, { recursive: true }, (err) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Directory is made")
        }
    });
    // Open the file for writing
    fs.open(lib.baseDir + dir + "/" + file + ".json", "wx", (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // convert data to string
            const stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            cb(false);
                        } else {
                            cb("Error closing new file");
                        }
                    });
                } else {
                    cb("Error writing to new file");
                }
            });
        } else {
            cb("Could not create file, it may already exist");
        }
    })
};

// Read from File
lib.read = (dir, file, cb) => {
    fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            cb(false, parsedData);
        } else {
            cb(err, data);
        }

    })
};

lib.update = (dir, file, data, cb) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + "/" + file + ".json", "r+", (err, fd) => {
        if (!err && fd) {
            // convert data to string
            const stringData = JSON.stringify(data);

            fs.ftruncate(fd, (err) => {
                if (!err) {
                    //Write to file and close it
                    fs.writeFile(fd, stringData, (err) => {
                        if (!err) {
                            fs.close(fd, (err) => {
                                if (!err) {
                                    cb(false)
                                } else {
                                    cb("Error closing exiting file");
                                }
                            })
                        } else {
                            cb("Could write to file")
                        }
                    })
                } else {
                    cb("Error truncating file ")
                }
            })
        } else {
            cd("Could not open the file for updating., it may not exit yet")
        }
    })
};

// Delete a file
lib.delete = (dir, file, cb) => {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
        if (!err) {
            cb(false)
        } else {
            cb("Error deleting file");
        }
    })
};


module.exports = lib;