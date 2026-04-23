<p align="center">
  <img src="https://img.shields.io/badge/Bolix-Tasas%20de%20Cambio-00C853?style=for-the-badge&logo=bitcoin&logoColor=white" alt="Bolix Badge"/>
</p>

<h1 align="center">💱 Bolix</h1>

<p align="center">
  <strong>Tasas de cambio en tiempo real para Venezuela</strong><br/>
  Dólar BCV · Euro BCV · USDT Binance P2P
</p>

<p align="center">
  <a href="https://bolix-five.vercel.app">
    <img src="https://img.shields.io/badge/🌐_Frontend-bolix--five.vercel.app-0070F3?style=flat-square&logo=vercel" alt="Frontend"/>
  </a>
  <a href="https://bolix-backend.vercel.app">
    <img src="https://img.shields.io/badge/⚡_Backend-bolix--backend.vercel.app-000000?style=flat-square&logo=vercel" alt="Backend"/>
  </a>
  <img src="https://img.shields.io/github/license/CarlosSalazar34/Bolix?style=flat-square&color=emerald" alt="License"/>
</p>

---

## 📖 Descripción

**Bolix** es una aplicación web que muestra las tasas de cambio del **Bolívar venezolano (VES)** frente al Dólar, Euro y USDT en tiempo real. Los datos se obtienen mediante web scraping del **Banco Central de Venezuela (BCV)** y de la plataforma **Binance P2P**.

### ✨ Características

- 📊 **Tasas en tiempo real** — Dólar BCV, Euro BCV y USDT Binance P2P
- 📈 **Promedio de mercado** — Cálculo automático del promedio entre BCV y Binance
- 🔄 **Brecha porcentual** — Diferencia entre tasa oficial y paralela
- 🕐 **Historial de consultas** — Registro de las últimas 20 consultas
- 💱 **Calculadora de conversión** — Convierte entre VES, USD, EUR y USDT
- ⚡ **Caché inteligente** — Respuestas cacheadas por 10 minutos en PostgreSQL
- 📱 **Diseño mobile-first** — Interfaz optimizada para dispositivos móviles

---

## 🏗️ Arquitectura

```
Bolix/
├── backend/                # API REST (Python)
│   ├── app.py              # Servidor FastAPI principal
│   ├── functions/
│   │   └── dolar.py        # Scraping de BCV y Binance P2P
│   ├── requirements.txt    # Dependencias Python
│   └── vercel.json         # Configuración de deploy
│
├── frontend/               # Aplicación web (React + TypeScript)
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   │   ├── BottomNav.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── ConverterSheet.tsx
│   │   │   ├── HeroCard.tsx
│   │   │   ├── HistoryItem.tsx
│   │   │   ├── RateCard.tsx
│   │   │   └── icons.tsx
│   │   ├── pages/          # Páginas de la app
│   │   │   ├── HomePage.tsx
│   │   │   ├── HistorialPage.tsx
│   │   │   ├── AlertasPage.tsx
│   │   │   └── PerfilPage.tsx
│   │   ├── services/
│   │   │   └── api.ts      # Cliente HTTP para el backend
│   │   ├── App.tsx          # Componente raíz
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vercel.json          # SPA routing config
│
├── LICENSE
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
| Tecnología | Uso |
|---|---|
| ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) | Librería de UI |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Tipado estático |
| ![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white) | Bundler y dev server |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | Estilos utility-first |

### Backend
| Tecnología | Uso |
|---|---|
| ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) | Lenguaje principal |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) | Framework web async |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Base de datos (caché + historial) |
| ![BeautifulSoup](https://img.shields.io/badge/BeautifulSoup4-grey?style=flat-square) | Web scraping del BCV |

### Infraestructura
| Servicio | Uso |
|---|---|
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white) | Deploy frontend y backend |
| ![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white) | PostgreSQL en la nube |

---

## 🚀 API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/status` | Estado del servidor, DB y uptime |
| `GET` | `/tasa` | Tasas de cambio actuales (con caché) |
| `GET` | `/historial` | Últimas 20 consultas registradas |

### Ejemplo de respuesta `/tasa`

```json
{
  "dolar_bcv": 481.70,
  "euro_bcv": 567.58,
  "usdt_binance": 632.00,
  "promedio": 556.85,
  "brecha_porcentual": "31.2%",
  "estatus_mercado": "Alerta: Brecha Alta"
}
```

---

## ⚙️ Instalación Local

### Requisitos previos
- **Node.js** >= 18
- **Python** >= 3.10
- **PostgreSQL** (o usar Railway)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crear archivo .env con:
# DATABASE_URL=postgresql://...
# ALLOWED_ORIGINS=http://localhost:5173

# Ejecutar servidor
uvicorn app:app --reload --port 5000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🌐 Variables de Entorno

### Backend (`.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@host:port/db` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:5173,https://bolix-five.vercel.app` |

### Frontend (`.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL del backend | `http://localhost:5000` |

---

## 📱 Páginas

| Página | Descripción |
|---|---|
| **Inicio** | Dashboard principal con tasas, promedio y brecha |
| **Historial** | Registro cronológico de consultas anteriores |
| **Alertas** | Notificaciones y alertas del mercado (próximamente) |
| **Perfil** | Configuración del usuario (próximamente) |

---

## 👥 Autores

Este proyecto fue desarrollado en conjunto por:

| | Desarrollador | Rol | GitHub |
|---|---|---|---|
| 🎨 | **Carlos Salazar** | Frontend (React + TypeScript) | [@CarlosSalazar34](https://github.com/CarlosSalazar34) |
| ⚙️ | **Gabriel Mejías** | Backend (FastAPI + Python) | [@Gabbuvtt](https://github.com/Gabbuvtt) |

> *Este proyecto no hubiera sido posible sin el trabajo en equipo. Agradecimiento especial a **Gabriel Mejías**, cuyo desarrollo del backend fue fundamental para hacer realidad Bolix.* 🤝

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.


# 🚀 Ecosistema Bolix

<p align="center">
  <img src="https://img.shields.io/badge/Bolix-Ecosistema%20Financiero-00C853?style=for-the-badge&logo=bitcoin&logoColor=white" alt="Bolix Badge"/>
  <img src="https://img.shields.io/badge/Versi%C3%B3n-1.2.6-blue?style=for-the-badge" alt="Versión"/>
</p>

**Bolix** es un ecosistema de seguimiento financiero de alto rendimiento, diseñado específicamente para el mercado venezolano. Permite el monitoreo en tiempo real de la tasa de cambio entre el **Bolívar (VES)** y las principales divisas extranjeras (**USD**, **EUR**) y activos digitales (**USDT**).

El sistema integra datos en vivo del **Banco Central de Venezuela (BCV)** y **Binance P2P**, ofreciendo una visión integral de la brecha del mercado, tendencias históricas y herramientas de conversión inteligentes.

---

## ✨ Características Principales

### 📡 Inteligencia en Tiempo Real
*   **Monitoreo Dual**: Seguimiento simultáneo de las tasas oficiales del BCV y las tasas de mercado de Binance P2P (USDT).
*   **Análisis de Brecha**: Cálculo automático del diferencial porcentual entre la tasa oficial y la paralela para detectar volatilidad.
*   **Resiliencia Inteligente**: Lógica de scraping robusta con una capa de caché en PostgreSQL y fallback histórico, garantizando un tiempo de actividad del 99.9%.

### 🔐 Seguro y Personalizado
*   **Autenticación JWT**: Sistema seguro de registro e inicio de sesión.
*   **Perfiles de Usuario**: Gestión de sesiones para una experiencia personalizada.
*   **Historial de Auditoría**: Acceso a las últimas 20 actualizaciones de tasas para rastrear micro-tendencias.

### 🛠️ Herramientas Interactivas
*   **Calculadora Multimoneda**: Conversión instantánea entre VES, USD, EUR y USDT utilizando las tasas actuales.
*   **Notificaciones Push (En Desarrollo)**: Mantente informado con alertas en tiempo real sobre cambios significativos en las tasas.
*   **Registro de Trades**: Rastrea tus transacciones personales y monitorea tu balance de operaciones.

---

## 🏗️ Arquitectura Técnica

```mermaid
graph TD
    User((Usuario)) -->|React + Vite| Frontend[Frontend Bolix]
    Frontend -->|HTTPS / JWT| Backend[Backend FastAPI]
    Backend -->|Web Scraping| BCV[BCV - Tasa Oficial]
    Backend -->|Web Scraping| Binance[Binance P2P - USDT]
    Backend -->|Motor Async| DB[(PostgreSQL Caché/Historial)]
    Backend -->|Autenticación| Auth[JWT / Middleware]
```

---

## 🛠️ Stack Tecnológico

### **Frontend (La Interfaz)**
*   **React 19**: Biblioteca de UI moderna para una experiencia de usuario reactiva.
*   **TypeScript**: Desarrollo robusto con tipado estático.
*   **Vite**: Herramienta de construcción y servidor de desarrollo ultra-rápido.
*   **Tailwind CSS**: Estilizado basado en utilidades para un diseño premium mobile-first.
*   **Lucide React**: Iconografía consistente y estética.

### **Backend (El Motor)**
*   **FastAPI**: Framework asíncrono de Python de alto rendimiento.
*   **SQLAlchemy (Async)**: ORM moderno para operaciones de base de datos eficientes.
*   **PostgreSQL**: Base de datos relacional confiable para caché e historial.
*   **BeautifulSoup4**: Análisis avanzado de HTML para la extracción de datos.

### **Infraestructura**
*   **Vercel**: Despliegue global para Frontend y Backend (Serverless).
*   **Railway**: Base de datos PostgreSQL alojada en la nube.

---

## 🚀 Endpoints de la API

| Categoría | Método | Endpoint | Descripción |
| :--- | :--- | :--- | :--- |
| **Núcleo** | `GET` | `/tasa` | Tasas actuales (BCV/Binance) con Caché. |
| **Datos** | `GET` | `/historial` | Historial reciente de actualizaciones. |
| **Sistema** | `GET` | `/status` | Salud del servidor, estado de DB y uptime. |
| **Seguridad**| `POST`| `/auth/login` | Autenticación de usuario. |
| **Finanzas** | `POST`| `/trades/registrar`| Registro de una nueva operación USDT. |
| **Finanzas** | `GET` | `/trades/balance/{id}`| Obtener conteo de operaciones del usuario. |

---

## ⚙️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/CarlosSalazar34/Bolix.git
cd Bolix
```

### 2. Configuración del Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # En Linux: source venv/bin/activate
pip install -r requirements.txt
# Crear archivo .env con DATABASE_URL y ALLOWED_ORIGINS
uvicorn app.app:app --reload --port 5000
```

### 3. Configuración del Frontend
```bash
cd frontend
npm install
# Crear archivo .env con VITE_API_URL=http://localhost:5000
npm run dev
```

---

## 👥 Equipo de Desarrollo

| Desarrollador | Responsabilidad | Contacto |
| :--- | :--- | :--- |
| **Carlos Salazar** | Arquitecto Frontend y Diseñador UX | [@CarlosSalazar34](https://github.com/CarlosSalazar34) |
| **Gabriel Mejías** | Ingeniero Backend e Integrador | [@Gabbuvtt](https://github.com/Gabbuvtt) |

---

## 📄 Licencia
Este proyecto está bajo la **Licencia MIT**. Consulta el archivo [LICENSE](LICENSE) para más información.

---
<p align="center">Hecho con ❤️ para Venezuela 🇻🇪</p>