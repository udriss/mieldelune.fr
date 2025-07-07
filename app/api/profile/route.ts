import { NextResponse } from 'next/server';
import { parseProfileData, updateProfileData } from '@/lib/utils/data-parser';
import { Profile } from '@/lib/dataProfil';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await parseProfileData();
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error loading profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();
    
    // First get current profile data
    const currentProfile = await parseProfileData();

    // Update profile with new field values
    const updatedProfile: Profile = {
      ...currentProfile,
      ...updates
    };

    // Use utility function to update profile data
    await updateProfileData(updatedProfile);

    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

