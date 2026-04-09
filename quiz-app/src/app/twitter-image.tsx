import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Geek Arena - Quiz Definitivo de Rap Geek';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d0d1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <span style={{ fontSize: 80 }}>🎮</span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: 80,
                fontWeight: 'bold',
                color: '#b829ff',
                textShadow: '0 0 30px #b829ff',
                fontFamily: 'system-ui',
              }}
            >
              GEEK
            </span>
            <span
              style={{
                fontSize: 80,
                fontWeight: 'bold',
                color: '#00d2ff',
                textShadow: '0 0 30px #00d2ff',
                fontFamily: 'system-ui',
              }}
            >
              ARENA
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: 30,
            color: '#fff',
            marginTop: 30,
            fontFamily: 'system-ui',
          }}
        >
          O Quiz Definitivo de Rap Geek
        </span>
        <span
          style={{
            fontSize: 24,
            color: '#888',
            marginTop: 10,
            fontFamily: 'system-ui',
          }}
        >
          7 Minutoz • Enygma • M4rkim • Anirap • Daikinez
        </span>
      </div>
    ),
    { ...size }
  );
}