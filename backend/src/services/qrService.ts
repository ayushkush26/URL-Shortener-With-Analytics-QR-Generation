import QRCode from 'qrcode';
import crypto from 'crypto';
import { QRCode as QRCodeModel } from '../models/QRCode';
import { ShortUrl } from '../models/ShortUrl';

interface QRCodeOptions {
  format?: 'png' | 'svg' | 'pdf';
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate QR code for a short URL
 */
export const generateQRCode = async (
  shortUrlId: string,
  shortCode: string,
  baseUrl: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  const {
    format = 'png',
    size = 256,
    errorCorrectionLevel = 'M',
  } = options;

  // Construct the full URL
  const fullUrl = `${baseUrl}/${shortCode}`;

  // Check if QR code already exists
  const existingQR = await QRCodeModel.findOne({ shortUrlId });
  if (existingQR) {
    return existingQR.storageUrl;
  }

  // Generate QR code
  let qrCodeData: string;
  try {
    if (format === 'svg') {
      qrCodeData = await QRCode.toString(fullUrl, {
        type: 'svg',
        width: size,
        errorCorrectionLevel,
      });
    } else if (format === 'pdf') {
      // For PDF, we'll generate as PNG and convert (simplified)
      qrCodeData = await QRCode.toDataURL(fullUrl, {
        width: size,
        errorCorrectionLevel,
      });
    } else {
      // PNG as data URL
      qrCodeData = await QRCode.toDataURL(fullUrl, {
        width: size,
        errorCorrectionLevel,
      });
    }
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
  }

  // Generate hash for uniqueness
  const hash = crypto.createHash('sha256').update(qrCodeData).digest('hex');

  // Save to database
  // Save to database
  try {
    const qrCodeDoc = await QRCodeModel.create({
      shortUrlId,
      format,
      size,
      storageUrl: qrCodeData, // In production, upload to S3/Cloudinary and store URL
      hash,
      generatedAt: new Date(),
    });

    return qrCodeDoc.storageUrl;
  } catch (error: any) {
    console.error(`QR Generation Error for ${shortUrlId}:`, error);

    // Handle duplicate hash error (likely from an orphaned QR code)
    if (error.code === 11000 || error.message?.includes('duplicate key')) {
      console.log('Found existing QR with same hash, checking for orphan...');

      const existingHashQR = await QRCodeModel.findOne({ hash });

      if (existingHashQR) {
        console.log(`Existing QR found: ${existingHashQR._id} for shortUrlId: ${existingHashQR.shortUrlId}`);
        // Check if the associated ShortUrl exists
        const parentUrl = await ShortUrl.findById(existingHashQR.shortUrlId);

        if (!parentUrl) {
          console.log(`Adopting orphaned QR code ${existingHashQR._id} for new URL ${shortUrlId}`);
          // Update the owner of this QR code to the new URL
          // Cast string to ObjectId
          const mongoose = await import('mongoose');
          existingHashQR.shortUrlId = new mongoose.Types.ObjectId(shortUrlId);
          await existingHashQR.save();
          return existingHashQR.storageUrl;
        } else {
          console.error("Critical: Hash collision with existing valid URL. This should not happen.");
        }
      } else {
        console.error("Duplicate key error but could not find existing document?");
      }
    }
    throw error;
  }
};

/**
 * Get QR code for a short URL
 */
export const getQRCode = async (shortUrlId: string): Promise<string | null> => {
  const qrCode = await QRCodeModel.findOne({ shortUrlId });
  return qrCode?.storageUrl || null;
};

/**
 * Regenerate QR code
 */
export const regenerateQRCode = async (
  shortUrlId: string,
  shortCode: string,
  baseUrl: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  // Delete existing QR code
  await QRCodeModel.deleteOne({ shortUrlId });

  // Generate new one
  return generateQRCode(shortUrlId, shortCode, baseUrl, options);
};

/**
 * Delete QR code for a short URL
 */
export const deleteQRCode = async (shortUrlId: string): Promise<void> => {
  await QRCodeModel.deleteOne({ shortUrlId });
};

