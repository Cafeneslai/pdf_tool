# 🐧 PenguTools — ข้อมูลเวอร์ชันและบันทึกการเปลี่ยนแปลง (Version & Changelog)

> **Current Version:** `v1.2.0`  
> **Release Date:** 2026-10-17  
> **Architecture:** 100% Client-Side In-Browser Processing (Zero-Backend, Zero-Dependency Static App)  
> **Maintainer:** Cafeneslai  
> **Repository:** [https://github.com/Cafeneslai/pdf_tool.git](https://github.com/Cafeneslai/pdf_tool.git)

---

## 📌 สรุปประวัติเวอร์ชัน (Version History)

| เวอร์ชัน | วันที่เผยแพร่ | สถานะ | สรุปไฮไลท์สำคัญ |
| :--- | :--- | :--- | :--- |
| **v1.2.0** | 2026-10-17 | **Current (Stable)** | แก้ไขบัคความปลอดภัย (XSS), แก้ปัญหา Memory Leak (Canvas Buffers), รองรับเลขอารบิก-ไทย, ปรับปรุง Responsive & Touch ทุกหน้าจอ, เพิ่มระบบ Mobile Drawer Navigation |
| **v1.1.0** | 2026-10-15 | Stable | เพิ่มเครื่องมือใหม่ 8 รายการ: Organize PDF, Unlock PDF, Watermark PDF, Compare Files, Inspect ZIP, ปรับแต่ง Dark Mode สมบูรณ์ |
| **v1.0.0** | 2026-10-10 | Initial Release | เปิดตัว PenguTools พร้อม 10 เครื่องมือพื้นฐาน (PDF, Image, File Utilities) และมาสคอตน้องเพนกวิน |

---

## 🚀 บันทึกการเปลี่ยนแปลงฉบับละเอียด (Detailed Changelog)

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
