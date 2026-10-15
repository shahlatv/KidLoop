const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: [150, "Product name cannot exceed 150 characters"]
        },

        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Product category is required"]
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            default: null
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"]
        },

        discount: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"],
            max: [100, "Discount cannot exceed 100%"]
        },

        highlights: [
            {
                type: String,
                trim: true
            }
        ],

        isListed: {
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

// Help product listing queries.
productSchema.index({
    category: 1,
    isListed: 1,
    isDeleted: 1
});

productSchema.index({
    name: 1
});

module.exports = mongoose.model("Product", productSchema);