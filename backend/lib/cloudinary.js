const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

function isCloudinaryEnabled() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  if (!isCloudinaryEnabled()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

function uploadBuffer(buffer, options = {}) {
  if (!configureCloudinary()) {
    return Promise.reject(new Error('Cloudinary is not configured'));
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'constituency-cms',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = { isCloudinaryEnabled, uploadBuffer };
