/**
 * Carnicería Control - Cliente Odoo (JSON-RPC para Odoo 19)
 * Port de OdooClient.gs a TypeScript para Supabase Edge Functions
 */

// ============================================================================
// TYPES
// ============================================================================

export interface OdooConfig {
  odoo_url: string;
  odoo_db: string;
  odoo_username: string;
  odoo_api_key: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: 'call';
  params: {
    service: string;
    method: string;
    args: any[];
  };
  id: number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// ============================================================================
// ODOO CLIENT CLASS
// ============================================================================

/**
 * Cliente para comunicación con Odoo 19 Enterprise usando JSON-RPC
 *
 * Equivalente a OdooClient.gs del proyecto Apps Script
 */
export class OdooClient {
  private url: string;
  private db: string;
  private username: string;
  private apiKey: string;
  private uid: number | null = null;

  constructor(config: OdooConfig) {
    this.url = config.odoo_url;
    this.db = config.odoo_db;
    this.username = config.odoo_username;
    this.apiKey = config.odoo_api_key;
  }

  /**
   * Autentica con Odoo y obtiene el UID
   * @returns UID del usuario autenticado
   */
  async authenticate(): Promise<number> {
    try {
      const payload: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [this.db, this.username, this.apiKey, {}]
        },
        id: Math.floor(Math.random() * 1000000)
      };

      const response = await this.makeRequest(payload);

      if (response.result) {
        this.uid = response.result;
        return this.uid;
      } else {
        throw new Error('Autenticación fallida: ' + JSON.stringify(response.error));
      }
    } catch (e) {
      throw new Error(`Error de autenticación: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /**
   * Ejecuta una llamada a método de Odoo
   * @param model - Modelo de Odoo (ej: 'product.template', 'product.category')
   * @param method - Método a ejecutar (ej: 'search_read', 'write', 'create')
   * @param args - Argumentos posicionales para el método
   * @param kwargs - Argumentos nombrados (keyword arguments)
   * @returns Resultado del método ejecutado
   */
  async execute(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    if (!this.uid) {
      await this.authenticate();
    }

    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          this.db,
          this.uid,
          this.apiKey,
          model,
          method,
          args,
          kwargs
        ]
      },
      id: Math.floor(Math.random() * 1000000)
    };

    const response = await this.makeRequest(payload);

    if (response.error) {
      throw new Error(`Odoo Error: ${JSON.stringify(response.error)}`);
    }

    return response.result;
  }

  /**
   * Realiza request HTTP a Odoo
   * @param payload - Payload JSON-RPC
   * @returns Response parseado
   */
  private async makeRequest(payload: JsonRpcRequest): Promise<JsonRpcResponse> {
    const endpoint = `${this.url}/jsonrpc`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data: JsonRpcResponse = await response.json();
    return data;
  }

  /**
   * Busca y lee registros (search_read)
   * @param model - Modelo de Odoo
   * @param domain - Dominio de búsqueda (filtros)
   * @param fields - Campos a retornar
   * @param limit - Límite de registros
   * @param offset - Offset para paginación
   * @param order - Ordenamiento
   * @returns Array de registros
   */
  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    limit: number | null = null,
    offset = 0,
    order = ''
  ): Promise<any[]> {
    const kwargs: Record<string, any> = { fields, offset };
    if (limit) kwargs.limit = limit;
    if (order) kwargs.order = order;

    return this.execute(model, 'search_read', [domain], kwargs);
  }

  /**
   * Actualiza registros
   * @param model - Modelo de Odoo
   * @param ids - IDs de registros a actualizar
   * @param values - Valores a actualizar
   * @returns true si la actualización fue exitosa
   */
  async write(model: string, ids: number[], values: Record<string, any>): Promise<boolean> {
    return this.execute(model, 'write', [ids, values]);
  }

  /**
   * Crea un registro
   * @param model - Modelo de Odoo
   * @param values - Valores del nuevo registro
   * @returns ID del registro creado
   */
  async create(model: string, values: Record<string, any>): Promise<number> {
    return this.execute(model, 'create', [values]);
  }

  /**
   * Busca IDs de registros (search)
   * @param model - Modelo de Odoo
   * @param domain - Dominio de búsqueda
   * @param limit - Límite de registros
   * @param offset - Offset para paginación
   * @returns Array de IDs
   */
  async search(
    model: string,
    domain: any[] = [],
    limit: number | null = null,
    offset = 0
  ): Promise<number[]> {
    const kwargs: Record<string, any> = { offset };
    if (limit) kwargs.limit = limit;

    return this.execute(model, 'search', [domain], kwargs);
  }

  /**
   * Cuenta registros
   * @param model - Modelo de Odoo
   * @param domain - Dominio de búsqueda
   * @returns Número de registros que coinciden
   */
  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return this.execute(model, 'search_count', [domain]);
  }

  /**
   * Lee registros por IDs
   * @param model - Modelo de Odoo
   * @param ids - IDs de registros a leer
   * @param fields - Campos a retornar
   * @returns Array de registros
   */
  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    return this.execute(model, 'read', [ids], { fields });
  }

  /**
   * Elimina registros
   * @param model - Modelo de Odoo
   * @param ids - IDs de registros a eliminar
   * @returns true si la eliminación fue exitosa
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.execute(model, 'unlink', [ids]);
  }

  /**
   * Test de conexión a Odoo
   * @returns Resultado del test de conexión
   */
  async testConnection(): Promise<{ success: boolean; uid?: number; message: string; count?: number }> {
    try {
      await this.authenticate();

      // Test simple: contar productos
      const count = await this.execute('product.template', 'search_count', [[]]);

      return {
        success: true,
        uid: this.uid!,
        count,
        message: `✓ Conexión exitosa. UID: ${this.uid}. Productos encontrados: ${count}`
      };
    } catch (e) {
      return {
        success: false,
        message: `✗ Error de conexión: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formatea valores para campos many2many de Odoo
 * Odoo espera formato: [[6, 0, [ids]]] para reemplazar todos los registros relacionados
 *
 * @param ids - Array de IDs para el campo many2many
 * @returns Formato de Odoo para many2many
 */
export function formatMany2Many(ids: number[]): [number, number, number[]][] {
  return [[6, 0, ids]];
}

/**
 * Formatea valores para campos many2one de Odoo
 * Odoo espera solo el ID (número) o false para limpiar
 *
 * @param id - ID del registro relacionado, o null para limpiar
 * @returns ID o false
 */
export function formatMany2One(id: number | null): number | false {
  return id === null ? false : id;
}

/**
 * Parsea un campo many2one de Odoo
 * Odoo retorna formato: [id, "nombre"] o false
 *
 * @param value - Valor del campo many2one
 * @returns { id, name } o null
 */
export function parseMany2One(value: [number, string] | false): { id: number; name: string } | null {
  if (!value || value === false) return null;
  return { id: value[0], name: value[1] };
}

/**
 * Parsea un campo many2many de Odoo
 * Odoo retorna formato: [id1, id2, id3] o []
 *
 * @param value - Valor del campo many2many
 * @returns Array de IDs
 */
export function parseMany2Many(value: number[] | false): number[] {
  if (!value || value === false) return [];
  return value;
}
