import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/auth">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        <article className="prose prose-sm dark:prose-invert max-w-none">
          <h1>Política de Privacidad</h1>
          <p className="text-muted-foreground">
            Última actualización: 25 de abril de 2026
          </p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            <strong>Mejora Continua®</strong> (en adelante, "la Empresa") es responsable del tratamiento de los datos personales recopilados a través de la plataforma <strong>MejoraCRM</strong>, disponible en <a href="https://mejoracrm.vercel.app">mejoracrm.vercel.app</a>.
          </p>
          <p>
            Para consultas sobre privacidad y protección de datos, contactar a: <strong>privacidad@mejoraok.com</strong>
          </p>

          <h2>2. Datos que recopilamos</h2>
          <h3>2.1 Datos del usuario (quien usa el CRM)</h3>
          <ul>
            <li><strong>Nombre completo</strong> — para identificación dentro del sistema</li>
            <li><strong>Correo electrónico</strong> — para autenticación y comunicaciones del sistema</li>
            <li><strong>Avatar</strong> (opcional) — foto de perfil</li>
            <li><strong>Rol</strong> — administrador, supervisor o vendedor</li>
          </ul>

          <h3>2.2 Datos de clientes del CRM</h3>
          <p>Los usuarios del CRM cargan información de sus clientes comerciales:</p>
          <ul>
            <li>Nombre de empresa y persona de contacto</li>
            <li>Datos de contacto (email, WhatsApp, teléfono)</li>
            <li>Ubicación (provincia, dirección)</li>
            <li>Interacciones comerciales (presupuestos, ventas, seguimientos)</li>
            <li>Notas y observaciones</li>
          </ul>

          <h3>2.3 Datos técnicos</h3>
          <ul>
            <li>Dirección IP (registrada por Supabase Auth)</li>
            <li>Datos de sesión (tokens JWT)</li>
            <li>Información del dispositivo (para PWA)</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Los datos se utilizan exclusivamente para:</p>
          <ul>
            <li>Proveer el servicio de CRM (gestión de clientes e interacciones comerciales)</li>
            <li>Autenticación y control de acceso por roles</li>
            <li>Generación de reportes y estadísticas internas del equipo de ventas</li>
            <li>Comunicaciones operativas del sistema (notificaciones de seguimientos)</li>
          </ul>
          <p><strong>No vendemos, compartimos ni cedemos datos a terceros</strong> con fines comerciales o publicitarios.</p>

          <h2>4. Base legal</h2>
          <p>El tratamiento de datos se basa en:</p>
          <ul>
            <li><strong>Consentimiento del titular</strong> — al registrarse, el usuario acepta esta política</li>
            <li><strong>Ejecución de contrato</strong> — los datos son necesarios para prestar el servicio de CRM</li>
            <li><strong>Interés legítimo</strong> — mejora del servicio y seguridad del sistema</li>
          </ul>

          <h2>5. Almacenamiento y seguridad</h2>
          <ul>
            <li>Los datos se almacenan en <strong>Supabase Cloud</strong> (infraestructura de Amazon Web Services)</li>
            <li>La transmisión se realiza mediante <strong>HTTPS/TLS</strong></li>
            <li>El acceso a los datos está controlado por <strong>Row Level Security (RLS)</strong> en la base de datos</li>
            <li>Las contraseñas se almacenan de forma hasheada (bcrypt) a través de Supabase Auth</li>
            <li>Las credenciales de acceso a infraestructura están almacenadas en <strong>GitHub Secrets</strong> (no en el código fuente)</li>
          </ul>

          <h2>6. Retención de datos</h2>
          <ul>
            <li><strong>Datos de usuario:</strong> se conservan mientras la cuenta esté activa</li>
            <li><strong>Datos de clientes del CRM:</strong> se conservan mientras el usuario los mantenga en el sistema</li>
            <li><strong>Logs de auditoría:</strong> se eliminan automáticamente después de 90 días</li>
            <li><strong>Datos eliminados:</strong> se anonimizan de forma irreversible</li>
          </ul>

          <h2>7. Derechos del titular</h2>
          <p>Conforme a la <strong>Ley 25.326</strong> de Protección de Datos Personales, usted tiene derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre usted</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de sus datos</li>
            <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos</li>
          </ul>
          <p>
            Para ejercer estos derechos, acceda a <strong>Configuración → Cuenta → Eliminar mis datos</strong> dentro de la aplicación, o envíe un correo a <strong>privacidad@mejoraok.com</strong>.
          </p>
          <p>
            La eliminación de datos es <strong>irreversible</strong>. Se anonimizarán todos sus datos personales y se eliminarán los datos de clientes que usted haya cargado.
          </p>

          <h2>8. Cookies y tecnologías de rastreo</h2>
          <p>
            MejoraCRM <strong>no utiliza cookies de rastreo</strong>, publicidad ni analítica de terceros. Las únicas cookies utilizadas son las de sesión de autenticación de Supabase, necesarias para el funcionamiento del servicio.
          </p>

          <h2>9. Transferencia internacional de datos</h2>
          <p>
            Supabase almacena datos en servidores de AWS. Dependiendo de la región seleccionada al crear el proyecto, los datos pueden estar fuera de Argentina. Supabase cumple con el RGPD europeo y cuenta con cláusulas contractuales estándar para transferencias internacionales.
          </p>

          <h2>10. Menores de edad</h2>
          <p>
            MejoraCRM no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores.
          </p>

          <h2>11. Cambios en esta política</h2>
          <p>
            Nos reservamos el derecho de modificar esta política. Los cambios significativos serán comunicados a través de la plataforma. El uso continuado del servicio después de un cambio implica la aceptación de la nueva política.
          </p>

          <h2>12. Autoridad de control</h2>
          <p>
            La autoridad de control competente en Argentina es la <strong>Dirección Nacional de Protección de Datos Personales</strong> (DNPDP), dependiente de la Agencia de Acceso a la Información Pública (AAIP).
          </p>
          <p>
            Sitio web: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/aaip</a>
          </p>
        </article>
      </div>
    </div>
  );
}
