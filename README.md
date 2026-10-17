# PenguTools — Cute Online File Toolkit 🐧
> *Small Penguin, Big File Solutions!* — เครื่องมือจัดการไฟล์ออนไลน์น่ารัก สบายตา ปลอดภัย 100%

[![Version](https://img.shields.io/badge/version-v1.2.0-0284c7.svg)](VERSION.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/architecture-100%25%20Client--Side-10b981.svg)](#-จุดเด่นสำคัญ)
[![Mobile Ready](https://img.shields.io/badge/mobile-responsive%20%26%20touch-38bdf8.svg)](#-รองรับ-responsive-และ-touch-ทุกขนาดหน้าจอ)

**PenguTools** คือเว็บแอปพลิเคชันสำหรับจัดการไฟล์ PDF, รูปภาพ และยูทิลิตี้จำเป็น ออกแบบในสไตล์ **Cute Minimal SaaS** ผสมกับ **Soft UI** (ธีมฟ้า-ขาว `#0284c7`, `#f0f9ff`) พร้อมมาสคอตน้องเพนกวินที่จะคอยช่วยเหลือและให้กำลังใจในทุกขั้นตอน 

---

## 🌟 จุดเด่นสำคัญ

1. **🔒 ความปลอดภัยและความเป็นส่วนตัว 100% (100% Client-Side In-Browser Processing):**
   - ประมวลผลไฟล์ทั้งหมดบนเว็บเบราว์เซอร์ของเครื่องผู้ใช้งานโดยตรง (Client-Side) ผ่าน WebAssembly, HTML5 Canvas API, Web Crypto API และไลบรารีสแตนด์อโลน
   - **ไม่มีการส่งไฟล์ขึ้นไปเก็บบนเซิร์ฟเวอร์หรือ Third-party ใดๆ แม้แต่ไบต์เดียว** ไฟล์ส่วนตัวและข้อมูลสำคัญของคุณจึงปลอดภัยอย่างแท้จริง
   - มีระบบตัดอักขระพิเศษ (HTML Sanitization) ป้องกันการโจมตีแบบ XSS
2. **🚀 ติดตั้งและใช้งานง่ายผ่าน `public_html` ทันที:**
   - ใช้งานได้บน Web Server ทุกประเภท (Apache, Nginx, LiteSpeed, cPanel, DirectAdmin, Plesk)
   - ไม่จำเป็นต้องมี Node.js runtime, Python หรือ Docker บนเซิร์ฟเวอร์
   - รวมไลบรารีสแตนด์อโลนไว้ในโฟลเดอร์ `assets/libs/` ครบถ้วน ไม่ต้องพึ่งพา CDN ภายนอก ทำงานได้แม้เน็ตไม่เสถียร
3. **📁 รองรับการติดตั้งใน Subdirectory และ GitHub Pages:**
   - สามารถวางไว้ที่ Root domain (`https://example.com/`) หรือโฟลเดอร์ย่อย เช่น (`https://example.com/tools/` หรือ `https://example.com/pengutools/`) ได้อย่างไร้รอยต่อ ลิงก์และเส้นทางไฟล์ทั้งหมดถูกออกแบบด้วย Relative Path
4. **🐧 มาสคอตน้องเพนกวินสื่ออารมณ์ครบทุกสถานะ:**
   - โบกมือทักทายที่ Hero Section
   - รอรับไฟล์ในพื้นที่ Drag & Drop
   - แอนิเมชันกำลังตั้งใจทำงานระหว่างประมวลผล (Loading State)
   - กระโดดดีใจพร้อมคำยินดีเมื่อทำงานสำเร็จ (Success State)
   - ปลอบใจและแนะนำแนวทางแก้ไขเมื่อเกิดข้อผิดพลาด (Error Handling State)
5. **📱 รองรับ Responsive Design และ Touch เต็มรูปแบบ:**
   - รองรับทุกขนาดหน้าจอ: จอมือถือขนาดเล็ก (320–375px), มือถือทั่วไป (390–430px), แท็บเล็ต (768–1024px) และเดสก์ท็อป (1280px+)
   - ปุ่ม Hamburger และ Mobile Navigation Drawer สำหรับการใช้งานบนมือถืออย่างสะดวกสบาย
   - พื้นที่สัมผัสปุ่มและตัวควบคุมขนาด $\ge 44 \times 44\text{px}$
   - ป้องกัน iOS Safari ซูมเข้าอัตโนมัติด้วยขนาดตัวอักษรของ Input ที่ได้มาตรฐาน
   - มีโหมดกลางคืน (Dark Mode) ถนอมสายตา

---

## 🛠️ รายการเครื่องมือทั้งหมด (18 เครื่องมือ)

### 1. หมวด PDF Tools (10 เครื่องมือ)
- **Merge PDF (รวมไฟล์ PDF)** — รวมไฟล์ PDF หลายไฟล์ (2-30 ไฟล์) พร้อมปุ่มจัดเรียงลำดับไฟล์ (เลื่อนขึ้น-ลง) และลบไฟล์ก่อนรวม
- **Organize PDF (จัดเรียง ลบ หมุนหน้า PDF)** — จัดระเบียบหน้าเอกสารแบบเห็นภาพพรีวิว (Thumbnail) ทุกหน้า ลากสลับตำแหน่ง หมุนองศา หรือลบหน้าที่ไม่ต้องการออกได้อิสระ
- **Split PDF (แยกไฟล์ PDF)** — แยกเอกสารตามช่วงหน้าที่กำหนด (เช่น `1-3, 5` หรือ `๑-๓, ๕`) เป็นไฟล์ใหม่ หรือแยกทุกหน้าเป็นไฟล์เดี่ยวใน ZIP
- **Compress PDF (บีบอัด PDF)** — ระบบบีบอัด 2 โหมด: โหมด Smart Visual Downsampling (บีบอัดภาพในเอกสาร ลดขนาดได้จริง 40-90%) และโหมด Structural Compression พร้อมเปรียบเทียบขนาดไบต์จริงก่อนและหลัง
- **Watermark & Page Number (ใส่ลายน้ำและเลขหน้า)** — ใส่ลายน้ำข้อความภาษาไทย/อังกฤษ ปรับมุมเอียง ความโปร่งใส ขนาดตัวอักษร และใส่เลขหน้าเอกสารแบบอัตโนมัติ
- **Rotate PDF (หมุนหน้า PDF)** — หมุนเอกสาร 90°, 180°, 270° เลือกหมุนทุกหน้า, หน้าคี่, หน้าคู่ หรือระบุหน้าเองได้
- **Extract PDF Pages (ดึงหน้าที่เลือก)** — ดึงเฉพาะหน้าที่ต้องการออกมาเป็นเอกสาร PDF ฉบับใหม่
- **Unlock PDF (ปลดล็อกรหัสผ่าน PDF)** — ถอดรหัสผ่านของไฟล์ PDF เพื่อให้เปิดอ่านและแก้ไขได้โดยไม่ต้องกรอกรหัสผ่านซ้ำ
- **Images to PDF (แปลงภาพเป็น PDF)** — รวมภาพถ่าย/รูปภาพหลายรูป (JPG, PNG, WebP) เป็นเอกสาร PDF กำหนดขนาดกระดาษ (A4 / พอดีภาพ) การวางแนว และระยะขอบ
- **PDF to Images (แปลง PDF เป็นรูปภาพ)** — แปลงหน้า PDF แต่ละหน้าเป็นรูปภาพ PNG หรือ JPG เลือกระดับความละเอียด (1.5x, 2.0x, 3.0x) ดาวน์โหลดเป็นภาพเดี่ยวหรือรวมเป็น `.ZIP` (แก้ไขพื้นหลังโปร่งใสเป็นสีขาวสะอาดตา)

### 2. หมวด Image Tools (4 เครื่องมือ)
- **Image Compressor (บีบอัดรูปภาพ)** — สไลเดอร์ปรับระดับคุณภาพ (10% - 95%), ย่อขนาดตามสเกล (100%, 75%, 50%, Full HD, HD) รองรับ JPG, PNG, WebP
- **Image Resizer (ปรับขนาดภาพ)** — กำหนดความกว้างและความสูงเป็นพิกเซล, ล็อกอัตราส่วนภาพ (Aspect Ratio), ย่อขนาดเป็นเปอร์เซ็นต์ หรือเลือก Presets ยอดนิยม (Full HD, HD, Square, Avatar) ป้องกันข้อผิดพลาด NaN
- **Image Converter (แปลงนามสกุลภาพ)** — แปลงไฟล์ไป-มาระหว่าง PNG, JPG และ WebP อย่างสะดวกรวดเร็ว
- **Images to PDF** — แปลงชุดภาพเป็นเอกสาร PDF สมบูรณ์แบบ

### 3. หมวด File Utilities (4 เครื่องมือ)
- **File Size Checker (ตรวจสอบขนาดไฟล์)** — ตรวจสอบขนาดไฟล์อย่างละเอียด (Bytes, KB, MB, GB), ตรวจสอบขีดจำกัดไฟล์แนบอีเมล (25 MB), คำนวณเวลาถ่ายโอนข้อมูลบนเครือข่าย 4G, 5G, Fiber, USB 2.0, USB 3.0
- **ZIP Files (รวมไฟล์เป็น ZIP)** — รวมไฟล์หลายไฟล์ (ไม่จำกัดนามสกุล) เข้าเป็นไฟล์ `.ZIP` พร้อมตั้งชื่อไฟล์ และแสดงขนาดก่อน-หลัง
- **File Information & SHA-256 (ดูข้อมูลไฟล์เชิงลึก)** — ตรวจสอบ MIME Type, Magic Bytes Signature (Header) เพื่อระบุประเภทไฟล์ที่แท้จริง และคำนวณ **SHA-256 Checksum** ด้วย Web Crypto API
- **Compare Files (เปรียบเทียบไฟล์)** — เปรียบเทียบความเหมือนกันของไฟล์ 2 ไฟล์ผ่านค่าแฮช SHA-256 และโครงสร้างขนาดไฟล์อย่างแม่นยำ
- **Inspect ZIP (เปิดดูเนื้อหาใน ZIP)** — ตรวจสอบโครงสร้างไฟล์ย่อยภายในไฟล์ ZIP ดูขนาดก่อนและหลังบีบอัด และเลือกแตกไฟล์ดาวน์โหลดเฉพาะไฟล์ที่ต้องการได้ทันที

---

## 📂 โครงสร้างไดเรกทอรีของโปรเจกต์

```text
pdf_tool/
├── index.html                           # ไฟล์หน้าเว็บหลัก (SPA Shell, SEO, Layout)
├── README.md                            # คู่มือการใช้งานและรายละเอียดโปรเจกต์
├── VERSION.md                           # ข้อมูลเวอร์ชันและบันทึกการเปลี่ยนแปลง (Changelog)
├── .gitignore                           # รายการไฟล์ที่ไม่ต้องการติดตามใน Git
├── docs/
│   ├── PROJECT_AUDIT_AND_FIX_REPORT.md  # รายงานการตรวจสอบ แก้ไขบัค และปรับปรุงระบบฉบับสมบูรณ์
│   └── PROJECT_IMPROVEMENT_ROADMAP.md   # แผนยุทธศาสตร์การพัฒนาฟีเจอร์ในอนาคต
└── assets/
    ├── css/
    │   └── style.css                    # Design System, Responsive Breakpoints, Touch & Dark Mode
    ├── images/
    │   ├── og-preview.png               # ภาพพรีวิว Social Share สไตล์เพนกวิน
    │   └── og-preview.jpg               # ภาพพรีวิวสำรอง
    ├── js/
    │   ├── mascot.js                    # เวกเตอร์ SVG มาสคอตน้องเพนกวินทุกสถานะ
    │   ├── app.js                       # คอนโทรลเลอร์หลัก: Hash Router, State, UI, Organizers
    │   └── tools/
    │       ├── pdf-tools.js             # เอนจินประมวลผล PDF (pdf-lib, pdfjs-dist, canvas)
    │       ├── image-tools.js           # เอนจินประมวลผลรูปภาพ (HTML5 Canvas & Blob API)
    │       └── file-tools.js            # เอนจินคำนวณขนาดไฟล์, ZIP, และ Web Crypto SHA-256
    └── libs/
        ├── pdf-lib.min.js               # ไลบรารีจัดการ PDF แบบสแตนด์อโลน (512.8 KB)
        ├── pdf.min.js                   # ไลบรารีเรนเดอร์ PDF แบบสแตนด์อโลน (312.5 KB)
        ├── pdf.worker.min.js            # Worker สำหรับเรนเดอร์ PDF (1,061.7 KB)
        └── jszip.min.js                 # ไลบรารีสร้างและอ่านไฟล์ ZIP (95.3 KB)
```

---

## 🚀 วิธีการติดตั้งและใช้งาน

### 1. ใช้งานบน Local Development / เปิดดูทันที
สามารถเปิดไฟล์ `index.html` บนเว็บเบราว์เซอร์สมัยใหม่ได้ทันที หรือรันผ่าน Local HTTP Server:
```bash
# ตัวอย่างการรันด้วย Python
python -m http.server 8080

# หรือรันด้วย Node.js npx
npx serve .
```
แล้วเปิดเบราว์เซอร์ไปที่ `http://localhost:8080`

### 2. นำขึ้นเซิร์ฟเวอร์ Shared Hosting (cPanel / DirectAdmin / Plesk)
1. เข้าสู่ Control Panel ของโฮสติ้งของคุณ
2. ไปที่ **File Manager** แล้วเข้าไปที่โฟลเดอร์ `public_html`
3. อัปโหลดไฟล์ทั้งหมดของโปรเจกต์นี้เข้าไปใน `public_html` (หรือโฟลเดอร์ย่อย เช่น `public_html/pdf_tool/`)
4. ใช้งานได้ทันที ไม่ต้องติดตั้งโปรแกรมหรือรันคำสั่งใดๆ เพิ่มเติม

### 3. นำขึ้น GitHub Pages
1. ไปที่แท็บ **Settings** ของ Repository บน GitHub
2. ไปที่เมนู **Pages** ทางซ้ายมือ
3. ในส่วน **Build and deployment** เลือก Source เป็น **Deploy from a branch**
4. เลือก Branch เป็น `main` และโฟลเดอร์เป็น `/ (root)` แล้วกด **Save**
5. รอสักครู่ เว็บไซต์จะออนไลน์พร้อมใช้งานทันที

---

## 📱 รองรับ Responsive และ Touch ทุกขนาดหน้าจอ

- **Small Mobile (320–375px):** จัดการตัดคำยาวอัตโนมัติ ซ่อนป้ายแท็กเพื่อไม่ให้เบียดโลโก้ กริดแสดง 1 คอลัมน์ ไม่ล้นขอบจอ
- **Standard Mobile (390–430px):** แถบเมนูด้านข้าง Mobile Navigation Drawer เปิด-ปิดได้นุ่มนวล ปุ่มสัมผัสขนาด $\ge 44\text{px}$ ป้องกันอาการจอซูมเข้าอัตโนมัติ
- **Tablet (768–1024px):** กริดแสดงผล 2 คอลัมน์สมมาตร รองรับทั้งแนวตั้งและแนวนอน
- **Desktop (1280px+):** แสดงผลเต็มตา รองรับ Keyboard Navigation ครบถ้วน

---

## 📄 เอกสารเพิ่มเติม
- 📋 [รายงานการตรวจสอบและแก้ไขบัคฉบับสมบูรณ์ (PROJECT_AUDIT_AND_FIX_REPORT.md)](docs/PROJECT_AUDIT_AND_FIX_REPORT.md)
- 🗺️ [แผนพัฒนาฟีเจอร์ในอนาคต (PROJECT_IMPROVEMENT_ROADMAP.md)](docs/PROJECT_IMPROVEMENT_ROADMAP.md)
- 🏷️ [บันทึกประวัติเวอร์ชัน (VERSION.md)](VERSION.md)

---

## 🤝 การมีส่วนร่วมและการพัฒนาต่อยอด (Contributing)
ยินดีรับข้อเสนอแนะ รายงานปัญหา หรือ Pull Request เสมอ:
1. Fork โครงการนี้
2. สร้าง Feature Branch ของคุณ (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง Branch ของคุณ (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

---

## ⚖️ สัญญาอนุญาต (License)
เผยแพร่ภายใต้สัญญาอนุญาต [MIT License](LICENSE) สามารถนำไปใช้งาน พัฒนาต่อยอด หรือติดตั้งบนโฮสติ้งส่วนตัวได้ฟรี
