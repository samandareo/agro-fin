const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "agro-reports");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + file.originalname.replace(/[^\w.\-]/g, "");
        cb(null, unique);
    },
});

const upload = multer({ storage });

module.exports = upload;