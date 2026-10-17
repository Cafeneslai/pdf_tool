/**
 * PenguTools - Image Tools Implementation 🐧
 * 100% In-Browser processing via HTML5 Canvas API & Blob API
 */

const ImageTools = {
  /**
   * Helper: Load an image file into an HTMLImageElement
   */
  loadImage: (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`ไม่สามารถโหลดไฟล์รูปภาพ "${file.name}" ได้`));
      };
      img.src = url;
    });
  },

  /**
   * 1. Compress Image
   * Real image decompression, downscaling, and re-encoding with exact byte comparisons
   */
  compressImage: async (file, options = {}, onProgress) => {
    const {
      quality = 0.75,         // 0.1 to 0.95
      outputFormat = 'auto',  // 'auto', 'image/jpeg', 'image/webp', 'image/png'
      scalePercent = 100,     // 100, 75, 50
      maxWidth = null,
      maxHeight = null
    } = options;

    if (onProgress) onProgress(20, 'กำลังถอดรหัสภาพและตรวจสอบข้อมูลพิกเซล...');
    const img = await ImageTools.loadImage(file);

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    // Apply scale percentage if specified
    if (scalePercent && scalePercent < 100) {
      const factor = scalePercent / 100;
      width = Math.round(width * factor);
      height = Math.round(height * factor);
    }

    // Apply dimension bounding constraints
    if (maxWidth && width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (maxHeight && height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    // Ensure at least 1x1
    width = Math.max(1, width);
    height = Math.max(1, height);

    if (onProgress) onProgress(45, `กำลังปรับความละเอียดภาพเป็น ${width} × ${height} px...`);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Determine target MIME type
    let targetMime = outputFormat;
    const originalType = (file.type || '').toLowerCase();
    const isPng = originalType === 'image/png' || file.name.match(/\.png$/i);

    if (targetMime === 'auto') {
      if (isPng) {
        // For PNG with auto: draw to check transparency or default to WebP for massive compression
        targetMime = 'image/webp';
      } else if (originalType === 'image/webp' || file.name.match(/\.webp$/i)) {
        targetMime = 'image/webp';
      } else {
        targetMime = 'image/jpeg';
      }
    }

    // Handle background fill:
    // If output is JPEG, JPEG cannot have transparent pixels, fill white background
    if (targetMime === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    if (onProgress) onProgress(75, 'กำลังเข้ารหัสและบีบอัดสตรีมภาพ...');
    let blob = await new Promise(resolve => canvas.toBlob(resolve, targetMime, quality));

    // Fallback if browser doesn't support the requested MIME type
    if (!blob) {
      targetMime = 'image/jpeg';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      blob = await new Promise(resolve => canvas.toBlob(resolve, targetMime, quality));
    }

    canvas.width = 0;
    canvas.height = 0;

    const originalSize = file.size;
    const newSize = blob.size;
    const savedBytes = originalSize - newSize;
    const savedPercent = Number((((originalSize - newSize) / originalSize) * 100).toFixed(1));
    const isReduced = newSize < originalSize;

    let ext = 'jpg';
    if (targetMime === 'image/webp') ext = 'webp';
    else if (targetMime === 'image/png') ext = 'png';

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const filename = `${baseName}_compressed.${ext}`;

    if (onProgress) onProgress(100, 'บีบอัดภาพเรียบร้อย!');

    return {
      blob,
      filename,
      originalSize,
      newSize,
      savedBytes,
      savedPercent,
      isReduced,
      width,
      height,
      targetMime
    };
  },

  /**
   * 2. Resize Image
   */
  resizeImage: async (file, options = {}, onProgress) => {
    const {
      targetWidth,
      targetHeight,
      format = 'image/png',
      quality = 0.92
    } = options;

    if (onProgress) onProgress(25, 'กำลังโหลดรูปภาพ...');
    const img = await ImageTools.loadImage(file);

    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    const width = Math.max(1, parseInt(targetWidth, 10) || origWidth);
    const height = Math.max(1, parseInt(targetHeight, 10) || origHeight);

    if (onProgress) onProgress(60, `กำลังปรับขนาดเป็น ${width} x ${height} px...`);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    if (onProgress) onProgress(90, 'กำลังบันทึกภาพ...');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality));
    canvas.width = 0;
    canvas.height = 0;

    let ext = 'png';
    if (format === 'image/jpeg') ext = 'jpg';
    else if (format === 'image/webp') ext = 'webp';

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const filename = `${baseName}_${width}x${height}.${ext}`;

    return {
      blob,
      filename,
      width,
      height,
      origWidth,
      origHeight,
      newSize: blob.size,
      originalSize: file.size
    };
  },

  /**
   * 3. Convert Image Format
   */
  convertImage: async (file, targetFormat = 'image/png', quality = 0.9, onProgress) => {
    if (onProgress) onProgress(30, 'กำลังอ่านรูปภาพต้นฉบับ...');
    const img = await ImageTools.loadImage(file);

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0);

    if (onProgress) onProgress(80, 'กำลังแปลงฟอร์แมต...');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, targetFormat, quality));
    canvas.width = 0;
    canvas.height = 0;

    let ext = 'png';
    if (targetFormat === 'image/jpeg') ext = 'jpg';
    else if (targetFormat === 'image/webp') ext = 'webp';

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const filename = `${baseName}_converted.${ext}`;

    return {
      blob,
      filename,
      originalSize: file.size,
      newSize: blob.size
    };
  },

  /**
   * 4. Batch Compress Multiple Images
   */
  compressMultipleImages: async (files, options = {}, onProgress) => {
    const total = files.length;
    const results = [];
    let totalOrigBytes = 0;
    let totalNewBytes = 0;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (onProgress) {
        const percent = Math.round((i / total) * 90);
        onProgress(percent, `กำลังบีบอัดรูปภาพ ${i + 1}/${total}: ${file.name}...`);
      }
      const res = await ImageTools.compressImage(file, options);
      results.push(res);
      totalOrigBytes += res.originalSize;
      totalNewBytes += res.newSize;
    }

    if (total === 1) {
      return {
        isBatch: false,
        ...results[0]
      };
    }

    if (onProgress) onProgress(93, 'กำลังรวบรวมรูปภาพทั้งหมดเป็นไฟล์ ZIP...');
    if (!window.JSZip) throw new Error('ไม่พบไลบรารี JSZip สำหรับรวมไฟล์');
    const zip = new window.JSZip();
    for (const res of results) {
      zip.file(res.filename, res.blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const savedBytes = totalOrigBytes - totalNewBytes;
    const savedPercent = Number((((totalOrigBytes - totalNewBytes) / totalOrigBytes) * 100).toFixed(1));

    if (onProgress) onProgress(100, 'บีบอัดรูปภาพทั้งหมดเสร็จสิ้น!');

    return {
      isBatch: true,
      blob: zipBlob,
      filename: 'pengutools_compressed_images.zip',
      totalFiles: total,
      originalSize: totalOrigBytes,
      newSize: totalNewBytes,
      savedBytes,
      savedPercent,
      isReduced: totalNewBytes < totalOrigBytes,
      items: results
    };
  },

  /**
   * 5. Batch Convert Multiple Images
   */
  convertMultipleImages: async (files, targetFormat = 'image/png', quality = 0.9, onProgress) => {
    const total = files.length;
    const results = [];
    let totalOrigBytes = 0;
    let totalNewBytes = 0;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (onProgress) {
        const percent = Math.round((i / total) * 90);
        onProgress(percent, `กำลังแปลงฟอร์แมตรูปภาพ ${i + 1}/${total}: ${file.name}...`);
      }
      const res = await ImageTools.convertImage(file, targetFormat, quality);
      results.push(res);
      totalOrigBytes += res.originalSize;
      totalNewBytes += res.newSize;
    }

    if (total === 1) {
      return {
        isBatch: false,
        ...results[0]
      };
    }

    if (onProgress) onProgress(93, 'กำลังรวบรวมรูปภาพเป็นไฟล์ ZIP...');
    if (!window.JSZip) throw new Error('ไม่พบไลบรารี JSZip');
    const zip = new window.JSZip();
    for (const res of results) {
      zip.file(res.filename, res.blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    if (onProgress) onProgress(100, 'แปลงรูปภาพทั้งหมดเสร็จสิ้น!');

    return {
      isBatch: true,
      blob: zipBlob,
      filename: 'pengutools_converted_images.zip',
      totalFiles: total,
      items: results
    };
  }
};

window.ImageTools = ImageTools;
