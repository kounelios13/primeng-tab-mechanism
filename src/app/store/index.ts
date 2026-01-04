/**
 * NgRx Store Exports
 * 
 * This module provides the state management layer for the tab system,
 * including both main tabs and inner tabs.
 * 
 * ## Main Tab Store
 * - `TabActions` - Actions for managing main tabs
 * - `tabFeature` - Feature state for main tabs
 * - `selectAllTabs`, `selectActiveTabId` - Main tab selectors
 * 
 * ## Inner Tab Store
 * - `InnerTabActions` - Actions for managing inner tabs
 * - `innerTabFeature` - Feature state for inner tabs
 * - `selectInnerTabs()`, `selectActiveInnerTabId()` - Inner tab selectors
 * - `InnerTabComponentType` - Enum of available component types
 * 
 * @example
 * ```typescript
 * import { 
 *   TabActions, 
 *   InnerTabActions, 
 *   InnerTabComponentType,
 *   selectInnerTabs 
 * } from './store';
 * ```
 */

// Main Tab Store
export * from './tab.actions';
export * from './tab.reducer';
export * from './tab.selectors';

// Inner Tab Store
export * from './inner-tab.actions';
export * from './inner-tab.reducer';
export * from './inner-tab.selectors';

// Re-export commonly used items for convenience
export { TabActions } from './tab.actions';
export { tabFeature } from './tab.reducer';
export { InnerTabActions, InnerTabComponentType } from './inner-tab.actions';
export { innerTabFeature } from './inner-tab.reducer';