// Browser-safe Cloudinary upload helper using unsigned upload preset
// The Node.js Cloudinary SDK cannot run in the browser.
// Image uploads are done via direct HTTP POST to Cloudinary's REST API.

const CLOUDINARY_CLOUD_NAME = 'dguaehrat';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // Replace with your actual unsigned upload preset name

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * @param {File} file - The file object to upload
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        throw new Error('Cloudinary upload failed: ' + response.statusText);
    }

    const data = await response.json();
    return { secure_url: data.secure_url, public_id: data.public_id };
}

/**
 * Deletes an image from Cloudinary — must be done via your own server.
 * Call your backend endpoint to delete by public_id instead of calling Cloudinary directly.
 * This is a placeholder to remind you to route deletions through the server.
 */
export function deleteFromCloudinary(public_id) {
    // ⚠️ Cloudinary deletion requires your API secret — it MUST go through your server.
    // Example: return axios.delete('http://localhost:5000/blog/cloudinary-delete', { data: { public_id } });
    console.warn('deleteFromCloudinary: route this through your server API, not the browser.');
}