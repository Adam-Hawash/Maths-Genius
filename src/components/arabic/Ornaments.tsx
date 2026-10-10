/**
 * زخارف SVG عربية — قلادة، فواصل مزخرفة، زوايا إطار
 * كلها مرسومة يدويًا بأسلوب التذهيب في المخطوطات العربية
 */

export function Emblem({
  size = 96,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label="شعار منصة مستر محمد صبري"
    >
      {/* الدائرة الخارجية */}
      <circle cx="60" cy="60" r="57" stroke="#D4A843" strokeWidth="2" />
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#D4A843"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.65"
      />
      {/* نجمة ثمانية — مربعان متقاطعان */}
      <rect
        x="30"
        y="30"
        width="60"
        height="60"
        stroke="#D4A843"
        strokeWidth="1.2"
        opacity="0.8"
      />
      <rect
        x="30"
        y="30"
        width="60"
        height="60"
        stroke="#E9C767"
        strokeWidth="1.2"
        opacity="0.8"
        transform="rotate(45 60 60)"
      />
      {/* قرص مركزي */}
      <circle cx="60" cy="60" r="31" fill="#0B241C" stroke="#D4A843" strokeWidth="1.5" />
      <text
        x="60"
        y="64"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Aref Ruqaa', 'Amiri', serif"
        fontWeight="700"
        fontSize="42"
        fill="#E9C767"
      >
        م
      </text>
      {/* كراسات صغيرة على المحيط */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle
          key={a}
          cx={60 + 57 * Math.cos((a * Math.PI) / 180)}
          cy={60 + 57 * Math.sin((a * Math.PI) / 180)}
          r="2.2"
          fill="#D4A843"
          opacity="0.9"
        />
      ))}
    </svg>
  );
}

/** فاصل مزخرف: خط — معيّن — زهرة — معيّن — خط */
export function OrnamentDivider({
  className = "",
  width = 320,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      width={width}
      height="26"
      viewBox="0 0 320 26"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* الخطوط الجانبية المتدرجة */}
      <line x1="0" y1="13" x2="104" y2="13" stroke="url(#goldLineL)" strokeWidth="1.5" />
      <line x1="216" y1="13" x2="320" y2="13" stroke="url(#goldLineR)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="goldLineL" x1="0" y1="0" x2="104" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A843" stopOpacity="0" />
          <stop offset="1" stopColor="#D4A843" />
        </linearGradient>
        <linearGradient id="goldLineR" x1="216" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A843" />
          <stop offset="1" stopColor="#D4A843" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* معيّنان جانبيان */}
      <rect x="108" y="9" width="8" height="8" transform="rotate(45 112 13)" fill="#D4A843" opacity="0.85" />
      <rect x="204" y="9" width="8" height="8" transform="rotate(45 208 13)" fill="#D4A843" opacity="0.85" />
      {/* الزهرة المركزية */}
      <circle cx="160" cy="13" r="9.5" stroke="#D4A843" strokeWidth="1.3" />
      <circle cx="160" cy="13" r="3.4" fill="#E9C767" />
      <circle cx="160" cy="1.5" r="2" fill="#D4A843" opacity="0.9" />
      <circle cx="160" cy="24.5" r="2" fill="#D4A843" opacity="0.9" />
      <circle cx="148.5" cy="13" r="2" fill="#D4A843" opacity="0.9" />
      <circle cx="171.5" cy="13" r="2" fill="#D4A843" opacity="0.9" />
    </svg>
  );
}

/** زاوية إطار مزخرفة — تُدار بحسب الركن */
export function CornerOrnament({
  className = "",
  flipX = false,
  flipY = false,
}: {
  className?: string;
  flipX?: boolean;
  flipY?: boolean;
}) {
  const transform = `${flipX ? "scale(-1,1) translate(-100,0)" : ""} ${flipY ? "scale(1,-1) translate(0,-100)" : ""}`.trim();
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g transform={transform || undefined}>
        <path
          d="M4 96 V34 Q4 4 34 4 H96"
          stroke="#D4A843"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 96 V40 Q14 14 40 14 H96"
          stroke="#D4A843"
          strokeWidth="1"
          opacity="0.55"
          strokeLinecap="round"
        />
        {/* معيّن الزاوية */}
        <rect x="26" y="26" width="10" height="10" transform="rotate(45 31 31)" fill="#D4A843" opacity="0.9" />
        <rect x="40" y="40" width="6" height="6" transform="rotate(45 43 43)" stroke="#E9C767" strokeWidth="1" opacity="0.7" />
        {/* كراسات زخرفية على الخط */}
        <circle cx="60" cy="4" r="2.5" fill="#E9C767" opacity="0.9" />
        <circle cx="4" cy="60" r="2.5" fill="#E9C767" opacity="0.9" />
      </g>
    </svg>
  );
}

/** زخرفة صغيرة ۞ — تُستخدم بين العناصر النصية */
export function SmallRosette({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
      <rect x="4.2" y="4.2" width="9.6" height="9.6" stroke="currentColor" strokeWidth="1.1" />
      <rect x="4.2" y="4.2" width="9.6" height="9.6" stroke="currentColor" strokeWidth="1.1" transform="rotate(45 9 9)" />
      <circle cx="9" cy="9" r="1.8" fill="currentColor" />
    </svg>
  );
}
