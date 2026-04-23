from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

# Cargamos las variables del .env
load_dotenv()

# Cambia DATABASE_URL por el nombre que uses en tu .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Error: No se encontró DATABASE_URL en el archivo .env")
else:
    # Si usas SQLite, asegúrate de que la ruta sea correcta
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    print(f"--- Tablas en la base de datos ---")
    tables = inspector.get_table_names()

    if not tables:
        print("La base de datos está vacía (no hay tablas).")
    else:
        for table in tables:
            print(f"\n📌 Tabla: {table}")
            # Listar columnas y sus tipos
            columns = inspector.get_columns(table)
            for column in columns:
                print(f"  - {column['name']} ({column['type']})")