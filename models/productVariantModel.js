const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"]
        },

        color: {
            type: String,
            required: [true, "Color is required"],
            trim: true
        },

        size: {
            type: String,
            required: [true, "Size is required"],
            trim: true
        },

        images: {
            type: [
                {
                    type: String,
                    trim: true
                }
            ],
            validate: {
                validator: function (images) {
                    return images.length >= 3;
                },
                message: "Each variant requires at least 3 images"
            }
        },

        stock: {
            type: Number,
            required: [true, "Stock quantity is required"],
            default: 0,
            min: [0, "Stock cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Stock must be a whole number"
            }
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// A product should not have duplicate active variants
// with the same color and size.
productVariantSchema.index(
    { product: 1, color: 1, size: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

productVariantSchema.index({
    product: 1,
    isActive: 1,
    isDeleted: 1
});

module.exports = mongoose.model(
    "ProductVariant",
    productVariantSchema
);