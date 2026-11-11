import { SUP_COLOR, DLR_COLOR } from "../_lib/constants";

// 서포터 = 초록 십자가, 딜러 = 칼
export default function RoleIcon({ sup, size = 11 }) {
  if (sup) {
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" aria-label="서포터" style={{ flex: "none" }}>
        <path d="M4.4 .8h3.2v3.6h3.6v3.2H7.6v3.6H4.4V7.6H.8V4.4h3.6z" fill={SUP_COLOR} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-label="딜러" fill="none" stroke={DLR_COLOR} strokeWidth="1.9" strokeLinecap="round" style={{ flex: "none" }}>
      <path d="M14.5 1.5 L6.8 9.2" />
      <path d="M14.5 1.5 L12.2 2.1 M14.5 1.5 L13.9 3.8" />
      <path d="M4.6 7.4 L8.6 11.4" />
      <path d="M5.6 10.4 L2.2 13.8" />
    </svg>
  );
}
