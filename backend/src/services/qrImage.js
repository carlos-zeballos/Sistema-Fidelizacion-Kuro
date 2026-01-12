import QRCode from 'qrcode';

/**
 * Generate QR code as PNG buffer
 */
export async function generateQRPNG(data) {
  try {
    const pngBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1a1a1a',
        light: '#ffffff'
      }
    });
    return pngBuffer;
  } catch (error) {
    console.error('Error generating QR PNG:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as data URL (base64)
 */
export async function generateQRDataURL(data) {
  try {
    const dataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1a1a1a',
        light: '#ffffff'
      }
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    throw new Error('Failed to generate QR code');
  }
}

