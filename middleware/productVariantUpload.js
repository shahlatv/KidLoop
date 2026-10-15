const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Destination for processed product variant images
const uploadDirectory = path.join(
    __dirname,
    "../public/uploads/product-variants"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Temporarily hold uploaded images in memory.
// Sharp will process them before saving.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only JPG, PNG, and WEBP images are allowed."),
            false
        );
    }
};

const uploadProductVariantImages = multer({
    storage,
    fileFilter,
    limits: {
        files: 10,
        fileSize: 5 * 1024 * 1024
    }
});

// Process uploaded images and save them as WebP
const processProductVariantImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next();
        }

        for (const file of req.files) {
            const filename =
                `variant-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;

            const outputPath = path.join(
                uploadDirectory,
                filename
            );

            await sharp(file.buffer)
                .rotate()
                .resize({
                    width: 1200,
                    height: 1200,
                    fit: "cover",
                    position: "centre",
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

            // Add the processed image details to the file object
            file.filename = filename;
            file.path = outputPath;
        }

        next();
    } catch (error) {
        console.error("Product image processing error:", error);

        // Remove files already processed if a later image fails
        for (const file of req.files || []) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        next(new Error("Unable to process product images. Please try again."));
    }
};

module.exports = {
    uploadProductVariantImages,
    processProductVariantImages
};