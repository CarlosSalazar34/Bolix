import psycopg2
from psycopg2.extras import RealDictCursor

# Tu URL de conexión
DB_URL = "postgresql://postgres:BJMPCaSnfIMeKqBhmshYJrYVNVHiElHw@nozomi.proxy.rlwy.net:17348/railway"

def consultar_base_de_datos():
    try:
        # Conexión a la base de datos
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("--- 🔍 EXPLORADOR DE BASE DE DATOS BOLIX ---")

        # 1. Obtener nombres de todas las tablas existentes
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tablas = cur.fetchall()

        if not tablas:
            print("No se encontraron tablas en la base de datos.")
            return

        for tabla in tablas:
            nombre_tabla = tabla['table_name']
            print(f"\n📌 TABLA: {nombre_tabla}")
            print("-" * 30)

            # 2. Consultar las columnas de la tabla para entender la estructura de Carlos
            cur.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{nombre_tabla}'
            """)
            columnas = cur.fetchall()
            cols_info = ", ".join([f"{c['column_name']} ({c['data_type']})" for c in columnas])
            print(f"Estructura: {cols_info}")

            # 3. Mostrar los últimos 5 registros
            try:
                cur.execute(f"SELECT * FROM {nombre_tabla} LIMIT 5;")
                registros = cur.fetchall()
                
                if registros:
                    for reg in registros:
                        print(f"   Row: {dict(reg)}")
                else:
                    print("   (Tabla vacía)")
            except Exception as e:
                print(f"   ❌ No se pudo leer la tabla: {e}")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    consultar_base_de_datos()