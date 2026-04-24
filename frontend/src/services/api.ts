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
    const { data } = await api.get<TradeResponse>('/balance');
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

export const registrarTrade = async (payload: {
    tipo: 'COMPRA' | 'VENTA' | 'FONDEO';
    monto_usdt: number;
    precio_tasa: number;
    wallet_id?: number;
    moneda?: string;
}) => {
    const { data } = await api.post('/registrar', payload);
    return data;
};

export const sendChatMessage = async (mensaje: string): Promise<{ respuesta: string }> => {
    const { data } = await api.post<{ respuesta: string }>(
        `/bot/chatbot/consultar`,
        null,
        { params: { mensaje } }
    );
    return data;
};