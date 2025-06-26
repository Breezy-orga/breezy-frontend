import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  try {
    const requestData = await request.json().catch(() => ({}));
    console.log('Login request received:', { hasBody: !!requestData });
    
    const { email, identifier, password } = requestData;
    
    if (!password) {
      logError('Missing password', {});
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    if (!email && !identifier) {
      logError('Missing email/identifier', {});
      return NextResponse.json(
        { error: 'Email or identifier is required' },
        { status: 400 }
      );
    }
    
    const loginData = email 
      ? { email, password }
      : { email: identifier, password };
    
    console.log('Forwarding login request to backend:', { 
      backend: `${BACKEND_URL}/auth/login`,
      hasPassword: !!password,
      usingEmail: !!email 
    });
    
    const startTime = Date.now();
    let backendResponse;
    
    try {
      backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
    } catch (fetchError) {
      logError('Failed to connect to backend', fetchError, {
        backendUrl: BACKEND_URL,
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
    console.log(`Backend response (${responseTime}ms):`, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: Object.fromEntries(backendResponse.headers.entries())
    });

    try {
      const responseData = await backendResponse.json().catch(() => ({}));
      
      if (!backendResponse.ok) {
        logError('Login failed', new Error('Authentication failed'), {
          status: backendResponse.status,
          response: responseData,
          responseTime
        });
        
        return NextResponse.json(
          { 
            error: responseData.message || 'Authentication failed',
            details: responseData.details
          },
          { status: backendResponse.status }
        );
      }

      console.log('Login successful');
      return NextResponse.json(responseData);
      
    } catch (parseError) {
      logError('Failed to parse backend response', parseError, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
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
    logError('Unexpected error in login route', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
