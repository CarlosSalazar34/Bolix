import axios from 'axios';
import { authService } from './auth.service';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const LOCAL_WALLETS_KEY = 'bolix_local_wallets';
const LOCAL_TRADES_KEY = 'bolix_local_trades';
const CAPABILITIES_KEY = 'bolix_api_capabilities';
const FORCE_LOCAL_WALLET_TRADES = false; // Desactivado para usar la DB real

// 1. Instancia centralizada de Axios
export const api = axios.create({
    baseURL: API_BASE,
});



const getStoredUserId = (): number | null => {
    const raw = localStorage.getItem('bolix_user_id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

const getLocalWallets = (): Wallet[] => {
    try {
        const raw = localStorage.getItem(LOCAL_WALLETS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Wallet[];
    } catch {
        return [];
    }
};

const setLocalWallets = (wallets: Wallet[]) => {
    localStorage.setItem(LOCAL_WALLETS_KEY, JSON.stringify(wallets));
};

const getLocalTrades = (): Trade[] => {
    try {
        const raw = localStorage.getItem(LOCAL_TRADES_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Trade[];
    } catch {
        return [];
    }
};

const setLocalTrades = (trades: Trade[]) => {
    localStorage.setItem(LOCAL_TRADES_KEY, JSON.stringify(trades));
};

const saveLocalTradeAndUpdateWallet = (payload: {
    tipo: 'COMPRA' | 'VENTA' | 'FONDEO';
    monto_usdt: number;
    precio_tasa: number;
    wallet_id?: number;
    moneda?: string;
}) => {
    const trades = getLocalTrades();
    const nextId = trades.length > 0 ? Math.max(...trades.map((t) => t.id)) + 1 : 1;
    const newTrade: Trade = {
        id: nextId,
        tipo: payload.tipo,
        monto_usdt: payload.monto_usdt,
        precio_tasa: payload.precio_tasa,
        fecha: new Date().toISOString(),
        wallet_id: payload.wallet_id,
        moneda: payload.moneda,
    };
    setLocalTrades([newTrade, ...trades]);

    const wallets = getLocalWallets();
    const walletIndex = payload.wallet_id
        ? wallets.findIndex((w) => w.id === payload.wallet_id)
        : wallets.findIndex((w) => w.es_principal_usdt);
    if (walletIndex >= 0) {
        const sign = payload.tipo === 'VENTA' ? -1 : 1;
        const updated = [...wallets];
        updated[walletIndex] = {
            ...updated[walletIndex],
            saldo: Number(updated[walletIndex].saldo) + sign * payload.monto_usdt,
        };
        setLocalWallets(updated);
    }
    return { status: 'local_fallback', trade_id: nextId };
};

type ApiCapabilities = {
    walletsAvailable: boolean | null;
    tradesAvailable: boolean | null;
};

const getCapabilities = (): ApiCapabilities => {
    try {
        const raw = localStorage.getItem(CAPABILITIES_KEY);
        if (!raw) return { walletsAvailable: null, tradesAvailable: null };
        return JSON.parse(raw) as ApiCapabilities;
    } catch {
        return { walletsAvailable: null, tradesAvailable: null };
    }
};

const setCapabilities = (next: Partial<ApiCapabilities>) => {
    const current = getCapabilities();
    localStorage.setItem(CAPABILITIES_KEY, JSON.stringify({ ...current, ...next }));
};

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
        // Si el servidor responde 401, el token ya no sirve o expiró
        if (error.response && error.response.status === 401) {
            console.warn("Sesión expirada o inválida. Redirigiendo al login...");
            authService.logout(); 
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

// ── Funciones de API (Consumo de Endpoints) ────────────────────────────────

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
    if (FORCE_LOCAL_WALLET_TRADES) {
        return getLocalWallets();
    }
    const caps = getCapabilities();
    if (caps.walletsAvailable === false) {
        return getLocalWallets();
    }
    try {
        const { data } = await api.get<Wallet[]>('/wallets/');
        setCapabilities({ walletsAvailable: true });
        return data;
    } catch (error: any) {
        setCapabilities({ walletsAvailable: false });
        return getLocalWallets();
    }
};

export const fetchTrades = async (): Promise<TradeResponse> => {
    const userId = getStoredUserId();
    const localTrades = getLocalTrades();
    if (FORCE_LOCAL_WALLET_TRADES) {
        return {
            saldo_actual_usdt: 0,
            historial: localTrades,
        };
    }
    const caps = getCapabilities();
    if (caps.tradesAvailable === false) {
        return {
            saldo_actual_usdt: 0,
            historial: localTrades,
        };
    }
    try {
        const path = userId ? `/trades/balance?user_id=${userId}` : '/trades/balance';
        const { data } = await api.get<TradeResponse>(path);
        setCapabilities({ tradesAvailable: true });
        return data;
    } catch (error: any) {
        setCapabilities({ tradesAvailable: false });
        return {
            saldo_actual_usdt: 0,
            historial: localTrades,
        };
    }
};

export const createWallet = async (payload: {
    nombre: string;
    moneda: string;
    saldo: number;
    es_principal_usdt: boolean;
}): Promise<Wallet> => {
    if (FORCE_LOCAL_WALLET_TRADES) {
        const wallets = getLocalWallets();
        const nextId = wallets.length > 0 ? Math.max(...wallets.map((w) => w.id)) + 1 : 1;
        const newWallet: Wallet = {
            id: nextId,
            nombre: payload.nombre,
            moneda: payload.moneda,
            saldo: payload.saldo,
            es_principal_usdt: payload.es_principal_usdt,
        };
        setLocalWallets([...wallets, newWallet]);
        return newWallet;
    }
    const caps = getCapabilities();
    if (caps.walletsAvailable === false) {
        const wallets = getLocalWallets();
        const nextId = wallets.length > 0 ? Math.max(...wallets.map((w) => w.id)) + 1 : 1;
        const newWallet: Wallet = {
            id: nextId,
            nombre: payload.nombre,
            moneda: payload.moneda,
            saldo: payload.saldo,
            es_principal_usdt: payload.es_principal_usdt,
        };
        setLocalWallets([...wallets, newWallet]);
        return newWallet;
    }
    try {
        const { data } = await api.post<Wallet>('/wallets/', payload);
        setCapabilities({ walletsAvailable: true });
        return data;
    } catch (error: any) {
        if (error?.response?.status !== 404) {
            throw error;
        }
        setCapabilities({ walletsAvailable: false });
        const wallets = getLocalWallets();
        const nextId = wallets.length > 0 ? Math.max(...wallets.map((w) => w.id)) + 1 : 1;
        const newWallet: Wallet = {
            id: nextId,
            nombre: payload.nombre,
            moneda: payload.moneda,
            saldo: payload.saldo,
            es_principal_usdt: payload.es_principal_usdt,
        };
        setLocalWallets([...wallets, newWallet]);
        return newWallet;
    }
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
    if (FORCE_LOCAL_WALLET_TRADES) {
        const wallets = getLocalWallets();
        const updated = wallets.map((w) =>
            w.id === walletId ? { ...w, ...payload } : w
        );
        setLocalWallets(updated);
        return updated.find((w) => w.id === walletId) as Wallet;
    }
    const caps = getCapabilities();
    if (caps.walletsAvailable === false) {
        const wallets = getLocalWallets();
        const updated = wallets.map((w) =>
            w.id === walletId ? { ...w, ...payload } : w
        );
        setLocalWallets(updated);
        return updated.find((w) => w.id === walletId) as Wallet;
    }
    try {
        const { data } = await api.patch<Wallet>(`/wallets/${walletId}`, payload);
        setCapabilities({ walletsAvailable: true });
        return data;
    } catch (error: any) {
        if (error?.response?.status !== 404) {
            throw error;
        }
        setCapabilities({ walletsAvailable: false });
        const wallets = getLocalWallets();
        const updated = wallets.map((w) =>
            w.id === walletId ? { ...w, ...payload } : w
        );
        setLocalWallets(updated);
        return updated.find((w) => w.id === walletId) as Wallet;
    }
};

export const registrarTrade = async (payload: {
    tipo: 'COMPRA' | 'VENTA' | 'FONDEO';
    monto_usdt: number;
    precio_tasa: number;
    wallet_id?: number;
    moneda?: string;
}) => {
    if (FORCE_LOCAL_WALLET_TRADES) {
        return saveLocalTradeAndUpdateWallet(payload);
    }
    const caps = getCapabilities();
    if (caps.tradesAvailable === false) {
        return saveLocalTradeAndUpdateWallet(payload);
    }
    const storedUserId = localStorage.getItem('bolix_user_id');
    const payloadCompat = {
        ...payload,
        user_id: storedUserId ? Number(storedUserId) : undefined,
    };
    try {
        const { data } = await api.post('/trades/registrar', payloadCompat);
        setCapabilities({ tradesAvailable: true });
        return data;
    } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404 && status !== 422) {
            throw error;
        }
        setCapabilities({ tradesAvailable: false });
        return saveLocalTradeAndUpdateWallet(payload);
    }
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