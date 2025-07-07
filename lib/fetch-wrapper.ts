const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https://' : 'http://';
const host = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN;
const port = !isProduction ? ':' + (process.env.NEXT_PUBLIC_API_PORT || '8005') : '';


export const apiUrl = `${protocol}${host}${port}`;
//
// Check if we're on the client side
const isClient = typeof window !== 'undefined';

export class FetchError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'FetchError';
  }
}

interface FetchErrorDetails {
  input: string;
  isProduction: boolean;
  isClient: boolean;
  apiUrl: string;
  error: string;
  status?: number;
}

export async function myFetch(input: string, options?: RequestInit): Promise<Response> {
  try {
    // For API routes
    if (input.startsWith('/api/')) {
      // In development & client-side, use relative URL
      // In production or server-side, use full URL
      input = (!isProduction && isClient) ? input : `${apiUrl}${input}`;
    }

/*     console.debug('Fetching URL:', {
      originalInput: input,
      isProduction,
      isClient,
      finalUrl: input,
      apiUrl: apiUrl
    }); */

    const response = await fetch(input, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: isProduction ? 'same-origin' : 'include'
    });

    if (!response.ok) {
      const errorDetails: FetchErrorDetails = {
        input,
        isProduction,
        isClient,
        apiUrl,
        error: `HTTP error! status: ${response.status}`,
        status: response.status
      };

      if (process.env.NODE_ENV !== 'production') {
        console.warn('Fetch error:', errorDetails);
      }

      throw new FetchError(errorDetails.error, response.status);
    }

    return response;
  } catch (error) {
    const errorDetails: FetchErrorDetails = {
      input,
      isProduction,
      isClient,
      apiUrl,
      error: error instanceof Error ? error.message : String(error),
      status: error instanceof FetchError ? error.status : undefined
    };

    if (process.env.NODE_ENV !== 'production') {
      console.warn('Fetch error:', errorDetails);
    }
    
    throw error;
  }
}