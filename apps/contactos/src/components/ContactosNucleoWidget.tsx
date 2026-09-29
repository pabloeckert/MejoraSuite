import React, { useState, useEffect } from 'react';
import { fetchContactosFromSqlite } from '../lib/nucleoAdapter';
import type { ClienteRecord } from '@mejora/nucleo';

export function ContactosNucleoWidget() {
  const [contactos, setContactos] = useState<ClienteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadContactos() {
    setLoading(true);
    try {
      const data = await fetchContactosFromSqlite();
      setContactos(data);
    } catch (err) {
      console.error('[ContactosNucleoWidget] Error al leer SQLite:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContactos();
  }, []);

  const frecuentes = contactos.filter((c) => c.tag === 'frecuente').length;
  const ocasionales = contactos.filter((c) => c.tag === 'ocasional').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-spartan">
              Contactos • Deduplicación y Persistencia
            </h3>
          </div>
          <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono">
            SQLite Sync
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Fuente de verdad local unificada leyendo entidades <code>Cliente</code> de <code>@mejora/nucleo</code>.
        </p>

        {loading ? (
          <div className="text-xs text-slate-500 py-4 text-center">Leyendo registros locales...</div>
        ) : (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
            {contactos.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No hay contactos sincronizados.</div>
            ) : (
              contactos.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-white truncate">{c.nombre}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.empresa || 'Particular'} • {c.whatsapp || 'Sin Tel'}</div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono shrink-0 ${
                    c.tag === 'frecuente' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {c.tag || 'Normal'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex space-x-3 text-slate-400">
          <span>Frecuentes: <strong className="text-emerald-400">{frecuentes}</strong></span>
          <span>Ocasionales: <strong className="text-amber-400">{ocasionales}</strong></span>
        </div>
        <button
          type="button"
          onClick={loadContactos}
          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          ? Refrescar
        </button>
      </div>
    </div>
  );
}
