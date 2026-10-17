/**
 * PenguTools - Mascot SVG Components 🐧
 * น้องเพนกวินน่ารัก มาสคอตประจำ PenguTools
 */

const PenguMascot = {
  /**
   * 1. เพนกวินโบกมือทักทาย (Hero / Welcome)
   */
  waving: (size = 140) => `
    <svg width="${size}" height="${size}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="pengu-mascot pengu-wave" role="img" aria-label="น้องเพนกวินโบกมือทักทาย">
      <!-- Shadow -->
      <ellipse cx="80" cy="148" rx="46" ry="8" fill="rgba(2, 132, 199, 0.15)" />
      <!-- Left Arm (Waving) -->
      <g class="pengu-arm-wave">
        <path d="M42 75 C25 60 15 42 28 35 C38 30 48 52 48 68 Z" fill="#1E293B" />
        <ellipse cx="25" cy="38" rx="6" ry="6" fill="#38BDF8" opacity="0.4" />
      </g>
      <!-- Right Arm (Resting) -->
      <path d="M118 78 C135 88 142 105 132 112 C122 118 112 98 112 85 Z" fill="#1E293B" />
      <!-- Body (Dark Slate) -->
      <ellipse cx="80" cy="92" rx="44" ry="52" fill="#1E293B" />
      <!-- White Belly -->
      <ellipse cx="80" cy="98" rx="32" ry="40" fill="#F8FAFC" />
      <path d="M60 85 Q80 72 100 85 Q105 125 80 135 Q55 125 60 85 Z" fill="#FFFFFF" />
      <!-- Cute Winter Scarf (Sky Blue) -->
      <path d="M52 68 C62 60 98 60 108 68 C112 74 105 80 80 80 C55 80 48 74 52 68 Z" fill="#0284C7" />
      <rect x="70" y="74" width="16" height="26" rx="4" fill="#38BDF8" />
      <rect x="70" y="94" width="16" height="6" fill="#0284C7" />
      <!-- Feet (Soft Amber) -->
      <ellipse cx="64" cy="144" rx="14" ry="7" fill="#F59E0B" />
      <ellipse cx="96" cy="144" rx="14" ry="7" fill="#F59E0B" />
      <!-- Head / Face -->
      <ellipse cx="80" cy="56" rx="36" ry="32" fill="#1E293B" />
      <!-- Face White Mask -->
      <path d="M54 58 C54 44 65 36 74 44 C77 46 80 46 83 44 C92 36 106 44 106 58 C106 70 96 74 80 74 C64 74 54 70 54 58 Z" fill="#FFFFFF" />
      <!-- Cheeks (Blushing pink) -->
      <ellipse cx="60" cy="62" rx="6" ry="4" fill="#FDA4AF" opacity="0.85" />
      <ellipse cx="100" cy="62" rx="6" ry="4" fill="#FDA4AF" opacity="0.85" />
      <!-- Eyes (Big Sparkling) -->
      <circle cx="68" cy="54" r="5" fill="#0F172A" />
      <circle cx="66.5" cy="52" r="2" fill="#FFFFFF" />
      <circle cx="92" cy="54" r="5" fill="#0F172A" />
      <circle cx="90.5" cy="52" r="2" fill="#FFFFFF" />
      <!-- Beak (Cute Triangle) -->
      <path d="M74 58 Q80 56 86 58 Q80 70 74 58 Z" fill="#F59E0B" />
      <path d="M76 60 Q80 58 84 60 Q80 67 76 60 Z" fill="#FBBF24" />
      <!-- Little Head Tuft -->
      <path d="M78 24 C79 20 83 20 82 25 Z" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />
    </svg>
  `,

  /**
   * 2. เพนกวินถือเอกสาร / รอรับไฟล์ (Drop Zone)
   */
  droppable: (size = 110) => `
    <svg width="${size}" height="${size}" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" class="pengu-mascot pengu-drop" role="img" aria-label="น้องเพนกวินรอรับไฟล์">
      <ellipse cx="70" cy="130" rx="42" ry="7" fill="rgba(2, 132, 199, 0.15)" />
      <!-- Wings held open for files -->
      <path d="M35 82 C16 75 14 60 26 56 C36 53 45 68 45 80 Z" fill="#1E293B" />
      <path d="M105 82 C124 75 126 60 114 56 C104 53 95 68 95 80 Z" fill="#1E293B" />
      <!-- Body -->
      <ellipse cx="70" cy="85" rx="38" ry="44" fill="#1E293B" />
      <ellipse cx="70" cy="90" rx="28" ry="34" fill="#FFFFFF" />
      <!-- Document icon held in belly -->
      <g transform="translate(56, 75)">
        <rect x="0" y="0" width="28" height="34" rx="4" fill="#E0F2FE" stroke="#0284C7" stroke-width="2" />
        <line x1="5" y1="8" x2="23" y2="8" stroke="#0284C7" stroke-width="2" stroke-linecap="round" />
        <line x1="5" y1="14" x2="19" y2="14" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
        <line x1="5" y1="20" x2="21" y2="20" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
        <circle cx="20" cy="26" r="3" fill="#F59E0B" />
      </g>
      <!-- Feet -->
      <ellipse cx="56" cy="128" rx="12" ry="6" fill="#F59E0B" />
      <ellipse cx="84" cy="128" rx="12" ry="6" fill="#F59E0B" />
      <!-- Scarf -->
      <path d="M46 56 C54 48 86 48 94 56 C98 62 90 67 70 67 C50 67 42 62 46 56 Z" fill="#0284C7" />
      <!-- Head -->
      <ellipse cx="70" cy="46" rx="30" ry="26" fill="#1E293B" />
      <path d="M48 48 C48 36 58 30 65 36 C68 38 72 38 75 36 C82 30 92 36 92 48 C92 58 84 62 70 62 C56 62 48 58 48 48 Z" fill="#FFFFFF" />
      <!-- Cheeks -->
      <ellipse cx="54" cy="52" rx="5" ry="3" fill="#FDA4AF" opacity="0.8" />
      <ellipse cx="86" cy="52" rx="5" ry="3" fill="#FDA4AF" opacity="0.8" />
      <!-- Eyes looking UP excitedly -->
      <circle cx="60" cy="44" r="4.5" fill="#0F172A" />
      <circle cx="61" cy="42" r="1.8" fill="#FFFFFF" />
      <circle cx="80" cy="44" r="4.5" fill="#0F172A" />
      <circle cx="81" cy="42" r="1.8" fill="#FFFFFF" />
      <!-- Beak open smile -->
      <path d="M65 49 Q70 47 75 49 Q70 58 65 49 Z" fill="#F59E0B" />
    </svg>
  `,

  /**
   * 3. เพนกวินตั้งใจทำงาน / กำลังประมวลผล (Loading / Processing State)
   */
  working: (size = 120) => `
    <svg width="${size}" height="${size}" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" class="pengu-mascot pengu-work" role="img" aria-label="น้องเพนกวินกำลังประมวลผลไฟล์">
      <ellipse cx="70" cy="128" rx="40" ry="7" fill="rgba(2, 132, 199, 0.15)" />
      <!-- Gears / Sparkles of thought -->
      <g class="pengu-gear-spin" transform-origin="105 32">
        <circle cx="105" cy="32" r="8" stroke="#0284C7" stroke-width="3" stroke-dasharray="4 3" fill="#E0F2FE" />
        <circle cx="105" cy="32" r="3" fill="#0284C7" />
      </g>
      <!-- Body -->
      <ellipse cx="70" cy="85" rx="38" ry="44" fill="#1E293B" />
      <ellipse cx="70" cy="90" rx="28" ry="34" fill="#FFFFFF" />
      <!-- Little Laptop / Tool stand -->
      <rect x="50" y="88" width="40" height="26" rx="4" fill="#0284C7" />
      <rect x="54" y="92" width="32" height="18" rx="2" fill="#F0F9FF" />
      <!-- Code lines on laptop -->
      <line x1="58" y1="97" x2="78" y2="97" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
      <line x1="58" y1="102" x2="72" y2="102" stroke="#0284C7" stroke-width="2" stroke-linecap="round" />
      <!-- Hands typing on laptop -->
      <ellipse cx="48" cy="98" rx="6" ry="8" fill="#1E293B" />
      <ellipse cx="92" cy="98" rx="6" ry="8" fill="#1E293B" />
      <!-- Feet -->
      <ellipse cx="56" cy="126" rx="12" ry="6" fill="#F59E0B" />
      <ellipse cx="84" cy="126" rx="12" ry="6" fill="#F59E0B" />
      <!-- Head with cute Glasses -->
      <ellipse cx="70" cy="46" rx="30" ry="26" fill="#1E293B" />
      <path d="M48 48 C48 36 58 30 65 36 C68 38 72 38 75 36 C82 30 92 36 92 48 C92 58 84 62 70 62 C56 62 48 58 48 48 Z" fill="#FFFFFF" />
      <!-- Glasses frames -->
      <circle cx="60" cy="46" r="7" stroke="#0284C7" stroke-width="2" fill="none" />
      <circle cx="80" cy="46" r="7" stroke="#0284C7" stroke-width="2" fill="none" />
      <line x1="67" y1="46" x2="73" y2="46" stroke="#0284C7" stroke-width="2" />
      <!-- Cheeks -->
      <ellipse cx="52" cy="54" rx="4" ry="3" fill="#FDA4AF" opacity="0.8" />
      <ellipse cx="88" cy="54" rx="4" ry="3" fill="#FDA4AF" opacity="0.8" />
      <!-- Focused Eyes -->
      <circle cx="61" cy="46" r="3.5" fill="#0F172A" />
      <circle cx="60" cy="45" r="1.5" fill="#FFFFFF" />
      <circle cx="79" cy="46" r="3.5" fill="#0F172A" />
      <circle cx="78" cy="45" r="1.5" fill="#FFFFFF" />
      <!-- Beak -->
      <path d="M66 50 Q70 48 74 50 Q70 56 66 50 Z" fill="#F59E0B" />
    </svg>
  `,

  /**
   * 4. เพนกวินดีใจ / ทำงานสำเร็จ (Success State)
   */
  happy: (size = 130) => `
    <svg width="${size}" height="${size}" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" class="pengu-mascot pengu-jump" role="img" aria-label="น้องเพนกวินดีใจ งานเสร็จสมบูรณ์">
      <ellipse cx="75" cy="140" rx="36" ry="6" fill="rgba(2, 132, 199, 0.15)" />
      <!-- Sparkles / Confetti -->
      <path d="M28 35 L32 40 L28 45 L24 40 Z" fill="#F59E0B" />
      <circle cx="125" cy="42" r="3.5" fill="#10B981" />
      <path d="M120 25 L124 30 L120 35 L116 30 Z" fill="#38BDF8" />
      <!-- Left Wing Raised High -->
      <path d="M38 72 C18 52 14 36 26 30 C36 24 48 48 48 64 Z" fill="#1E293B" />
      <!-- Right Wing Raised High -->
      <path d="M112 72 C132 52 136 36 124 30 C114 24 102 48 102 64 Z" fill="#1E293B" />
      <!-- Body -->
      <ellipse cx="75" cy="88" rx="40" ry="46" fill="#1E293B" />
      <ellipse cx="75" cy="94" rx="30" ry="36" fill="#FFFFFF" />
      <!-- Green Success Badge with Checkmark -->
      <circle cx="75" cy="100" r="14" fill="#10B981" />
      <path d="M68 100 L73 105 L82 95" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Feet (Dancing) -->
      <ellipse cx="60" cy="134" rx="13" ry="7" fill="#F59E0B" transform="rotate(-8 60 134)" />
      <ellipse cx="90" cy="134" rx="13" ry="7" fill="#F59E0B" transform="rotate(8 90 134)" />
      <!-- Scarf -->
      <path d="M48 60 C58 52 92 52 102 60 C106 66 98 72 75 72 C52 72 44 66 48 60 Z" fill="#0284C7" />
      <rect x="80" y="66" width="14" height="22" rx="3" fill="#38BDF8" />
      <!-- Head -->
      <ellipse cx="75" cy="48" rx="32" ry="28" fill="#1E293B" />
      <path d="M52 50 C52 38 62 32 70 38 C73 40 77 40 80 38 C88 32 98 38 98 50 C98 60 90 64 75 64 C60 64 52 60 52 50 Z" fill="#FFFFFF" />
      <!-- Cheeks Extra Rosy -->
      <ellipse cx="58" cy="54" rx="6" ry="4" fill="#FDA4AF" />
      <ellipse cx="92" cy="54" rx="6" ry="4" fill="#FDA4AF" />
      <!-- Joyful Curved Eyes (Smiling ^ ^) -->
      <path d="M60 48 Q66 42 72 48" stroke="#0F172A" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M78 48 Q84 42 90 48" stroke="#0F172A" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- Wide Smile Beak -->
      <path d="M69 52 Q75 49 81 52 Q75 63 69 52 Z" fill="#F59E0B" />
      <path d="M71 54 Q75 52 79 54 Q75 60 71 54 Z" fill="#FBBF24" />
    </svg>
  `,

  /**
   * 5. เพนกวินปลอบใจ / เตือนเมื่อเกิดข้อผิดพลาด (Error / Warning State)
   */
  comfort: (size = 120) => `
    <svg width="${size}" height="${size}" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" class="pengu-mascot pengu-sad" role="img" aria-label="น้องเพนกวินเป็นห่วงและให้กำลังใจ">
      <ellipse cx="70" cy="128" rx="38" ry="6" fill="rgba(239, 68, 68, 0.12)" />
      <!-- Little heart floating above -->
      <path d="M70 20 C68 15 62 15 60 19 C58 23 70 30 70 30 C70 30 82 23 80 19 C78 15 72 15 70 20 Z" fill="#EF4444" />
      <!-- Wings wrapped around (hugging itself / comforting) -->
      <path d="M40 76 C32 82 32 98 48 95 C54 94 54 82 45 78 Z" fill="#1E293B" />
      <path d="M100 76 C108 82 108 98 92 95 C86 94 86 82 95 78 Z" fill="#1E293B" />
      <!-- Body -->
      <ellipse cx="70" cy="85" rx="38" ry="44" fill="#1E293B" />
      <ellipse cx="70" cy="90" rx="28" ry="34" fill="#FFFFFF" />
      <!-- Feet -->
      <ellipse cx="56" cy="126" rx="12" ry="6" fill="#F59E0B" />
      <ellipse cx="84" cy="126" rx="12" ry="6" fill="#F59E0B" />
      <!-- Scarf -->
      <path d="M46 56 C54 48 86 48 94 56 C98 62 90 67 70 67 C50 67 42 62 46 56 Z" fill="#0284C7" />
      <!-- Head slightly tilted -->
      <ellipse cx="70" cy="46" rx="30" ry="26" fill="#1E293B" />
      <path d="M48 48 C48 36 58 30 65 36 C68 38 72 38 75 36 C82 30 92 36 92 48 C92 58 84 62 70 62 C56 62 48 58 48 48 Z" fill="#FFFFFF" />
      <!-- Cheeks -->
      <ellipse cx="52" cy="54" rx="4" ry="3" fill="#FDA4AF" opacity="0.7" />
      <ellipse cx="88" cy="54" rx="4" ry="3" fill="#FDA4AF" opacity="0.7" />
      <!-- Concerned, gentle eyes -->
      <circle cx="60" cy="46" r="4" fill="#0F172A" />
      <circle cx="59" cy="44" r="1.5" fill="#FFFFFF" />
      <!-- Tear drop (tiny cute) -->
      <path d="M54 50 C54 48 56 46 56 50 C56 52 54 52 54 50 Z" fill="#38BDF8" />
      <circle cx="80" cy="46" r="4" fill="#0F172A" />
      <circle cx="79" cy="44" r="1.5" fill="#FFFFFF" />
      <!-- Little concerned beak -->
      <path d="M66 52 Q70 49 74 52 Q70 57 66 52 Z" fill="#F59E0B" />
    </svg>
  `,

  /**
   * 6. โลโก้เพนกวินขนาดเล็กสำหรับ Navbar / Favicon
   */
  logo: (size = 36) => `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="pengu-mascot-logo" role="img" aria-label="โลโก้ PenguTools">
      <circle cx="24" cy="24" r="22" fill="#E0F2FE" />
      <ellipse cx="24" cy="28" rx="15" ry="14" fill="#1E293B" />
      <ellipse cx="24" cy="30" rx="10" ry="10" fill="#FFFFFF" />
      <!-- Scarf -->
      <path d="M15 22 Q24 19 33 22 Q24 25 15 22 Z" fill="#0284C7" />
      <!-- Head -->
      <circle cx="24" cy="16" r="11" fill="#1E293B" />
      <path d="M16 16 C16 12 19 10 22 12 C23 13 25 13 26 12 C29 10 32 12 32 16 C32 20 29 21 24 21 C19 21 16 20 16 16 Z" fill="#FFFFFF" />
      <circle cx="20" cy="15" r="1.6" fill="#0F172A" />
      <circle cx="28" cy="15" r="1.6" fill="#0F172A" />
      <path d="M22 17 Q24 16 26 17 Q24 20 22 17 Z" fill="#F59E0B" />
    </svg>
  `,

  /**
   * 7. เพนกวินพร้อมกล่องคำแนะนำน่ารัก (Mascot with Tip Speech Bubble)
   */
  withTip: (tipText, type = 'waving', size = 90) => {
    const mascotFn = PenguMascot[type] || PenguMascot.waving;
    return `
      <div class="pengu-tip-container">
        <div class="pengu-tip-mascot">
          ${mascotFn(size)}
        </div>
        <div class="pengu-speech-bubble">
          <span class="pengu-speech-badge">🐧 น้องเพนกวินแนะนำ</span>
          <p class="pengu-speech-text">${tipText}</p>
        </div>
      </div>
    `;
  }
};

window.PenguMascot = PenguMascot;
