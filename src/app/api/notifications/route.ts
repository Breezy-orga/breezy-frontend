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
      logError('Missing authorization header', {});
      return NextResponse.json(
        { 
          error: 'Authentication required',
          details: 'No authorization header provided'
        },
        { status: 401 }
      );
    }
    
    console.log('Fetching notifications from backend:', {
      backend: `${BACKEND_URL}/notifications`,
      hasAuthHeader: !!authHeader
    });
    
    const startTime = Date.now();
    let response;
    
    try {
      response = await fetch(`${BACKEND_URL}/notifications`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        next: { revalidate: 0 } // Ensure fresh data
      });
    } catch (fetchError) {
      logError('Failed to connect to notifications service', fetchError, {
        backendUrl: `${BACKEND_URL}/notifications`,
        duration: Date.now() - startTime
      });
      
      return NextResponse.json(
        { 
          error: 'Cannot connect to notifications service',
          details: (fetchError as Error).message
        },
        { status: 503 }
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(`Notifications response (${responseTime}ms):`, {
      status: response.status,
      statusText: response.statusText
    });

    try {
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        logError('Failed to fetch notifications', new Error('Failed to fetch notifications'), {
          status: response.status,
          response: data,
          responseTime
        });
        
        return NextResponse.json(
          { 
            error: data.message || 'Failed to fetch notifications',
            details: data.details,
            status: response.status
          },
          { status: response.status }
        );
      }

      console.log('Successfully fetched notifications');
      return NextResponse.json(data);
      
    } catch (parseError) {
      logError('Failed to parse notifications response', parseError, {
        status: response.status,
        statusText: response.statusText,
        responseTime
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid response from notifications service',
          details: (parseError as Error).message
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    logError('Unexpected error in notifications route', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while fetching notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; // Ensure dynamic evaluation
