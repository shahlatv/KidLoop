const addressService = require("../services/addressService");


const addAddress = async (req, res) => {
    try {
        const address = await addressService.addAddress(
            req.session.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAddresses = async (req, res) => {
    try {
        const addresses = await addressService.getAddresses(
            req.session.userId
        );

        res.status(200).json({
            success: true,
            addresses
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateAddress = async (req, res) => {
    try {
        const address = await addressService.updateAddress(
            req.session.userId,
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteAddress = async (req, res) => {
    try {
        const result = await addressService.deleteAddress(
            req.session.userId,
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress
};