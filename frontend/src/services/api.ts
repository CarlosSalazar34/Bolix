import axios from 'axios';
import { authService } from './auth.service';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// 1. Instancia centralizada de Axios
export const api = axios.create({
    baseURL: API_BASE,
});

// 2. Interceptor para inyectar el Token (Soluciona los errores 401)
api.interceptors.request.use((config) => {
    const token = authService.getToken(); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 3. Interceptor de RESPUESTA (Maneja expulsión por token inválido)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Sesión expirada o inválida. Cerrando sesión...");
            authService.logout(); 
            window.location.reload(); 
        }
        return Promise.reject(error);
    }
);

// ── Interfaces (Types) ─────────────────────────────────────────────────────

export interface TasaResponse {
    dolar_bcv: number;
    euro_bcv: number;
    usdt_binance: number;
    promedio: number;
    brecha_porcentual: string;
    estatus_mercado: string;
    error?: string;
}

export interface HistorialItem {
    fecha: string;
    dolar_bcv: number;
    usdt_binance: number;
    promedio: number;
    brecha: string;
}

export interface HistorialResponse {
    status: string;
    count: number;
    data: HistorialItem[];
    error?: string;
}

export interface StatusResponse {
    version: string;
    status: string;
    fuentes: string[];
    cache_ttl: string;
    redis: string;
    uptime: string;
}

export interface Wallet {
    id: number;
    nombre: string;
    moneda: string;
    saldo: number;
    es_principal_usdt: boolean;
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    pago_banco?: string;
    pago_telefono?: string;
    pago_cedula?: string;
}

export interface Trade {
    id: number;
    tipo: 'COMPRA' | 'VENTA' | 'FONDEO';
    monto_usdt: number;
    precio_tasa: number;
    fecha: string;
    wallet_id?: number;
    moneda?: string;
}

export interface TradeResponse {
    saldo_actual_usdt: number;
    historial: Trade[];
}

export interface GestorCategory {
    id: number;
    nombre: string;
    icono: string;
    color: string;
    tipo: 'gasto' | 'ingreso';
    es_default: boolean;
}

export interface GestorRecord {
    id: number;
    tipo: 'ingreso' | 'gasto';
    monto: number;
    categoria_id: number;
    descripcion?: string;
    fecha: string;
    wallet_id: number;
    tasa_aplicada: string;
    tasa_valor: number;
    monto_convertido: number;
    categoria?: GestorCategory;
}

export interface GestorSummary {
    total_ingresos: number;
    total_gastos: number;
    balance: number;
    count_ingresos: number;
    count_gastos: number;
    ultima_actualizacion: string;
}


// ── Funciones de API (Consumo Directo de Railway) ─────────────────────────

export const fetchTasas = async (): Promise<TasaResponse> => {
    const { data } = await api.get<TasaResponse>('/tasa');
    return data;
};

export const fetchHistorial = async (): Promise<HistorialResponse> => {
    const { data } = await api.get<HistorialResponse>('/historial');
    return data;
};

export const fetchStatus = async (): Promise<StatusResponse> => {
    const { data } = await api.get<StatusResponse>('/status');
    return data;
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>('/auth/me');
    return data;
};

export const updateUserPaymentInfo = async (payload: {
    pago_banco: string;
    pago_telefono: string;
    pago_cedula: string;
}): Promise<UserProfile> => {
    const { data } = await api.patch<UserProfile>('/auth/update-pago', payload);
    return data;
};

export const fetchWallets = async (): Promise<Wallet[]> => {
    const { data } = await api.get<Wallet[]>('/wallets/');
    return data;
};

export const fetchTrades = async (): Promise<TradeResponse> => {
    const { data } = await api.get<TradeResponse>('/trades/balance');
    return data;
};

export const createWallet = async (payload: {
    nombre: string;
    moneda: string;
    saldo: number;
    es_principal_usdt: boolean;
}): Promise<Wallet> => {
    const { data } = await api.post<Wallet>('/wallets/', payload);
    return data;
};

export const updateWallet = async (
    walletId: number,
    payload: {
        nombre: string;
        moneda: string;
        saldo: number;
        es_principal_usdt: boolean;
    }
): Promise<Wallet> => {
    const { data } = await api.patch<Wallet>(`/wallets/${walletId}`, payload);
    return data;
};

export const deleteWallet = async (walletId: number): Promise<void> => {
    await api.delete(`/wallets/${walletId}`);
};

export const deleteTrade = async (tradeId: number): Promise<void> => {
    await api.delete(`/trades/${tradeId}`);
};

export const registrarTrade = async (payload: {
    tipo: 'COMPRA' | 'VENTA' | 'FONDEO';
    monto_usdt: number;
    precio_tasa: number;
    wallet_id?: number;
    moneda?: string;
}) => {
    const { data } = await api.post('/trades/registrar', payload);
    return data;
};

export interface SmokeTestResult {
    endpoint: string;
    ok: boolean;
    status: number | null;
    message: string;
}

export const smokeTestBolixEndpoints = async (): Promise<SmokeTestResult[]> => {
    const candidates = [
        '/status',
        '/wallets/',
        '/trades/balance',
    ];

    const results = await Promise.all(
        candidates.map(async (endpoint) => {
            try {
                const response = await api.get(endpoint);
                return {
                    endpoint,
                    ok: true,
                    status: response.status,
                    message: 'OK',
                } satisfies SmokeTestResult;
            } catch (error: any) {
                return {
                    endpoint,
                    ok: false,
                    status: error?.response?.status ?? null,
                    message: error?.response?.statusText ?? error?.message ?? 'Error',
                } satisfies SmokeTestResult;
            }
        })
    );

    return results;
};

export const sendChatMessage = async (mensaje: string): Promise<{ respuesta: string }> => {
    const { data } = await api.post<{ respuesta: string }>(
        `/bot/chatbot/consultar`,
        null,
        { params: { mensaje } }
    );
    return data;
};

// ── Funciones del Gestor ──────────────────────────────────────────────────

export const fetchGestorRecords = async (): Promise<GestorRecord[]> => {
    const { data } = await api.get<GestorRecord[]>('/gestor/records');
    return data;
};

export const fetchGestorCategories = async (): Promise<GestorCategory[]> => {
    const { data } = await api.get<GestorCategory[]>('/gestor/categories');
    return data;
};

export const createGestorRecord = async (payload: {
    tipo: 'ingreso' | 'gasto';
    monto: number;
    categoria_id: number;
    descripcion?: string;
    wallet_id: number;
    tasa_aplicada: string;
    tasa_valor: number;
    monto_convertido: number;
}): Promise<GestorRecord> => {
    const { data } = await api.post<GestorRecord>('/gestor/records', payload);
    return data;
};

export const getGestorSummary = async (): Promise<GestorSummary> => {
    const { data } = await api.get<GestorSummary>('/gestor/summary');
    return data;
};

export const seedGestorCategories = async (): Promise<GestorCategory[]> => {
    const { data } = await api.post<GestorCategory[]>('/gestor/categories/seed');
    return data;
};