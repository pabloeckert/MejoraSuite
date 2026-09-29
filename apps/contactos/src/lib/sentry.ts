// Stub offline para MejoraSuite Monorepo - sin dependencia de @sentry/react
export function initSentry(): void {
  // no-op en entorno offline / desktop suite
}

export function captureToSentry(error: unknown, context?: Record<string, any>): void {
  console.warn('[Offline ErrorReporter]', error, context);
}

export function setSentryUser(_userId: string): void {
  // no-op
}

export function addSentryBreadcrumb(_breadcrumb: Record<string, any>): void {
  // no-op
}
