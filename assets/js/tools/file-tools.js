/**
 * PenguTools - File Utilities Implementation 🐧
 * 100% In-Browser utilities: File Size Checker, ZIP Files, File Information
 */

const FileTools = {
  /**
   * Helper: Calculate SHA-256 hash in browser using Web Crypto API
   */
  calculateSha256: async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Helper: Detect real file signature from Magic Bytes
   */
  detectMagicBytes: async (file) => {
    if (!file || file.size === 0) {
      return {
        hexSignature: '00 (Empty)',
        detectedType: 'ไฟล์ว่างเปล่า (Empty File 0 Bytes)'
      };
    }

    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

    let detectedType = 'Unknown / Binary';

    // Signatures
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      detectedType = 'PDF Document (%PDF)';
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      detectedType = 'PNG Image (‰PNG)';
    } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      detectedType = 'JPEG Image';
    } else if (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05)) {
      detectedType = 'ZIP / Office Archive (PK)';
    } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      // Check for WEBP
      const ascii = String.fromCharCode(...bytes.slice(8, 12));
      detectedType = ascii === 'WEBP' ? 'WebP Image (RIFF...WEBP)' : 'RIFF Container';
    } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      detectedType = 'GIF Image';
    } else if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      detectedType = 'BMP Image';
    }

    return {
      hexSignature: hex.slice(0, 23),
      detectedType
    };
  },

  /**
   * Helper: Format network transfer time
   */
  calculateTransferTime: (bytes, speedMbps) => {
    if (!bytes || bytes <= 0) return '0 วินาที';
    const bits = bytes * 8;
    const speedBps = speedMbps * 1000 * 1000;
    const seconds = bits / speedBps;
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)} มิลลิวินาที`;
    } else if (seconds < 60) {
      return `${seconds.toFixed(2)} วินาที`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSecs = Math.round(seconds % 60);
      return `${minutes} นาที ${remainingSecs} วินาที`;
    }
  },

  /**
   * 1. File Size Checker
   */
  checkFileSize: (file) => {
    const bytes = file.size || 0;
    const kb = (bytes / 1024).toFixed(2);
    const mb = (bytes / (1024 * 1024)).toFixed(3);
    const gb = (bytes / (1024 * 1024 * 1024)).toFixed(4);

    const emailLimit25Mb = 25 * 1024 * 1024;
    const isEmailSafe = bytes <= emailLimit25Mb;

    return {
      name: file.name,
      bytes: bytes.toLocaleString() + ' Bytes',
      kb: kb + ' KB',
      mb: mb + ' MB',
      gb: gb + ' GB',
      isEmailSafe,
      transferTimes: {
        network4g: FileTools.calculateTransferTime(bytes, 30),
        network5g: FileTools.calculateTransferTime(bytes, 300),
        fiber: FileTools.calculateTransferTime(bytes, 1000),
        usb2: FileTools.calculateTransferTime(bytes, 480),
        usb3: FileTools.calculateTransferTime(bytes, 5000)
      }
    };
  },

  /**
   * 2. ZIP Multiple Files
   */
  zipFiles: async (fileList, zipName = 'pengu_archive.zip', onProgress) => {
    if (!window.JSZip) throw new Error('ไม่พบไลบรารี JSZip');
    const zip = new window.JSZip();

    const total = fileList.length;
    const seenNames = new Map();

    for (let i = 0; i < total; i++) {
      const file = fileList[i];
      if (onProgress) onProgress(Math.round(((i) / total) * 85), `กำลังบีบอัดไฟล์ ${i + 1}/${total}: ${file.name}...`);
      
      let finalName = file.name;
      if (seenNames.has(finalName)) {
        const count = seenNames.get(finalName) + 1;
        seenNames.set(finalName, count);
        const lastDot = finalName.lastIndexOf('.');
        if (lastDot > 0) {
          finalName = `${finalName.substring(0, lastDot)}_${count}${finalName.substring(lastDot)}`;
        } else {
          finalName = `${finalName}_${count}`;
        }
      } else {
        seenNames.set(finalName, 1);
      }

      const buffer = await file.arrayBuffer();
      zip.file(finalName, buffer);
    }

    if (onProgress) onProgress(90, 'กำลังจัดทำไฟล์ ZIP สมบูรณ์...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (metadata) => {
      if (onProgress && metadata.percent) {
        onProgress(Math.round(85 + (metadata.percent * 0.14)), `กำลังสร้างไฟล์ ZIP (${Math.round(metadata.percent)}%)...`);
      }
    });

    const totalOriginalSize = fileList.reduce((acc, f) => acc + f.size, 0);

    return {
      blob: zipBlob,
      filename: zipName.endsWith('.zip') ? zipName : `${zipName}.zip`,
      totalOriginalSize,
      zipSize: zipBlob.size
    };
  },

  /**
   * 3. Comprehensive File Information
   */
  inspectFile: async (file, onProgress) => {
    if (onProgress) onProgress(30, 'กำลังตรวจสอบโครงสร้างและ Signature ของไฟล์...');
    const magicInfo = await FileTools.detectMagicBytes(file);

    if (onProgress) onProgress(70, 'กำลังคำนวณรหัสความปลอดภัย SHA-256 Checksum...');
    const sha256 = await FileTools.calculateSha256(file);

    let extraDetails = {};

    // Check for Image dimensions
    if (file.type.startsWith('image/')) {
      try {
        const objUrl = URL.createObjectURL(file);
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => {
            URL.revokeObjectURL(objUrl);
            res(i);
          };
          i.onerror = (e) => {
            URL.revokeObjectURL(objUrl);
            rej(e);
          };
          i.src = objUrl;
        });
        extraDetails['ขนาดรูปภาพ (Dimensions)'] = `${img.naturalWidth} × ${img.naturalHeight} พิกเซล`;
      } catch (e) {
        // ignore
      }
    }

    // Check for PDF page count
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      if (window.PDFLib) {
        try {
          const ab = await file.arrayBuffer();
          const doc = await window.PDFLib.PDFDocument.load(ab, { ignoreEncryption: true });
          extraDetails['จำนวนหน้าทั้งหมด (Page Count)'] = `${doc.getPageCount()} หน้า`;
        } catch (e) {
          // ignore
        }
      }
    }

    const lastModifiedDate = new Date(file.lastModified).toLocaleString('th-TH', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    return {
      name: file.name,
      sizeFormatted: PdfTools.formatSize(file.size) + ` (${file.size.toLocaleString()} Bytes)`,
      extension: (file.name.split('.').pop() || 'ไม่มี').toUpperCase(),
      mimeType: file.type || 'ไม่ระบุ (application/octet-stream)',
      magicSignature: magicInfo.hexSignature,
      detectedFileType: magicInfo.detectedType,
      sha256,
      lastModified: lastModifiedDate,
      extraDetails
    };
  },

  /**
   * 4. Compare Two Files by SHA-256 Checksum
   */
  compareFiles: async (file1, file2, onProgress) => {
    if (onProgress) onProgress(25, `กำลังคำนวณ Checksum ไฟล์ที่ 1: ${file1.name}...`);
    const hash1 = await FileTools.calculateSha256(file1);

    if (onProgress) onProgress(70, `กำลังคำนวณ Checksum ไฟล์ที่ 2: ${file2.name}...`);
    const hash2 = await FileTools.calculateSha256(file2);

    if (onProgress) onProgress(95, 'กำลังตรวจสอบความสอดคล้องของข้อมูล...');
    const isIdentical = hash1 === hash2;
    const sizeDiff = Math.abs(file1.size - file2.size);

    return {
      isIdentical,
      file1: {
        name: file1.name,
        size: file1.size,
        sizeFormatted: window.PdfTools.formatSize(file1.size),
        hash: hash1
      },
      file2: {
        name: file2.name,
        size: file2.size,
        sizeFormatted: window.PdfTools.formatSize(file2.size),
        hash: hash2
      },
      sizeDiff,
      sizeDiffFormatted: window.PdfTools.formatSize(sizeDiff)
    };
  },

  /**
   * 5. Inspect ZIP File Contents and allow selective extraction
   */
  inspectZip: async (file, onProgress) => {
    if (!window.JSZip) throw new Error('ไม่พบไลบรารี JSZip');
    if (onProgress) onProgress(30, 'กำลังเปิดอ่านโครงสร้างไฟล์ ZIP...');
    const zip = await window.JSZip.loadAsync(file);

    const entries = [];
    let totalUncompressedSize = 0;

    const fileNames = Object.keys(zip.files);
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const zipEntry = zip.files[fileName];
      if (!zipEntry.dir) {
        const entrySize = zipEntry._data ? (zipEntry._data.uncompressedSize || 0) : 0;
        totalUncompressedSize += entrySize;
        entries.push({
          index: entries.length,
          name: fileName,
          date: zipEntry.date ? new Date(zipEntry.date).toLocaleString('th-TH') : '-',
          size: entrySize,
          sizeFormatted: window.PdfTools.formatSize(entrySize)
        });
      }
    }

    if (onProgress) onProgress(100, 'อ่านโครงสร้างไฟล์ ZIP สำเร็จ!');

    // Cache the active zip object and entries for selective download
    window._currentInspectedZip = zip;
    window._currentInspectedZipEntries = entries;

    return {
      zipName: file.name,
      zipSize: file.size,
      zipSizeFormatted: window.PdfTools.formatSize(file.size),
      totalEntries: entries.length,
      totalUncompressedSize: window.PdfTools.formatSize(totalUncompressedSize),
      entries
    };
  },

  /**
   * Helper: Extract and download a single file from the loaded ZIP by entry index or name
   */
  downloadZipEntryByIndex: async (indexOrName) => {
    if (!window._currentInspectedZip || !window._currentInspectedZipEntries) {
      throw new Error('ไม่พบข้อมูลไฟล์ ZIP กรุณาเปิดไฟล์อีกครั้ง');
    }
    let item;
    if (typeof indexOrName === 'number') {
      item = window._currentInspectedZipEntries[indexOrName];
    } else if (typeof indexOrName === 'string') {
      item = window._currentInspectedZipEntries.find(e => e.name === indexOrName);
    }
    if (!item && typeof indexOrName === 'string') {
      item = { name: indexOrName };
    }
    if (!item) {
      throw new Error('ไม่พบข้อมูลไฟล์ที่เลือกใน ZIP');
    }
    const zipEntry = window._currentInspectedZip.file(item.name);
    if (!zipEntry) {
      throw new Error(`ไม่พบไฟล์ "${item.name}" ใน ZIP`);
    }

    const blob = await zipEntry.async('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name.split('/').pop() || item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },

  /**
   * Helper: Extract and download a single file from the loaded ZIP (legacy name support)
   */
  downloadSingleZipEntry: async (entryName) => {
    if (!window._currentInspectedZip) throw new Error('ไม่พบข้อมูลไฟล์ ZIP');
    const zipEntry = window._currentInspectedZip.file(entryName);
    if (!zipEntry) throw new Error(`ไม่พบไฟล์ "${entryName}" ใน ZIP`);

    const blob = await zipEntry.async('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entryName.split('/').pop() || entryName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
};

window.FileTools = FileTools;
