import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f3ec" }}>
        <svg width="132" height="132" viewBox="0 0 32 32">
          <path d="M16 1.5C8.8 1.5 3 7.1 3 14.1c0 9 11.3 16.6 12.1 17.1a1.6 1.6 0 0 0 1.8 0C17.7 30.7 29 23.1 29 14.1 29 7.1 23.2 1.5 16 1.5Z" fill="#e4572e" />
          <circle cx="16" cy="14" r="8.4" fill="#1d1a16" />
          <circle cx="16" cy="14" r="5.6" fill="none" stroke="#f7f3ec" strokeOpacity=".25" strokeWidth=".9" />
          <path d="M10.3 10.6a6.8 6.8 0 0 1 4.3-3" fill="none" stroke="#f7f3ec" strokeOpacity=".75" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="16" cy="14" r="2.6" fill="#f2a541" />
          <circle cx="16" cy="14" r=".9" fill="#1d1a16" />
        </svg>
      </div>
    ),
    size,
  );
}
