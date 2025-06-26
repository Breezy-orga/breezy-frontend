import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const authHeader = request.headers.get('authorization');
    
    console.log(`Fetching posts for user ${userId} from backend`);
    
    const response = await fetch(`${BACKEND_URL}/posts/user/${userId}`, {
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error fetching user posts:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch user posts' },
        { status: response.status }
      );
    }

    const posts = await response.json();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error in user posts API route:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while fetching user posts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
