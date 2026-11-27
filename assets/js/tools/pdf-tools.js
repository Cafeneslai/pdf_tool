/**
 * PenguTools - PDF Tools Implementation 🐧
 * Powered by pdf-lib, pdfjs-dist, and JSZip (100% Client-side in browser)
 */

const PdfTools = {
  /**
   * Helper: Initialize PDF.js worker
   */
  initPdfWorker: () => {
    if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/libs/pdf.worker.min.js';
    }
  },

  /**
   * Helper: Parse page ranges string like "1-3, 5, 8-10" to array of 0-based page indices
   */
  parsePageRange: (rangeStr, totalPages) => {
    if (!rangeStr) return [];
    // Normalize Thai digits (๐-๙) to Arabic digits (0-9)
    const normalized = String(rangeStr).replace(/[๐-๙]/g, d => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d));
    const indices = new Set();
    const parts = normalized.split(',').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          indices.add(num - 1);
        }
      }
    }
    return Array.from(indices).sort((a, b) => a - b);
  },

  /**
   * Helper: canvas.toBlob that never returns null (null = canvas over the browser's size limit)
   */
  canvasToBlob: async (canvas, type = 'image/png', quality) => {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
    if (blob) return blob;
    const png = type !== 'image/png' ? await new Promise(resolve => canvas.toBlob(resolve, 'image/png')) : null;
    if (png) return png;
    throw new Error(`หน้าเอกสาร/ภาพมีขนาดใหญ่เกินกว่าที่เบราว์เซอร์รองรับ (${canvas.width}×${canvas.height} px) กรุณาลดความละเอียดลง`);
  },

  /**
   * Helper: Render scale capped so the canvas stays under ~16.7M px (iOS Safari limit)
   */
  safeScale: (viewport, scale) => {
    const maxPixels = 16777216;
    const px = viewport.width * viewport.height * scale * scale;
    return px > maxPixels ? scale * Math.sqrt(maxPixels / px) : scale;
  },

  /**
   * Helper: Map "as displayed" coordinates (honours the page's /Rotate and MediaBox offset)
   * to raw PDF coordinates so stamps land where the user sees them.
   */
  visualFrame: (page) => {
    const { x: ox, y: oy, width: W, height: H } = page.getMediaBox();
    const rot = ((page.getRotation().angle % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const map = (u, v) => {
      if (rot === 90) return { x: ox + W - v, y: oy + u };
      if (rot === 180) return { x: ox + W - u, y: oy + H - v };
      if (rot === 270) return { x: ox + v, y: oy + H - u };
      return { x: ox + u, y: oy + v };
    };
    return { width: swap ? H : W, height: swap ? W : H, rot, map };
  },

  /**
   * Helper: Draw an image at a visual rect (u, v = bottom-left as displayed) with optional extra rotation
   */
  drawVisualImage: (page, image, { u, v, width, height, angle = 0 }) => {
    const frame = PdfTools.visualFrame(page);
    const pt = frame.map(u, v);
    page.drawImage(image, {
      x: pt.x,
      y: pt.y,
      width,
      height,
      rotate: window.PDFLib.degrees(frame.rot + angle)
    });
  },

  /**
   * Helper: Read EXIF orientation (1-8) from JPEG bytes, 1 when absent
   */
  jpegOrientation: (buffer) => {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return 1;
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset);
      const size = view.getUint16(offset + 2);
      if (marker === 0xFFE1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
        const tiff = offset + 10;
        if (tiff + 8 > view.byteLength) return 1;
        const little = view.getUint16(tiff) === 0x4949;
        const ifd = tiff + view.getUint32(tiff + 4, little);
        if (ifd + 2 > view.byteLength) return 1;
        const count = view.getUint16(ifd, little);
        for (let i = 0; i < count; i++) {
          const entry = ifd + 2 + i * 12;
          if (entry + 10 > view.byteLength) return 1;
          if (view.getUint16(entry, little) === 0x0112) return view.getUint16(entry + 8, little);
        }
        return 1;
      }
      if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) return 1;
      offset += 2 + size;
    }
    return 1;
  },

  /**
   * Helper: Format file size to human readable string
   */
  formatSize: (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 1. Merge PDF
   */
  mergePdf: async (fileList, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib กรุณารีเฟรชหน้าเว็บ');
    const { PDFDocument } = window.PDFLib;
    
    if (fileList.length < 2) {
      throw new Error('กรุณาเลือกไฟล์ PDF อย่างน้อย 2 ไฟล์เพื่อรวม');
    }

    const mergedDoc = await PDFDocument.create();
    const totalFiles = fileList.length;

    for (let i = 0; i < totalFiles; i++) {
      if (onProgress) onProgress(Math.round(((i) / totalFiles) * 90), `กำลังอ่านไฟล์ ${i + 1}/${totalFiles}: ${fileList[i].name}...`);
      
      const arrayBuffer = await fileList[i].arrayBuffer();
      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      } catch (err) {
        throw new Error(`ไฟล์ "${fileList[i].name}" ไม่ถูกต้องหรือถูกเข้ารหัส: ${err.message}`);
      }

      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    }

    if (onProgress) onProgress(95, 'กำลังบันทึกและประมวลผลไฟล์รวม...');
    const pdfBytes = await mergedDoc.save();
    if (onProgress) onProgress(100, 'รวมไฟล์สำเร็จ!');

    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 2. Split PDF
   */
  splitPdf: async (file, mode, rangeStr, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument } = window.PDFLib;

    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (mode === 'range') {
      // Split by range into a single new PDF
      const pageIndices = PdfTools.parsePageRange(rangeStr, totalPages);
      if (pageIndices.length === 0) {
        throw new Error(`ช่วงหน้าที่ระบุไม่ถูกต้อง กรุณาระบุหน้าในช่วง 1 ถึง ${totalPages}`);
      }

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach(p => newDoc.addPage(p));
      const pdfBytes = await newDoc.save();
      return {
        type: 'pdf',
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        filename: `${file.name.replace(/\.pdf$/i, '')}_split.pdf`
      };
    } else {
      // Split every page into separate individual PDFs, bundled in a ZIP
      if (!window.JSZip) throw new Error('ไม่พบไลบรารี JSZip');
      const zip = new window.JSZip();

      for (let i = 0; i < totalPages; i++) {
        if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 90), `กำลังแยกหน้าที่ ${i + 1} จาก ${totalPages}...`);
        const pageDoc = await PDFDocument.create();
        const [copiedPage] = await pageDoc.copyPages(srcDoc, [i]);
        pageDoc.addPage(copiedPage);
        const pageBytes = await pageDoc.save();
        zip.file(`${file.name.replace(/\.pdf$/i, '')}_page_${i + 1}.pdf`, pageBytes);
      }

      if (onProgress) onProgress(95, 'กำลังรวมเป็นไฟล์ ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return {
        type: 'zip',
        blob: zipBlob,
        filename: `${file.name.replace(/\.pdf$/i, '')}_all_pages.zip`
      };
    }
  },

  /**
   * 3. Compress PDF
   * Supports both 'visual' (page & image downsampling + JPEG compression)
   * and 'structural' (lossless stream deflating & metadata cleanup)
   */
  compressPdf: async (file, options = {}, onProgress) => {
    // Support options as object or string level for backward compatibility
    let level = 'balanced';
    let mode = 'visual';

    if (typeof options === 'string') {
      level = options;
    } else if (typeof options === 'object' && options !== null) {
      level = options.level || 'balanced';
      mode = options.mode || 'visual';
    }

    const originalSize = file.size;
    const arrayBuffer = await file.arrayBuffer();

    if (mode === 'visual') {
      // Mode 1: Smart Visual & Image Downsampling via PDF.js + Canvas + PDF-Lib
      PdfTools.initPdfWorker();
      if (!window.pdfjsLib) throw new Error('ไม่พบไลบรารี PDF.js');
      if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');

      if (onProgress) onProgress(10, 'กำลังโหลดและวิเคราะห์โครงสร้างหน้าเอกสาร PDF...');
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // Determine rendering resolution & quality by level
      let renderScale = 1.5;   // approx 110-120 DPI
      let jpegQuality = 0.70;  // 70% JPEG quality
      if (level === 'high') {
        renderScale = 1.25;    // approx 90-100 DPI
        jpegQuality = 0.52;    // 52% quality (great for huge scanned docs/slides)
      } else if (level === 'low') {
        renderScale = 1.85;    // approx 135-150 DPI
        jpegQuality = 0.82;    // 82% quality (near original sharpness)
      }

      const { PDFDocument } = window.PDFLib;
      const newDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const percent = Math.round(15 + ((i / totalPages) * 75));
        if (onProgress) onProgress(percent, `กำลังบีบอัดหน้า ${i} จาก ${totalPages}...`);

        const page = await pdf.getPage(i);
        const origViewport = page.getViewport({ scale: 1.0 });
        const scaledViewport = page.getViewport({ scale: PdfTools.safeScale(origViewport, renderScale) });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(scaledViewport.width);
        canvas.height = Math.round(scaledViewport.height);
        const ctx = canvas.getContext('2d');

        // Draw crisp white background for transparent pages
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport
        }).promise;

        const imgBlob = await PdfTools.canvasToBlob(canvas, 'image/jpeg', jpegQuality);
        const imgBytes = await imgBlob.arrayBuffer();
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();

        const embeddedImg = imgBlob.type === 'image/png' ? await newDoc.embedPng(imgBytes) : await newDoc.embedJpg(imgBytes);

        // Keep original physical PDF page dimensions (e.g. A4 595.28 x 841.89 pt)
        const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height
        });
      }

      await pdf.destroy();
      if (onProgress) onProgress(93, 'กำลังประกอบและจัดทำไฟล์ PDF บีบอัด...');
      newDoc.setProducer('PenguTools (Cute Online File Toolkit)');
      newDoc.setCreator('PenguTools');
      const compressedBytes = await newDoc.save({ useObjectStreams: true });

      const newSize = compressedBytes.length;
      const savedBytes = originalSize - newSize;
      const savedPercent = Number((((originalSize - newSize) / originalSize) * 100).toFixed(1));
      const isReduced = newSize < originalSize;

      if (onProgress) onProgress(100, 'บีบอัดเสร็จสิ้น!');
      return {
        blob: new Blob([compressedBytes], { type: 'application/pdf' }),
        originalSize,
        newSize,
        savedBytes,
        savedPercent,
        isReduced,
        mode,
        level,
        totalPages
      };

    } else {
      // Mode 2: Structural Lossless Stream & Metadata Optimization
      if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
      const { PDFDocument } = window.PDFLib;

      if (onProgress) onProgress(30, 'กำลังวิเคราะห์โครงสร้างเวกเตอร์และ Stream...');
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      doc.setProducer('PenguTools (Cute Online File Toolkit)');
      doc.setCreator('PenguTools');

      if (onProgress) onProgress(75, 'กำลังรวม Cross-Reference Tables และทำ Object Streams...');
      const compressedBytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false
      });

      const newSize = compressedBytes.length;
      const savedBytes = originalSize - newSize;
      const savedPercent = Number((((originalSize - newSize) / originalSize) * 100).toFixed(1));
      const isReduced = newSize < originalSize;

      if (onProgress) onProgress(100, 'จัดระเบียบโครงสร้างเสร็จสิ้น!');
      return {
        blob: new Blob([compressedBytes], { type: 'application/pdf' }),
        originalSize,
        newSize,
        savedBytes,
        savedPercent,
        isReduced,
        mode,
        level,
        totalPages: doc.getPageCount()
      };
    }
  },

  /**
   * 4. Rotate PDF
   */
  rotatePdf: async (file, degreesAngle = 90, targetMode = 'all', customRangeStr = '', onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument, degrees } = window.PDFLib;

    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = doc.getPages();
    const totalPages = pages.length;

    let targetIndices = [];
    if (targetMode === 'all') {
      targetIndices = pages.map((_, i) => i);
    } else if (targetMode === 'odd') {
      targetIndices = pages.map((_, i) => i).filter(i => (i + 1) % 2 !== 0);
    } else if (targetMode === 'even') {
      targetIndices = pages.map((_, i) => i).filter(i => (i + 1) % 2 === 0);
    } else if (targetMode === 'custom') {
      targetIndices = PdfTools.parsePageRange(customRangeStr, totalPages);
    }

    if (targetIndices.length === 0) {
      throw new Error('ไม่พบหน้าที่ตรงกับเงื่อนไขการหมุน');
    }

    for (let i = 0; i < targetIndices.length; i++) {
      const pageIndex = targetIndices[i];
      const page = pages[pageIndex];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + degreesAngle) % 360;
      page.setRotation(degrees(newRotation));
    }

    if (onProgress) onProgress(90, 'กำลังบันทึกหน้ากระดาษที่หมุน...');
    const pdfBytes = await doc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 5. Extract PDF Pages
   */
  extractPages: async (file, rangeStr, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument } = window.PDFLib;

    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const pageIndices = PdfTools.parsePageRange(rangeStr, totalPages);
    if (pageIndices.length === 0) {
      throw new Error(`กรุณาระบุหน้าที่ต้องการดึง เช่น "1, 3, 5-7" (มีทั้งหมด ${totalPages} หน้า)`);
    }

    if (onProgress) onProgress(40, `กำลังคัดลอกหน้าที่เลือก (${pageIndices.length} หน้า)...`);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    if (onProgress) onProgress(90, 'กำลังบันทึกไฟล์ใหม่...');
    const pdfBytes = await newDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 6. Images to PDF
   */
  imagesToPdf: async (imageFiles, options = {}, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument, PageSizes } = window.PDFLib;

    const {
      pageSize = 'a4',       // 'a4' or 'fit'
      orientation = 'auto',  // 'auto', 'portrait', 'landscape'
      margin = 20            // in points
    } = options;

    const pdfDoc = await PDFDocument.create();
    const total = imageFiles.length;

    for (let i = 0; i < total; i++) {
      const file = imageFiles[i];
      if (onProgress) onProgress(Math.round(((i) / total) * 90), `กำลังประมวลผลรูปภาพ ${i + 1}/${total}: ${file.name}...`);

      const arrayBuffer = await file.arrayBuffer();
      let embeddedImage;

      // Detect by magic bytes (file.type / extension can lie)
      const head = new Uint8Array(arrayBuffer, 0, Math.min(4, arrayBuffer.byteLength));
      const isJpeg = head[0] === 0xFF && head[1] === 0xD8;
      const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47;

      if (isJpeg && PdfTools.jpegOrientation(arrayBuffer) <= 1) {
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      } else if (isPng) {
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      } else {
        // Rotated phone JPEGs (EXIF) and WebP/BMP/GIF: redraw via canvas, browsers apply EXIF orientation on draw
        const img = await window.ImageTools.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const blob = await PdfTools.canvasToBlob(canvas, isJpeg ? 'image/jpeg' : 'image/png', 0.92);
        canvas.width = 0;
        canvas.height = 0;
        const bytes = await blob.arrayBuffer();
        embeddedImage = blob.type === 'image/jpeg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      let pageWidth, pageHeight;

      if (pageSize === 'fit') {
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      } else {
        // A4 size: 595.28 x 841.89 points
        let isLandscape = false;
        if (orientation === 'landscape') isLandscape = true;
        else if (orientation === 'portrait') isLandscape = false;
        else if (orientation === 'auto') isLandscape = imgWidth > imgHeight;

        pageWidth = isLandscape ? PageSizes.A4[1] : PageSizes.A4[0];
        pageHeight = isLandscape ? PageSizes.A4[0] : PageSizes.A4[1];
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Calculate scale to fit within margins
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;
      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);

      const renderWidth = imgWidth * scale;
      const renderHeight = imgHeight * scale;

      const posX = margin + (availWidth - renderWidth) / 2;
      const posY = margin + (availHeight - renderHeight) / 2;

      page.drawImage(embeddedImage, {
        x: posX,
        y: posY,
        width: renderWidth,
        height: renderHeight
      });
    }

    if (onProgress) onProgress(95, 'กำลังสร้างเอกสาร PDF...');
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 7. PDF to Images (using PDF.js)
   */
  pdfToImages: async (file, options = {}, onProgress) => {
    PdfTools.initPdfWorker();
    if (!window.pdfjsLib) throw new Error('ไม่พบไลบรารี PDF.js');

    const {
      format = 'image/png',   // 'image/png' or 'image/jpeg'
      scale = 2.0,            // 1.5, 2.0, 3.0
      pageRange = ''          // blank = all
    } = options;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    let targetPages = [];
    if (!pageRange.trim()) {
      targetPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const zeroBased = PdfTools.parsePageRange(pageRange, totalPages);
      targetPages = zeroBased.map(i => i + 1);
    }

    if (targetPages.length === 0) {
      throw new Error('ไม่พบหน้าที่ต้องการแปลง');
    }

    const imageResults = [];
    
    for (let idx = 0; idx < targetPages.length; idx++) {
      const pageNum = targetPages[idx];
      if (onProgress) onProgress(Math.round(((idx) / targetPages.length) * 90), `กำลังเรนเดอร์หน้าที่ ${pageNum}/${totalPages}...`);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: PdfTools.safeScale(page.getViewport({ scale: 1 }), scale) });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');

      // Draw crisp white background for transparent pages
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      const blob = await PdfTools.canvasToBlob(canvas, format, 0.92);
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
      imageResults.push({
        pageNum,
        blob,
        filename: `${file.name.replace(/\.pdf$/i, '')}_page_${pageNum}.${blob.type === 'image/jpeg' ? 'jpg' : 'png'}`
      });
    }
    await pdf.destroy();

    if (targetPages.length === 1) {
      // Single page direct image download
      return {
        type: 'single',
        blob: imageResults[0].blob,
        filename: imageResults[0].filename
      };
    } else {
      // Multiple pages packaged in ZIP
      if (!window.JSZip) throw new Error('ไม่พบไลบรารี JSZip');
      if (onProgress) onProgress(95, 'กำลังรวมรูปภาพเป็นไฟล์ ZIP...');
      const zip = new window.JSZip();
      for (const item of imageResults) {
        zip.file(item.filename, item.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return {
        type: 'zip',
        blob: zipBlob,
        filename: `${file.name.replace(/\.pdf$/i, '')}_images.zip`
      };
    }
  },

  /**
   * 8. Unlock Password-Protected PDF
   */
  unlockPdf: async (file, password, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument } = window.PDFLib;

    if (onProgress) onProgress(20, 'กำลังตรวจสอบรหัสผ่านและถอดรหัสเอกสาร...');
    const arrayBuffer = await file.arrayBuffer();

    // Probe first so a non-encrypted file gets a clear message instead of a silent re-save
    const probe = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (!probe.isEncrypted) {
      throw new Error('ไฟล์นี้ไม่ได้ถูกล็อกด้วยรหัสผ่าน สามารถเปิดใช้งานได้ตามปกติอยู่แล้วครับ');
    }

    let doc;
    try {
      doc = await PDFDocument.load(arrayBuffer, { password: password || '' });
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('password') || msg.includes('encrypt') || msg.includes('decrypt')) {
        throw new Error('รหัสผ่านไม่ถูกต้อง หรือเอกสารใช้รูปแบบการเข้ารหัสที่ไม่รองรับ กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
      }
      throw err;
    }

    // The fork keeps the old /Encrypt dictionary object around; drop it so the saved file is truly unlocked
    const { PDFName, PDFDict } = window.PDFLib;
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      const dict = obj instanceof PDFDict ? obj : (obj && obj.dict instanceof PDFDict ? obj.dict : null);
      const filter = dict && dict.get(PDFName.of('Filter'));
      if (dict && (dict.has(PDFName.of('Encrypt')) || (filter && filter.toString() === '/Standard'))) {
        doc.context.delete(ref);
      }
    }

    if (onProgress) onProgress(75, 'กำลังบันทึกเอกสารฉบับปลดล็อกรหัสผ่าน...');
    const pdfBytes = await doc.save();

    if (onProgress) onProgress(100, 'ปลดล็อกรหัสผ่านเอกสารสำเร็จ!');
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 9. Render PDF Thumbnails for Visual Page Organizer
   */
  renderPdfThumbnails: async (file, onPageRendered, onProgress) => {
    PdfTools.initPdfWorker();
    if (!window.pdfjsLib) throw new Error('ไม่พบไลบรารี PDF.js');

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    const pages = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) onProgress(Math.round((pageNum / totalPages) * 100), `กำลังเรนเดอร์ภาพตัวอย่างหน้า ${pageNum}/${totalPages}...`);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.32 });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      canvas.width = 0;
      canvas.height = 0;
      const pageInfo = {
        originalIndex: pageNum - 1,
        pageNumber: pageNum,
        thumbUrl: thumbDataUrl,
        rotation: 0
      };

      page.cleanup();
      pages.push(pageInfo);
      if (onPageRendered) onPageRendered(pageInfo, pageNum, totalPages);
    }

    await pdf.destroy();
    return pages;
  },

  /**
   * 10. Save Organized PDF (reordered, rotated, selective pages)
   */
  saveOrganizedPdf: async (file, pagesState, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument, degrees } = window.PDFLib;

    if (!pagesState || pagesState.length === 0) {
      throw new Error('กรุณาเลือกหรือคงหน้าเอกสารไว้อย่างน้อย 1 หน้า');
    }

    if (onProgress) onProgress(20, 'กำลังเปิดเอกสาร PDF ต้นฉบับ...');
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();

    const total = pagesState.length;
    for (let i = 0; i < total; i++) {
      const item = pagesState[i];
      if (onProgress) onProgress(Math.round(20 + ((i / total) * 70)), `กำลังจัดหน้าใหม่ ${i + 1}/${total}...`);

      const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
      if (item.rotation) {
        const curRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((curRot + item.rotation) % 360));
      }
      newDoc.addPage(copiedPage);
    }

    if (onProgress) onProgress(95, 'กำลังบันทึกเอกสาร PDF ที่จัดระเบียบใหม่...');
    const pdfBytes = await newDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 11. Add Watermark & Page Numbers (with seamless Thai text support via Canvas Stamp)
   */
  addWatermarkAndNumbering: async (file, options = {}, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { PDFDocument } = window.PDFLib;

    const {
      addPageNumber = true,
      pageNumberPos = 'bottom-center',
      pageNumberFormat = 'page_of_total',
      addWatermark = false,
      watermarkText = 'สำเนาถูกต้อง',
      watermarkOpacity = 0.25,
      watermarkColor = '#0284c7',
      watermarkAngle = -45
    } = options;

    if (onProgress) onProgress(15, 'กำลังเปิดเอกสาร PDF...');
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = doc.getPages();
    const totalPages = pages.length;

    // Helper: Create a Canvas text stamp and embed as PNG into doc for flawless Thai typography
    const createStampPng = async (text, fontSize = 24, fontColor = '#64748b', opacity = 1.0, isBold = false) => {
      const scale = 2; // 2x retina clarity for crisp printing & high-res rendering
      const actualFontSize = fontSize * scale;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `${isBold ? 'bold ' : ''}${actualFontSize}px Prompt, Kanit, Sarabun, sans-serif`;

      const metrics = ctx.measureText(text);
      const textWidth = Math.ceil(metrics.width) + (24 * scale);
      const textHeight = Math.ceil(actualFontSize * 1.5) + (20 * scale);

      canvas.width = Math.max(textWidth, 10);
      canvas.height = Math.max(textHeight, 10);

      const ctx2 = canvas.getContext('2d');
      ctx2.font = `${isBold ? 'bold ' : ''}${actualFontSize}px Prompt, Kanit, Sarabun, sans-serif`;
      ctx2.fillStyle = fontColor;
      ctx2.globalAlpha = opacity;
      ctx2.textBaseline = 'middle';
      ctx2.textAlign = 'center';
      ctx2.fillText(text, canvas.width / 2, canvas.height / 2);

      const blob = await PdfTools.canvasToBlob(canvas, 'image/png');
      canvas.width = 0;
      canvas.height = 0;
      const buffer = await blob.arrayBuffer();
      const embedded = await doc.embedPng(buffer);
      return {
        image: embedded,
        width: embedded.width / scale,
        height: embedded.height / scale
      };
    };

    let watermarkStamp = null;
    if (addWatermark && watermarkText.trim()) {
      watermarkStamp = await createStampPng(watermarkText.trim(), 46, watermarkColor, watermarkOpacity, true);
    }

    for (let i = 0; i < totalPages; i++) {
      if (onProgress) onProgress(Math.round(20 + ((i / totalPages) * 70)), `กำลังประมวลผลหน้าที่ ${i + 1}/${totalPages}...`);
      const page = pages[i];
      const { width, height } = PdfTools.visualFrame(page);

      if (watermarkStamp) {
        // Shrink long watermark text so it never runs off the page diagonal
        const fit = Math.min(1, (Math.hypot(width, height) * 0.75) / watermarkStamp.width);
        const wmWidth = watermarkStamp.width * fit;
        const wmHeight = watermarkStamp.height * fit;
        const rad = (watermarkAngle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Offset the rotation origin so the stamp's centre sits on the page centre
        const posX = (width / 2) - (wmWidth / 2) * cos + (wmHeight / 2) * sin;
        const posY = (height / 2) - (wmWidth / 2) * sin - (wmHeight / 2) * cos;

        PdfTools.drawVisualImage(page, watermarkStamp.image, { u: posX, v: posY, width: wmWidth, height: wmHeight, angle: watermarkAngle });
      }

      if (addPageNumber) {
        let numStr = `${i + 1} / ${totalPages}`;
        if (pageNumberFormat === 'page_only') numStr = `${i + 1}`;
        else if (pageNumberFormat === 'thai') numStr = `หน้า ${i + 1} จาก ${totalPages}`;

        const numStamp = await createStampPng(numStr, 13, '#334155', 0.85, false);
        const stampW = numStamp.width;
        const stampH = numStamp.height;

        let posX = (width - stampW) / 2;
        if (pageNumberPos === 'bottom-left') posX = 36;
        else if (pageNumberPos === 'bottom-right') posX = width - stampW - 36;

        PdfTools.drawVisualImage(page, numStamp.image, { u: posX, v: 20, width: stampW, height: stampH });
      }
    }

    if (onProgress) onProgress(95, 'กำลังจัดทำไฟล์ PDF สมบูรณ์...');
    const pdfBytes = await doc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 12. Protect PDF with a password (AES via @cantoo/pdf-lib encrypt)
   */
  protectPdf: async (file, options = {}, onProgress) => {
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี pdf-lib');
    const { userPassword = '', ownerPassword = '', allowPrinting = true, allowCopying = false, allowModifying = false } = options;
    if (!userPassword) throw new Error('กรุณาตั้งรหัสผ่านสำหรับเปิดเอกสาร');

    if (onProgress) onProgress(20, 'กำลังเปิดเอกสาร PDF...');
    const doc = await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
    if (doc.isEncrypted) throw new Error('ไฟล์นี้ถูกล็อกรหัสผ่านอยู่แล้ว กรุณาปลดล็อกก่อนตั้งรหัสใหม่');

    if (onProgress) onProgress(60, 'กำลังเข้ารหัสเอกสาร...');
    doc.encrypt({
      userPassword,
      // Owner password unlocks the permission limits; default to a random one so the user password alone can't lift them
      ownerPassword: ownerPassword || Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''),
      permissions: {
        printing: allowPrinting ? 'highResolution' : undefined,
        copying: allowCopying,
        modifying: allowModifying,
        annotating: allowModifying,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: allowModifying
      }
    });
    const pdfBytes = await doc.save();
    if (onProgress) onProgress(100, 'ล็อกรหัสผ่านสำเร็จ!');
    return new Blob([pdfBytes], { type: 'application/pdf' });
  },

  /**
   * 13. Extract text from a PDF (text layer only; scanned pages have none)
   */
  extractText: async (file, pageRange = '', onProgress) => {
    PdfTools.initPdfWorker();
    if (!window.pdfjsLib) throw new Error('ไม่พบไลบรารี PDF.js');
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    const total = pdf.numPages;
    const targets = pageRange.trim()
      ? PdfTools.parsePageRange(pageRange, total).map(i => i + 1)
      : Array.from({ length: total }, (_, i) => i + 1);
    if (targets.length === 0) throw new Error(`ช่วงหน้าที่ระบุไม่ถูกต้อง (มีทั้งหมด ${total} หน้า)`);

    const parts = [];
    let charCount = 0;
    for (let idx = 0; idx < targets.length; idx++) {
      const n = targets[idx];
      if (onProgress) onProgress(Math.round((idx / targets.length) * 95), `กำลังอ่านข้อความหน้า ${n}/${total}...`);
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const text = content.items.map(it => (it.str || '') + (it.hasEOL ? '\n' : '')).join('').replace(/[ \t]+\n/g, '\n').trim();
      charCount += text.length;
      parts.push(`===== หน้า ${n} =====\n${text}`);
      page.cleanup();
    }
    await pdf.destroy();
    if (onProgress) onProgress(100, 'ดึงข้อความสำเร็จ!');
    const fullText = parts.join('\n\n');
    return {
      text: fullText,
      charCount,
      pageCount: targets.length,
      blob: new Blob(['﻿' + fullText], { type: 'text/plain;charset=utf-8' })
    };
  },

  /**
   * Render one page to a data URL (used by the Sign PDF click-to-place preview)
   */
  renderPagePreview: async (file, pageNumber, targetWidth = 360) => {
    PdfTools.initPdfWorker();
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    try {
      const page = await pdf.getPage(Math.min(Math.max(1, pageNumber), pdf.numPages));
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: targetWidth / base.width });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const url = canvas.toDataURL('image/jpeg', 0.85);
      const aspect = canvas.width / canvas.height;
      canvas.width = 0;
      canvas.height = 0;
      return { url, aspect, numPages: pdf.numPages };
    } finally {
      await pdf.destroy();
    }
  },

  /**
   * Embed signature and optional date stamp on chosen page(s)
   */
  signPdf: async function (file, options = {}, onProgress) {
    if (!window.PDFLib) throw new Error('PDFLib is not loaded');
    if (!options.signatureDataUrl) throw new Error('ไม่พบลายเซ็น กรุณาวาดลายเซ็นหรืออัปโหลดภาพลายเซ็นก่อน');

    if (onProgress) onProgress(10, 'กำลังอ่านเอกสาร PDF...');
    const arrayBuffer = await file.arrayBuffer();
    const doc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = doc.getPages();
    const totalPages = pages.length;

    if (onProgress) onProgress(30, 'กำลังแปลงภาพลายเซ็น...');
    
    // Convert signature DataURL to binary bytes
    const base64Data = options.signatureDataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const sigBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      sigBytes[i] = binaryStr.charCodeAt(i);
    }

    let sigImage;
    try {
      if (options.signatureDataUrl.startsWith('data:image/jpeg') || options.signatureDataUrl.startsWith('data:image/jpg')) {
        sigImage = await doc.embedJpg(sigBytes);
      } else {
        sigImage = await doc.embedPng(sigBytes);
      }
    } catch (embErr) {
      try {
        sigImage = await doc.embedJpg(sigBytes);
      } catch (jpgErr) {
        throw new Error('ไม่สามารถอ่านภาพลายเซ็นได้ กรุณาใช้ไฟล์รูปภาพ PNG หรือ JPG');
      }
    }
    const sigAspect = sigImage.width / sigImage.height;

    // Optional date stamp canvas
    let dateImage = null;
    let dateAspect = 1;
    if (options.addDate && options.dateText) {
      const dCanvas = document.createElement('canvas');
      const dCtx = dCanvas.getContext('2d');
      dCtx.font = '24px "Prompt", "Kanit", sans-serif';
      const textMetrics = dCtx.measureText(options.dateText);
      const dWidth = Math.ceil(textMetrics.width) + 24;
      const dHeight = 44;
      dCanvas.width = dWidth;
      dCanvas.height = dHeight;
      dCtx.font = '24px "Prompt", "Kanit", sans-serif';
      dCtx.fillStyle = options.dateColor || '#334155';
      dCtx.textBaseline = 'middle';
      dCtx.fillText(options.dateText, 12, dHeight / 2);

      const dDataUrl = dCanvas.toDataURL('image/png');
      const dBase64 = dDataUrl.split(',')[1];
      const dBinStr = atob(dBase64);
      const dBytes = new Uint8Array(dBinStr.length);
      for (let i = 0; i < dBinStr.length; i++) {
        dBytes[i] = dBinStr.charCodeAt(i);
      }
      dateImage = await doc.embedPng(dBytes);
      dateAspect = dateImage.width / dateImage.height;

      dCanvas.width = 0;
      dCanvas.height = 0;
    }

    if (onProgress) onProgress(60, 'กำลังวางลายเซ็นลงบนหน้าเอกสาร...');

    let targetPages = [];
    if (options.targetPage === 'all') {
      targetPages = pages;
    } else if (options.targetPage === 'last') {
      targetPages = [pages[totalPages - 1]];
    } else {
      const p = parseInt(options.targetPage, 10);
      const targetIndex = isNaN(p) ? totalPages - 1 : Math.min(totalPages - 1, Math.max(0, p - 1));
      targetPages = [pages[targetIndex]];
    }

    const sizePercent = Math.min(60, Math.max(8, options.sizePercent || 25)) / 100;
    const posXPercent = Math.min(100, Math.max(0, options.posXPercent !== undefined ? options.posXPercent : 70)) / 100;
    const posYPercent = Math.min(100, Math.max(0, options.posYPercent !== undefined ? options.posYPercent : 85)) / 100;

    for (const page of targetPages) {
      // Visual size = as displayed, so rotated (/Rotate) pages get the signature where the user expects
      const { width, height } = PdfTools.visualFrame(page);

      const sigWidth = width * sizePercent;
      const sigHeight = sigWidth / sigAspect;

      // posYPercent is 0 at top, 100 at bottom; PDF origin is bottom-left
      const sigX = Math.max(0, Math.min(width - sigWidth, (width - sigWidth) * posXPercent));
      const sigY = Math.max(0, Math.min(height - sigHeight, height - sigHeight - (height - sigHeight) * posYPercent));

      PdfTools.drawVisualImage(page, sigImage, { u: sigX, v: sigY, width: sigWidth, height: sigHeight });

      if (dateImage) {
        const dateWidth = sigWidth * 0.9;
        const dateHeight = dateWidth / dateAspect;
        // Below the signature, or above it when there is no room at the bottom edge
        const below = sigY - dateHeight - 4;
        const dateY = below >= 5 ? below : Math.min(height - dateHeight, sigY + sigHeight + 4);
        PdfTools.drawVisualImage(page, dateImage, { u: sigX, v: dateY, width: dateWidth, height: dateHeight });
      }
    }

    if (onProgress) onProgress(90, 'กำลังบันทึกเอกสาร PDF สมบูรณ์...');
    const pdfBytes = await doc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
};

window.PdfTools = PdfTools;
