# 🐧 PenguTools — ข้อมูลเวอร์ชันและบันทึกการเปลี่ยนแปลง (Version & Changelog)

> **Current Version:** `v1.3.1`  
> **Release Date:** 2026-10-18  
> **Architecture:** 100% Client-Side In-Browser Processing (Zero-Backend, PWA Installable, Offline Ready)  
> **Maintainer:** Cafeneslai  
> **Repository:** [https://github.com/Cafeneslai/pdf_tool.git](https://github.com/Cafeneslai/pdf_tool.git)

---

## 📌 สรุปประวัติเวอร์ชัน (Version History)

| เวอร์ชัน | วันที่เผยแพร่ | สถานะ | สรุปไฮไลท์สำคัญ |
| :--- | :--- | :--- | :--- |
| **v1.3.1** | 2026-10-18 | **Current (Stable)** | **Deep Bug Hunt & Resiliency:** แก้ไขบัค ZIP Inspector Index Mismatch, แก้ปัญหาภาพลายเซ็น JPG/WebP, ป้องกันชื่อไฟล์ซ้ำใน ZIP, เพิ่ม Live Placement Preview ใน Sign PDF, ปรับปรุงการจัดการ 0-byte/TB files |
| **v1.3.0** | 2026-10-18 | Stable | เพิ่มเครื่องมือ **Sign PDF (เซ็นเอกสาร PDF ออนไลน์)**, ระบบ **Workflow Chaining (ส่งต่อไฟล์ข้ามเครื่องมือ)**, รองรับ **Progressive Web App (PWA) & Offline Mode** |
| **v1.2.0** | 2026-10-17 | Stable | แก้ไขบัคความปลอดภัย (XSS), แก้ปัญหา Memory Leak (Canvas Buffers), รองรับเลขอารบิก-ไทย, ปรับปรุง Responsive & Touch ทุกหน้าจอ, เพิ่มระบบ Mobile Drawer Navigation |
| **v1.1.0** | 2026-10-15 | Stable | เพิ่มเครื่องมือใหม่ 8 รายการ: Organize PDF, Unlock PDF, Watermark PDF, Compare Files, Inspect ZIP, ปรับแต่ง Dark Mode สมบูรณ์ |
| **v1.0.0** | 2026-10-10 | Initial Release | เปิดตัว PenguTools พร้อม 10 เครื่องมือพื้นฐาน (PDF, Image, File Utilities) และมาสคอตน้องเพนกวิน |

---

## 🚀 บันทึกการเปลี่ยนแปลงฉบับละเอียด (Detailed Changelog)

### [v1.3.1] — 2026-10-18 (Deep Bug Hunt, Resiliency & Live Visual Preview)

#### 🐞 การแก้ไขบัคสำคัญ (Bug Fixes)
1. **ZIP Inspector Entry Index Mismatch:**
   - *สาเหตุเดิม:* ใน `inspectZip()` ดึง index `i` จากคีย์ไฟล์ทั้งหมดใน ZIP ซึ่งรวมถึง Folder Entries แต่ array `entries` กรองเฉพาะไฟล์ปกติ เมื่อ ZIP มีโฟลเดอร์อยู่ข้างหน้า ทำให้ค่า `index` คลาดเคลื่อนจน `downloadZipEntryByIndex(index)` อ่านได้ `undefined` และเกิดข้อผิดพลาด
   - *การแก้ไข:* ปรับให้กำหนด `index: entries.length` อย่างเคร่งครัด พร้อมเพิ่มการค้นหาด้วยชื่อไฟล์ (`item.name`) เป็น Fallback ป้องกันการแครช 100%
2. **Resilient Signature Image Embedding (`sign-pdf`):**
   - *สาเหตุเดิม:* เมื่อผู้ใช้อัปโหลดลายเซ็นเป็นไฟล์ JPG หรือ WebP ตัวฟังก์ชันเรียก `doc.embedPng(sigBytes)` ซึ่งโยนข้อผิดพลาด Unhandled Error ทันที
   - *การแก้ไข:* ใน `handleSigFileSelect` นำภาพมาวาดผ่าน Off-screen Canvas เพื่อ Normalization เป็น PNG Data URL ที่มีช่อง Alpha โปร่งใส และใน `signPdf` ตรวจสอบ Magic Bytes / MIME Type เพื่อเรียก `embedJpg` หรือ `embedPng` ตามจริง พร้อมมี Try-Catch Fallback
3. **Explicit Page Handling in `sign-pdf`:**
   - *การแก้ไข:* แยกเงื่อนไขการเลือกหน้าอย่างชัดเจนสำหรับ `'last'`, `'all'`, `'all-last'` และเลขหน้า 1-based index เพื่อป้องกันกรณีที่ `parseInt('all-last')` แปลงเป็น `NaN`
4. **ZIP Filename Collision Prevention:**
   - *สาเหตุเดิม:* หากผู้ใช้เลือกไฟล์ที่มีชื่อซ้ำกันจากคนละโฟลเดอร์เพื่อรวมเป็น ZIP ตัวไลบรารี JSZip จะเขียนทับไฟล์เดิมโดยไม่แจ้งเตือน
   - *การแก้ไข:* เพิ่มระบบตรวจจับชื่อไฟล์ซ้ำใน `zipFiles`, `compressMultipleImages` และ `convertMultipleImages` โดยจะเติมหมายเลขลำดับต่อท้ายอัตโนมัติ (เช่น `file_2.pdf`)
5. **0-Byte & TB File Handling in `formatSize`:**
   - *การแก้ไข:* ป้องกันข้อผิดพลาด `Math.log(0)` หรือ `Math.log(negative)` ที่อาจคืนค่า `NaN undefined` โดยกำหนด Guard Clause คืนค่า `'0 B'` และรองรับหน่วยขนาดไฟล์ถึงระดับ `TB`
6. **Canvas Blob Null Fallback & Division-by-Zero:**
   - *การแก้ไข:* ป้องกันเบราว์เซอร์คืนค่า `null` จาก `canvas.toBlob()` ใน `image-resizer`, `image-converter` และ `pdf-to-images` ด้วยการ Fallback ไปยัง PNG อัตโนมัติ พร้อมป้องกันการคำนวณ `savedPercent` หารด้วย 0 เมื่อเจอไฟล์ 0 ไบต์

#### ✨ ฟีเจอร์และการปรับปรุง UX
- **Live Placement Visual Preview สำหรับ Sign PDF:**
  - เพิ่มการ์ดจำลองหน้ากระดาษ A4 ในส่วนตั้งค่าของ Sign PDF
  - มีกล่องลายเซ็นและตราประทับวันที่จำลองที่ขยับตำแหน่งและปรับขนาดตามแถบสไลเดอร์ (X, Y, Size) และ Presets แบบ Real-Time ให้ผู้ใช้เห็นภาพจริงก่อนกดบันทึก
- **Sync Version Badge & PWA Cache:**
  - อัปเดต Brand Badge ในหน้าเว็บและ Cache Engine ใน `sw.js` เป็น `v1.3.1` สมบูรณ์

---

### [v1.3.0] — 2026-10-18 (Sign PDF, Workflow Chaining & PWA Offline Engine)

#### 🖊️ ฟีเจอร์ใหม่: Sign PDF (เซ็นเอกสาร PDF ออนไลน์)
- เพิ่มเครื่องมือ `sign-pdf` ในหมวด PDF Tools
- **Signature Drawing Pad:** ผืนผ้าใบวาดลายเซ็นความละเอียดสูง รองรับทั้งการใช้นิ้วมือบนหน้าจอสัมผัส (Touch Screen) และเมาส์ มีระบบป้องกันหน้าจอเลื่อนขณะวาด
- **Pen Controls:** ปรับสีหมึกได้ 3 สียอดนิยม (ดำ `#0f172a`, น้ำเงิน `#1d4ed8`, แดง `#dc2626`) และเลือกขนาดเส้น (บาง, ปานกลาง, หนา) พร้อมปุ่มล้างลายเซ็น
- **Image Signature Upload:** รองรับการอัปโหลดรูปภาพลายเซ็น (PNG โปร่งใส หรือ JPG)
- **Visual Placement & Presets:** เลือกหน้าที่ต้องการวางลายเซ็น (เช่น หน้าสุดท้าย หรือระบุหน้าเอง), กำหนดตำแหน่งผ่าน Presets (ล่างขวามาตรฐานสัญญา, ล่างซ้าย, ล่างตรงกลาง, ตรงกลางหน้า) หรือปรับละเอียดด้วยแถบสไลเดอร์ X, Y, Size
- **Date Stamp:** ตัวเลือกประทับตราวันที่กำกับใต้ลายเซ็นอัตโนมัติ

#### 🔄 ฟีเจอร์ใหม่: Workflow Chaining (ส่งต่อไฟล์ข้ามเครื่องมือแบบไร้รอยต่อ)
- เพิ่มระบบแนะนำเครื่องมือถัดไป (Next Action Recommendations) ในการ์ดแสดงผลลัพธ์
- หากผลลัพธ์เป็น PDF ระบบจะแนะนำ: บีบอัด PDF, เซ็นชื่อ, จัดเรียงหน้า, ใส่ลายน้ำ, แปลงเป็นรูปภาพ, แยกหน้า
- หากผลลัพธ์เป็นรูปภาพ ระบบจะแนะนำ: บีบอัดภาพ, ปรับขนาด, แปลงนามสกุล, แปลงเป็น PDF
- ผู้ใช้สามารถกดปุ่มเครื่องมือที่ต้องการ แล้วระบบจะโหลดไฟล์เดิมเข้าไปในเครื่องมือใหม่ทันทีโดย **ไม่ต้องดาวน์โหลดและอัปโหลดซ้ำ** ประหยัดเวลาและหน่วยความจำ

#### 📱 ฟีเจอร์ใหม่: Progressive Web App (PWA) & Offline Mode
- เพิ่มไฟล์ `manifest.json` กำหนดคุณสมบัติ Web App Manifest พร้อมธีมสี `#0284c7`
- สร้างไอคอนเวกเตอร์ SVG มาสคอตเพนกวิน `assets/images/icon.svg` สำหรับไอคอนแอปพลิเคชัน
- ติดตั้ง Service Worker (`sw.js`) แคชไฟล์แอปพลิเคชันและไลบรารีสแตนด์อโลน ช่วยให้เปิดใช้งาน PenguTools ได้แบบ **ออฟไลน์ 100% แม้ไม่มีสัญญาณอินเทอร์เน็ต**
- เพิ่มปุ่ม "📲 ติดตั้งแอป" บน Navbar และใน Mobile Drawer เพื่อให้ผู้ใช้ติดตั้งลงหน้าจอโทรศัพท์หรือคอมพิวเตอร์ได้ด้วยคลิกเดียว

---

### [v1.2.0] — 2026-10-17 (Bug Fixes, Security & Responsive Overhaul)

#### 🔒 ความปลอดภัย (Security Enhancements)
- **HTML Sanitization (XSS Prevention):** เพิ่มฟังก์ชัน `escapeHtml()` เพื่อกรองอักขระพิเศษ (`&`, `<`, `>`, `"`, `'`) ในทุกจุดที่นำชื่อไฟล์, แฮช SHA-256, ชนิด MIME, ข้อมูล Magic Bytes, ตารางไฟล์ ZIP และข้อความแจ้งเตือน Error ไปแสดงผลบนหน้าจอ ป้องกันการโจมตีประเภท Stored/DOM-based XSS โดยสมบูรณ์

#### ⚡ ประสิทธิภาพและการจัดการหน่วยความจำ (Performance & Memory)
- **Direct Binary Blob Generation:** ใน `compressPdf` (โหมด Visual Downsampling) เปลี่ยนจากการเรนเดอร์ Base64 Data URL ผ่าน `canvas.toDataURL()` และ `fetch()` มาใช้ `canvas.toBlob('image/jpeg')` และ `blob.arrayBuffer()` ข้ามการสร้างสตริงขนาดใหญ่ใน V8 Heap
- **Explicit Canvas Buffer Eviction:** เพิ่มการเคลียร์ขนาด Canvas (`canvas.width = 0; canvas.height = 0`) ทันทีหลังแปลงผลลัพธ์ใน `pdf-tools.js` และ `image-tools.js` ป้องกันปัญหาหน่วยความจำสะสมจนเกิดการแครช (OOM) บนเบราว์เซอร์มือถือ
- **Object URL Revocation:** ควบคุมการเรียก `URL.revokeObjectURL(objUrl)` ภายในทั้ง `onload` และ `onerror` ของ `imagesToPdf`, `inspectFile` และ `image-resizer` เพื่อคืนหน่วยความจำ RAM อย่างสม่ำเสมอ

#### 📱 การปรับปรุง Responsive & Touch Experience
- **Mobile Navigation Drawer:** เพิ่มเมนูด้านข้างแบบสไลด์เข้า (`#mobileNavDrawer`) พร้อมปุ่ม Hamburger Button ขนาด $44\times 44\text{px}$ ที่มีอนิเมชันแปลงเป็นกากบาท และฉากหลัง Backdrop Blur สามารถปิดได้ด้วยการแตะฉากหลังหรือกดปุ่ม `Escape`
- **Touch Target Optimization ($\ge 44\times 44\text{px}$):** ปรับขนาดปุ่มกด ลิงก์ และไอคอนควบคุมทั้งหมดให้แตะได้สะดวกด้วยนิ้วมือ
- **Range Slider Touch Thumb:** ออกแบบหัวลากสไลเดอร์ขนาด $28\text{px}$ พร้อมคุณสมบัติ `touch-action: manipulation;` ปรับคุณภาพและสเกลบนหน้าจอมือถือได้แม่นยำ
- **iOS Safari Auto-zoom Prevention:** กำหนด `font-size: 16px` สำหรับช่อง Input และ Select บนจอมือถือ ป้องกันเบราว์เซอร์ซูมหน้าจอเข้าโดยอัตโนมัติ
- **Horizontal Smooth Touch Scroll:** แถบเลือกหมวดหมู่เครื่องมือ (Category Navigation) เลื่อนแนวนอนได้อย่างราบรื่นบนจอเล็ก พร้อมซ่อน Scrollbar ที่เกะกะ
- **Anti-Overflow & Dynamic Word Break:** กำกับข้อความยาวและตารางด้วย `overflow-wrap: anywhere;` และ `-webkit-overflow-scrolling: touch;` แก้ไขปัญหาหน้าเว็บเลื่อนแนวนอนได้อย่างเด็ดขาด

#### 🛠️ การแก้ไขความถูกต้องของฟังก์ชัน (Functional Bug Fixes)
- **Thai Numeral Normalization:** เพิ่มการแปลงตัวเลขไทย `๐-๙` เป็นเลขอารบิก `0-9` อัตโนมัติในฟังก์ชันแยกช่วงหน้า (`parsePageRange`) รองรับคีย์บอร์ดมือถือภาษาไทยใน `split-pdf`, `rotate-pdf`, `extract-pdf`
- **Watermark Rotation Geometry:** แก้ไขสูตรตรีโกณมิติในการคำนวณพิกัดจุดกึ่งกลางของลายน้ำที่หมุนเอียง (เช่น $-45^\circ$) ให้อยู่กึ่งกลางหน้ากระดาษอย่างแม่นยำ พร้อมเรนเดอร์ Canvas ด้วยสเกล 2x Retina เพิ่มความคมชัด
- **PDF-to-Image Transparent Background Fix:** เติมพื้นหลังสีขาวบริสุทธิ์ (`#FFFFFF`) ลงบน Canvas ก่อนเรนเดอร์ แก้ปัญหาภาพที่ได้มีพื้นหลังสีดำเมื่อแปลง PDF หน้าโปร่งใสเป็น JPEG
- **Image Resizer Aspect Ratio Fix:** ป้องกันข้อผิดพลาด `NaN` และการหารด้วยศูนย์เมื่อผู้ใช้ลบตัวเลขในช่องกรอกความกว้าง/ความสูง
- **ZIP Inspector Safe Download:** ปรับปรุงตาราง ZIP ให้อ้างอิงการดาวน์โหลดผ่าน Index แทนการส่งสตริงชื่อไฟล์ ป้องกันข้อผิดพลาดจากชื่อไฟล์ที่มีเครื่องหมายคำพูด
- **Unlock PDF Validation:** เพิ่มการตรวจสอบรหัสผ่านว่างเปล่า พร้อมแสดงข้อความเตือนที่เป็นมิตร
- **Visual PDF Organizer Real-time Counter:** ซิงก์ตัวนับหน้าเอกสาร (`#fileCountBadge`) ให้ตรงกับจำนวนการ์ดหน้าที่เหลือจริงทันทีเมื่อมีการลบหรือย้ายหน้า

---

### [v1.1.0] — 2026-10-15 (New Tools & Dark Mode)
- เพิ่มเครื่องมือจัดการไฟล์ใหม่ 8 รายการ:
  1. `organize-pdf` (จัดเรียง ลบ หมุนหน้า PDF แบบเห็นภาพพรีวิวทุกหน้า)
  2. `unlock-pdf` (ปลดล็อกรหัสผ่านเอกสาร PDF)
  3. `watermark-pdf` (ใส่ลายน้ำข้อความและเลขหน้าเอกสาร PDF)
  4. `image-converter` (แปลงฟอร์แมตภาพ PNG, JPG, WebP)
  5. `image-resizer` (ปรับขนาดความกว้าง-สูง และรักษาสัดส่วนภาพ)
  6. `compare-files` (เปรียบเทียบความเหมือนของไฟล์ 2 ไฟล์ผ่าน SHA-256)
  7. `inspect-zip` (เปิดดูโครงสร้างไฟล์และแตกไฟล์เดี่ยวใน ZIP)
  8. `extract-pdf` (ดึงเฉพาะหน้าที่ต้องการออกจาก PDF)
- เพิ่มระบบ Dark Mode เต็มรูปแบบ ปรับเปลี่ยนสีอัตโนมัติตามธีมระบบ หรือกดสลับได้ด้วยตนเอง
- ปรับแต่ง Vector Mascot อนิเมชันเพนกวินตามสถานะการทำงาน

---

### [v1.0.0] — 2026-10-10 (Initial Release)
- เปิดตัว PenguTools พร้อมสถาปัตยกรรม 100% Client-Side In-Browser Processing
- บรรจุไลบรารีสแตนด์อโลน `pdf-lib`, `pdfjs-dist`, `jszip` โดยไม่ต้องพึ่งพา CDN ภายนอก
- รองรับ 10 เครื่องมือพื้นฐานสำหรับจัดการ PDF, รูปภาพ และขนาดไฟล์
- รองรับการติดตั้งบน Shared Hosting ทั่วไปผ่านโฟลเดอร์ `public_html` ทันที
