import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSiteConfig } from '../../lib/config';

export async function GET() {
  try {
    const config = getSiteConfig();
    const faviconPath = config.assets?.faviconPath || '/favicons/cuckoldchat';
    const cleanPath = faviconPath.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', cleanPath, 'favicon.ico');
    
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error('Favicon route error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

