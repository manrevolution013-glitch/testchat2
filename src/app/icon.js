import fs from 'fs';
import path from 'path';
import { getSiteConfig } from '../lib/config';

export const contentType = 'image/x-icon';
export const size = { width: 32, height: 32 };

export default async function Icon() {
  const config = getSiteConfig();
  const faviconPath = config.assets?.faviconPath || '/favicons/cuckoldchat';
  const cleanPath = faviconPath.replace(/^\//, '');
  const filePath = path.join(process.cwd(), 'public', cleanPath, 'favicon.ico');
  
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/x-icon',
      },
    });
  }
  
  return new Response(null, { status: 404 });
}

