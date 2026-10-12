import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
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
          backgroundColor: '#FFFFFF',
          borderRadius: '40px',
        }}
      >
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex' }}>
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '64px',
              height: '84px',
              backgroundColor: '#FB923C',
              borderRadius: '24px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '74px',
              height: '74px',
              backgroundColor: '#4F46E5',
              borderRadius: '24px',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
