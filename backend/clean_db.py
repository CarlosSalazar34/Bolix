import psycopg2

DB_URL = "postgresql://postgres:BJMPCaSnfIMeKqBhmshYJrYVNVHiElHw@nozomi.proxy.rlwy.net:17348/railway"

def borrar_tabla_extra():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        # Borramos la tabla que creó SQLAlchemy por error
        cur.execute("DROP TABLE IF EXISTS historial_precios;")
        conn.commit()
        print("✅ Tabla 'historial_precios' borrada con éxito.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    borrar_tabla_extra()