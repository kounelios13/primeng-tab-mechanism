/**
 * Shared Module Exports
 * 
 * This module provides shared utilities, base classes, and constants
 * for the inner tab system.
 * 
 * ## Base Tab Wrapper
 * - `BaseTabWrapper` - Abstract base class for tab wrapper components
 * - `ComponentRegistry` - Type for component type to class mappings
 * 
 * ## Constants
 * - `PARENT_TAB_IDS` - Constants for parent tab identifiers
 * - `ParentTabId` - Type for valid parent tab IDs
 * - `ALL_PARENT_TAB_IDS` - Array of all parent tab IDs
 * 
 * @example
 * ```typescript
 * import { BaseTabWrapper, PARENT_TAB_IDS, ComponentRegistry } from '../shared';
 * 
 * @Component({...})
 * export class MyComponent extends BaseTabWrapper {
 *   readonly parentTabId = PARENT_TAB_IDS.TASKS;
 *   readonly componentRegistry: ComponentRegistry = new Map([...]);
 * }
 * ```
 */
export * from './base-tab-wrapper';
export * from './constants';
