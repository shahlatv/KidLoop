const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Folder where category images will be stored.
const uploadDirectory = path.join(
    __dirname,
    "../public/uploads/categories"
);

// Create the folder if it does not exist.
fs.mkdirSync(uploadDirectory, {
    recursive: true
});

// Configure image storage.
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `category-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        callback(null, uniqueName);
    }
});

// Allow only supported image types.
const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new Error("Only JPG, PNG, and WEBP images are allowed.")
        );
    }
};

// Configure upload limits.
const uploadCategoryImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

module.exports = uploadCategoryImage;