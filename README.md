# 💱 Bolix

> API de tasas de cambio para Venezuela — consulta el dólar y euro oficial (BCV) en tiempo real.

## 🧩 ¿Qué es Bolix?

**Bolix** es una API REST construida con **FastAPI** que permite consultar las tasas de cambio oficiales publicadas por el Banco Central de Venezuela (BCV). Realiza web scraping en tiempo real al sitio del BCV y devuelve los valores del dólar y el euro de forma estructurada y consumible por cualquier cliente.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | ![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white) |
| Scraping | ![httpx](https://img.shields.io/badge/httpx-async-blueviolet?style=flat) ![BeautifulSoup4](https://img.shields.io/badge/BeautifulSoup4-scraping-orange?style=flat) |
| Servidor | ![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-green?style=flat) |
| Frontend | 🚧 Por definir |

---

## 📁 Estructura del Proyecto

```
Bolix/
├── backend/
│   ├── app.py                  # Entrada principal de la API (FastAPI)
│   └── functions/
│       └── dolar.py            # Scraper del BCV + (placeholder Binance)
├── README.md
└── LICENSE
```

---

## 🚀 Endpoints disponibles

### `GET /`
Verifica que la API esté activa.

```json
{
  "message": "api funcionando",
  "tiempo": "2026-04-20T15:00:00"
}
```

### `GET /tasa`
Retorna las tasas de cambio oficiales del BCV.

```json
{
  "tasas": [
    {
      "dolar": 36.50,
      "euro": 40.12
    }
  ]
}
```

---

## ⚙️ Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/CarlosSalazar34/Bolix.git
cd Bolix
```

### 2. Crear entorno virtual e instalar dependencias

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Linux/macOS
venv\Scripts\activate          # Windows

pip install fastapi uvicorn httpx beautifulsoup4
```

### 3. Ejecutar la API

```bash
python app.py
```

La API estará disponible en: `http://localhost:5000`  
Documentación interactiva: `http://localhost:5000/docs`

---

## 🔮 Roadmap

- [x] Scraping del BCV (dólar y euro)
- [ ] Fuente Binance P2P
- [ ] Más fuentes de tasas (paralelo, monitor dólar, etc.)
- [ ] Autenticación con API Key
- [ ] Caché de tasas para evitar scraping excesivo
- [ ] Frontend (por definir)
- [ ] Despliegue en producción

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.