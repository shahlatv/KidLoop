const Category = require("../models/categoryModel");

// Create a new category
const createCategory = async (name, image) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
        throw new Error("Category name is required");
    }

    if (!image) {
        throw new Error("Category image is required");
    }

    // Check for an existing category with the same name
    const existingCategory = await Category.findOne({
        name: {
            $regex: `^${escapeRegex(trimmedName)}$`,
            $options: "i"
        },
        isDeleted: false
    });

    if (existingCategory) {
        throw new Error("A category with this name already exists");
    }

    return await Category.create({
        name: trimmedName,
        image,
        isActive: true
    });
};


// Get categories with backend search, pagination and sorting
const getAllCategories = async (options = {}) => {
    const {
        search = "",
        page = 1,
        sort = "newest"
    } = options;

    const currentPage = Math.max(
        1,
        parseInt(page, 10) || 1
    );

    const limit = 10;
    const skip = (currentPage - 1) * limit;

    // Exclude archived categories
    const filter = {
        isDeleted: false
    };

    // Backend search by category name
    if (search.trim()) {
        filter.name = {
            $regex: escapeRegex(search.trim()),
            $options: "i"
        };
    }

    // Available sorting options
    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        "name-asc": { name: 1 },
        "name-desc": { name: -1 }
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    // Fetch the current page and total matching count
    const [categories, totalCategories] = await Promise.all([
        Category.find(filter)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .lean(),

        Category.countDocuments(filter)
    ]);

    return {
        categories,
        currentPage,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories,
        search: search.trim(),
        sort: sortOptions[sort] ? sort : "newest"
    };
};


// Get one category by ID
const getCategoryById = async (id) => {
    const category = await Category.findOne({
        _id: id,
        isDeleted: false
    });

    if (!category) {
        throw new Error("Category not found");
    }

    return category;
};


// Update category details
const updateCategory = async (id, name, image) => {
    const category = await getCategoryById(id);

    if (name !== undefined) {
        const trimmedName = name.trim();

        if (!trimmedName) {
            throw new Error("Category name is required");
        }

        const existingCategory = await Category.findOne({
            _id: { $ne: id },
            name: {
                $regex: `^${escapeRegex(trimmedName)}$`,
                $options: "i"
            },
            isDeleted: false
        });

        if (existingCategory) {
            throw new Error("A category with this name already exists");
        }

        category.name = trimmedName;
    }

    if (image) {
        category.image = image;
    }

    await category.save();

    return category;
};


// Activate or deactivate a category
const toggleCategoryStatus = async (id) => {
    const category = await getCategoryById(id);

    category.isActive = !category.isActive;

    await category.save();

    return category;
};


// Archive a category instead of permanently deleting it
const archiveCategory = async (id) => {
    const category = await getCategoryById(id);

    category.isDeleted = true;
    category.isActive = false;

    await category.save();

    return category;
};


// Escape special characters before using a value in a regular expression
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    toggleCategoryStatus,
    archiveCategory
};