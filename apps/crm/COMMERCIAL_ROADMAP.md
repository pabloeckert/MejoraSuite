# 🎯 Hoja de Ruta Comercial y UX (Segunda Opinión de PM)

Este documento detalla las prioridades comerciales, de producto y de experiencia de usuario (UX) identificadas para **MejoraCRM**. Está diseñado para servir como directiva estratégica para cualquier agente de IA o desarrollador que trabaje en este repositorio.

El objetivo principal es **eliminar la fricción operativa de los vendedores y maximizar la visibilidad de los ingresos para los gerentes.**

---

## 1. Rediseño del Registro de Interacciones (Fricción Cero)
*   **Archivos de impacto:**
    *   [InteractionForm.tsx](file:///C:/Github/Negocio/MejoraCRM/src/components/interactions/InteractionForm.tsx) (Wizard actual)
    *   [schemas.ts](file:///C:/Github/Negocio/MejoraCRM/src/lib/schemas.ts) (Validaciones Zod de la interacción)
*   **Problema comercial:** El wizard de 4 pasos desalienta la carga diaria de datos. Un vendedor necesita registrar gestiones comerciales en segundos, idealmente en una pantalla limpia y compacta.
*   **Especificaciones de mejora:**
    *   Reemplazar la interfaz de 4 pasos por un formulario de **una sola pantalla** (Single Page Form).
    *   Utilizar lógica condicional reactiva para mostrar campos:
        *   Si el resultado es `venta`, mostrar campos de montos, productos y adjunto de proforma.
        *   Si es `seguimiento`, mostrar selector de fecha y escenario de seguimiento.
        *   Si es `no_interesado`, mostrar selector de motivo de pérdida (`loss_reason`).
    *   Mantener el alto del formulario compacto con inputs de tamaño consistente (`h-9`).

---

## 2. Envejecimiento Dinámico de Oportunidades (Deal Aging)
*   **Archivos de impacto:**
    *   [InteractionCard.tsx](file:///C:/Github/Negocio/MejoraCRM/src/components/interactions/InteractionCard.tsx) (Generador del badge de tiempo)
    *   [constants.ts](file:///C:/Github/Negocio/MejoraCRM/src/lib/constants.ts) (Definición de umbrales y estilos)
*   **Problema comercial:** Los umbrales de alerta de 8 días (ámbar) y 30 días (rojo) son excesivos. Un negocio caliente se enfría en menos de una semana.
*   **Especificaciones de mejora:**
    *   Redefinir los umbrales de alerta comercial a valores más agresivos:
        *   **Ámbar:** Más de 2 días (48 horas) sin interacción en estado de *Presupuesto* o *Seguimiento*.
        *   **Rojo:** Más de 5 días (120 horas) de inactividad comercial.
    *   Agregar tooltips en el badge que expliquen al vendedor el tiempo exacto transcurrido y la urgencia del contacto.

---

## 3. Pipeline Kanban Financiero y Dinámico
*   **Archivos de impacto:**
    *   [PipelineKanban.tsx](file:///C:/Github/Negocio/MejoraCRM/src/components/interactions/PipelineKanban.tsx)
    *   [businessLogic.ts](file:///C:/Github/Negocio/MejoraCRM/src/lib/businessLogic.ts)
*   **Problema comercial:** El pipeline no muestra el volumen total de dinero comprometido en cada etapa. Es imposible hacer proyecciones de ventas (forecasting) eficientes.
*   **Especificaciones de mejora:**
    *   Calcular y renderizar la sumatoria del valor monetario (`total_amount` para ventas y presupuestos, `estimated_loss` para no interesados) en la cabecera de cada una de las 5 columnas del Kanban.
    *   Mostrar el formato de moneda de forma legible (ej. `$4.520.000` o `$2.5K USD` si es multi-moneda).
    *   Ordenar las tarjetas en el Kanban priorizando primero los **montos más altos** en lugar de solo ordenarlas por fecha. El vendedor debe enfocarse primero en la cuenta de mayor valor.

---

## 4. Dashboard Comercial Proactivo (Actionable Dashboard)
*   **Archivos de impacto:**
    *   [OwnerViewV2.tsx](file:///C:/Github/Negocio/MejoraCRM/src/components/dashboard/OwnerViewV2.tsx)
    *   [SellerViewV2.tsx](file:///C:/Github/Negocio/MejoraCRM/src/components/dashboard/SellerViewV2.tsx)
    *   [calculations.ts](file:///C:/Github/Negocio/MejoraCRM/src/lib/calculations.ts)
*   **Problema comercial:** Las vistas actuales son reactivas e históricas. Faltan disparadores accionables para el trabajo diario.
*   **Especificaciones de mejora:**
    *   Crear una widget en el inicio del vendedor titulado `"Mi Foco de Hoy"`.
    *   Este widget debe listar de forma automatizada las 5 oportunidades que requieren acción inmediata:
        1.  Seguimientos agendados para la fecha actual o vencidos.
        2.  Presupuestos calientes que superan las 48 horas sin seguimiento.
        3.  Clientes VIP en riesgo de enfriamiento.
    *   Cada elemento en la lista de foco debe tener accesos directos de acción (botón directo para llamar por WhatsApp o enviar correo).

---

## 5. Automatización de Mensajes de Seguimiento en WhatsApp
*   **Archivos de impacto:**
    *   [WhatsAppLink.tsx](file:///C:/Github/Negocio/MejoraCRM/src/pages/WhatsAppLink.tsx)
    *   [ClientDetailDialog.tsx](file:///C:/Github/Negocio/MejoraCRM/src/components/clients/ClientDetailDialog.tsx)
*   **Problema comercial:** Se pierde tiempo valioso redactando saludos y recordatorios genéricos. Los mensajes de la empresa carecen de consistencia de marca.
*   **Especificaciones de mejora:**
    *   Integrar un sistema de **plantillas rápidas de WhatsApp** al presionar el ícono de WhatsApp de un cliente.
    *   Ejemplos de plantillas dinámicas automatizadas (reemplazando variables del cliente y vendedor):
        *   *Plantilla de Presupuesto:* `"Hola {nombre_cliente}, te escribo de Mejora Continua para saber si pudiste revisar el presupuesto por {monto_presupuesto} que te enviamos..."`
        *   *Plantilla de Seguimiento:* `"Hola {nombre_cliente}, quedamos en contactarnos hoy para conversar sobre los siguientes pasos de..."`

---

## 6. Cuotas Dinámicas Mensuales por Vendedor
*   **Archivos de impacto:**
    *   [useProfiles.ts](file:///C:/Github/Negocio/MejoraCRM/src/hooks/useProfiles.ts)
    *   [Settings.tsx](file:///C:/Github/Negocio/MejoraCRM/src/pages/Settings.tsx) (Panel de administración)
*   **Problema comercial:** La cuota mensual es estática. No considera fluctuaciones del mercado ni estacionalidad comercial.
*   **Especificaciones de mejora:**
    *   Modificar la gestión de cuotas de vendedor para permitir asignar objetivos diferenciados según el mes en curso.
    *   Guardar la relación mes/año en la base de datos para mantener un histórico de cumplimiento de cuotas anual.
