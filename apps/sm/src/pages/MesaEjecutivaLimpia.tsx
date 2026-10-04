import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  Database,
  Save,
  Clock,
  Send,
  Award,
  Video,
  Image as ImageIcon,
  Smartphone,
  BookOpen,
  MessageSquare,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { 
  createPropuestaInSqlite, 
  fetchPropuestasFromSqlite, 
  isElectronLocal 
} from "@/lib/nucleoAdapter";

interface MultiFormatPack {
  carrusel: string;
  post: string;
  stories: string;
  cartel: string;
  video: string;
  completo: string;
}

function parseMultiFormatContent(rawText: string): MultiFormatPack {
  const postMatch = rawText.match(/===\s*POST DE TRINCHERA\s*===([\s\S]*?)(?====|$)/i);
  const carruselMatch = rawText.match(/===\s*CARRUSEL OPERATIVO\s*===([\s\S]*?)(?====|$)/i);
  const storiesMatch = rawText.match(/===\s*STORIES REFLEXIVAS\s*===([\s\S]*?)(?====|$)/i);
  const cartelMatch = rawText.match(/===\s*CARTEL DE PODER\s*===([\s\S]*?)(?====|$)/i);
  const videoMatch = rawText.match(/===\s*GUIÓN DE VIDEO \/ REEL\s*===([\s\S]*?)(?====|$)/i);

  const fallbackPost = rawText.includes('===') ? '' : rawText;

  return {
    post: postMatch ? postMatch[1].trim() : fallbackPost,
    carrusel: carruselMatch ? carruselMatch[1].trim() : '',
    stories: storiesMatch ? storiesMatch[1].trim() : '',
    cartel: cartelMatch ? cartelMatch[1].trim() : '',
    video: videoMatch ? videoMatch[1].trim() : '',
    completo: rawText.trim()
  };
}

export default function MesaEjecutivaLimpia() {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<keyof MultiFormatPack>("carrusel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [packContent, setPackContent] = useState<MultiFormatPack>({
    carrusel: "",
    post: "",
    stories: "",
    cartel: "",
    video: "",
    completo: ""
  });
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [recentProposals, setRecentProposals] = useState<Array<{ id: number | string; titulo: string; formato?: string | null; creado_el?: string }>>([]);

  const promptStarters = [
    {
      label: "Caos de Procesos vs ERP",
      text: "Reunión con dueño de empresa de 40 empleados: compraron un ERP costoso pero nadie carga los datos y todo se sigue pidiendo por WhatsApp. El dueño pasa 12 horas apagando incendios y siente que a la gente le falta compromiso."
    },
    {
      label: "Inflación Operativa",
      text: "Facturan un 60% más que el año pasado pero el dueño trabaja peor que nunca y no ve la rentabilidad en la caja. Siente que si él no está en cada detalle, la calidad se cae."
    },
    {
      label: "Ventas a Ciegas",
      text: "El equipo comercial responde mensajes sin método ni trazabilidad. Se quejan de que faltan leads, pero cuando entra un cliente calificado no le hacen seguimiento y las oportunidades se enfrían."
    },
    {
      label: "Líder en Soledad",
      text: "Dueño de pyme que creció rápido y no tiene con quién validar decisiones estratégicas. Tiene miedo de que la estructura colapse si intenta delegar."
    }
  ];

  const formatList: Array<{ id: keyof MultiFormatPack; label: string; icon: React.ReactNode }> = [
    { id: "carrusel", label: "Carrusel Operativo (6 Láminas)", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "post", label: "Post de Trinchera", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "stories", label: "Stories Reflexivas", icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: "cartel", label: "Cartel de Poder", icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: "video", label: "Guión de Video (60s)", icon: <Video className="w-3.5 h-3.5" /> },
    { id: "completo", label: "Pack Completo", icon: <FileText className="w-3.5 h-3.5" /> }
  ];

  const loadRecent = async () => {
    try {
      if (isElectronLocal()) {
        const data = await fetchPropuestasFromSqlite();
        if (data && data.length > 0) {
          setRecentProposals(data.slice(-5).reverse());
          return;
        }
      }
      const stored = localStorage.getItem("mejora_sm_propuestas_local");
      if (stored) {
        setRecentProposals(JSON.parse(stored).slice(-5).reverse());
      }
    } catch (err) {
      console.warn("[MesaEjecutivaLimpia] Error cargando propuestas recientes:", err);
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setSavedSuccess(null);

    let rawResult = "";

    // 1. Invocar el Motor Estratégico Soberano vía IPC
    if (typeof window !== "undefined" && (window as any).suite?.ai?.generate) {
      try {
        const aiRes = await (window as any).suite.ai.generate(prompt);
        if (aiRes?.success && aiRes.text) {
          rawResult = aiRes.text;
        }
      } catch (err) {
        console.warn("Fallo IPC en generación, usando redactor local:", err);
      }
    }

    // 2. Si no hay retorno IPC, redactor local instantáneo soberano (Criterio Medular)
    if (!rawResult) {
      await new Promise((r) => setTimeout(r, 300));
      const raw = prompt.trim();
      const lower = raw.toLowerCase();

      let rubro = 'empresas con equipos a cargo';
      if (/construct|obra|edif/i.test(lower)) rubro = 'constructoras y empresas de obras';
      else if (/fábrica|fabrica|taller|industr|producc/i.test(lower)) rubro = 'empresas industriales y productivas';
      else if (/logíst|distrib|depósito|transporte/i.test(lower)) rubro = 'distribuidoras y operadores logísticos';
      else if (/software|saas|tecnolog|it\b|app\b/i.test(lower)) rubro = 'empresas de tecnología y servicios digitales';
      else if (/agencia|marketing|publicidad/i.test(lower)) rubro = 'agencias y firmas de servicios profesionales';
      else if (/comercio|retail|locales|franquicia/i.test(lower)) rubro = 'cadenas comerciales y retailers';

      const esVentas = /venta|cliente|lead|crm|comercial|cotiz|prospect/i.test(lower);
      const esPersonas = /emplead|equipo|gente|personal|delegar|compromiso/i.test(lower);
      const esFinanzas = /plata|caja|margen|rentab|costo|factur/i.test(lower);

      let hook = 'Facturás más y trabajás peor. Eso no es crecimiento: es inflación operativa.';
      let creenciaFalsa = '«A la gente le falta compromiso» o «Necesito otro software»';
      let verdadEstructural = 'El problema jamás es la capacidad de las personas ni la voluntad del dueño. Es la falta de arquitectura operativa.';

      if (esVentas) {
        hook = 'No te faltan prospectos. Te sobra improvisación comercial.';
        creenciaFalsa = '«Hay que salir a vender más a cualquier costo»';
        verdadEstructural = 'Cuando el circuito comercial no tiene trazabilidad, meter más leads solo amplifica el desorden.';
      } else if (esPersonas) {
        hook = 'Si tenés que estar en cada detalle para que las cosas salgan bien, no tenés equipo: tenés ayudantes.';
        creenciaFalsa = '«Nadie cuida el negocio como yo»';
        verdadEstructural = 'No es falta de compromiso: es ausencia de roles delimitados con indicadores claros.';
      } else if (esFinanzas) {
        hook = 'Ventas récord con caja vacía: el síntoma de una empresa que escala sin orden.';
        creenciaFalsa = '«Vendiendo el doble los números se acomodan solos»';
        verdadEstructural = 'La escala sin control de costos ni rentabilidad por unidad genera fragilidad financiera.';
      }

      const caso = raw.length > 20 ? raw : 'El dueño pasa 12 a 14 horas al día apagando incendios operativos.';

      rawResult = `=== POST DE TRINCHERA ===
📌 ${hook}

En la trinchera empresarial, el error más costoso de un dueño es creer que los problemas de estructura se solucionan metiendo más horas propias adentro de la máquina.

Cuando el volumen de tu negocio sube pero la tranquilidad y la rentabilidad bajan, el síntoma es evidente: seguís operando con la lógica de una empresa chica cuando la escala ya te exige profesionalización.

El caso típico que vemos en ${rubro}:
«${caso}»

El quiebre que pocos se animan a decirte en la cara:
${verdadEstructural}

En las organizaciones que acompañamos desde Mejora Continua, el primer paso nunca es sumar software de golpe ni contratar más gente para tapar baches: es diagnosticar con rigor dónde se frena el flujo en sus 4 dimensiones:
1. Personal: Despejar al líder de la trinchera operativa para que recupere claridad.
2. Organizacional: Alinear roles y responsabilidades para que cada persona responda con autonomía.
3. Comercial: Construir trazabilidad de punta a punta entre prospección y entrega.
4. Empresarial: Asegurar que el crecimiento se traduzca en caja real y sostenibilidad.

Si tu estructura hoy es un cuello de botella que te impide dirigir y te atrapa en el día a día, no tenés por qué seguir decidiendo en soledad. Escribime por privado y empezamos a destrabar esto.

#MejoraContinua #LiderazgoB2B #Profesionalizacion #ClaridadEstrategica

=== CARRUSEL OPERATIVO ===
Lámina 1 (Portada):
"${hook}"
[Subtítulo: Por qué sumar más esfuerzo personal al desorden no escala — Método Mejora Continua®]

Lámina 2 (El Síntoma de Trinchera):
${caso}
El negocio se mueve, pero el desgaste es permanente y el margen no acompaña el esfuerzo.

Lámina 3 (El Quiebre de Creencia):
${creenciaFalsa}.
Falso. El problema no son las personas: es la falta de arquitectura operativa. Sin procesos claros, la supervisión se convierte en micromanagement obligatorio.

Lámina 4 (El Método Estructural en 3 Pasos):
Profesionalizar no es burocratizar:
1. Mapear el flujo de valor real de punta a punta.
2. Conectar prospección, venta y operación en un solo circuito trazable.
3. Delegar con indicadores tangibles de entrega, no con fe ciega.

Lámina 5 (El Resultado Tangible):
Las empresas que ordenan sus engranajes reducen un 70% las consultas operativas al dueño y transforman el caos en previsibilidad comercial.

Lámina 6 (Cierre de Autoridad):
El dueño de una empresa es una persona, no una máquina.
Si tu estructura hoy te impide dirigir, ya sabés dónde encontrarme. Escribime por mensaje privado y destrabamos el flujo.

=== STORIES REFLEXIVAS ===
Story 1 (Interpelación Directa):
¿Cuántas decisiones operativas tomaste hoy simplemente porque "era más rápido hacerlo vos que ponerte a explicarlo"?

Story 2 (El Espejo Operativo):
Eso no es liderazgo eficiente. Es estar atrapado adentro de la estructura que fundaste para tener libertad. Crecer sin orden no es avance: es inflación operativa.

Story 3 (Próximo Paso Urgente):
No tenés por qué seguir decidiendo en soledad ni esperando al colapso para ordenar tus procesos.
Escribime un mensaje con la palabra "CLARIDAD" o respondé acá y revisamos dónde está el nudo de tu operación.

=== CARTEL DE PODER ===
"El problema no es que a tu equipo le falte compromiso.
Es que a tu estructura le falta método."

— Mejora Continua® · Claridad Estratégica para Líderes

=== GUIÓN DE VIDEO / REEL ===
[0:00 - 0:03] Gancho a cámara:
"Si tu empresa no puede operar 48 horas sin que vos atiendas el teléfono, no tenés un negocio: tenés un autoempleo de 14 horas."

[0:03 - 0:20] Tensión:
"Facturás más que el año pasado, pero trabajás peor que nunca. Te prometiste que con más ventas todo se iba a ordenar, pero la realidad es que el desorden creció al mismo ritmo que la facturación. El dueño termina siendo el fusible de cada entrega."

[0:20 - 0:45] Método:
"En Mejora Continua no venimos a enseñarte tu oficio: venimos a construir los engranajes para que tu empresa funcione sin depender de que vos estés en cada detalle. Eso es profesionalización: alinear personas, procesos y números reales."

[0:45 - 1:00] Cierre urgente:
"Dejá de apagar incendios. Si sentís que tu estructura hoy es un cuello de botella, escribime al directo y empezamos a destrabar esto hoy mismo."`;
    }

    const parsed = parseMultiFormatContent(rawResult);
    setPackContent(parsed);
    setIsGenerating(false);
  };

  const currentTabContent = packContent[activeTab] || packContent.carrusel || packContent.completo;

  const handleSaveToNucleo = async () => {
    if (!currentTabContent || isSaving) return;
    setIsSaving(true);
    setSavedSuccess(null);

    try {
      const tituloPropuesta = prompt.slice(0, 60) || `Estrategia B2B (${activeTab.toUpperCase()})`;
      if (isElectronLocal()) {
        const record = await createPropuestaInSqlite({
          titulo: tituloPropuesta,
          contenido: currentTabContent,
          formato: activeTab === 'completo' ? 'post' : activeTab,
          estado: "borrador",
        });
        setSavedSuccess(`Guardado en SQLite (ID #${record?.id || "OK"})`);
      } else {
        const existing = JSON.parse(localStorage.getItem("mejora_sm_propuestas_local") || "[]");
        const newRecord = {
          id: Date.now(),
          titulo: tituloPropuesta,
          contenido: currentTabContent,
          formato: activeTab,
          estado: "borrador",
          creado_el: new Date().toISOString(),
        };
        existing.push(newRecord);
        localStorage.setItem("mejora_sm_propuestas_local", JSON.stringify(existing));
        setSavedSuccess(`Guardado (#${newRecord.id.toString().slice(-4)})`);
      }
      await loadRecent();
    } catch (err: any) {
      console.error("[MesaEjecutivaLimpia] Error al guardar:", err);
      setSavedSuccess("Error al guardar en base de datos local");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCurrent = () => {
    if (!currentTabContent) return;
    navigator.clipboard.writeText(currentTabContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPack = () => {
    if (!packContent.completo) return;
    navigator.clipboard.writeText(packContent.completo);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleClear = () => {
    setPrompt("");
    setPackContent({
      carrusel: "",
      post: "",
      stories: "",
      cartel: "",
      video: "",
      completo: ""
    });
    setSavedSuccess(null);
  };

  const hasContent = Boolean(packContent.completo || packContent.carrusel || packContent.post);

  return (
    <div className="w-full space-y-4 font-sans text-slate-900 animate-fadeIn">
      {/* 1. Encabezado Compacto y Métricas en Línea */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A3D84] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A3D84]">
              Mesa Ejecutiva · Estratega Digital Autónomo
            </h1>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[11px] font-semibold py-0.5">
              Criterio Medular B2B
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingresá tu concepto en crudo y obtené al instante el embudo orgánico estructurado en 5 formatos listos para convertir.
          </p>
        </div>

        {/* Tira compacta de KPIs clave (no ocupa espacio vertical invasivo) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs">
            <span className="font-bold text-[#1A3D84]">LinkedIn:</span>
            <span className="font-mono text-blue-900 font-semibold">7.54% clics</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs">
            <span className="font-bold text-rose-700">IG Guardados:</span>
            <span className="font-mono text-rose-900 font-semibold">&gt;4.5%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-700">WhatsApp:</span>
            <span className="font-mono text-emerald-900 font-semibold">28.4% resp.</span>
          </div>
          {(prompt || hasContent) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClear}
              className="h-7 text-xs text-slate-600 hover:text-slate-900 border-slate-300 ml-1"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* 2. Área de Trabajo Principal en Grid 50 / 50 Garantizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full items-start">

        {/* COLUMNA 1: ENTRADA EN CRUDO (50%) */}
        <div className="flex flex-col space-y-3 w-full">
          <Card className="border border-slate-200 bg-white shadow-sm flex flex-col">
            <CardHeader className="py-2.5 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#1A3D84]" />
                <span>1. Tu Concepto o Dolor en Crudo</span>
              </CardTitle>
              <span className="text-xs text-slate-400 font-mono">
                {prompt.length} caracteres
              </span>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
              <Textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribí o pegá acá tu idea en crudo, una anécdota con un cliente o un problema de trinchera...&#10;&#10;Ejemplo:&#10;Hablé con el dueño de una empresa de 45 personas. Compraron un ERP pero nadie lo carga y todo se sigue pidiendo por WhatsApp. El dueño pasa 12 horas al día apagando incendios y siente que a su equipo le falta compromiso..."
                className="w-full min-h-[340px] text-sm leading-relaxed bg-slate-50 border-slate-300 focus:border-[#1A3D84] focus:ring-1 focus:ring-[#1A3D84] p-3 rounded-xl resize-none font-sans"
              />

              {/* Botones de Inyección Rápida */}
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                  Ideas de Trinchera Rápidas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {promptStarters.map((ps, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(ps.text)}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      {ps.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Principal de Generación */}
              <Button
                id="btn-generar-contenido"
                type="button"
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full py-5 text-sm font-bold bg-[#1A3D84] hover:bg-[#15326c] text-white shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Estructurando Embudo Multi-Formato...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#F7CC13]" />
                    <span>Generar Embudo Orgánico (5 Formatos)</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 2: SUITE DE FORMATOS RESULTANTES (50%) */}
        <div className="flex flex-col space-y-3 w-full">
          <Card className="border border-slate-200 bg-white shadow-sm flex flex-col min-h-[460px]">
            <CardHeader className="py-2.5 px-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1A3D84]" />
                <span>2. Formatos Listos para Publicar</span>
              </CardTitle>

              {hasContent && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCurrent}
                    className="h-7 px-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1 text-slate-500" />
                        <span>Copiar Pestaña</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPack}
                    className="h-7 px-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" />
                        <span>Pack OK</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1 text-slate-500" />
                        <span>Copiar Todo</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    disabled={isSaving}
                    onClick={handleSaveToNucleo}
                    className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    <span>Guardar SQLite</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            {/* Pestañas de Formatos */}
            {hasContent && (
              <div className="px-4 pt-2.5 pb-1 border-b border-slate-100 flex flex-wrap gap-1 bg-slate-50/50">
                {formatList.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveTab(f.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === f.id
                        ? "bg-[#1A3D84] text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {f.icon}
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            <CardContent className="p-4 flex-1 flex flex-col">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1A3D84]" />
                  <p className="text-sm font-bold text-slate-800">
                    Procesando con ADN Ganador...
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Generando Carrusel, Post, Stories, Cartel y Video de forma instantánea.
                  </p>
                </div>
              ) : hasContent ? (
                <div className="flex-1 flex flex-col space-y-2">
                  <Textarea
                    readOnly
                    value={currentTabContent}
                    className="w-full flex-1 min-h-[340px] text-xs leading-relaxed font-sans bg-slate-50/70 border-slate-200 p-3.5 text-slate-800 rounded-xl focus:outline-none resize-none font-mono"
                  />

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Optimizado para conversión B2B
                    </span>
                    {savedSuccess && (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {savedSuccess}
                      </span>
                    )}
                    <span>{currentTabContent.split(/\s+/).filter(Boolean).length} palabras</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                  <Layers className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Mesa en Espera</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                    Ingresá una idea a la izquierda y presioná <strong>"Generar Embudo"</strong> para obtener todos los formatos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Borradores Recientes de SQLite */}
      {recentProposals.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#1A3D84]" />
              <span>Últimos Borradores Guardados en SQLite:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">sm_propuestas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentProposals.map((item, idx) => (
              <div key={idx} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="font-medium text-slate-800 max-w-[200px] truncate">{item.titulo}</span>
                <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-slate-200 text-slate-600">
                  {item.formato || "post"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
