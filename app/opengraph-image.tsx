import { ImageResponse } from 'next/og';

export const alt = 'TheCore - Track your projects, hosting platforms and .env files';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: '800', color: '#101828', letterSpacing: '-0.03em' }}>
            TheCore
          </span>
        </div>
        <div
          style={{
            fontSize: '44px',
            fontWeight: '700',
            color: '#101828',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            marginBottom: '24px',
          }}
        >
          Track your projects, hosting platforms and .env files
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#667085',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          Your personal encrypted vault for side projects, credentials, and deployment stacks.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
