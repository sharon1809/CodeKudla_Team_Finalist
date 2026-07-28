"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Upload a local file to Cloudinary
 * For non-image files like PDF and DOCX, resource_type MUST be 'raw'
 */
const uploadToCloudinary = async (filePath, folder = 'rag_documents') => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            folder,
            resource_type: 'raw',
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
    catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete a file from Cloudinary by its public ID
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: 'raw',
        });
    }
    catch (error) {
        throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
