/**
 * Shared Module Exports
 *
 * This module provides shared utilities, base classes, and constants
 * for the inner tab system.
 *
 * ## Base Tab Wrapper
 * - `BaseTabWrapper` - Abstract base class for tab wrapper components
 * - `ComponentRegistry` - Type for component type to class mappings
 * - `IInnerTabComponent` - Interface that all inner tab content components should implement
 *
 * ## Constants
 * - `PARENT_TAB_IDS` - Constants for parent tab identifiers
 * - `ParentTabId` - Type for valid parent tab IDs
 * - `ALL_PARENT_TAB_IDS` - Array of all parent tab IDs
 *
 * @example
 * ```typescript
 * import { BaseTabWrapper, IInnerTabComponent, PARENT_TAB_IDS, ComponentRegistry } from '../shared';
 *
 * @Component({...})
 * export class MyComponent extends BaseTabWrapper {
 *   readonly parentTabId = PARENT_TAB_IDS.TASKS;
 *   readonly componentRegistry: ComponentRegistry = new Map([...]);
 * }
 *
 * @Component({...})
 * export class MyInnerTabComponent implements IInnerTabComponent {
 *   @Input() tabData?: Record<string, unknown>;
 *   @Input() tabId?: string;
 *   @Input() parentTabId?: string;
 * }
 * ```
 */
export * from './base-tab-wrapper';
export * from './constants';
