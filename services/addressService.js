const Address = require("../models/Address");


const addAddress = async (userId, addressData) => {

    const {
        fullName,
        phone,
        addressLine,
        city,
        state,
        pincode,
        addressType,
        isDefault
    } = addressData;

    if (
        !fullName ||
        !phone ||
        !addressLine ||
        !city ||
        !state ||
        !pincode
    ) {
        throw new Error("All address fields are required");
    }

    // If this is the default address,
    // remove default status from existing addresses
    if (isDefault) {
        await Address.updateMany(
            { userId },
            { $set: { isDefault: false } }
        );
    }

    const address = await Address.create({
        userId,
        fullName,
        phone,
        addressLine,
        city,
        state,
        pincode,
        addressType,
        isDefault
    });

    return address;
};


const getAddresses = async (userId) => {

    return await Address.find({
        userId
    }).sort({
        createdAt: -1
    });
};


const updateAddress = async (
    userId,
    addressId,
    addressData
) => {

    const address = await Address.findOne({
        _id: addressId,
        userId
    });

    if (!address) {
        throw new Error("Address not found");
    }

    if (addressData.isDefault) {
        await Address.updateMany(
            { userId },
            { $set: { isDefault: false } }
        );
    }

    Object.assign(address, addressData);

    await address.save();

    return address;
};


const deleteAddress = async (
    userId,
    addressId
) => {

    const address = await Address.findOneAndDelete({
        _id: addressId,
        userId
    });

    if (!address) {
        throw new Error("Address not found");
    }

    return {
        message: "Address deleted successfully"
    };
};


module.exports = {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress
};