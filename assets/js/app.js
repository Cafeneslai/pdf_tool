/**
 * PenguTools - Main Application Controller 🐧
 * Client-Side Single Page Application Router & State Manager
 */

(function () {
  'use strict';

  // Security Helper: Escape HTML entities to prevent XSS injection
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Tool Definitions Registry
  const TOOLS = [
    // --- PDF Tools ---
    {
      id: 'merge-pdf',
      name: 'Merge PDF',
      title: 'รวมไฟล์ PDF',
      category: 'pdf',
      icon: '📑',
      desc: 'รวมไฟล์ PDF หลายไฟล์เข้าด้วยกันเป็นไฟล์เดียว พร้อมจัดลำดับไฟล์ได้อย่างอิสระ',
      badge: 'Popular',
      accept: '.pdf,application/pdf',
      multiple: true,
      minFiles: 2,
      maxFiles: 30,
      btnText: 'รวมไฟล์ PDF ตอนนี้',
      renderSettings: () => `
        <div class="alert-box alert-info">
          <span>💡 สามารถคลิกปุ่มลูกศรขึ้น-ลง หรือลบไฟล์ เพื่อจัดเรียงลำดับหน้าของ PDF ก่อนรวมได้เลยครับ</span>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const blob = await window.PdfTools.mergePdf(files, onProgress);
        return {
          blob,
          filename: 'pengutools_merged.pdf',
          successMsg: `รวมไฟล์ PDF สำเร็จทั้งหมด ${files.length} ไฟล์!`
        };
      }
    },
    {
      id: 'organize-pdf',
      name: 'Organize PDF Pages',
      title: 'จัดเรียง ลบ หมุนหน้า PDF',
      category: 'pdf',
      icon: '📑',
      desc: 'จัดเรียงลำดับหน้า หมุนองศา หรือลบหน้าที่ไม่ต้องการออก แบบเห็นภาพตัวอย่าง (Thumbnail) ทุกหน้า',
      badge: 'Popular',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'บันทึกเอกสาร PDF ที่จัดระเบียบใหม่',
      renderSettings: () => `
        <div class="alert-box alert-info">
          <span>💡 สามารถลากสลับตำแหน่งการ์ดหน้าเอกสาร, กดปุ่ม ↻ เพื่อหมุนหน้า หรือกด ✕ เพื่อลบหน้าที่ไม่ต้องการออกได้เลยครับ</span>
        </div>
        ${window.PenguMascot.withTip('เห็นภาพตัวอย่างของทุกหน้าจริง! คุณสามารถจัดระเบียบเอกสารตามต้องการได้อย่างแม่นยำ ไม่ต้องจำเลขหน้าอีกต่อไปกวิน!', 'droppable', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        if (!state.organizerPages || state.organizerPages.length === 0) {
          throw new Error('กรุณาเลือกหรือคงหน้าเอกสารไว้อย่างน้อย 1 หน้า');
        }
        const blob = await window.PdfTools.saveOrganizedPdf(files[0], state.organizerPages, onProgress);
        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_organized.pdf`,
          successMsg: `จัดระเบียบหน้า PDF ใหม่เรียบร้อย (คงไว้ ${state.organizerPages.length} หน้า)!`
        };
      }
    },
    {
      id: 'split-pdf',
      name: 'Split PDF',
      title: 'แยกไฟล์ PDF',
      category: 'pdf',
      icon: '✂️',
      desc: 'แยกหน้าเอกสาร PDF ตามช่วงหน้าที่ต้องการ หรือแยกทุกหน้าเป็นไฟล์เดี่ยว',
      badge: 'Client-Side',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'แยกไฟล์ PDF',
      renderSettings: (files) => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">โหมดการแยกหน้า</label>
            <select id="splitMode" class="form-control" onchange="PenguApp.handleSplitModeChange(this.value)">
              <option value="range">ระบุช่วงหน้าที่ต้องการ (เช่น 1-3, 5)</option>
              <option value="all">แยกทุกหน้าเป็นไฟล์ละ 1 หน้า (ดาวน์โหลดเป็น ZIP)</option>
            </select>
          </div>
          <div class="form-group" id="splitRangeGroup">
            <label class="form-label">ช่วงหน้า (เช่น 1-3, 5)</label>
            <input type="text" id="splitRange" class="form-control" placeholder="เช่น 1-2, 4" value="1">
          </div>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const mode = document.getElementById('splitMode')?.value || 'range';
        const rangeStr = document.getElementById('splitRange')?.value || '1';
        const result = await window.PdfTools.splitPdf(files[0], mode, rangeStr, onProgress);
        return {
          blob: result.blob,
          filename: result.filename,
          successMsg: mode === 'range' ? 'แยกหน้าเอกสารตามช่วงที่เลือกสำเร็จ!' : 'แยกทุกหน้าเอกสารเป็นไฟล์ ZIP สำเร็จ!'
        };
      }
    },
    {
      id: 'compress-pdf',
      name: 'Compress PDF',
      title: 'บีบอัด PDF',
      category: 'pdf',
      icon: '🗜️',
      desc: 'ลดขนาดไฟล์ PDF ให้กะทัดรัดขึ้น บีบอัดภาพในหน้าเอกสารจริง พร้อมเปรียบเทียบขนาดไบต์',
      badge: 'Popular',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'บีบอัด PDF',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">โหมดการบีบอัด</label>
            <select id="compressMode" class="form-control" onchange="PenguApp.handlePdfCompressModeChange(this.value)">
              <option value="visual" selected>บีบอัดภาพและหน้าเอกสาร (แนะนำ - ลดขนาดได้จริง 40-90%)</option>
              <option value="structural">บีบอัดโครงสร้างเวกเตอร์ (รักษาข้อความเดิม 100%)</option>
            </select>
          </div>
          <div class="form-group" id="compressLevelGroup">
            <label class="form-label">ระดับการบีบอัด</label>
            <select id="compressLevel" class="form-control">
              <option value="balanced" selected>ระดับสมดุล (แนะนำ - ตัวหนังสือคมชัด ลดขนาดได้มาก)</option>
              <option value="high">ระดับสูง (เน้นลดขนาดไฟล์สูงสุด สำหรับส่งอีเมล/อัปโหลด)</option>
              <option value="low">ระดับคงคุณภาพสูง (ลดขนาดปานกลาง รักษาความคมชัดสูง)</option>
            </select>
          </div>
        </div>
        ${window.PenguMascot.withTip('โหมด "บีบอัดภาพและหน้าเอกสาร" จะแปลงหน้าเป็นภาพความละเอียดสูงเพื่อลดขนาดไฟล์สูงสุด (ตัวหนังสือจะไม่สามารถเลือกหรือค้นหาได้) หากต้องการรักษาตัวหนังสือและลิงก์เดิมไว้ ให้เลือกโหมด "บีบอัดโครงสร้างเวกเตอร์" นะกวิน!', 'waving', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const mode = document.getElementById('compressMode')?.value || 'visual';
        const level = document.getElementById('compressLevel')?.value || 'balanced';
        const res = await window.PdfTools.compressPdf(files[0], { mode, level }, onProgress);

        const origBytesStr = res.originalSize.toLocaleString() + ' Bytes';
        const newBytesStr = res.newSize.toLocaleString() + ' Bytes';
        const savedBytesStr = Math.abs(res.savedBytes).toLocaleString() + ' Bytes';

        let statusBoxHtml = '';
        if (res.isReduced) {
          statusBoxHtml = `
            <div class="alert-box" style="background: var(--success-50); border: 1px solid rgba(16,185,129,0.3); color: var(--success-700); margin-top: 1rem;">
              <span>🎉 <strong>ลดขนาดสำเร็จ!</strong> ประหยัดพื้นที่ไปได้ <strong>${window.PdfTools.formatSize(res.savedBytes)}</strong> (${savedBytesStr}) หรือคิดเป็น <strong>${res.savedPercent}%</strong></span>
            </div>
          `;
        } else {
          statusBoxHtml = `
            <div class="alert-box alert-warning" style="margin-top: 1rem;">
              <span>⚠️ <strong>ไฟล์ไม่ลดขนาดลง:</strong> ไฟล์ต้นฉบับมีขนาดเล็กหรือถูกบีบอัดมาอย่างดีแล้ว (${origBytesStr}) ทำให้ขนาดผลลัพธ์ (${newBytesStr}) ไม่เล็กลง ${mode === 'structural' ? 'แนะนำให้ลองสลับไปใช้โหมด "บีบอัดภาพและหน้าเอกสาร" ครับ' : 'แนะนำให้ใช้ไฟล์ต้นฉบับได้เลยครับ'}</span>
            </div>
          `;
        }

        return {
          blob: res.blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_compressed.pdf`,
          customResultHtml: `
            <div class="comparison-container">
              <div class="comparison-box">
                <h4>ขนาดเดิม</h4>
                <div class="comparison-size">${window.PdfTools.formatSize(res.originalSize)}</div>
                <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">${origBytesStr}</div>
              </div>
              <div class="comparison-box">
                <h4>ขนาดหลังบีบอัด</h4>
                <div class="comparison-size" style="color: ${res.isReduced ? 'var(--success-500)' : 'var(--slate-800)'};">
                  ${window.PdfTools.formatSize(res.newSize)}
                </div>
                <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">${newBytesStr}</div>
                ${res.isReduced ? `<span class="comparison-save-badge">ลดลง ${res.savedPercent}% 🎉</span>` : '<span style="font-size:0.8rem; color:var(--warning-700); font-weight:600;">ขนาดไม่เล็กลง</span>'}
              </div>
            </div>
            ${statusBoxHtml}
          `,
          successMsg: res.isReduced ? 'บีบอัดเอกสาร PDF สำเร็จ!' : 'ประมวลผล PDF เรียบร้อย (ไม่มีการลดขนาด)'
        };
      }
    },
    {
      id: 'rotate-pdf',
      name: 'Rotate PDF',
      title: 'หมุนหน้ากระดาษ PDF',
      category: 'pdf',
      icon: '🔄',
      desc: 'หมุนเอกสาร PDF 90, 180 หรือ 270 องศา ทั้งหมดหรือเฉพาะหน้าที่ต้องการ',
      badge: 'Client-Side',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'หมุนหน้ากระดาษและบันทึก',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">องศาการหมุน</label>
            <select id="rotateAngle" class="form-control">
              <option value="90">หมุน 90° ตามเข็มนาฬิกา (ขวา)</option>
              <option value="180">หมุน 180° (กลับหัว)</option>
              <option value="270">หมุน 270° ทวนเข็มนาฬิกา (ซ้าย)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">เลือกหน้าที่ต้องการหมุน</label>
            <select id="rotateTarget" class="form-control" onchange="PenguApp.handleRotateTargetChange(this.value)">
              <option value="all">ทุกหน้าในเอกสาร</option>
              <option value="odd">เฉพาะหน้าคี่ (1, 3, 5...)</option>
              <option value="even">เฉพาะหน้าคู่ (2, 4, 6...)</option>
              <option value="custom">ระบุหน้าเอง</option>
            </select>
          </div>
          <div class="form-group" id="rotateCustomGroup" style="display: none;">
            <label class="form-label">ระบุหน้า (เช่น 1, 3, 5-7)</label>
            <input type="text" id="rotateCustomRange" class="form-control" placeholder="เช่น 1, 3">
          </div>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const angle = parseInt(document.getElementById('rotateAngle')?.value || '90', 10);
        const target = document.getElementById('rotateTarget')?.value || 'all';
        const customRange = document.getElementById('rotateCustomRange')?.value || '';
        const blob = await window.PdfTools.rotatePdf(files[0], angle, target, customRange, onProgress);
        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_rotated.pdf`,
          successMsg: 'หมุนหน้ากระดาษ PDF เรียบร้อยแล้ว!'
        };
      }
    },
    {
      id: 'extract-pdf',
      name: 'Extract PDF Pages',
      title: 'ดึงหน้า PDF ที่เลือก',
      category: 'pdf',
      icon: '📑',
      desc: 'ดึงเฉพาะหน้าที่ต้องการ เช่น หน้า 1, 3 หรือช่วงหน้า 5-8 ออกมาเป็น PDF ใหม่',
      badge: 'Client-Side',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'ดึงหน้าที่เลือกออกมา',
      renderSettings: () => `
        <div class="form-group">
          <label class="form-label">ระบุหน้าที่ต้องการดึง (เช่น 1, 3, 5-8)</label>
          <input type="text" id="extractRange" class="form-control" placeholder="เช่น 1, 3-5" value="1">
          <small style="color: var(--slate-500); margin-top: 4px;">ใช้เครื่องหมายจุลภาคคั่น หรือขีดสำหรับช่วงหน้า</small>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const range = document.getElementById('extractRange')?.value || '1';
        const blob = await window.PdfTools.extractPages(files[0], range, onProgress);
        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_extracted.pdf`,
          successMsg: 'ดึงหน้าที่เลือกออกมาเป็นไฟล์ใหม่สำเร็จ!'
        };
      }
    },
    {
      id: 'images-to-pdf',
      name: 'Images to PDF',
      title: 'แปลงรูปภาพเป็น PDF',
      category: 'pdf',
      icon: '🖼️',
      desc: 'รวมรูปภาพหลายรูป (JPG, PNG, WebP) เป็นเอกสาร PDF ปรับขนาดและระยะขอบได้',
      badge: 'Popular',
      accept: 'image/*,.jpg,.jpeg,.png,.webp,.bmp',
      multiple: true,
      btnText: 'แปลงรูปภาพเป็น PDF',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">ขนาดหน้ากระดาษ</label>
            <select id="imgPdfSize" class="form-control">
              <option value="a4" selected>กระดาษ A4 มาตรฐาน</option>
              <option value="fit">พอดีกับขนาดรูปภาพ (Fit to Image)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">การวางแนวหน้ากระดาษ</label>
            <select id="imgPdfOrient" class="form-control">
              <option value="auto" selected>อัตโนมัติตามรูปภาพ</option>
              <option value="portrait">แนวตั้ง (Portrait)</option>
              <option value="landscape">แนวนอน (Landscape)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ระยะขอบกระดาษ</label>
            <select id="imgPdfMargin" class="form-control">
              <option value="0">ไม่มีขอบ (ชิดขอบเต็มหน้า)</option>
              <option value="20" selected>ขอบมาตรฐาน (20 pt)</option>
              <option value="40">ขอบกว้าง (40 pt)</option>
            </select>
          </div>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const pageSize = document.getElementById('imgPdfSize')?.value || 'a4';
        const orientation = document.getElementById('imgPdfOrient')?.value || 'auto';
        const margin = parseInt(document.getElementById('imgPdfMargin')?.value || '20', 10);
        const blob = await window.PdfTools.imagesToPdf(files, { pageSize, orientation, margin }, onProgress);
        return {
          blob,
          filename: 'pengutools_images.pdf',
          successMsg: `รวมรูปภาพจำนวน ${files.length} รูปเป็น PDF เรียบร้อย!`
        };
      }
    },
    {
      id: 'pdf-to-images',
      name: 'PDF to Images',
      title: 'แปลง PDF เป็นรูปภาพ',
      category: 'pdf',
      icon: '📸',
      desc: 'แปลงหน้าเอกสาร PDF แต่ละหน้าให้ออกมาเป็นรูปภาพ PNG หรือ JPG ความคมชัดสูง',
      badge: 'Client-Side',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'แปลงเป็นรูปภาพ',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">ฟอร์แมตรูปภาพ</label>
            <select id="pdfImgFormat" class="form-control">
              <option value="image/png" selected>PNG (คมชัดสูงสุด ไม่สูญเสียรายละเอียด)</option>
              <option value="image/jpeg">JPG (ขนาดไฟล์เล็ก)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ความละเอียด (Resolution)</label>
            <select id="pdfImgScale" class="form-control">
              <option value="1.5">มาตรฐาน (1.5x - พอดีอ่าน)</option>
              <option value="2.0" selected>ความละเอียดสูง (2x - แนะนำ)</option>
              <option value="3.0">คมชัดพิเศษ (3x - ละเอียดสูงสำหรับพิมพ์)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">หน้าที่ต้องการแปลง (เว้นว่าง = ทุกหน้า)</label>
            <input type="text" id="pdfImgRange" class="form-control" placeholder="เช่น 1-3 หรือเว้นว่าง">
          </div>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const format = document.getElementById('pdfImgFormat')?.value || 'image/png';
        const scale = parseFloat(document.getElementById('pdfImgScale')?.value || '2.0');
        const pageRange = document.getElementById('pdfImgRange')?.value || '';
        const result = await window.PdfTools.pdfToImages(files[0], { format, scale, pageRange }, onProgress);
        return {
          blob: result.blob,
          filename: result.filename,
          successMsg: 'แปลงหน้า PDF เป็นรูปภาพสำเร็จ!'
        };
      }
    },
    {
      id: 'unlock-pdf',
      name: 'Unlock PDF',
      title: 'ปลดล็อกรหัสผ่าน PDF',
      category: 'pdf',
      icon: '🔓',
      desc: 'ปลดล็อกเอกสาร PDF ที่ทราบรหัสผ่าน เพื่อให้เปิดอ่าน แก้ไข หรือสั่งพิมพ์ได้โดยไม่ต้องกรอกรหัสซ้ำ',
      badge: 'Security',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'ปลดล็อกและบันทึก PDF',
      renderSettings: () => `
        <div class="form-group">
          <label class="form-label">รหัสผ่านเปิดเอกสาร (Password)</label>
          <div style="position: relative;">
            <input type="password" id="pdfUnlockPassword" class="form-control" placeholder="กรอกรหัสผ่านของไฟล์ PDF นี้" autocomplete="current-password">
            <button type="button" class="btn-icon-subtle" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 0.9rem;" onclick="
              const input = document.getElementById('pdfUnlockPassword');
              input.type = input.type === 'password' ? 'text' : 'password';
              this.textContent = input.type === 'password' ? '👁️' : '🙈';
            ">👁️</button>
          </div>
        </div>
        ${window.PenguMascot.withTip('รหัสผ่านและไฟล์ PDF จะถูกถอดรหัสในเบราว์เซอร์ของเครื่องคุณโดยตรง ไม่มีการส่งรหัสผ่านไปยังเซิร์ฟเวอร์ มั่นใจได้ว่าข้อมูลปลอดภัย 100% กวิน!', 'droppable', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const password = document.getElementById('pdfUnlockPassword')?.value || '';
        if (!password.trim()) {
          throw new Error('กรุณาระบุรหัสผ่านเพื่อปลดล็อกไฟล์ PDF');
        }
        const blob = await window.PdfTools.unlockPdf(files[0], password, onProgress);
        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_unlocked.pdf`,
          successMsg: 'ปลดล็อกรหัสผ่านเอกสาร PDF สำเร็จ! สามารถเปิดดูได้ทันทีโดยไม่ต้องใส่รหัสผ่านอีก'
        };
      }
    },
    {
      id: 'protect-pdf',
      name: 'Protect PDF',
      title: 'ล็อกรหัสผ่าน PDF',
      category: 'pdf',
      icon: '🔒',
      desc: 'ตั้งรหัสผ่านเปิดเอกสาร PDF และจำกัดสิทธิ์การพิมพ์ คัดลอก หรือแก้ไข เข้ารหัสในเครื่องของคุณ',
      badge: 'Security',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'ล็อกรหัสผ่านและบันทึก PDF',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">รหัสผ่านเปิดเอกสาร</label>
            <input type="password" id="protectUserPw" class="form-control" placeholder="รหัสผ่านที่ใช้เปิดไฟล์" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label">ยืนยันรหัสผ่าน</label>
            <input type="password" id="protectUserPw2" class="form-control" placeholder="พิมพ์รหัสผ่านอีกครั้ง" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label">รหัสผ่านเจ้าของ (ไม่บังคับ - ใช้ปลดล็อกสิทธิ์)</label>
            <input type="password" id="protectOwnerPw" class="form-control" placeholder="เว้นว่าง = สุ่มให้อัตโนมัติ" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label">สิทธิ์ที่อนุญาต</label>
            <label style="display:flex; gap:8px; align-items:center;"><input type="checkbox" id="protectAllowPrint" checked> อนุญาตให้สั่งพิมพ์</label>
            <label style="display:flex; gap:8px; align-items:center;"><input type="checkbox" id="protectAllowCopy"> อนุญาตให้คัดลอกข้อความ</label>
            <label style="display:flex; gap:8px; align-items:center;"><input type="checkbox" id="protectAllowModify"> อนุญาตให้แก้ไขเอกสาร</label>
          </div>
        </div>
        ${window.PenguMascot.withTip('จำรหัสผ่านไว้ให้ดีนะ! ระบบไม่เก็บรหัสผ่านไว้ที่ไหนเลย ถ้าลืมจะเปิดไฟล์ไม่ได้อีกกวิน!', 'droppable', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const userPassword = document.getElementById('protectUserPw')?.value || '';
        const confirmPw = document.getElementById('protectUserPw2')?.value || '';
        if (!userPassword) throw new Error('กรุณาตั้งรหัสผ่านสำหรับเปิดเอกสาร');
        if (userPassword !== confirmPw) throw new Error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        const blob = await window.PdfTools.protectPdf(files[0], {
          userPassword,
          ownerPassword: document.getElementById('protectOwnerPw')?.value || '',
          allowPrinting: document.getElementById('protectAllowPrint')?.checked ?? true,
          allowCopying: document.getElementById('protectAllowCopy')?.checked ?? false,
          allowModifying: document.getElementById('protectAllowModify')?.checked ?? false
        }, onProgress);
        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_protected.pdf`,
          successMsg: 'ล็อกรหัสผ่านเอกสาร PDF สำเร็จ! ต้องใส่รหัสผ่านทุกครั้งที่เปิดไฟล์'
        };
      }
    },
    {
      id: 'pdf-to-text',
      name: 'PDF to Text',
      title: 'ดึงข้อความจาก PDF',
      category: 'pdf',
      icon: '📝',
      desc: 'ดึงข้อความทั้งหมดในเอกสาร PDF ออกมาเป็นไฟล์ .txt รองรับภาษาไทย พร้อมคัดลอกได้ทันที',
      badge: 'New',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'ดึงข้อความ',
      renderSettings: () => `
        <div class="form-group">
          <label class="form-label">หน้าที่ต้องการ (เว้นว่าง = ทุกหน้า)</label>
          <input type="text" id="textRange" class="form-control" placeholder="เช่น 1-3, 5">
        </div>
        ${window.PenguMascot.withTip('ใช้ได้กับ PDF ที่มีข้อความจริง ถ้าเป็นไฟล์สแกนเป็นรูปภาพจะไม่มีข้อความให้ดึงนะกวิน!', 'waving', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const range = document.getElementById('textRange')?.value || '';
        const res = await window.PdfTools.extractText(files[0], range, onProgress);
        const preview = res.text.length > 20000 ? res.text.slice(0, 20000) + '\n…' : res.text;
        return {
          blob: res.blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}.txt`,
          customResultHtml: res.charCount === 0 ? `
            <div class="alert-box alert-warning" style="margin-top: 1rem;">
              <span>⚠️ ไม่พบข้อความในเอกสารนี้ อาจเป็นไฟล์สแกนที่เป็นรูปภาพ (ต้องใช้ OCR)</span>
            </div>
          ` : `
            <textarea id="extractedTextPreview" class="form-control" readonly style="width: 100%; min-height: 260px; margin-top: 1rem; font-family: inherit; text-align: left;">${escapeHtml(preview)}</textarea>
            <button type="button" class="btn-secondary" style="margin-top: 0.5rem;" onclick="navigator.clipboard && navigator.clipboard.writeText(document.getElementById('extractedTextPreview').value).then(() => { this.textContent = '✅ คัดลอกแล้ว'; })">📋 คัดลอกข้อความ</button>
          `,
          successMsg: `ดึงข้อความ ${res.pageCount} หน้า (${res.charCount.toLocaleString()} ตัวอักษร) สำเร็จ!`
        };
      }
    },
    {
      id: 'watermark-pdf',
      name: 'PDF Watermark & Numbering',
      title: 'ใส่เลขหน้าและลายน้ำ PDF',
      category: 'pdf',
      icon: '✍️',
      desc: 'เพิ่มเลขหน้า (เช่น 1/10 หรือ หน้า 1 จาก 10) และประทับตราลายน้ำ (เช่น สำเนาถูกต้อง) ลงในเอกสาร PDF',
      badge: 'Popular',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'ประทับตราและบันทึก PDF',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="enablePageNumber" checked onchange="document.getElementById('pageNumberSettings').style.display = this.checked ? 'block' : 'none'">
              <strong>เพิ่มเลขหน้าเอกสาร</strong>
            </label>
            <div id="pageNumberSettings" style="margin-top: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.8rem;">ตำแหน่งเลขหน้า</label>
                  <select id="pageNumberPos" class="form-control">
                    <option value="bottom-center" selected>กึ่งกลางล่าง (แนะนำ)</option>
                    <option value="bottom-right">ล่างขวา</option>
                    <option value="bottom-left">ล่างซ้าย</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.8rem;">รูปแบบเลขหน้า</label>
                  <select id="pageNumberFormat" class="form-control">
                    <option value="page_of_total" selected>1 / 10</option>
                    <option value="thai">หน้า 1 จาก 10</option>
                    <option value="page_only">เฉพาะเลขหน้า (1)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="enableWatermark" checked onchange="document.getElementById('watermarkSettings').style.display = this.checked ? 'block' : 'none'">
              <strong>ใส่ลายน้ำ (Watermark)</strong>
            </label>
            <div id="watermarkSettings" style="margin-top: 8px;">
              <label class="form-label" style="font-size: 0.8rem;">ข้อความลายน้ำ</label>
              <input type="text" id="watermarkText" class="form-control" value="สำเนาถูกต้อง" placeholder="เช่น สำเนาถูกต้อง หรือ CONFIDENTIAL">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.8rem;">สีลายน้ำ</label>
                  <select id="watermarkColor" class="form-control">
                    <option value="#0284c7" selected>สีฟ้า (Pengu Blue)</option>
                    <option value="#ef4444">สีแดง (เตือน/สำคัญ)</option>
                    <option value="#64748b">สีเทา (มาตรฐาน)</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.8rem;">ความจาง (Opacity)</label>
                  <select id="watermarkOpacity" class="form-control">
                    <option value="0.15">จางมาก (15%)</option>
                    <option value="0.25" selected>มาตรฐาน (25%)</option>
                    <option value="0.45">ชัดเจน (45%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${window.PenguMascot.withTip('รองรับภาษาไทย 100%! ประทับตรา "สำเนาถูกต้อง" หรือใส่เลขหน้าได้คมชัด สวยงาม ไม่มีปัญหาฟอนต์เพี้ยนแน่นอนกวิน!', 'happy', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const addPageNumber = document.getElementById('enablePageNumber')?.checked ?? true;
        const pageNumberPos = document.getElementById('pageNumberPos')?.value || 'bottom-center';
        const pageNumberFormat = document.getElementById('pageNumberFormat')?.value || 'page_of_total';

        const addWatermark = document.getElementById('enableWatermark')?.checked ?? false;
        const watermarkText = document.getElementById('watermarkText')?.value || '';
        const watermarkColor = document.getElementById('watermarkColor')?.value || '#0284c7';
        const watermarkOpacity = parseFloat(document.getElementById('watermarkOpacity')?.value || '0.25');

        const blob = await window.PdfTools.addWatermarkAndNumbering(files[0], {
          addPageNumber,
          pageNumberPos,
          pageNumberFormat,
          addWatermark,
          watermarkText,
          watermarkColor,
          watermarkOpacity,
          watermarkAngle: -45
        }, onProgress);

        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_stamped.pdf`,
          successMsg: 'ประทับตราลายน้ำและเพิ่มเลขหน้าลงในเอกสาร PDF เรียบร้อย!'
        };
      }
    },
    {
      id: 'sign-pdf',
      name: 'Sign PDF',
      title: 'เซ็นเอกสาร PDF',
      category: 'pdf',
      icon: '🖊️',
      desc: 'วาดลายเซ็นด้วยนิ้วมือหรือเมาส์ หรืออัปโหลดภาพลายเซ็น วางลงบนหน้าเอกสาร PDF ได้อิสระ ปลอดภัย 100%',
      badge: 'New',
      accept: '.pdf,application/pdf',
      multiple: false,
      btnText: 'บันทึกเอกสาร PDF พร้อมลายเซ็น',
      renderSettings: () => `
        <div class="sign-pdf-container">
          <!-- Signature Source Tabs -->
          <div class="sign-tabs">
            <button type="button" class="sign-tab-btn active" id="tabDrawSig" onclick="PenguApp.switchSignTab('draw')">
              ✍️ วาดลายเซ็น
            </button>
            <button type="button" class="sign-tab-btn" id="tabUploadSig" onclick="PenguApp.switchSignTab('upload')">
              📁 อัปโหลดภาพลายเซ็น
            </button>
          </div>

          <!-- Drawing Pad Area -->
          <div id="drawSigArea" class="sign-draw-area">
            <div class="sign-canvas-controls">
              <div class="sign-color-picker">
                <span class="sign-ctrl-label">สีหมึก:</span>
                <button type="button" class="color-dot active" style="background:#0f172a;" onclick="PenguApp.setSignColor('#0f172a', this)" title="สีดำ"></button>
                <button type="button" class="color-dot" style="background:#1d4ed8;" onclick="PenguApp.setSignColor('#1d4ed8', this)" title="สีน้ำเงิน"></button>
                <button type="button" class="color-dot" style="background:#dc2626;" onclick="PenguApp.setSignColor('#dc2626', this)" title="สีแดง"></button>
              </div>
              <div class="sign-width-picker">
                <span class="sign-ctrl-label">ขนาดเส้น:</span>
                <select id="signPenWidth" class="form-control" style="padding: 4px 8px; min-height: 36px; width: auto;" onchange="PenguApp.setSignWidth(this.value)">
                  <option value="2">บาง (2px)</option>
                  <option value="3" selected>ปานกลาง (3px)</option>
                  <option value="4">หนา (4px)</option>
                </select>
              </div>
              <button type="button" class="btn-clear-sig" onclick="PenguApp.clearSignature()">
                🗑️ ล้างลายเซ็น
              </button>
            </div>
            <div class="sign-canvas-wrap">
              <canvas id="signatureCanvas" width="540" height="190"></canvas>
              <div class="sign-canvas-hint">ใช้นิ้วมือหรือเมาส์เซ็นชื่อในกรอบนี้</div>
            </div>
          </div>

          <!-- Upload Image Area -->
          <div id="uploadSigArea" class="sign-upload-area" style="display: none;">
            <div class="sign-upload-box">
              <input type="file" id="sigFileInput" accept="image/png,image/jpeg,image/webp" style="display: none;" onchange="PenguApp.handleSigFileSelect(this)">
              <button type="button" class="btn-secondary" onclick="document.getElementById('sigFileInput').click()">
                เลือกภาพลายเซ็น (PNG โปร่งใส หรือ JPG)
              </button>
              <div id="sigImagePreview" style="margin-top: 10px; display: none;">
                <img id="sigImgTag" src="" alt="ภาพลายเซ็น" style="max-height: 90px; border: 1px dashed var(--slate-300); border-radius: 6px; padding: 4px; background: #fff;">
              </div>
            </div>
          </div>

          <!-- Signature Placement & Page Selection -->
          <div class="settings-grid" style="margin-top: 1.5rem;">
            <div class="form-group">
              <label class="form-label">วางลายเซ็นที่หน้า</label>
              <select id="signTargetPage" class="form-control" onchange="PenguApp.refreshSignPagePreview()">
                <option value="last" selected>หน้าสุดท้าย (มาตรฐานสัญญา/เอกสาร)</option>
                <option value="1">หน้าแรก (หน้า 1)</option>
                <option value="all">ทุกหน้าในเอกสาร</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">ตำแหน่งลายเซ็น (Presets)</label>
              <select id="signPosPreset" class="form-control" onchange="PenguApp.applySignPreset(this.value)">
                <option value="bottom-right" selected>ล่างขวา (มาตรฐานสัญญา/หนังสือราชการ)</option>
                <option value="bottom-left">ล่างซ้าย</option>
                <option value="bottom-center">ล่างตรงกลาง</option>
                <option value="center">กึ่งกลางหน้ากระดาษ</option>
                <option value="custom">กำหนดพิกัดเอง</option>
              </select>
            </div>
          </div>

          <!-- Position & Size Sliders -->
          <div class="settings-grid" style="margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label">ขนาดลายเซ็น: <span id="signSizeVal" class="range-val-badge">26%</span></label>
              <div class="range-slider-wrap">
                <input type="range" id="signSizeSlider" class="range-slider" min="10" max="50" value="26" oninput="PenguApp.handleSignSliderChange()">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">ตำแหน่งแนวนอน (X): <span id="signPosXVal" class="range-val-badge">70%</span></label>
              <div class="range-slider-wrap">
                <input type="range" id="signPosXSlider" class="range-slider" min="0" max="100" value="70" oninput="PenguApp.handleSignSliderChange()">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">ตำแหน่งแนวตั้ง (Y): <span id="signPosYVal" class="range-val-badge">85%</span></label>
              <div class="range-slider-wrap">
                <input type="range" id="signPosYSlider" class="range-slider" min="0" max="100" value="85" oninput="PenguApp.handleSignSliderChange()">
              </div>
            </div>
          </div>

          <!-- Date Stamp Option -->
          <div class="form-group" style="margin-top: 1rem; background: var(--slate-50); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--slate-200);">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
              <input type="checkbox" id="signAddDate" onchange="PenguApp.handleSignDateToggle(this.checked)">
              <span>ประทับตราวันที่กำกับใต้ลายเซ็น</span>
            </label>
            <div id="signDateInputGroup" style="display: none; margin-top: 8px;">
              <input type="text" id="signDateText" class="form-control" placeholder="เช่น 18 ต.ค. 2569 หรือ 18/10/2026" oninput="PenguApp.updateSignLivePreview()">
            </div>
          </div>

          <!-- Live Placement Visual Preview -->
          <div class="sign-preview-section" style="margin-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <label class="form-label" style="margin: 0; font-weight: 700; color: var(--slate-800);">
                👁️ ตัวอย่างตำแหน่งจริงบนหน้ากระดาษ (Live Placement Preview)
              </label>
              <span style="font-size: 0.78rem; color: var(--slate-500); background: var(--slate-200); padding: 2px 8px; border-radius: 10px;">คลิกบนหน้าเพื่อวางลายเซ็น</span>
            </div>
            <div class="sign-page-mockup-wrapper">
              <div class="sign-page-mockup" id="signPageMockup">
                <div class="mock-doc-line" style="width: 45%; height: 8px; background: var(--primary-200); margin-bottom: 14px;"></div>
                <div class="mock-doc-line" style="width: 95%;"></div>
                <div class="mock-doc-line" style="width: 88%;"></div>
                <div class="mock-doc-line" style="width: 92%;"></div>
                <div class="mock-doc-line" style="width: 70%;"></div>
                <div class="mock-doc-line" style="width: 90%;"></div>
                <div class="mock-doc-line" style="width: 85%;"></div>
                <div class="mock-doc-line" style="width: 60%;"></div>

                <div class="mock-signature-badge" id="mockSigBadge">
                  <img id="mockSigImg" class="mock-sig-thumb" src="" alt="ลายเซ็น">
                  <span id="mockSigText" style="font-size: 0.75rem; font-weight: 700; color: var(--primary-700);">✍️ ลายเซ็น</span>
                  <span id="mockDateBadge" style="display: none; font-size: 0.65rem; color: var(--slate-600); font-weight: 600; margin-top: 2px;"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const sigDataUrl = PenguApp.getSignatureDataUrl();
        if (!sigDataUrl) {
          throw new Error('กรุณาวาดลายเซ็นหรืออัปโหลดภาพลายเซ็นก่อนบันทึกครับ');
        }

        const targetPage = document.getElementById('signTargetPage')?.value || 'last';
        const posX = parseInt(document.getElementById('signPosXSlider')?.value || '70', 10);
        const posY = parseInt(document.getElementById('signPosYSlider')?.value || '85', 10);
        const size = parseInt(document.getElementById('signSizeSlider')?.value || '26', 10);
        const addDate = document.getElementById('signAddDate')?.checked || false;
        const dateText = document.getElementById('signDateText')?.value || '';

        const blob = await window.PdfTools.signPdf(files[0], {
          signatureDataUrl: sigDataUrl,
          targetPage,
          posXPercent: posX,
          posYPercent: posY,
          sizePercent: size,
          addDate,
          dateText
        }, onProgress);

        return {
          blob,
          filename: `${files[0].name.replace(/\.pdf$/i, '')}_signed.pdf`,
          successMsg: 'เซ็นเอกสาร PDF เรียบร้อยแล้ว พร้อมดาวน์โหลดครับ! ✍️'
        };
      }
    },

    // --- Image Tools ---
    {
      id: 'image-compressor',
      name: 'Image Compressor',
      title: 'บีบอัดรูปภาพ',
      category: 'image',
      icon: '📉',
      desc: 'ลดขนาดไฟล์รูปภาพ JPEG, PNG, WebP ให้เล็กลงจริง พร้อมปรับระดับสเกลและคุณภาพ',
      badge: 'Popular',
      accept: 'image/*,.jpg,.jpeg,.png,.webp',
      multiple: true,
      maxFiles: 50,
      btnText: 'บีบอัดรูปภาพ',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label">คุณภาพรูปภาพ (Quality)</label>
              <span id="qualityValBadge" class="range-val-badge">75%</span>
            </div>
            <div class="range-slider-wrap">
              <input type="range" id="compressQuality" class="range-slider" min="10" max="95" value="75" 
                oninput="document.getElementById('qualityValBadge').textContent = this.value + '%'">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">ปรับขนาดย่อภาพ (Scale)</label>
            <select id="compressScalePreset" class="form-control">
              <option value="100" selected>ขนาดเดิม (100%)</option>
              <option value="75">ย่อลง 75% ของขนาดเดิม</option>
              <option value="50">ย่อลง 50% (ลดขนาดไฟล์ได้มหาศาล)</option>
              <option value="max1920">จำกัดความกว้างสูงสุด 1920px (Full HD)</option>
              <option value="max1280">จำกัดความกว้างสูงสุด 1280px (HD)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ฟอร์แมตผลลัพธ์</label>
            <select id="compressOutputFormat" class="form-control">
              <option value="auto" selected>อัตโนมัติ (ฉลาดเลือก JPG/WebP เพื่อลดขนาดสูงสุด)</option>
              <option value="image/jpeg">JPG (ลดขนาดได้มากที่สุด สำหรับภาพถ่ายทั่วไป)</option>
              <option value="image/webp">WebP (กะทัดรัด คมชัด และรองรับพื้นหลังโปร่งใส)</option>
              <option value="image/png">PNG (คงไฟล์ PNG - ไม่สูญเสียรายละเอียด)</option>
            </select>
          </div>
        </div>
        ${window.PenguMascot.withTip('สามารถเลือกหลายรูปพร้อมกันได้สูงสุด 50 รูป! ระบบจะบีบอัดต่อเนื่องและรวมเป็นไฟล์ ZIP ให้อัตโนมัติเลยครับกวิน!', 'happy', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const qVal = parseInt(document.getElementById('compressQuality')?.value || '75', 10);
        const quality = qVal / 100;
        const outputFormat = document.getElementById('compressOutputFormat')?.value || 'auto';
        const scaleVal = document.getElementById('compressScalePreset')?.value || '100';

        let scalePercent = 100;
        let maxWidth = null;
        if (scaleVal === '75') scalePercent = 75;
        else if (scaleVal === '50') scalePercent = 50;
        else if (scaleVal === 'max1920') maxWidth = 1920;
        else if (scaleVal === 'max1280') maxWidth = 1280;

        const res = await window.ImageTools.compressMultipleImages(files, {
          quality,
          outputFormat,
          scalePercent,
          maxWidth
        }, onProgress);

        if (res.isBatch) {
          const origBytesStr = res.originalSize.toLocaleString() + ' Bytes';
          const newBytesStr = res.newSize.toLocaleString() + ' Bytes';
          const savedBytesStr = Math.abs(res.savedBytes).toLocaleString() + ' Bytes';

          return {
            blob: res.blob,
            filename: res.filename,
            customResultHtml: `
              <div class="comparison-container">
                <div class="comparison-box">
                  <h4>ขนาดเดิมรวม (${res.totalFiles} รูป)</h4>
                  <div class="comparison-size">${window.PdfTools.formatSize(res.originalSize)}</div>
                  <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">${origBytesStr}</div>
                </div>
                <div class="comparison-box">
                  <h4>ขนาดหลังบีบอัดรวม (ZIP)</h4>
                  <div class="comparison-size" style="color: ${res.isReduced ? 'var(--success-500)' : 'var(--slate-800)'};">
                    ${window.PdfTools.formatSize(res.newSize)}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">${newBytesStr}</div>
                  ${res.isReduced ? `<span class="comparison-save-badge">ลดลง ${res.savedPercent}% 🎉</span>` : '<span style="font-size:0.8rem; color:var(--warning-700); font-weight:600;">ขนาดไม่เล็กลง</span>'}
                </div>
              </div>
              <div class="alert-box" style="background: var(--success-50); border: 1px solid rgba(16,185,129,0.3); color: var(--success-700); margin-top: 1rem;">
                <span>🎉 <strong>บีบอัดภาพชุดสำเร็จ!</strong> รวมไฟล์ทั้งหมด ${res.totalFiles} รูป ประหยัดพื้นที่รวมได้ <strong>${window.PdfTools.formatSize(res.savedBytes)}</strong> (${savedBytesStr})</span>
              </div>
            `,
            successMsg: `บีบอัดรูปภาพเป็นชุดสำเร็จทั้งหมด ${res.totalFiles} รูป พร้อมดาวน์โหลดเป็น ZIP แล้ว!`
          };
        }

        const origBytesStr = res.originalSize.toLocaleString() + ' Bytes';
        const newBytesStr = res.newSize.toLocaleString() + ' Bytes';
        const savedBytesStr = Math.abs(res.savedBytes).toLocaleString() + ' Bytes';

        let statusBoxHtml = '';
        if (res.isReduced) {
          statusBoxHtml = `
            <div class="alert-box" style="background: var(--success-50); border: 1px solid rgba(16,185,129,0.3); color: var(--success-700); margin-top: 1rem;">
              <span>🎉 <strong>ลดขนาดภาพสำเร็จ!</strong> ประหยัดพื้นที่ไปได้ <strong>${window.PdfTools.formatSize(res.savedBytes)}</strong> (${savedBytesStr}) หรือคิดเป็น <strong>${res.savedPercent}%</strong></span>
            </div>
          `;
        } else {
          statusBoxHtml = `
            <div class="alert-box alert-warning" style="margin-top: 1rem;">
              <span>⚠️ <strong>ไฟล์ไม่ลดขนาดลง:</strong> ภาพต้นฉบับถูกบีบอัดมาอย่างดีแล้ว (${origBytesStr}) แนะนำให้ลองปรับลดคุณภาพลง หรือเลือกตัวเลือก "ย่อขนาดย่อภาพ" ครับ</span>
            </div>
          `;
        }

        return {
          blob: res.blob,
          filename: res.filename,
          customResultHtml: `
            <div class="comparison-container">
              <div class="comparison-box">
                <h4>ขนาดเดิม</h4>
                <div class="comparison-size">${window.PdfTools.formatSize(res.originalSize)}</div>
                <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">${origBytesStr}</div>
              </div>
              <div class="comparison-box">
                <h4>ขนาดหลังบีบอัด</h4>
                <div class="comparison-size" style="color: ${res.isReduced ? 'var(--success-500)' : 'var(--slate-800)'};">
                  ${window.PdfTools.formatSize(res.newSize)}
                </div>
                <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 4px;">${newBytesStr}</div>
                ${res.isReduced ? `<span class="comparison-save-badge">ลดลง ${res.savedPercent}% 🎉</span>` : '<span style="font-size:0.8rem; color:var(--warning-700); font-weight:600;">ขนาดไม่เล็กลง</span>'}
              </div>
            </div>
            ${statusBoxHtml}
          `,
          successMsg: res.isReduced ? 'บีบอัดรูปภาพสำเร็จ!' : 'ประมวลผลรูปภาพเรียบร้อย (ขนาดไม่ลดลง)'
        };
      }
    },
    {
      id: 'image-resizer',
      name: 'Image Resizer',
      title: 'ปรับขนาดภาพ',
      category: 'image',
      icon: '📐',
      desc: 'ปรับความกว้างและความสูงของภาพตามต้องการ ล็อกสัดส่วน หรือเลือก Preset ยอดนิยม',
      badge: 'Client-Side',
      accept: 'image/*,.jpg,.jpeg,.png,.webp,.bmp',
      multiple: false,
      btnText: 'ปรับขนาดรูปภาพ',
      renderSettings: (files) => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">ความกว้าง (Width - px)</label>
            <input type="number" id="resizeWidth" class="form-control" placeholder="ความกว้าง" value="1280" oninput="PenguApp.handleResizeDimChange('w')">
          </div>
          <div class="form-group">
            <label class="form-label">ความสูง (Height - px)</label>
            <input type="number" id="resizeHeight" class="form-control" placeholder="ความสูง" value="720" oninput="PenguApp.handleResizeDimChange('h')">
          </div>
          <div class="form-group">
            <label class="form-label">Presets ยอดนิยม</label>
            <select id="resizePreset" class="form-control" onchange="PenguApp.handleResizePreset(this.value)">
              <option value="">-- เลือกขนาดด่วน --</option>
              <option value="1920x1080">Full HD (1920 × 1080)</option>
              <option value="1280x720">HD (1280 × 720)</option>
              <option value="1080x1080">Square 1:1 (1080 × 1080)</option>
              <option value="500x500">Avatar / Profile (500 × 500)</option>
              <option value="scale_50">ย่อลง 50%</option>
              <option value="scale_25">ย่อลง 25%</option>
            </select>
          </div>
          <div class="form-group" style="justify-content: center;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 1.5rem; font-weight: 600; font-size: 0.9rem;">
              <input type="checkbox" id="keepAspect" checked> ล็อกสัดส่วนภาพ (Aspect Ratio)
            </label>
          </div>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const targetWidth = document.getElementById('resizeWidth')?.value;
        const targetHeight = document.getElementById('resizeHeight')?.value;
        // Keep the source format (PNG output for a JPEG photo would balloon the file size)
        const srcType = (files[0].type || '').toLowerCase();
        const format = ['image/jpeg', 'image/webp'].includes(srcType) ? srcType : 'image/png';
        const res = await window.ImageTools.resizeImage(files[0], { targetWidth, targetHeight, format }, onProgress);
        return {
          blob: res.blob,
          filename: res.filename,
          customResultHtml: `
            <div class="alert-box alert-info">
              <span>ขนาดเดิม: ${res.origWidth} × ${res.origHeight} px ➔ <strong>ขนาดใหม่: ${res.width} × ${res.height} px</strong></span>
            </div>
          `,
          successMsg: 'ปรับขนาดภาพสำเร็จ!'
        };
      }
    },
    {
      id: 'image-converter',
      name: 'Image Converter',
      title: 'แปลงนามสกุลภาพ',
      category: 'image',
      icon: '🔄',
      desc: 'แปลงชนิดไฟล์รูปภาพระหว่าง PNG, JPG และ WebP ได้อย่างรวดเร็วและคมชัด',
      badge: 'Popular',
      accept: 'image/*,.jpg,.jpeg,.png,.webp,.bmp',
      multiple: true,
      maxFiles: 50,
      btnText: 'แปลงนามสกุลรูปภาพ',
      renderSettings: () => `
        <div class="settings-grid">
          <div class="form-group">
            <label class="form-label">แปลงเป็นฟอร์แมต</label>
            <select id="targetConvertFormat" class="form-control">
              <option value="image/png">PNG (คมชัด เหมาะกับกราฟิก/โปร่งแสง)</option>
              <option value="image/jpeg">JPG / JPEG (เหมาะกับภาพถ่าย)</option>
              <option value="image/webp">WebP (เว็บสมัยใหม่ โหลดเร็ว)</option>
            </select>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between;">
              <label class="form-label">คุณภาพ (สำหรับ JPG & WebP)</label>
              <span id="convertQualBadge" class="range-val-badge">90%</span>
            </div>
            <div class="range-slider-wrap">
              <input type="range" id="convertQuality" class="range-slider" min="10" max="100" value="90"
                oninput="document.getElementById('convertQualBadge').textContent = this.value + '%'">
            </div>
          </div>
        </div>
        ${window.PenguMascot.withTip('สามารถเลือกแปลงหลายรูปพร้อมกันได้สูงสุด 50 รูป! หากเลือกหลายรูป ระบบจะรวมผลลัพธ์เป็นไฟล์ ZIP ให้ทันทีกวิน!', 'waving', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const targetFormat = document.getElementById('targetConvertFormat')?.value || 'image/png';
        const qVal = parseInt(document.getElementById('convertQuality')?.value || '90', 10);
        const quality = qVal / 100;
        const res = await window.ImageTools.convertMultipleImages(files, targetFormat, quality, onProgress);

        if (res.isBatch) {
          return {
            blob: res.blob,
            filename: res.filename,
            customResultHtml: `
              <div class="alert-box" style="background: var(--success-50); border: 1px solid rgba(16,185,129,0.3); color: var(--success-700); margin-top: 1rem;">
                <span>🎉 <strong>แปลงฟอร์แมตภาพชุดสำเร็จ!</strong> รวมทั้งหมด ${res.totalFiles} รูป เป็น ${targetFormat.split('/').pop().toUpperCase()} รวมในไฟล์ ZIP เรียบร้อย</span>
              </div>
            `,
            successMsg: `แปลงนามสกุลภาพเป็นชุดสำเร็จทั้งหมด ${res.totalFiles} รูป!`
          };
        }

        return {
          blob: res.blob,
          filename: res.filename,
          successMsg: `แปลงรูปภาพเป็น ${res.filename.split('.').pop().toUpperCase()} เรียบร้อย!`
        };
      }
    },

    // --- File Utilities ---
    {
      id: 'file-size-checker',
      name: 'File Size Checker',
      title: 'ตรวจสอบขนาดไฟล์',
      category: 'file',
      icon: '📊',
      desc: 'ตรวจสอบขนาดไฟล์อย่างละเอียด พร้อมคำนวณเวลาถ่ายโอนข้อมูลบนเครือข่ายต่าง ๆ',
      badge: 'Utility',
      accept: '*/*',
      multiple: false,
      btnText: 'เริ่มตรวจสอบขนาดไฟล์',
      renderSettings: () => `
        <div class="alert-box alert-info">
          <span>💡 สามารถเลือกไฟล์ใดก็ได้เพื่อคำนวณการจัดเก็บ และความเร็วในการส่งข้อมูลผ่านเน็ตครับ</span>
        </div>
      `,
      execute: async (files) => {
        const info = window.FileTools.checkFileSize(files[0]);
        const safeName = escapeHtml(info.name);
        return {
          noDownload: true,
          customResultHtml: `
            <div class="workspace-card" style="text-align: left; margin-top: 1.5rem;">
              <h3 style="margin-bottom: 1rem; color: var(--slate-900);">ผลการคำนวณขนาดไฟล์: ${safeName}</h3>
              <table class="info-table">
                <tbody>
                  <tr><th>Bytes</th><td>${info.bytes}</td></tr>
                  <tr><th>Kilobytes (KB)</th><td><strong>${info.kb}</strong></td></tr>
                  <tr><th>Megabytes (MB)</th><td><strong>${info.mb}</strong></td></tr>
                  <tr><th>Gigabytes (GB)</th><td>${info.gb}</td></tr>
                  <tr><th>จำกัดขนาดส่งอีเมล (25 MB)</th><td>${info.isEmailSafe ? '<span style="color:var(--success-500); font-weight:700;">✅ ส่งผ่านอีเมลได้สบาย</span>' : '<span style="color:var(--danger-500); font-weight:700;">⚠️ เกินขีดจำกัดไฟล์แนบอีเมล 25MB</span>'}</td></tr>
                </tbody>
              </table>

              <h4 style="margin: 1.5rem 0 0.5rem; color: var(--slate-800);">ประมาณการเวลาอัปโหลด/ดาวน์โหลด</h4>
              <table class="info-table">
                <tbody>
                  <tr><th>เครือข่าย 4G LTE (30 Mbps)</th><td>${info.transferTimes.network4g}</td></tr>
                  <tr><th>เครือข่าย 5G (300 Mbps)</th><td>${info.transferTimes.network5g}</td></tr>
                  <tr><th>เน็ตบ้านไฟเบอร์ (1 Gbps)</th><td>${info.transferTimes.fiber}</td></tr>
                  <tr><th>ช่องต่อ USB 2.0 (480 Mbps)</th><td>${info.transferTimes.usb2}</td></tr>
                  <tr><th>ช่องต่อ USB 3.0 (5 Gbps)</th><td>${info.transferTimes.usb3}</td></tr>
                </tbody>
              </table>
            </div>
          `,
          successMsg: 'วิเคราะห์ขนาดไฟล์เสร็จสมบูรณ์!'
        };
      }
    },
    {
      id: 'zip-files',
      name: 'ZIP Files',
      title: 'รวมไฟล์เป็น ZIP',
      category: 'file',
      icon: '📦',
      desc: 'รวมไฟล์หลายไฟล์เป็นไฟล์ .ZIP เพื่อดาวน์โหลดและแชร์อย่างสะดวกสบาย',
      badge: 'Popular',
      accept: '*/*',
      multiple: true,
      btnText: 'สร้างไฟล์ ZIP',
      renderSettings: () => `
        <div class="form-group">
          <label class="form-label">ตั้งชื่อไฟล์ ZIP ผลลัพธ์</label>
          <input type="text" id="customZipName" class="form-control" placeholder="เช่น archive_files" value="pengu_archive">
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const nameInput = document.getElementById('customZipName')?.value || 'pengu_archive';
        const res = await window.FileTools.zipFiles(files, nameInput, onProgress);
        return {
          blob: res.blob,
          filename: res.filename,
          customResultHtml: `
            <div class="alert-box alert-info">
              <span>รวมไฟล์ทั้งหมด <strong>${files.length} ไฟล์</strong> (ขนาดเดิม ${window.PdfTools.formatSize(res.totalOriginalSize)} ➔ ขนาด ZIP ${window.PdfTools.formatSize(res.zipSize)})</span>
            </div>
          `,
          successMsg: 'สร้างไฟล์ ZIP สำเร็จเรียบร้อย!'
        };
      }
    },
    {
      id: 'file-info',
      name: 'File Information',
      title: 'ดูข้อมูลไฟล์เชิงลึก',
      category: 'file',
      icon: 'ℹ️',
      desc: 'ตรวจสอบ MIME Type, Magic Bytes Signature และคำนวณ SHA-256 Checksum',
      badge: 'Utility',
      accept: '*/*',
      multiple: false,
      btnText: 'สแกนข้อมูลไฟล์',
      renderSettings: () => `
        <div class="alert-box alert-info">
          <span>💡 ระบบจะอ่าน Magic Bytes แท้ของไฟล์ เพื่อตรวจสอบว่าไฟล์ตรงกับนามสกุลจริงหรือไม่ พร้อมคำนวณ SHA-256</span>
        </div>
      `,
      execute: async (files, settings, onProgress) => {
        const info = await window.FileTools.inspectFile(files[0], onProgress);
        let extraRows = '';
        for (const [key, val] of Object.entries(info.extraDetails)) {
          extraRows += `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(val)}</td></tr>`;
        }

        return {
          noDownload: true,
          customResultHtml: `
            <div class="workspace-card" style="text-align: left; margin-top: 1.5rem;">
              <h3 style="margin-bottom: 1rem; color: var(--slate-900);">ข้อมูลไฟล์: ${escapeHtml(info.name)}</h3>
              <table class="info-table">
                <tbody>
                  <tr><th>ชื่อไฟล์ (Filename)</th><td>${escapeHtml(info.name)}</td></tr>
                  <tr><th>นามสกุลไฟล์ (Extension)</th><td>.${escapeHtml(info.extension)}</td></tr>
                  <tr><th>ขนาดไฟล์ (Size)</th><td>${escapeHtml(info.sizeFormatted)}</td></tr>
                  <tr><th>MIME Type ที่ระบบแจ้ง</th><td><code>${escapeHtml(info.mimeType)}</code></td></tr>
                  <tr><th>ชนิดไฟล์จริงจาก Signature</th><td><strong>${escapeHtml(info.detectedFileType)}</strong></td></tr>
                  <tr><th>Magic Bytes Header (Hex)</th><td><code>${escapeHtml(info.magicSignature)}</code></td></tr>
                  <tr><th>แก้ไขล่าสุด (Last Modified)</th><td>${escapeHtml(info.lastModified)}</td></tr>
                  ${extraRows}
                  <tr><th>SHA-256 Hash</th><td><span class="hash-code">${escapeHtml(info.sha256)}</span></td></tr>
                </tbody>
              </table>
            </div>
          `,
          successMsg: 'ตรวจสอบข้อมูลไฟล์เชิงลึกสำเร็จ!'
        };
      }
    },
    {
      id: 'compare-files',
      name: 'File Comparator',
      title: 'เปรียบเทียบไฟล์ 2 ไฟล์',
      category: 'file',
      icon: '⚖️',
      desc: 'เปรียบเทียบไฟล์ 2 ไฟล์ว่ามีข้อมูลและเนื้อหาเหมือนกันทุกบิตหรือไม่ ด้วยการคำนวณและเทียบค่า SHA-256 Checksum',
      badge: 'Security',
      accept: '*/*',
      multiple: true,
      minFiles: 2,
      maxFiles: 2,
      btnText: 'เปรียบเทียบข้อมูลไฟล์',
      renderSettings: () => `
        <div class="alert-box alert-info">
          <span>💡 กรุณาเลือกไฟล์ที่ต้องการเปรียบเทียบจำนวน <strong>2 ไฟล์</strong> เพื่อคำนวณ Checksum เทียบความสอดคล้องครับ</span>
        </div>
        ${window.PenguMascot.withTip('หากรหัส SHA-256 ตรงกันทุกตัวอักษร แสดงว่าไฟล์ทั้งสองมีข้อมูลเหมือนกัน 100% ไม่มีส่วนใดถูกดัดแปลงหรือเสียหายเลยกวิน!', 'waving', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const res = await window.FileTools.compareFiles(files[0], files[1], onProgress);
        return {
          noDownload: true,
          customResultHtml: `
            <div class="compare-status-banner ${res.isIdentical ? 'match' : 'diff'}">
              <span style="font-size: 2rem;">${res.isIdentical ? '✅' : '❌'}</span>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem;">${res.isIdentical ? 'ไฟล์ทั้งสองเหมือนกัน 100% (Identical)' : 'ไฟล์ทั้งสองมีความแตกต่างกัน (Different)'}</h3>
                <p style="margin: 4px 0 0; font-size: 0.9rem;">
                  ${res.isIdentical ? 'ค่ารหัสตรวจสอบ SHA-256 Checksum ตรงกันทุกบิต ปราศจากการดัดแปลง' : `ขนาดต่างกัน ${escapeHtml(res.sizeDiffFormatted)} (${res.sizeDiff.toLocaleString()} Bytes) หรือเนื้อหาภายในไม่ตรงกัน`}
                </p>
              </div>
            </div>

            <div class="compare-grid">
              <div class="compare-card">
                <h4><span>📄</span> ไฟล์ที่ 1: ${escapeHtml(res.file1.name)}</h4>
                <div style="font-size: 0.9rem; color: var(--slate-600); margin-bottom: 8px;">
                  ขนาด: <strong>${escapeHtml(res.file1.sizeFormatted)}</strong> (${res.file1.size.toLocaleString()} Bytes)
                </div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-700);">SHA-256 Checksum:</div>
                <code class="hash-code-block">${escapeHtml(res.file1.hash)}</code>
              </div>

              <div class="compare-card">
                <h4><span>📄</span> ไฟล์ที่ 2: ${escapeHtml(res.file2.name)}</h4>
                <div style="font-size: 0.9rem; color: var(--slate-600); margin-bottom: 8px;">
                  ขนาด: <strong>${escapeHtml(res.file2.sizeFormatted)}</strong> (${res.file2.size.toLocaleString()} Bytes)
                </div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-700);">SHA-256 Checksum:</div>
                <code class="hash-code-block">${escapeHtml(res.file2.hash)}</code>
              </div>
            </div>
          `,
          successMsg: res.isIdentical ? 'ตรวจสอบแล้ว: ไฟล์ทั้งสองเหมือนกันทุกประการ!' : 'ตรวจสอบแล้ว: ไฟล์ทั้งสองแตกต่างกัน!'
        };
      }
    },
    {
      id: 'inspect-zip',
      name: 'ZIP Inspector',
      title: 'เปิดดูและแตกไฟล์ใน ZIP',
      category: 'file',
      icon: '🔍',
      desc: 'เปิดดูโครงสร้างไฟล์ภายใน ZIP ตรวจสอบขนาด วันที่ และเลือกดาวน์โหลดเฉพาะไฟล์ที่ต้องการได้ทันที',
      badge: 'Utility',
      accept: '.zip,application/zip,application/x-zip-compressed',
      multiple: false,
      btnText: 'เปิดอ่านโครงสร้าง ZIP',
      renderSettings: () => `
        <div class="alert-box alert-info">
          <span>💡 เลือกไฟล์ .ZIP เพื่อเปิดดูรายการไฟล์ข้างใน และสามารถเลือกแตกไฟล์เฉพาะไฟล์ที่ต้องการได้เลยครับ</span>
        </div>
        ${window.PenguMascot.withTip('ประหยัดเวลาและพื้นที่! ไม่จำเป็นต้องแตกไฟล์ทั้งหมดลงเครื่อง คุณสามารถคลิกดาวน์โหลดเฉพาะไฟล์ที่ต้องการได้ทันทีกวิน!', 'droppable', 80)}
      `,
      execute: async (files, settings, onProgress) => {
        const res = await window.FileTools.inspectZip(files[0], onProgress);
        
        let tableRows = '';
        res.entries.forEach(item => {
          tableRows += `
            <tr>
              <td><strong>${escapeHtml(item.name)}</strong></td>
              <td>${escapeHtml(item.sizeFormatted)}</td>
              <td style="color: var(--slate-500); font-size: 0.82rem;">${escapeHtml(item.date)}</td>
              <td>
                <button type="button" class="btn-extract-single" onclick="window.FileTools.downloadZipEntryByIndex(${item.index})" title="ดาวน์โหลดเฉพาะไฟล์นี้">
                  ⬇️ โหลดไฟล์นี้
                </button>
              </td>
            </tr>
          `;
        });

        return {
          noDownload: true,
          customResultHtml: `
            <div class="workspace-card" style="text-align: left; margin-top: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: var(--slate-900);">📦 ข้อมูลไฟล์ ZIP: ${escapeHtml(res.zipName)}</h3>
                <span class="tool-badge client">รวม ${res.totalEntries} ไฟล์ (ขนาด ZIP: ${escapeHtml(res.zipSizeFormatted)})</span>
              </div>

              <div class="zip-entries-table-wrap">
                <table class="zip-table">
                  <thead>
                    <tr>
                      <th>ชื่อไฟล์ใน ZIP</th>
                      <th>ขนาดก่อนบีบ</th>
                      <th>วันที่บันทึก</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows || '<tr><td colspan="4" style="text-align:center;">ไม่พบไฟล์ข้างใน</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          `,
          successMsg: `เปิดอ่านโครงสร้างไฟล์ ZIP สำเร็จ พบทั้งหมด ${res.totalEntries} ไฟล์!`
        };
      }
    }
  ];

  // Application State
  const state = {
    currentTool: null,
    selectedFiles: [],
    processing: false,
    currentResultBlob: null,
    currentResultUrl: null,
    activeCategory: 'all',
    searchQuery: '',
    imageNaturalDims: { width: 1280, height: 720 },
    organizerPages: [],
    organizerOriginalPages: [],
    pendingFiles: null,
    sharedFiles: [],
    lastResultFilename: null
  };

  /**
   * Router / Page Switching
   */
  function handleRouting() {
    closeMobileMenu();
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();

    if (!rawHash || rawHash === '') {
      state.activeCategory = 'all';
      renderHomePage();
      updateNavActiveState('home');
    } else if (rawHash.startsWith('category/') || rawHash === 'pdf' || rawHash === 'image' || rawHash === 'file') {
      const cat = rawHash.replace('category/', '');
      state.activeCategory = ['pdf', 'image', 'file'].includes(cat) ? cat : 'all';
      renderHomePage();
      updateNavActiveState(state.activeCategory);

      // Scroll smoothly to tools area when selecting category
      setTimeout(() => {
        const area = document.getElementById('toolsDisplayArea');
        if (area) area.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else if (rawHash === 'shared') {
      renderSharedPage();
      updateNavActiveState('home');
    } else {
      const tool = TOOLS.find(t => t.id === rawHash);
      if (tool) {
        renderToolPage(tool);
        updateNavActiveState(tool.category);
      } else {
        state.activeCategory = 'all';
        renderHomePage();
        updateNavActiveState('home');
      }
    }
  }

  /**
   * Update Active State on Desktop and Mobile Navigation
   */
  function updateNavActiveState(activeTarget) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-link').forEach(link => link.classList.remove('active'));

    const navMap = {
      home: { desktop: 'navHome', mobile: 'mobileNavHome' },
      pdf: { desktop: 'navPdf', mobile: 'mobileNavPdf' },
      image: { desktop: 'navImage', mobile: 'mobileNavImage' },
      file: { desktop: 'navFile', mobile: 'mobileNavFile' }
    };

    const target = navMap[activeTarget];
    if (target) {
      const desktopEl = document.getElementById(target.desktop);
      if (desktopEl && desktopEl.closest('.nav-item')) {
        desktopEl.closest('.nav-item').classList.add('active');
      }
      const mobileEl = document.getElementById(target.mobile);
      if (mobileEl) {
        mobileEl.classList.add('active');
      }
    }
  }

  /**
   * Mobile Menu Drawer Toggling
   */
  function toggleMobileMenu(forceState) {
    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const btn = document.getElementById('mobileMenuBtn');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('open');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !isOpen;

    if (shouldOpen) {
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
      if (btn) {
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('is-active');
      }
      document.body.style.overflow = 'hidden';
    } else {
      closeMobileMenu();
    }
  }

  function closeMobileMenu() {
    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('mobileNavBackdrop');
    const btn = document.getElementById('mobileMenuBtn');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-active');
    }
    document.body.style.overflow = '';
  }

  /**
   * Shared Files Page (PWA Share Target): pick a tool for files shared from another app
   */
  async function renderSharedPage() {
    state.currentTool = null;
    const mainApp = document.getElementById('app');
    if (!mainApp) return;

    let files = [];
    try {
      const cache = await caches.open('pengutools-share');
      const keys = await cache.keys();
      for (const req of keys) {
        const res = await cache.match(req);
        const blob = await res.blob();
        const name = decodeURIComponent(res.headers.get('X-Filename') || 'shared_file');
        files.push(new File([blob], name, { type: blob.type }));
      }
    } catch (e) {
      console.warn('Could not read shared files:', e);
    }
    state.sharedFiles = files;

    const tools = files.length ? TOOLS.filter(t => files.every(f => matchesAccept(f, t.accept))) : [];
    mainApp.innerHTML = `
      <div class="container" style="padding: 2rem 1rem; max-width: 760px;">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">📥 ไฟล์ที่แชร์เข้ามา</h1>
        ${files.length ? `
          <p style="color: var(--slate-500);">${files.map(f => escapeHtml(f.name)).join(', ')}</p>
          <h3 style="margin: 1.5rem 0 0.75rem;">เลือกเครื่องมือที่ต้องการใช้</h3>
          <div class="chain-pills">
            ${tools.map(t => `
              <button type="button" class="chain-pill-btn" onclick="PenguApp.useSharedFiles('${t.id}')">
                <span>${t.icon}</span><span>${t.title}</span>
              </button>
            `).join('') || '<p>ไม่มีเครื่องมือที่รองรับไฟล์ชนิดนี้</p>'}
          </div>
        ` : '<p>ไม่พบไฟล์ที่แชร์เข้ามา ลองแชร์ไฟล์จากแอปอื่นมาที่ PenguTools อีกครั้งครับ</p>'}
        <p style="margin-top: 2rem;"><a href="#/">← กลับหน้าแรก</a></p>
      </div>
    `;
  }

  function useSharedFiles(toolId) {
    if (!state.sharedFiles.length) return;
    state.pendingFiles = state.sharedFiles;
    state.sharedFiles = [];
    caches.delete('pengutools-share').catch(() => {});
    window.location.hash = '#/' + toolId;
  }

  /**
   * Render Home Page
   */
  function renderHomePage() {
    state.currentTool = null;
    state.selectedFiles = [];
    state.organizerPages = [];
    state.organizerOriginalPages = [];
    cleanupResultUrl();

    const mainApp = document.getElementById('app');
    if (!mainApp) return;

    mainApp.innerHTML = `
      <!-- Hero: penguin on an ice floe, search is the main action -->
      <section class="hero-section">
        <div class="container hero-content">
          <div class="hero-copy">
            <h1 class="hero-title">จัดการไฟล์ PDF และรูปภาพ<br>ในเบราว์เซอร์ของคุณเอง</h1>
            <p class="hero-desc">
              ${TOOLS.length} เครื่องมือ ใช้ได้ทันทีโดยไม่ต้องสมัคร ไฟล์ทุกไฟล์ประมวลผลในเครื่องนี้ ไม่ถูกส่งขึ้นเซิร์ฟเวอร์
            </p>
            <div class="search-container">
              <div class="search-input-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--slate-400); margin-right: 8px;">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="toolSearch" class="search-input" aria-label="ค้นหาเครื่องมือ" placeholder="ค้นหาเครื่องมือ เช่น รวม PDF, บีบอัดภาพ, เซ็นเอกสาร" value="${escapeHtml(state.searchQuery)}">
                <button id="searchClear" class="search-clear-btn" aria-label="ล้างการค้นหา">✕</button>
              </div>
            </div>
          </div>
          <div class="hero-floe" aria-hidden="true">
            <div class="hero-mascot-wrap">${window.PenguMascot.waving(150)}</div>
          </div>
        </div>
      </section>

      <!-- Category Filter Pills -->
      <div class="container">
        <div class="category-nav">
          <button class="cat-pill-btn ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">ทั้งหมด</button>
          <button class="cat-pill-btn ${state.activeCategory === 'pdf' ? 'active' : ''}" data-cat="pdf">PDF</button>
          <button class="cat-pill-btn ${state.activeCategory === 'image' ? 'active' : ''}" data-cat="image">รูปภาพ</button>
          <button class="cat-pill-btn ${state.activeCategory === 'file' ? 'active' : ''}" data-cat="file">ไฟล์ทั่วไป</button>
        </div>

        <div id="toolsDisplayArea">
          ${renderToolsList()}
        </div>

        <!-- How it works 3 steps -->
        <section class="how-it-works-section">
          <h2 class="how-title">ใช้งานอย่างไร</h2>
          <div class="steps-grid">
            <div class="step-card">
              <span class="step-number">1</span>
              <h3 class="step-title">เลือกไฟล์</h3>
              <p class="step-desc">ลากไฟล์ลงในพื้นที่จัดวาง หรือคลิกเพื่อเลือกไฟล์จากอุปกรณ์ของคุณ</p>
            </div>
            <div class="step-card">
              <span class="step-number">2</span>
              <h3 class="step-title">ตั้งค่า</h3>
              <p class="step-desc">เลือกการตั้งค่าที่ต้องการ เช่น เรียงหน้า หมุน บีบอัด หรือเปลี่ยนขนาด</p>
            </div>
            <div class="step-card">
              <span class="step-number">3</span>
              <h3 class="step-title">ดาวน์โหลด</h3>
              <p class="step-desc">ประมวลผลในเครื่องของคุณ แล้วกดดาวน์โหลด หรือส่งต่อไปเครื่องมืออื่นได้เลย</p>
            </div>
          </div>
        </section>
      </div>
    `;

    setupHomeEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Render Filtered Tool Cards
   */
  function renderToolsList() {
    let filtered = TOOLS;
    if (state.activeCategory !== 'all') {
      filtered = filtered.filter(t => t.category === state.activeCategory);
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      return `
        <div style="text-align: center; padding: 3rem 1rem;">
          <div style="margin-bottom: 1rem;">${window.PenguMascot.comfort(100)}</div>
          <h3 style="color: var(--slate-800); margin-bottom: 0.5rem;">ไม่พบเครื่องมือที่ตรงกับคำค้นหา</h3>
          <p style="color: var(--slate-500);">ลองค้นหาด้วยคำอื่น หรือกดดูหมวดหมู่ทั้งหมดดูนะ</p>
        </div>
      `;
    }

    const BADGES = { Popular: 'ยอดนิยม', New: 'ใหม่' };
    const item = (tool) => `
      <a href="#/${tool.id}" class="tool-card" id="card-${tool.id}">
        <span class="tool-icon-box" aria-hidden="true">${tool.icon}</span>
        <span class="tool-text">
          <span class="tool-name">${tool.title}${BADGES[tool.badge] ? ` <span class="tool-badge ${tool.badge === 'New' ? 'is-new' : ''}">${BADGES[tool.badge]}</span>` : ''}</span>
          <span class="tool-desc">${tool.desc}</span>
        </span>
      </a>
    `;

    // Full catalogue: one section per category so people scan by file type
    if (state.activeCategory === 'all' && !state.searchQuery.trim()) {
      const groups = [
        { id: 'pdf', label: 'PDF' },
        { id: 'image', label: 'รูปภาพ' },
        { id: 'file', label: 'ไฟล์ทั่วไป' }
      ];
      return groups.map(g => {
        const tools = filtered.filter(t => t.category === g.id);
        return `
          <section class="tool-group">
            <h2 class="tool-group-title">${g.label} <span class="tool-group-count">${tools.length}</span></h2>
            <div class="tools-grid">${tools.map(item).join('')}</div>
          </section>
        `;
      }).join('');
    }

    return `<div class="tools-grid">${filtered.map(item).join('')}</div>`;
  }

  /**
   * Setup Home Event Handlers
   */
  function setupHomeEvents() {
    const searchInput = document.getElementById('toolSearch');
    const searchClear = document.getElementById('searchClear');
    const displayArea = document.getElementById('toolsDisplayArea');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (searchClear) {
          searchClear.style.display = state.searchQuery ? 'inline-flex' : 'none';
        }
        if (displayArea) {
          displayArea.innerHTML = renderToolsList();
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        state.searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchClear.style.display = 'none';
        if (displayArea) {
          displayArea.innerHTML = renderToolsList();
        }
      });
    }

    document.querySelectorAll('.cat-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.getAttribute('data-cat');
        if (displayArea) {
          displayArea.innerHTML = renderToolsList();
        }
      });
    });
  }

  /**
   * Render Generic Tool Page
   */
  function renderToolPage(tool) {
    state.currentTool = tool;
    state.selectedFiles = [];
    state.organizerPages = [];
    state.organizerOriginalPages = [];
    cleanupResultUrl();

    const mainApp = document.getElementById('app');
    if (!mainApp) return;

    mainApp.innerHTML = `
      <div class="container tool-view-wrapper">
        <div class="tool-back-bar">
          <a href="#/" class="btn-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>กลับหน้าหลัก</span>
          </a>
        </div>

        <!-- Tool Header Card -->
        <div class="tool-header-card">
          <div class="tool-header-info">
            <div class="tool-header-icon">${tool.icon}</div>
            <div class="tool-header-text">
              <h1>${tool.title}</h1>
              <p>${tool.desc}</p>
            </div>
          </div>
          <div class="tool-safety-pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>ประมวลผลบนเบราว์เซอร์ 100%</span>
          </div>
        </div>

        <!-- Drop Zone -->
        <div id="dropzone" class="dropzone-container" tabindex="0" role="button" aria-label="คลิกหรือลากไฟล์มาวางที่นี่เพื่ออัปโหลด">
          <input type="file" id="fileInput" class="file-input-hidden" ${tool.multiple ? 'multiple' : ''} accept="${tool.accept}">
          <div class="dropzone-content">
            <div class="dropzone-mascot">
              ${window.PenguMascot.droppable(95)}
            </div>
            <div class="dropzone-title">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</div>
            <div class="dropzone-subtitle">รองรับไฟล์ชนิด: ${tool.accept} ${tool.multiple ? '(เลือกได้หลายไฟล์)' : '(1 ไฟล์)'}</div>
            <button type="button" class="dropzone-btn" onclick="document.getElementById('fileInput').click()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>เลือกไฟล์จากอุปกรณ์</span>
            </button>
            <div class="dropzone-limit-note">🔒 ปลอดภัยสูงสุด ไฟล์จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ใด ๆ</div>
          </div>
        </div>

        <!-- Workspace Area (File List & Options) -->
        <div id="workspaceArea" style="display: none;">
          <div class="workspace-layout">
            <!-- Files List Card -->
            <div class="workspace-card">
              <div class="card-title">
                <span>รายการไฟล์ที่เลือก (<span id="fileCountBadge">0</span>)</span>
                <button type="button" class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="PenguApp.clearFiles()">ล้างทั้งหมด</button>
              </div>
              <div id="fileListContainer" class="file-list"></div>
            </div>

            <!-- Settings Card -->
            <div class="workspace-card">
              <div class="card-title">
                <span>การตั้งค่า</span>
              </div>
              <div id="toolSettingsContainer">
                ${tool.renderSettings ? tool.renderSettings(state.selectedFiles) : ''}
              </div>
            </div>
          </div>

          <!-- Action Bar -->
          <div class="action-bar">
            <button type="button" class="btn-secondary" onclick="PenguApp.clearFiles()">ยกเลิก</button>
            <button type="button" id="btnExecute" class="btn-primary-action" onclick="PenguApp.runAction()">
              <span>${tool.btnText || 'เริ่มประมวลผล'}</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        <!-- Processing & Result Area -->
        <div id="statusArea" style="display: none;"></div>
      </div>
    `;

    setupToolEvents(tool);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Setup Dropzone & File Input Events
   */
  function setupToolEvents(tool) {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    if (!dropzone || !fileInput) return;

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = Array.from(dt.files);
      handleFilesAdded(files, tool);
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFilesAdded(files, tool);
    });

    // Keyboard support for dropzone
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    // Auto-load files handed over by workflow chaining or the PWA share target
    if (state.pendingFiles) {
      const pending = state.pendingFiles;
      state.pendingFiles = null;
      setTimeout(() => {
        handleFilesAdded(pending, tool);
      }, 60);
    }
  }

  /**
   * Check a file against an <input accept> string, e.g. ".pdf,application/pdf" or "image/*"
   */
  function matchesAccept(file, accept) {
    if (!accept || accept === '*/*') return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return accept.split(',').map(a => a.trim().toLowerCase()).some(a => {
      if (a.startsWith('.')) return name.endsWith(a);
      if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
      return type === a;
    });
  }

  /**
   * Handle Added Files & Validation
   */
  function handleFilesAdded(incomingFiles, tool = state.currentTool) {
    if (!incomingFiles || incomingFiles.length === 0) return;

    // Filter by accepted types (drag & drop bypasses the input's accept attribute) and non-empty files
    const rejected = [];
    const validFiles = incomingFiles.filter(file => {
      if (file.size === 0) {
        alert(`ไฟล์ "${file.name}" เป็นไฟล์ว่างเปล่า (0 Bytes)`);
        return false;
      }
      if (!matchesAccept(file, tool.accept)) {
        rejected.push(file.name);
        return false;
      }
      return true;
    });
    if (rejected.length) {
      alert(`ไฟล์ต่อไปนี้ไม่ใช่ชนิดที่เครื่องมือนี้รองรับ (${tool.accept}): ${rejected.join(', ')}`);
    }

    if (validFiles.length === 0) return;

    if (tool.id === 'compare-files') {
      if (validFiles.length > 2) {
        alert('เครื่องมือเปรียบเทียบไฟล์รองรับครั้งละ 2 ไฟล์ ระบบเลือก 2 ไฟล์แรกให้ครับ');
        state.selectedFiles = validFiles.slice(0, 2);
      } else if (state.selectedFiles.length === 0) {
        state.selectedFiles = validFiles.slice(0, 2);
      } else if (state.selectedFiles.length === 1) {
        state.selectedFiles = [...state.selectedFiles, validFiles[0]];
      } else {
        // Already 2 files selected, replace with new files
        state.selectedFiles = validFiles.slice(0, 2);
      }
    } else if (tool.multiple) {
      const maxAllowed = tool.maxFiles || 50;
      const combined = [...state.selectedFiles, ...validFiles];
      if (combined.length > maxAllowed) {
        alert(`เครื่องมือนี้เลือกไฟล์ได้สูงสุดไม่เกิน ${maxAllowed} ไฟล์ ระบบจะนำเข้าเฉพาะ ${maxAllowed} ไฟล์แรก`);
        state.selectedFiles = combined.slice(0, maxAllowed);
      } else {
        state.selectedFiles = combined;
      }
    } else {
      state.selectedFiles = [validFiles[0]];
    }

    // Inspect natural image dimensions if image resizer
    if (tool.id === 'image-resizer' && state.selectedFiles[0]) {
      const img = new Image();
      const objUrl = URL.createObjectURL(state.selectedFiles[0]);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        state.imageNaturalDims = { width: img.naturalWidth || 1280, height: img.naturalHeight || 720 };
        const wInput = document.getElementById('resizeWidth');
        const hInput = document.getElementById('resizeHeight');
        if (wInput) wInput.value = img.naturalWidth || 1280;
        if (hInput) hInput.value = img.naturalHeight || 720;
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    }

    // Special handler for Visual PDF Page Organizer
    if (tool.id === 'organize-pdf' && state.selectedFiles[0]) {
      loadOrganizerThumbnails(state.selectedFiles[0]);
      return;
    }

    // Special handler for Sign PDF to init canvas and populate page count
    if (tool.id === 'sign-pdf' && state.selectedFiles[0]) {
      setTimeout(() => {
        initSignaturePad();
        populateSignPages(state.selectedFiles[0]);
      }, 60);
    }

    updateWorkspaceUI(tool);
  }

  /**
   * Update Workspace UI with Selected Files
   */
  function updateWorkspaceUI(tool) {
    const workspaceArea = document.getElementById('workspaceArea');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileCountBadge = document.getElementById('fileCountBadge');

    if (!workspaceArea || !fileListContainer) return;

    if (state.selectedFiles.length === 0) {
      workspaceArea.style.display = 'none';
      return;
    }

    workspaceArea.style.display = 'block';
    if (fileCountBadge) fileCountBadge.textContent = state.selectedFiles.length;

    // Custom UI for Visual PDF Organizer
    if (tool.id === 'organize-pdf') {
      if (fileCountBadge) fileCountBadge.textContent = `${state.organizerPages.length} หน้า`;
      fileListContainer.innerHTML = `
        <div class="pdf-organizer-container">
          <div class="pdf-organizer-toolbar">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button type="button" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="PenguApp.handleOrganizeRotateAll(90)">
                ↻ หมุนทุกหน้า +90°
              </button>
              <button type="button" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="PenguApp.handleOrganizeReset()">
                ↩ รีเซ็ตลำดับเดิม
              </button>
            </div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-600);">
              จำนวนหน้าที่จะบันทึก: <span id="organizerCountBadge" style="color: var(--primary-600);">${state.organizerPages.length} หน้า</span>
            </div>
          </div>
          <div id="organizerGridContainer" class="pdf-organizer-grid"></div>
        </div>
      `;
      renderOrganizerGrid();
      return;
    }

    fileListContainer.innerHTML = state.selectedFiles.map((file, idx) => `
      <div class="file-item" data-index="${idx}">
        <div class="file-item-left">
          ${tool.multiple ? `
            <div class="file-item-actions">
              <button type="button" class="btn-icon-subtle btn-move" onclick="PenguApp.moveFile(${idx}, -1)" title="เลื่อนขึ้น" aria-label="เลื่อนขึ้น" ${idx === 0 ? 'disabled' : ''}>▲</button>
              <button type="button" class="btn-icon-subtle btn-move" onclick="PenguApp.moveFile(${idx}, 1)" title="เลื่อนลง" aria-label="เลื่อนลง" ${idx === state.selectedFiles.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
          ` : ''}
          <div class="file-thumb-preview">
            ${file.type.startsWith('image/') ? '🖼️' : (file.name.endsWith('.pdf') ? '📄' : '📁')}
          </div>
          <div class="file-meta-info">
            <span class="file-item-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="file-item-sub">
              <span>${window.PdfTools.formatSize(file.size)}</span>
              <span>•</span>
              <span>${escapeHtml(file.type || file.name.split('.').pop().toUpperCase())}</span>
            </span>
          </div>
        </div>
        <div class="file-item-actions">
          <button type="button" class="btn-icon-subtle" onclick="PenguApp.removeFile(${idx})" title="ลบไฟล์นี้" aria-label="ลบไฟล์นี้">✕</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Move File in List (Reorder)
   */
  function moveFile(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= state.selectedFiles.length) return;
    const temp = state.selectedFiles[index];
    state.selectedFiles[index] = state.selectedFiles[targetIdx];
    state.selectedFiles[targetIdx] = temp;
    updateWorkspaceUI(state.currentTool);
  }

  /**
   * Remove Single File
   */
  function removeFile(index) {
    state.selectedFiles.splice(index, 1);
    updateWorkspaceUI(state.currentTool);
  }

  /**
   * Clear All Files
   */
  function clearFiles() {
    state.selectedFiles = [];
    state.organizerPages = [];
    state.organizerOriginalPages = [];
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    updateWorkspaceUI(state.currentTool);
    const statusArea = document.getElementById('statusArea');
    if (statusArea) statusArea.style.display = 'none';
  }

  /**
   * Run Action for Current Tool
   */
  async function runAction() {
    const tool = state.currentTool;
    if (!tool || state.processing) return;

    if (state.selectedFiles.length === 0) {
      alert('กรุณาเลือกไฟล์ก่อนเริ่มดำเนินการ');
      return;
    }

    if (tool.minFiles && state.selectedFiles.length < tool.minFiles) {
      alert(`เครื่องมือนี้จำเป็นต้องใช้ไฟล์อย่างน้อย ${tool.minFiles} ไฟล์`);
      return;
    }

    state.processing = true;
    const btnExecute = document.getElementById('btnExecute');
    if (btnExecute) btnExecute.disabled = true;

    const statusArea = document.getElementById('statusArea');
    if (statusArea) {
      statusArea.style.display = 'block';
      statusArea.innerHTML = `
        <div class="status-card">
          <div class="status-mascot-box">
            ${window.PenguMascot.working(120)}
          </div>
          <h2 class="status-title">น้องเพนกวินกำลังประมวลผล...</h2>
          <p id="statusMsg" class="status-desc">กำลังเริ่มจัดเตรียมไฟล์...</p>
          <div class="progress-container">
            <div id="progressBar" class="progress-bar-fill"></div>
          </div>
        </div>
      `;
      statusArea.scrollIntoView({ behavior: 'smooth' });
    }

    const onProgress = (percent, message) => {
      const progressBar = document.getElementById('progressBar');
      const statusMsg = document.getElementById('statusMsg');
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (statusMsg && message) statusMsg.textContent = message;
    };

    try {
      const result = await tool.execute(state.selectedFiles, {}, onProgress);

      cleanupResultUrl();
      if (result.blob) {
        state.currentResultBlob = result.blob;
        state.currentResultUrl = URL.createObjectURL(result.blob);
        state.lastResultFilename = result.filename;
      }

      if (statusArea) {
        const chainHtml = getChainRecommendationsHtml(result);

        statusArea.innerHTML = `
          <div class="status-card">
            <div class="status-mascot-box">
              ${window.PenguMascot.happy(130)}
            </div>
            <h2 class="status-title" style="color: var(--success-700);">เย้! ทำงานสำเร็จแล้ว 🐧</h2>
            <p class="status-desc">${result.successMsg || 'ประมวลผลไฟล์ของคุณเสร็จสมบูรณ์ พร้อมดาวน์โหลดแล้วครับ'}</p>
            
            ${result.customResultHtml || ''}

            <div class="result-actions" style="margin-top: 1.5rem;">
              ${!result.noDownload ? `
                <a href="${state.currentResultUrl}" download="${escapeHtml(result.filename || 'pengutools_result')}" class="btn-download" id="btnDownload">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>ดาวน์โหลดไฟล์ผลลัพธ์</span>
                </a>
              ` : ''}
              <button type="button" class="btn-secondary" onclick="PenguApp.resetCurrentTool()">
                🔄 ทำรายการใหม่
              </button>
            </div>

            ${chainHtml}
          </div>
        `;
        statusArea.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      if (statusArea) {
        statusArea.innerHTML = `
          <div class="status-card">
            <div class="status-mascot-box">
              ${window.PenguMascot.comfort(120)}
            </div>
            <h2 class="status-title" style="color: var(--danger-700);">อุ๊ย! เกิดข้อผิดพลาด</h2>
            <div class="alert-box alert-error" style="max-width: 600px; margin: 1rem auto;">
              <span>${escapeHtml(err.message || 'ไม่สามารถประมวลผลไฟล์ได้ กรุณาตรวจสอบความถูกต้องของไฟล์และลองอีกครั้ง')}</span>
            </div>
            <div class="result-actions" style="margin-top: 1.5rem;">
              <button type="button" class="btn-secondary" onclick="PenguApp.runAction()">
                ลองใหม่อีกครั้ง
              </button>
              <button type="button" class="btn-secondary" onclick="PenguApp.clearFiles()">
                เลือกไฟล์ใหม่
              </button>
            </div>
          </div>
        `;
        statusArea.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      state.processing = false;
      if (btnExecute) btnExecute.disabled = false;
    }
  }

  function resetCurrentTool() {
    clearFiles();
    const statusArea = document.getElementById('statusArea');
    if (statusArea) statusArea.style.display = 'none';
  }

  function cleanupResultUrl() {
    if (state.currentResultUrl) {
      URL.revokeObjectURL(state.currentResultUrl);
      state.currentResultUrl = null;
      state.currentResultBlob = null;
    }
  }

  // PDF Compress mode change handler
  function handlePdfCompressModeChange(mode) {
    const levelGroup = document.getElementById('compressLevelGroup');
    if (levelGroup) {
      levelGroup.style.display = mode === 'visual' ? 'flex' : 'none';
    }
  }

  // Split PDF mode change handler
  function handleSplitModeChange(mode) {
    const rangeGroup = document.getElementById('splitRangeGroup');
    if (rangeGroup) {
      rangeGroup.style.display = mode === 'range' ? 'flex' : 'none';
    }
  }

  // Rotate target change handler
  function handleRotateTargetChange(target) {
    const customGroup = document.getElementById('rotateCustomGroup');
    if (customGroup) {
      customGroup.style.display = target === 'custom' ? 'flex' : 'none';
    }
  }

  // Image Resizer Preset change
  function handleResizePreset(val) {
    if (!val) return;
    const wInput = document.getElementById('resizeWidth');
    const hInput = document.getElementById('resizeHeight');
    if (!wInput || !hInput) return;

    if (val.startsWith('scale_')) {
      const scale = parseInt(val.replace('scale_', ''), 10) / 100;
      wInput.value = Math.round(state.imageNaturalDims.width * scale);
      hInput.value = Math.round(state.imageNaturalDims.height * scale);
    } else {
      const [w, h] = val.split('x');
      wInput.value = w;
      hInput.value = h;
    }
  }

  // Image Resizer dimension sync for aspect ratio
  function handleResizeDimChange(changed) {
    const keepAspect = document.getElementById('keepAspect')?.checked;
    if (!keepAspect) return;

    const wInput = document.getElementById('resizeWidth');
    const hInput = document.getElementById('resizeHeight');
    if (!wInput || !hInput) return;

    const natW = state.imageNaturalDims?.width || 1280;
    const natH = state.imageNaturalDims?.height || 720;
    const ratio = (natH > 0 && natW > 0) ? (natW / natH) : (16 / 9);

    if (changed === 'w') {
      const w = parseFloat(wInput.value);
      if (!isNaN(w) && w > 0 && ratio > 0) {
        hInput.value = Math.max(1, Math.round(w / ratio));
      }
    } else {
      const h = parseFloat(hInput.value);
      if (!isNaN(h) && h > 0 && ratio > 0) {
        wInput.value = Math.max(1, Math.round(h * ratio));
      }
    }
  }

  // Theme Controller (Light / Dark Mode)
  function initTheme() {
    const saved = localStorage.getItem('pengu_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved ? saved : (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem('pengu_theme', nextTheme);
      });
    }
  }

  function applyTheme(theme) {
    const icon = document.getElementById('themeToggleIcon');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (icon) icon.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (icon) icon.textContent = '🌙';
    }
  }

  // Visual PDF Organizer Handlers
  let draggedOrganizerIdx = null;

  async function loadOrganizerThumbnails(file) {
    const workspaceArea = document.getElementById('workspaceArea');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileCountBadge = document.getElementById('fileCountBadge');

    if (!workspaceArea) return;
    workspaceArea.style.display = 'block';
    if (fileCountBadge) fileCountBadge.textContent = 'กำลังอ่านหน้า...';

    if (fileListContainer) {
      fileListContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
          <div class="pengu-work" style="display: inline-block; margin-bottom: 1rem;">
            ${window.PenguMascot.working(110)}
          </div>
          <h3 style="font-size: 1.15rem; color: var(--slate-800); margin-bottom: 0.5rem;">กำลังสร้างภาพตัวอย่างหน้าเอกสารทั้งหมด...</h3>
          <p id="organizerLoadProgress" style="font-size: 0.9rem; color: var(--slate-500);">กรุณารอสักครู่ น้องเพนกวินกำลังเรนเดอร์ภาพหน้า PDF บนเครื่องของคุณ</p>
        </div>
      `;
    }

    try {
      const pages = await window.PdfTools.renderPdfThumbnails(
        file,
        null,
        (percent, msg) => {
          const prog = document.getElementById('organizerLoadProgress');
          if (prog) prog.textContent = `${msg} (${percent}%)`;
        }
      );

      state.organizerPages = pages;
      state.organizerOriginalPages = pages.map(p => ({ ...p }));
      updateWorkspaceUI(state.currentTool);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอ่านหน้าเอกสาร PDF ได้: ' + (err.message || ''));
      clearFiles();
    }
  }

  function renderOrganizerGrid() {
    const container = document.getElementById('organizerGridContainer');
    const countBadge = document.getElementById('organizerCountBadge');
    if (countBadge) countBadge.textContent = `${state.organizerPages.length} หน้า`;
    const fileCountBadge = document.getElementById('fileCountBadge');
    if (fileCountBadge) fileCountBadge.textContent = `${state.organizerPages.length} หน้า`;

    if (!container) return;

    if (state.organizerPages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--slate-400); grid-column: 1 / -1;">
          ไม่มีหน้าเอกสารเหลืออยู่ กรุณากดปุ่ม "รีเซ็ตลำดับเดิม"
        </div>
      `;
      return;
    }

    container.innerHTML = state.organizerPages.map((page, idx) => `
      <div class="pdf-page-card" draggable="true"
           ondragstart="PenguApp.handleOrganizeDragStart(event, ${idx})"
           ondragover="PenguApp.handleOrganizeDragOver(event)"
           ondrop="PenguApp.handleOrganizeDrop(event, ${idx})"
           ondragend="PenguApp.handleOrganizeDragEnd(event)">
        <div class="pdf-page-header">
          <span class="pdf-page-badge">หน้า ${idx + 1}</span>
          <div class="pdf-page-actions">
            <button type="button" class="btn-icon-subtle" onclick="PenguApp.handleOrganizeRotate(${idx})" title="หมุนหน้า 90°" aria-label="หมุนหน้า ${idx + 1} 90 องศา">↻</button>
            <button type="button" class="btn-icon-subtle" onclick="PenguApp.handleOrganizeDelete(${idx})" title="ลบหน้านี้" aria-label="ลบหน้า ${idx + 1}">✕</button>
          </div>
        </div>
        <div class="pdf-thumb-wrap">
          <img class="pdf-thumb-img" src="${page.thumbUrl}" style="transform: rotate(${page.rotation}deg);" alt="หน้า ${idx + 1}">
        </div>
        <div class="pdf-page-footer">
          <button type="button" class="btn-icon-subtle" onclick="PenguApp.handleOrganizeMove(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="ย้ายไปซ้าย" aria-label="ย้ายหน้า ${idx + 1} ไปทางซ้าย">◀</button>
          <span style="font-size: 0.75rem; color: var(--slate-400);">ต้นฉบับ P.${page.pageNumber}</span>
          <button type="button" class="btn-icon-subtle" onclick="PenguApp.handleOrganizeMove(${idx}, 1)" ${idx === state.organizerPages.length - 1 ? 'disabled' : ''} title="ย้ายไปขวา" aria-label="ย้ายหน้า ${idx + 1} ไปทางขวา">▶</button>
        </div>
      </div>
    `).join('');
  }

  function handleOrganizeRotate(index, angle = 90) {
    if (!state.organizerPages[index]) return;
    state.organizerPages[index].rotation = (state.organizerPages[index].rotation + angle) % 360;
    renderOrganizerGrid();
  }

  function handleOrganizeRotateAll(angle = 90) {
    state.organizerPages.forEach(p => {
      p.rotation = (p.rotation + angle) % 360;
    });
    renderOrganizerGrid();
  }

  function handleOrganizeDelete(index) {
    if (state.organizerPages.length <= 1) {
      alert('เอกสารต้องมีอย่างน้อย 1 หน้า ไม่สามารถลบหน้าสุดท้ายออกได้');
      return;
    }
    state.organizerPages.splice(index, 1);
    renderOrganizerGrid();
  }

  function handleOrganizeMove(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= state.organizerPages.length) return;
    const temp = state.organizerPages[index];
    state.organizerPages[index] = state.organizerPages[targetIdx];
    state.organizerPages[targetIdx] = temp;
    renderOrganizerGrid();
  }

  function handleOrganizeReset() {
    if (!state.organizerOriginalPages || state.organizerOriginalPages.length === 0) return;
    state.organizerPages = state.organizerOriginalPages.map(p => ({ ...p, rotation: 0 }));
    renderOrganizerGrid();
  }

  function handleOrganizeDragStart(e, index) {
    draggedOrganizerIdx = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
    }
    const card = e.target.closest('.pdf-page-card');
    if (card) card.classList.add('dragging');
  }

  function handleOrganizeDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleOrganizeDrop(e, targetIdx) {
    e.preventDefault();
    if (draggedOrganizerIdx === null || draggedOrganizerIdx === targetIdx) return;
    const movedItem = state.organizerPages.splice(draggedOrganizerIdx, 1)[0];
    state.organizerPages.splice(targetIdx, 0, movedItem);
    draggedOrganizerIdx = null;
    renderOrganizerGrid();
  }

  function handleOrganizeDragEnd(e) {
    const card = e.target.closest('.pdf-page-card');
    if (card) card.classList.remove('dragging');
    draggedOrganizerIdx = null;
  }

  /**
   * Workflow Chaining Helpers
   */
  function getChainRecommendationsHtml(result) {
    if (!result || !result.blob) return '';
    const isPdf = result.blob.type === 'application/pdf' || (result.filename && result.filename.endsWith('.pdf'));
    const isImg = result.blob.type.startsWith('image/') || (result.filename && result.filename.match(/\.(png|jpe?g|webp)$/i));
    const isZip = result.filename && result.filename.endsWith('.zip');

    let tools = [];
    if (isPdf) {
      tools = [
        { id: 'compress-pdf', icon: '⚡', label: 'บีบอัด PDF' },
        { id: 'sign-pdf', icon: '🖊️', label: 'เซ็นชื่อ' },
        { id: 'organize-pdf', icon: '📑', label: 'จัดเรียง/หมุนหน้า' },
        { id: 'watermark-pdf', icon: '💧', label: 'ใส่ลายน้ำ' },
        { id: 'pdf-to-images', icon: '🖼️', label: 'แปลงเป็นภาพ' },
        { id: 'protect-pdf', icon: '🔒', label: 'ล็อกรหัสผ่าน' },
        { id: 'pdf-to-text', icon: '📝', label: 'ดึงข้อความ' },
        { id: 'split-pdf', icon: '✂️', label: 'แยกหน้า' }
      ];
    } else if (isImg) {
      tools = [
        { id: 'image-compressor', icon: '⚡', label: 'บีบอัดรูปภาพ' },
        { id: 'image-resizer', icon: '📏', label: 'ปรับขนาดภาพ' },
        { id: 'image-converter', icon: '🔄', label: 'แปลงนามสกุล' },
        { id: 'images-to-pdf', icon: '📑', label: 'แปลงเป็น PDF' }
      ];
    } else if (isZip) {
      tools = [
        { id: 'inspect-zip', icon: '🔍', label: 'ดูเนื้อหาใน ZIP' },
        { id: 'file-info', icon: 'ℹ️', label: 'ตรวจ SHA-256' }
      ];
    }

    tools = tools.filter(t => t.id !== state.currentTool?.id);
    if (tools.length === 0) return '';

    return `
      <div class="chain-workflow-box">
        <div class="chain-header">
          <span class="chain-title">⚡ ทำงานต่อด้วยไฟล์นี้ทันที</span>
          <span class="chain-badge">ไม่ต้องอัปโหลดซ้ำ</span>
        </div>
        <div class="chain-pills">
          ${tools.map(t => `
            <button type="button" class="chain-pill-btn" onclick="PenguApp.chainToTool('${t.id}')">
              <span>${t.icon}</span>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function chainToTool(targetToolId) {
    if (!state.currentResultBlob) return;

    const filename = state.lastResultFilename || 'pengutools_file';
    const chainedFile = new File([state.currentResultBlob], filename, {
      type: state.currentResultBlob.type,
      lastModified: Date.now()
    });

    state.pendingFiles = [chainedFile];
    window.location.hash = '#/' + targetToolId;
  }

  /**
   * Signature Pad Engine (Touch & Mouse Support)
   */
  const sigState = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    hasDrawn: false,
    penColor: '#0f172a',
    penWidth: 3,
    uploadedDataUrl: null,
    activeTab: 'draw'
  };

  function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 540;
    const height = rect.height || 190;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = sigState.penColor;
    ctx.lineWidth = sigState.penWidth;

    sigState.canvas = canvas;
    sigState.ctx = ctx;
    sigState.hasDrawn = false;
    sigState.drawAspect = width / height;

    // Click-to-place: centre the signature where the user clicks on the page preview
    const mockup = document.getElementById('signPageMockup');
    if (mockup) {
      mockup.onclick = (e) => {
        const b = mockup.getBoundingClientRect();
        const size = parseInt(document.getElementById('signSizeSlider')?.value || '26', 10);
        const heightPct = getSignHeightPercent(size);
        const cx = ((e.clientX - b.left) / b.width) * 100;
        const cy = ((e.clientY - b.top) / b.height) * 100;
        const clamp = (v) => Math.round(Math.min(100, Math.max(0, v)));
        const posX = size >= 100 ? 0 : clamp(((cx - size / 2) / (100 - size)) * 100);
        const posY = heightPct >= 100 ? 0 : clamp(((cy - heightPct / 2) / (100 - heightPct)) * 100);
        const xs = document.getElementById('signPosXSlider');
        const ys = document.getElementById('signPosYSlider');
        if (xs) xs.value = posX;
        if (ys) ys.value = posY;
        const preset = document.getElementById('signPosPreset');
        if (preset) preset.value = 'custom';
        handleSignSliderChange();
      };
    }

    const getPos = (e) => {
      const b = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return {
          x: e.touches[0].clientX - b.left,
          y: e.touches[0].clientY - b.top
        };
      }
      return {
        x: e.clientX - b.left,
        y: e.clientY - b.top
      };
    };

    canvas.onmousedown = (e) => {
      sigState.isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      sigState.hasDrawn = true;
    };
    canvas.onmousemove = (e) => {
      if (!sigState.isDrawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    canvas.onmouseup = () => {
      sigState.isDrawing = false;
      updateSignLivePreview();
    };
    if (!sigState.windowListenerBound) {
      sigState.windowListenerBound = true;
      window.addEventListener('mouseup', () => {
        if (sigState.isDrawing) {
          sigState.isDrawing = false;
          updateSignLivePreview();
        }
      });
    }

    canvas.ontouchstart = (e) => {
      e.preventDefault();
      sigState.isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      sigState.hasDrawn = true;
    };
    canvas.ontouchmove = (e) => {
      e.preventDefault();
      if (!sigState.isDrawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    canvas.ontouchend = (e) => {
      e.preventDefault();
      sigState.isDrawing = false;
      updateSignLivePreview();
    };

    updateSignLivePreview();
  }

  function clearSignature() {
    if (!sigState.canvas || !sigState.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    sigState.ctx.clearRect(0, 0, sigState.canvas.width / dpr, sigState.canvas.height / dpr);
    sigState.hasDrawn = false;
    updateSignLivePreview();
  }

  function setSignColor(color, el) {
    sigState.penColor = color;
    if (sigState.ctx) sigState.ctx.strokeStyle = color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    if (el) el.classList.add('active');
    updateSignLivePreview();
  }

  function setSignWidth(w) {
    sigState.penWidth = parseInt(w, 10) || 3;
    if (sigState.ctx) sigState.ctx.lineWidth = sigState.penWidth;
  }

  function switchSignTab(mode) {
    sigState.activeTab = mode;
    const drawTab = document.getElementById('tabDrawSig');
    const uploadTab = document.getElementById('tabUploadSig');
    const drawArea = document.getElementById('drawSigArea');
    const uploadArea = document.getElementById('uploadSigArea');
    if (mode === 'draw') {
      if (drawTab) drawTab.classList.add('active');
      if (uploadTab) uploadTab.classList.remove('active');
      if (drawArea) drawArea.style.display = 'block';
      if (uploadArea) uploadArea.style.display = 'none';
    } else {
      if (drawTab) drawTab.classList.remove('active');
      if (uploadTab) uploadTab.classList.add('active');
      if (drawArea) drawArea.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'block';
    }
    updateSignLivePreview();
  }

  function handleSigFileSelect(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        sigState.uploadedDataUrl = c.toDataURL('image/png');
        sigState.uploadAspect = c.width / c.height;
        c.width = 0;
        c.height = 0;
        const preview = document.getElementById('sigImagePreview');
        const imgTag = document.getElementById('sigImgTag');
        if (imgTag) imgTag.src = sigState.uploadedDataUrl;
        if (preview) preview.style.display = 'block';
        updateSignLivePreview();
      };
      img.onerror = () => alert('ไม่สามารถอ่านไฟล์ภาพลายเซ็นได้ กรุณาใช้ไฟล์ PNG, JPG หรือ WebP');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function getSignatureDataUrl() {
    if (sigState.activeTab === 'upload') {
      return sigState.uploadedDataUrl;
    }
    if (!sigState.hasDrawn || !sigState.canvas) {
      return null;
    }
    return sigState.canvas.toDataURL('image/png');
  }

  function applySignPreset(val) {
    const sizeSlider = document.getElementById('signSizeSlider');
    const posXSlider = document.getElementById('signPosXSlider');
    const posYSlider = document.getElementById('signPosYSlider');
    if (!sizeSlider || !posXSlider || !posYSlider) return;

    if (val === 'bottom-right') {
      sizeSlider.value = 26;
      posXSlider.value = 70;
      posYSlider.value = 85;
    } else if (val === 'bottom-left') {
      sizeSlider.value = 26;
      posXSlider.value = 10;
      posYSlider.value = 85;
    } else if (val === 'bottom-center') {
      sizeSlider.value = 26;
      posXSlider.value = 37;
      posYSlider.value = 85;
    } else if (val === 'center') {
      sizeSlider.value = 30;
      posXSlider.value = 35;
      posYSlider.value = 50;
    }
    handleSignSliderChange();
  }

  function handleSignSliderChange() {
    const size = document.getElementById('signSizeSlider')?.value || '26';
    const posX = document.getElementById('signPosXSlider')?.value || '70';
    const posY = document.getElementById('signPosYSlider')?.value || '85';
    const sizeBadge = document.getElementById('signSizeVal');
    const posXBadge = document.getElementById('signPosXVal');
    const posYBadge = document.getElementById('signPosYVal');
    if (sizeBadge) sizeBadge.textContent = `${size}%`;
    if (posXBadge) posXBadge.textContent = `${posX}%`;
    if (posYBadge) posYBadge.textContent = `${posY}%`;
    updateSignLivePreview();
  }

  function handleSignDateToggle(checked) {
    const group = document.getElementById('signDateInputGroup');
    if (group) group.style.display = checked ? 'block' : 'none';
    updateSignLivePreview();
  }

  function updateSignLivePreview() {
    const badge = document.getElementById('mockSigBadge');
    if (!badge) return;

    const size = parseInt(document.getElementById('signSizeSlider')?.value || '26', 10);
    const posX = parseInt(document.getElementById('signPosXSlider')?.value || '70', 10);
    const posY = parseInt(document.getElementById('signPosYSlider')?.value || '85', 10);

    // Same maths as PdfTools.signPdf, so the preview matches the saved PDF
    const heightPct = getSignHeightPercent(size);
    const left = ((100 - size) * posX) / 100;
    const top = ((100 - heightPct) * posY) / 100;

    badge.style.left = `${left}%`;
    badge.style.top = `${top}%`;
    badge.style.width = `${size}%`;
    badge.style.height = `${heightPct}%`;

    const addDate = document.getElementById('signAddDate')?.checked;
    const dateText = document.getElementById('signDateText')?.value || '';
    const mockDateBadge = document.getElementById('mockDateBadge');
    if (mockDateBadge) {
      if (addDate) {
        mockDateBadge.style.display = 'block';
        mockDateBadge.textContent = dateText.trim() || 'วว/ดด/ปปปป';
      } else {
        mockDateBadge.style.display = 'none';
      }
    }

    const mockSigImg = document.getElementById('mockSigImg');
    const mockSigText = document.getElementById('mockSigText');
    const dataUrl = getSignatureDataUrl();
    if (dataUrl && mockSigImg && mockSigText) {
      mockSigImg.src = dataUrl;
      mockSigImg.style.display = 'block';
      mockSigText.style.display = 'none';
    } else if (mockSigImg && mockSigText) {
      mockSigImg.style.display = 'none';
      mockSigText.style.display = 'block';
    }
  }

  // Signature height as % of the page height for a given width %
  function getSignHeightPercent(size) {
    const mockup = document.getElementById('signPageMockup');
    const pageAspect = sigState.pageAspect || (mockup && mockup.clientHeight ? mockup.clientWidth / mockup.clientHeight : 0.75);
    const sigAspect = (sigState.activeTab === 'upload' ? sigState.uploadAspect : sigState.drawAspect) || (540 / 190);
    return Math.min(100, (size * pageAspect) / sigAspect);
  }

  // Render the chosen target page behind the placement preview
  async function refreshSignPagePreview() {
    const file = state.selectedFiles[0];
    const mockup = document.getElementById('signPageMockup');
    if (!file || !mockup || !window.pdfjsLib) return;
    const target = document.getElementById('signTargetPage')?.value || 'last';
    const token = (sigState.previewToken = (sigState.previewToken || 0) + 1);
    try {
      const pageNum = target === 'last' ? Infinity : (target === 'all' ? 1 : parseInt(target, 10) || 1);
      const preview = await window.PdfTools.renderPagePreview(file, pageNum === Infinity ? 1e9 : pageNum);
      if (token !== sigState.previewToken) return; // a newer request superseded this one
      sigState.pageAspect = preview.aspect;
      mockup.classList.add('has-page');
      mockup.style.backgroundImage = `url(${preview.url})`;
      mockup.style.aspectRatio = String(preview.aspect);
      updateSignLivePreview();
    } catch (e) {
      console.warn('Could not render sign page preview:', e);
    }
  }

  async function populateSignPages(file) {
    const targetSelect = document.getElementById('signTargetPage');
    if (!targetSelect || !file || !window.PDFLib) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = doc.getPageCount();

      let optionsHtml = `
        <option value="last" selected>หน้าสุดท้าย (หน้า ${count}) - แนะนำ</option>
        <option value="all">ทุกหน้าในเอกสาร (${count} หน้า)</option>
      `;
      for (let i = 1; i <= count; i++) {
        optionsHtml += `<option value="${i}">หน้า ${i}</option>`;
      }
      targetSelect.innerHTML = optionsHtml;
      refreshSignPagePreview();
    } catch (e) {
      console.warn('Could not read page count for sign target:', e);
    }
  }

  /**
   * PWA Installation Manager
   */
  let deferredPrompt = null;

  function initPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installBtn = document.getElementById('pwaInstallBtn');
      const mobileInstallBtn = document.getElementById('mobilePwaInstallBtn');
      if (installBtn) installBtn.style.display = 'inline-flex';
      if (mobileInstallBtn) mobileInstallBtn.style.display = 'flex';
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      const installBtn = document.getElementById('pwaInstallBtn');
      const mobileInstallBtn = document.getElementById('mobilePwaInstallBtn');
      if (installBtn) installBtn.style.display = 'none';
      if (mobileInstallBtn) mobileInstallBtn.style.display = 'none';
      console.log('[PWA] PenguTools was successfully installed!');
    });
  }

  function installPwa() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  }

  // Expose to window for inline onclicks
  window.PenguApp = {
    handleRouting,
    moveFile,
    removeFile,
    clearFiles,
    runAction,
    resetCurrentTool,
    handlePdfCompressModeChange,
    handleSplitModeChange,
    handleRotateTargetChange,
    handleResizePreset,
    handleResizeDimChange,
    handleOrganizeRotate,
    handleOrganizeRotateAll,
    handleOrganizeDelete,
    handleOrganizeMove,
    handleOrganizeReset,
    handleOrganizeDragStart,
    handleOrganizeDragOver,
    handleOrganizeDrop,
    handleOrganizeDragEnd,
    toggleMobileMenu,
    closeMobileMenu,
    chainToTool,
    switchSignTab,
    setSignColor,
    setSignWidth,
    clearSignature,
    handleSigFileSelect,
    applySignPreset,
    handleSignSliderChange,
    handleSignDateToggle,
    updateSignLivePreview,
    getSignatureDataUrl,
    refreshSignPagePreview,
    useSharedFiles,
    installPwa
  };

  // Init Theme, PWA & Router on load & hashchange
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initPwaInstall();
    handleRouting();

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    });
  });
  window.addEventListener('hashchange', () => {
    handleRouting();
  });

})();
