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
    
    console.log(`Fetching following users for user ${userId}`);
    
    const startTime = Date.now();
    let response;
    
    try {
      response = await fetch(`${BACKEND_URL}/users/${userId}/following`, {
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      logError('Failed to connect to backend for following users', fetchError, {
        userId,
        backendUrl: `${BACKEND_URL}/users/following/${userId}`,
        duration: Date.now() - startTime
      });
      
      return NextResponse.json(
        { 
          error: 'Cannot connect to the following users service',
          details: (fetchError as Error).message
        },
        { status: 503 }
      );
    }

    const responseTime = Date.now() - startTime;
    
    try {
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        logError('Failed to fetch following users', new Error('Failed to fetch following users'), {
          userId,
          status: response.status,
          response: data,
          responseTime
        });
        
        return NextResponse.json(
          { 
            error: data.message || 'Failed to fetch following users',
            details: data.details,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log(`Successfully fetched following users for user ${userId}`);
      return NextResponse.json(data);
      
    } catch (parseError) {
      logError('Failed to parse following users response', parseError, {
        userId,
        status: response.status,
        statusText: response.statusText,
        responseTime
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid response from following users service',
          details: (parseError as Error).message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logError('Unexpected error in following users route', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while fetching following users',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
