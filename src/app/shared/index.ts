/**
 * Shared module exports for the inner tab system.
 */
export * from './base-tab-launcher';
export * from './inner-tab-container/inner-tab-container.component';
export * from './constants';

// Re-export generic interfaces for convenience
export type { InnerTabItem, InnerTabConfig } from './base-tab-launcher';
