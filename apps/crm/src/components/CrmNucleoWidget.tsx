import React, { useState, useEffect } from 'react';
import { fetchClientesFromSqlite, fetchNegociosFromSqlite, createClienteInSqlite } from '../lib/nucleoAdapter';
import type { ClienteRecord, NegocioRecord } from '@mejora/nucleo';

export function CrmNucleoWidget() {
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [negocios, setNegocios] = useState<NegocioRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSqliteData() {
    setLoading(true);
    try {
      const [cData, nData] = await Promise.all([
        fetchClientesFromSqlite(),
        fetchNegociosFromSqlite()
      ]);
      setClientes(cData);
      setNegocios(nData);
    } catch (err) {
      console.error('[CrmNucleoWidget] Error al cargar datos SQLite:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSqliteData();
  }, []);

  async function handleAddTestClient() {
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    const newClient: Partial<ClienteRecord> = {
      nombre: 'Cliente CRM Test #' + randomSuffix,
      empresa: 'Corporacion Beta ' + randomSuffix,
      cargo: 'Gerente de Compras',
      whatsapp: '+54911' + Math.floor(10000000 + Math.random() * 90000000),
      tag: 'frecuente',
      notas: 'Generado desde CrmNucleoWidget via SQLite'
    };
    await createClienteInSqlite(newClient);
    await loadSqliteData();
  }

  const negocio = negocios[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-spartan">
              CRM • Conexión SQLite Nucleo
            </h3>
          </div>
          {negocio && (
            <span className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-300 px-2.5 py-0.5 rounded-full font-mono">
              {negocio.nombre} ({negocio.moneda})
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Consulta SQL directa (<code>SELECT * FROM Cliente</code>) contra <code>nucleo.db</code>.
        </p>

        {loading ? (
          <div className="text-xs text-slate-500 py-4 text-center">Cargando registros SQLite...</div>
        ) : (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
            {clientes.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No hay clientes en la tabla SQLite.</div>
            ) : (
              clientes.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <div className="text-xs font-semibold text-white">{c.nombre}</div>
                    <div className="text-[11px] text-slate-400">{c.empresa || 'Independiente'} • {c.cargo || 'Contacto'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      ID #{c.id}
                    </span>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{c.whatsapp || 'Sin WhatsApp'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">
          Total: <strong className="text-white">{clientes.length}</strong> clientes en BD
        </span>
        <button
          type="button"
          onClick={handleAddTestClient}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          + Insertar en SQLite
        </button>
      </div>
    </div>
  );
}
