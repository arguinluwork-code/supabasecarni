/**
 * Utilidades comunes para Supabase Edge Functions
 */

import { ApiResponse } from './types.ts';

// ============================================================================
// HTTP RESPONSE HELPERS
// ============================================================================

/**
 * Crea una respuesta JSON exitosa
 */
export function successResponse<T>(data: T, message?: string): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Crea una respuesta JSON de error
 */
export function errorResponse(error: string, status = 500): Response {
  const body: ApiResponse = {
    success: false,
    error,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Maneja errores de manera uniforme
 */
export function handleError(e: unknown): Response {
  console.error('Error:', e);

  const message = e instanceof Error ? e.message : String(e);
  return errorResponse(message, 500);
}

// ============================================================================
// CORS HELPERS
// ============================================================================

/**
 * Headers de CORS para permitir requests desde el frontend
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Maneja preflight requests (OPTIONS)
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida que el request tenga Authorization header
 */
export function validateAuth(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }
  return authHeader;
}

/**
 * Parsea y valida el body JSON de un request
 */
export async function parseRequestBody<T>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return body as T;
  } catch (e) {
    throw new Error('Invalid JSON body');
  }
}

// ============================================================================
// ARRAY HELPERS
// ============================================================================

/**
 * Divide un array en chunks de tamaño específico
 * @param array - Array a dividir
 * @param size - Tamaño de cada chunk
 * @returns Array de chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Elimina duplicados de un array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// ============================================================================
// STRING HELPERS
// ============================================================================

/**
 * Parsea un string de tags comma-separated y retorna array de tags limpios
 * @param tagsString - String tipo "Materia Prima, Congelado, Mostrador carnicería"
 * @returns Array de tags limpios
 */
export function parseTags(tagsString: string | null | undefined): string[] {
  if (!tagsString) return [];

  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Une tags en un string comma-separated
 * @param tags - Array de tags
 * @returns String comma-separated
 */
export function joinTags(tags: string[]): string {
  return tags.join(', ');
}

/**
 * Trunca un string a un largo máximo
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// NUMBER HELPERS
// ============================================================================

/**
 * Redondea un número a N decimales
 */
export function round(num: number, decimals = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calcula el margen porcentual
 * @param listPrice - Precio de venta
 * @param standardPrice - Costo
 * @returns Margen porcentual
 */
export function calculateMarginPercent(listPrice: number, standardPrice: number): number {
  if (standardPrice === 0) return 0;
  return round(((listPrice - standardPrice) / standardPrice) * 100, 2);
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Formatea una fecha a ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Obtiene timestamp actual
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Calcula tiempo transcurrido en segundos
 */
export function elapsedSeconds(start: number): number {
  return (Date.now() - start) / 1000;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log con timestamp
 */
export function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Log de error con timestamp
 */
export function logError(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] ERROR: ${message}`, error);
  } else {
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
}

// ============================================================================
// ASYNC HELPERS
// ============================================================================

/**
 * Sleep/delay asíncrono
 * @param ms - Milisegundos a esperar
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry con exponential backoff
 * @param fn - Función a ejecutar
 * @param maxRetries - Máximo de reintentos
 * @param initialDelay - Delay inicial en ms
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
