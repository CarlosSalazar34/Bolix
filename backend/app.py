from fastapi import FastAPI
from datetime import datetime
from functions.dolar import get_bcv

app = FastAPI(title="api-bolix")

@app.get("/")
async def root():
    return {"message": "api funcionando", "tiempo": datetime.now().utcnow()}

@app.get("/tasa")
async def tasa_dolar():
    bcv = await get_bcv()
    return {"tasas": [
        {
            "dolar": bcv['dolar_bcv'],
            "euro": bcv['euro_bcv'] 
        }
    ]}

@app.exception_handler(Exception)
async def exception_handler(request, exc):
    return {"error": str(exc)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app="app:app", reload=True, port=5000)