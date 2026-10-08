import React from 'react';

declare module '@mejora/crm' {
  export const CrmApp: React.ComponentType<any>;
  export const CrmNucleoWidget: React.ComponentType<any>;
}

declare module '@mejora/contactos' {
  export const ContactosApp: React.ComponentType<any>;
  export const ContactosNucleoWidget: React.ComponentType<any>;
}

declare module '@mejora/sm' {
  export const SmApp: React.ComponentType<any>;
}
