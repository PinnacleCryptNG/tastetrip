import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#12141f" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <rect x="3" y="3" width="26" height="12.6" rx="4" fill="#1f2335" />
          <rect x="3" y="16.4" width="26" height="12.6" rx="4" fill="#191c2b" />
          <path d="M3 16h26" stroke="#000" strokeOpacity=".7" />
          <path d="M21.1 21.4 19.75 15.25l2.63-2.63C23.5 11.5 23.88 10 23.5 9.25c-.75-.38-2.25 0-3.38 1.13L17.5 13l-6.15-1.35c-.38-.08-.68.08-.83.38l-.22.38c-.15.37-.08.75.22.97L14.5 16.75 13 19h-2.25l-.75.75 2.25 1.5 1.5 2.25.75-.75V20.5l2.25-1.5 2.63 3.98c.22.3.6.37.97.22l.38-.15c.3-.23.45-.53.37-.9Z" fill="#ffd23f" />
        </svg>
      </div>
    ),
    size,
  );
}
