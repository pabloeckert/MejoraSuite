#!/usr/bin/env python3
"""
Script de inyección directa de Semillas de Oro en SQLite
Mejora Continua Suite (@mejora/nucleo & @mejora/sm)
Asegura la disponibilidad de ADN Ganador para el motor de Gemini Pro.
"""

import os
import sys
import sqlite3
from pathlib import Path

def main():
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent
    
    candidate_sql_files = [
        repo_root / "semillas_oro.sql",
        script_dir / "semillas_oro.sql",
        Path.cwd() / "semillas_oro.sql",
        Path.cwd() / "MejoraSuite" / "scripts" / "semillas_oro.sql"
    ]

    sql_file = None
    for cand in candidate_sql_files:
        if cand.exists():
            sql_file = cand
            break

    if not sql_file:
        print(f"[-] Error: Archivo semillas_oro.sql no encontrado en ninguna ruta candidata.")
        sys.exit(1)

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    appdata = os.environ.get("APPDATA") or os.environ.get("LOCALAPPDATA") or ""
    candidate_paths = [
        Path(appdata) / "@mejora" / "shell" / "nucleo.db",
        Path(appdata) / "MejoraSuite" / "nucleo.db",
        Path(appdata) / "Electron" / "nucleo.db",
        Path.cwd() / "nucleo.db",
        repo_root / "MejoraSuite" / "nucleo.db"
    ]

    target_dbs = []
    seen = set()
    for p in candidate_paths:
        p_resolved = p.resolve()
        if p_resolved.exists() and p_resolved not in seen:
            seen.add(p_resolved)
            target_dbs.append(p_resolved)

    if not target_dbs:
        target_path = (Path(appdata) / "@mejora" / "shell" / "nucleo.db").resolve()
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_dbs = [target_path]

    print("================================================================")
    print("   MEJORA CONTINUA - INYECCIÓN DE SEMILLAS DE ORO (COLD START)  ")
    print("================================================================")
    print(f"[*] Archivo SQL origen: {sql_file}")

    for db_path in target_dbs:
        print(f"\n[+] Procesando base de datos: {db_path}")
        try:
            con = sqlite3.connect(db_path)
            cur = con.cursor()
            cur.executescript(sql_content)
            con.commit()

            rows = cur.execute("""
                SELECT p.id, p.titulo,
                       MAX(CASE WHEN m.alcance > 0 THEN (CAST(m.clics AS REAL) / m.alcance) ELSE 0 END) AS tasa_conversion,
                       MAX(m.clics) AS max_clics,
                       MAX(m.interacciones) AS max_interacciones,
                       MAX(m.alcance) AS max_alcance
                FROM sm_propuestas p
                INNER JOIN sm_metricas m ON p.id = m.propuesta_id
                WHERE p.estado = 'publicado'
                GROUP BY p.id, p.titulo
                ORDER BY tasa_conversion DESC, max_clics DESC, max_interacciones DESC
                LIMIT 3
            """).fetchall()

            print(f"  [OK] Semillas inyectadas con éxito. Posts activos con ADN Ganador: {len(rows)}")
            for idx, r in enumerate(rows, 1):
                print(f"    {idx}. ID {r[0]}: \"{r[1]}\" | Conversión: {r[2]*100:.2f}% | Clics: {r[3]} | Alcance: {r[5]}")
            con.close()
        except Exception as e:
            print(f"  [-] Error al inyectar en {db_path}: {e}")

    print("\n[OK] Inyección completada. El motor de Gemini 1.5 Pro ya cuenta con métricas y ADN ganador.")

if __name__ == "__main__":
    main()
