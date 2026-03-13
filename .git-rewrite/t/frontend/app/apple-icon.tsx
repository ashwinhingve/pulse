import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
                    borderRadius: '36px',
                }}
            >
                <svg
                    viewBox="0 0 24 24"
                    width="110"
                    height="110"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 2 L20 5 L20 12 C20 17 16 20.5 12 22 C8 20.5 4 17 4 12 L4 5 Z"
                        fill="rgba(255,255,255,0.15)"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.3"
                    />
                    <polyline
                        points="5,13 8,13 10,9 12,17 14,8 16,13 19,13"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        ),
        { ...size }
    );
}
