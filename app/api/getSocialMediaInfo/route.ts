import { parseSocialMediaData } from '@/lib/utils/data-parser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const socialMedia = await parseSocialMediaData();
    return NextResponse.json(socialMedia);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch social media data' },
      { status: 500 }
    );
  }
}

import { updateSocialMediaData } from '@/lib/utils/data-parser';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await updateSocialMediaData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update social media data' },
      { status: 500 }
    );
  }
}