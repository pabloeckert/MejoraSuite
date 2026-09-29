import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
          <h1>Términos de Servicio</h1>
          <p className="text-muted-foreground">
            Última actualización: 25 de abril de 2026
          </p>

          <h2>1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar <strong>MejoraCRM</strong> (disponible en <a href="https://mejoracrm.vercel.app">mejoracrm.vercel.app</a>), usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no utilice el servicio.
          </p>

          <h2>2. Descripción del servicio</h2>
          <p>
            MejoraCRM es una plataforma de gestión de relaciones con clientes (CRM) que permite:
          </p>
          <ul>
            <li>Gestionar un catálogo de clientes y contactos</li>
            <li>Registrar interacciones comerciales (presupuestos, ventas, seguimientos)</li>
            <li>Administrar un catálogo de productos y servicios</li>
            <li>Visualizar reportes y estadísticas del proceso de ventas</li>
            <li>Recibir notificaciones sobre seguimientos programados</li>
          </ul>

          <h2>3. Cuenta de usuario</h2>
          <h3>3.1 Registro</h3>
          <ul>
            <li>Debe proporcionar información veraz al registrarse</li>
            <li>Es responsable de mantener la confidencialidad de su contraseña</li>
            <li>Debe notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
          </ul>
          <h3>3.2 Roles</h3>
          <p>El sistema distingue tres roles con diferentes niveles de acceso:</p>
          <ul>
            <li><strong>Administrador:</strong> acceso completo, gestión de usuarios y configuración</li>
            <li><strong>Supervisión:</strong> acceso a todos los clientes, reportes y productos</li>
            <li><strong>Vendedor:</strong> acceso limitado a sus clientes asignados</li>
          </ul>

          <h2>4. Uso aceptable</h2>
          <p>Se compromete a:</p>
          <ul>
            <li>Utilizar el servicio únicamente con fines comerciales legítimos</li>
            <li>No intentar acceder a datos de otros usuarios sin autorización</li>
            <li>No introducir código malicioso o intentar vulnerar la seguridad</li>
            <li>No sobrecargar el sistema con solicitudes automatizadas</li>
            <li>Cumplir con la legislación aplicable en el tratamiento de datos de sus clientes</li>
          </ul>

          <h2>5. Datos y propiedad</h2>
          <ul>
            <li><strong>Usted conserva la propiedad</strong> de todos los datos que ingresa en el CRM</li>
            <li>La Empresa no reclama ningún derecho sobre sus datos comerciales</li>
            <li>Puede exportar sus datos en cualquier momento desde la sección de Configuración</li>
            <li>Puede solicitar la eliminación completa de sus datos (ver <Link to="/privacy" className="underline">Política de Privacidad</Link>)</li>
          </ul>

          <h2>6. Disponibilidad del servicio</h2>
          <ul>
            <li>El servicio se provee "tal cual" sin garantía de disponibilidad del 100%</li>
            <li>Podemos realizar mantenimiento programado con aviso previo cuando sea posible</li>
            <li>No somos responsables por interrupciones del servicio fuera de nuestro control</li>
          </ul>

          <h2>7. Limitación de responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley aplicable, la Empresa no será responsable por:
          </p>
          <ul>
            <li>Pérdida de datos por causas ajenas a nuestro control</li>
            <li>Daños indirectos, incidentales o consecuentes</li>
            <li>Decisiones comerciales tomadas basándose en la información del CRM</li>
            <li>Interrupciones del servicio por mantenimiento o causas de fuerza mayor</li>
          </ul>

          <h2>8. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos. Los cambios serán notificados a través de la plataforma. El uso continuado del servicio después de la notificación implica la aceptación de los nuevos términos.
          </p>

          <h2>9. Resolución de disputas</h2>
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será sometida a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
          </p>

          <h2>10. Contacto</h2>
          <p>
            Para consultas sobre estos términos, contactar a: <strong>legal@mejoraok.com</strong>
          </p>
        </article>
      </div>
    </div>
  );
}
