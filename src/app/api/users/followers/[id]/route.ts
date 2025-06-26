import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

function logError(context: string, error: any, extra: Record<string, any> = {}) {
  console.error(`[${new Date().toISOString()}] ${context}`, {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    ...extra
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const authHeader = request.headers.get('authorization');
    
    console.log(`Fetching followers for user ${userId}`);
    
    const startTime = Date.now();
    let response;
    
    try {
      response = await fetch(`${BACKEND_URL}/users/${userId}/followers`, {
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      logError('Failed to connect to backend for followers', fetchError, {
        userId,
        backendUrl: `${BACKEND_URL}/users/followers/${userId}`,
        duration: Date.now() - startTime
      });
      
      return NextResponse.json(
        { 
          error: 'Cannot connect to the followers service',
          details: (fetchError as Error).message
        },
        { status: 503 }
      );
    }

    const responseTime = Date.now() - startTime;
    
    try {
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        logError('Failed to fetch followers', new Error('Failed to fetch followers'), {
          userId,
          status: response.status,
          response: data,
          responseTime
        });
        
        return NextResponse.json(
          { 
            error: data.message || 'Failed to fetch followers',
            details: data.details,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log(`Successfully fetched followers for user ${userId}`);
      return NextResponse.json(data);
      
    } catch (parseError) {
      logError('Failed to parse followers response', parseError, {
        userId,
        status: response.status,
        statusText: response.statusText,
        responseTime
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid response from followers service',
          details: (parseError as Error).message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logError('Unexpected error in followers route', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while fetching followers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
