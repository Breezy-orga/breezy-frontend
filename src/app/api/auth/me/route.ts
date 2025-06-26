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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      logError('Missing authorization header in /api/auth/me', {});
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    console.log('Fetching current user from backend');
    const startTime = Date.now();
    let response;

    try {
      response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      logError('Failed to connect to backend for /auth/me', fetchError, {
        backendUrl: `${BACKEND_URL}/auth/me`,
        duration: Date.now() - startTime
      });
      
      return NextResponse.json(
        { 
          error: 'Cannot connect to the authentication service',
          details: (fetchError as Error).message
        },
        { status: 503 }
      );
    }

    const responseTime = Date.now() - startTime;
    
    try {
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        logError('Failed to fetch current user', new Error('Failed to fetch current user'), {
          status: response.status,
          response: data,
          responseTime
        });
        
        return NextResponse.json(
          { 
            error: data.message || 'Failed to fetch current user',
            details: data.details,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Successfully fetched current user');
      return NextResponse.json(data);
      
    } catch (parseError) {
      logError('Failed to parse current user response', parseError, {
        status: response.status,
        statusText: response.statusText,
        responseTime
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid response from authentication service',
          details: (parseError as Error).message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logError('Unexpected error in /api/auth/me route', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while fetching current user',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
