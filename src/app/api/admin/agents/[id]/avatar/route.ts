import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
import { uploadAgentAvatarToR2 } from '@/lib/r2-upload';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 SuperAdmin updating agent avatar for:', params.id);
    console.log('🕐 Timestamp:', new Date().toISOString());
    await connectDB();

    // Check if user is SuperAdmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    console.log('👤 Avatar API auth check:', authResult);
    
    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get the agent to update
    const agent = await User.findById(params.id);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    console.log('👤 Agent found:', {
      id: agent._id,
      name: agent.fullName,
      role: agent.role,
      currentAvatar: agent.profile?.avatar,
      currentAvatarType: agent.profile?.avatar ? (agent.profile.avatar.includes('r2.dev') ? 'R2' : 'Local') : 'None'
    });

    // Check if agent role is valid
    if (!['agent', 'agency'].includes(agent.role)) {
      return NextResponse.json(
        { success: false, error: 'User is not an agent' },
        { status: 400 }
      );
    }

    // Check content type to determine if it's a file upload or JSON update
    const contentType = request.headers.get('content-type') || '';
    console.log('📋 Content type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('avatar') as File;

      if (!file) {
        console.error('❌ No file provided in form data');
        return NextResponse.json(
          { success: false, error: 'No image file provided' },
          { status: 400 }
        );
      }

      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        return NextResponse.json(
          { success: false, error: 'File must be an image' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('❌ File too large:', file.size);
        return NextResponse.json(
          { success: false, error: 'Image size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Upload image to R2 in agents folder
      let avatarUrl: string;
      let uploadMethod: 'R2' | 'Local' | 'Fallback' = 'R2';
      
      try {
        console.log('📤 Uploading agent avatar to R2 agents folder...');
        console.log('🔧 Using uploadAgentAvatarToR2 function with agentId:', params.id);
        
        const uploadResult = await uploadAgentAvatarToR2(file, params.id);
        avatarUrl = uploadResult.url;
        uploadMethod = 'R2';
        
        console.log('✅ Agent avatar uploaded to R2 agents folder successfully!');
        console.log('🔗 Upload result:', uploadResult);
        console.log('📸 Final avatar URL:', avatarUrl);
        console.log('☁️ Upload method: R2 (Cloudflare)');
        
      } catch (error) {
        console.error('❌ Failed to upload agent avatar to R2:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace available'
        });
        
        // Use fallback image if upload fails
        avatarUrl = DEFAULT_AVATAR_URL;
        uploadMethod = 'Fallback';
        console.log('🔄 Using fallback avatar due to upload failure:', avatarUrl);
        console.log('⚠️ Upload method: Fallback (Unsplash)');
      }

      console.log('💾 Updating agent profile with avatar URL:', avatarUrl);
      console.log('📊 Upload summary:', {
        agentId: params.id,
        agentName: agent.fullName,
        uploadMethod: uploadMethod,
        avatarUrl: avatarUrl,
        isR2: avatarUrl.includes('r2.dev'),
        isLocal: avatarUrl.startsWith('/uploads'),
        isFallback: avatarUrl.includes('unsplash')
      });

      // Update agent's profile with new avatar
      const updatedAgent = await User.findByIdAndUpdate(
        params.id,
        {
          'profile.avatar': avatarUrl,
        },
        { new: true, select: '-password' }
      );

      console.log('✅ Agent avatar updated successfully in database');
      console.log('👤 Updated agent profile:', {
        id: updatedAgent._id,
        avatar: updatedAgent.profile?.avatar,
        avatarType: updatedAgent.profile?.avatar ? (updatedAgent.profile.avatar.includes('r2.dev') ? 'R2' : updatedAgent.profile.avatar.includes('unsplash') ? 'Fallback' : 'Local') : 'None'
      });

      return NextResponse.json({
        success: true,
        message: 'Agent avatar updated successfully',
        data: {
          id: updatedAgent._id,
          fullName: updatedAgent.fullName,
          role: updatedAgent.role,
          profile: updatedAgent.profile,
        },
        uploadInfo: {
          method: uploadMethod,
          isR2: avatarUrl.includes('r2.dev'),
          url: avatarUrl
        }
      });

    } else {
      // Handle JSON update (for profile updates)
      const body = await request.json();
      const { avatar } = body;

      if (!avatar) {
        return NextResponse.json(
          { success: false, error: 'No avatar URL provided' },
          { status: 400 }
        );
      }

      // Update agent's profile with provided avatar URL
      const updatedAgent = await User.findByIdAndUpdate(
        params.id,
        {
          'profile.avatar': avatar,
        },
        { new: true, select: '-password' }
      );

      console.log('✅ Agent avatar URL updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Agent avatar URL updated successfully',
        data: {
          id: updatedAgent._id,
          fullName: updatedAgent.fullName,
          role: updatedAgent.role,
          profile: updatedAgent.profile,
        },
      });
    }

  } catch (error) {
    console.error('❌ Error updating agent avatar:', error);
    console.error('❌ Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available'
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update agent avatar' },
      { status: 500 }
    );
  }
}
