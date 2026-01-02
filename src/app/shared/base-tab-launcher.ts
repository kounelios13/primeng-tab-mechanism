import { computed, Directive, inject, Injector, Input, Signal, Type } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { 
  InnerTabActions, 
  InnerTabConfig as StoreInnerTabConfig, 
  InnerTabComponentType,
  InnerTabItem as StoreInnerTabItem,
  selectInnerTabs 
} from '../store';
import { ParentTabId } from './constants';

/**
 * Generic interface for inner tab items that belong to a parent main tab.
 * This allows launchers to use custom enum types for component types.
 * 
 * @template TComponentType - The type used for component types (can be string enum, number enum, etc.)
 */
export interface InnerTabItem<TComponentType = InnerTabComponentType> {
  id: string;
  parentTabId: string;
  title: string;
  componentType: TComponentType;
  icon?: string;
  closable: boolean;
  singleton?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Generic configuration for creating a new inner tab.
 * parentTabId is added automatically by the launcher.
 * 
 * @template TComponentType - The type used for component types (can be string enum, number enum, etc.)
 */
export type InnerTabConfig<TComponentType = InnerTabComponentType> = Omit<InnerTabItem<TComponentType>, 'parentTabId'>;

/**
 * Abstract base class for tab launcher components.
 * Extend this class in your launcher components to get access to
 * common inner tab management functionality.
 * 
 * Features:
 * - Signal-based tab state for reactive access
 * - Component registry management for dynamic tab loading
 * - canOpenTab() method that can be overridden for custom logic
 * - Automatic focus on existing tab when singleton is opened
 * 
 * @template TComponentType - The enum type used for component types (can be string enum, number enum, etc.)
 * 
 * @remarks
 * The generic type parameter allows you to use custom enums (string-based or number-based)
 * for better type safety in your launcher component. The base launcher will handle the
 * conversion between your custom enum type and the store's `InnerTabComponentType`.
 * 
 * @example
 * ```typescript
 * export class TaskLauncherComponent extends BaseTabLauncher<InnerTabComponentType> {
 *   protected parentTabId = PARENT_TAB_IDS.TASKS;
 *   readonly componentType = InnerTabComponentType.TaskLauncher;
 * 
 *   // Initialize component registry for this launcher
 *   override componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
 *     [InnerTabComponentType.TaskDetail, TaskDetailComponent],
 *     [InnerTabComponentType.TaskForm, TaskFormComponent]
 *   ]);
 * 
 *   openNewTaskForm(): void {
 *     this.openInnerTab({
 *       id: this.generateTabId('task-new'),
 *       title: 'New Task',
 *       componentType: InnerTabComponentType.TaskForm,
 *       icon: 'pi pi-plus',
 *       closable: true,
 *       singleton: true  // Only one instance allowed
 *     });
 *   }
 * }
 * ```
 * 
 * @example With custom string enum
 * ```typescript
 * enum CustomComponentType {
 *   CustomLauncher = 'custom-launcher',
 *   CustomDetail = 'custom-detail',
 *   CustomForm = 'custom-form'
 * }
 * 
 * export class CustomLauncherComponent extends BaseTabLauncher<CustomComponentType> {
 *   protected parentTabId = PARENT_TAB_IDS.CUSTOM;
 *   readonly componentType = CustomComponentType.CustomLauncher;
 * 
 *   override componentRegistry = new Map<CustomComponentType, Type<unknown>>([
 *     [CustomComponentType.CustomDetail, CustomDetailComponent]
 *   ]);
 * }
 * ```
 * 
 * @example With custom number enum
 * ```typescript
 * enum FeatureTabType {
 *   Launcher = 0,
 *   Detail = 1,
 *   Form = 2
 * }
 * 
 * export class FeatureLauncherComponent extends BaseTabLauncher<FeatureTabType> {
 *   protected parentTabId = PARENT_TAB_IDS.FEATURE;
 *   readonly componentType = FeatureTabType.Launcher;
 * 
 *   override componentRegistry = new Map<FeatureTabType, Type<unknown>>([
 *     [FeatureTabType.Detail, FeatureDetailComponent]
 *   ]);
 * }
 * ```
 */
@Directive()
export abstract class BaseTabLauncher<TComponentType = InnerTabComponentType> {
  /**
   * The ID of the parent tab this launcher belongs to.
   * Must be set by the extending class using PARENT_TAB_IDS constants.
   */
  protected abstract parentTabId: ParentTabId;

  /**
   * The component type of this launcher.
   * Must be set by the extending class.
   */
  abstract readonly componentType: TComponentType;

  /**
   * Component registry mapping component type to component classes.
   * Each child class should initialize this with their specific components.
   * This can be used in templates to iterate over available components.
   * 
   * @example
   * ```typescript
   * componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
   *   [InnerTabComponentType.TaskDetail, TaskDetailComponent],
   *   [InnerTabComponentType.TaskForm, TaskFormComponent]
   * ]);
   * ```
   */
  componentRegistry: Map<TComponentType, Type<unknown>> = new Map();

  /**
   * Data passed from the inner tab system via ngComponentOutlet.
   * Available for launchers that need initialization data.
   */
  @Input() tabData?: Record<string, unknown>;

  /**
   * The ID of this tab, passed from the inner tab system.
   */
  @Input() tabId?: string;

  /**
   * NgRx Store instance, injected automatically.
   */
  protected store = inject(Store);

  /**
   * Injector instance for creating signals outside injection context.
   */
  private injector = inject(Injector);

  /**
   * Signal containing current inner tabs from store.
   * Automatically updates when store changes.
   * Note: Initialized lazily in getter due to abstract parentTabId.
   */
  private _currentTabs?: Signal<InnerTabItem<TComponentType>[]>;

  protected get currentTabs(): Signal<InnerTabItem<TComponentType>[]> {
    if (!this._currentTabs) {
      const storeTabs = toSignal(
        this.store.select(selectInnerTabs(this.parentTabId)), 
        { initialValue: [], injector: this.injector }
      );
      
      // Map store tabs to generic tabs
      this._currentTabs = computed(() => 
        storeTabs().map(tab => this.mapStoreTabToGenericTab(tab))
      );
    }
    return this._currentTabs;
  }

  /**
   * Maps a store tab item to a generic tab item.
   * Subclasses can override this to provide custom mapping logic.
   * 
   * @param storeTab - The tab item from the store
   * @returns The mapped generic tab item
   */
  protected mapStoreTabToGenericTab(storeTab: StoreInnerTabItem): InnerTabItem<TComponentType> {
    return {
      ...storeTab,
      componentType: this.mapStoreTypeToGenericType(storeTab.componentType)
    };
  }

  /**
   * Maps a store component type to the generic type.
   * Subclasses should override this to provide custom mapping logic.
   * 
   * **Default implementation**: Uses double casting to convert between types.
   * This works when your generic enum values are compatible with `InnerTabComponentType` values
   * (e.g., when both are string enums with matching values).
   * 
   * **For custom mappings** (e.g., number enums or incompatible string values),
   * override this method with your own conversion logic.
   * 
   * @param storeType - The component type from the store
   * @returns The mapped generic type
   * 
   * @example
   * ```typescript
   * // Custom mapping for number enum
   * protected override mapStoreTypeToGenericType(storeType: InnerTabComponentType): MyNumberEnum {
   *   const mapping: Record<InnerTabComponentType, MyNumberEnum> = {
   *     [InnerTabComponentType.GenericLauncher]: MyNumberEnum.Launcher,
   *     // ... other mappings
   *   };
   *   return mapping[storeType] ?? MyNumberEnum.Launcher;
   * }
   * ```
   */
  protected mapStoreTypeToGenericType(storeType: InnerTabComponentType): TComponentType {
    // Default: Double cast for maximum flexibility
    // Override this method for custom type conversions
    return storeType as unknown as TComponentType;
  }

  /**
   * Maps a generic component type to the store type.
   * Subclasses should override this to provide custom mapping logic.
   * 
   * **Default implementation**: Uses double casting to convert between types.
   * This works when your generic enum values are compatible with `InnerTabComponentType` values
   * (e.g., when both are string enums with matching values).
   * 
   * **For custom mappings** (e.g., number enums or incompatible string values),
   * override this method with your own conversion logic.
   * 
   * @param genericType - The generic component type
   * @returns The mapped store type
   * 
   * @example
   * ```typescript
   * // Custom mapping for number enum
   * protected override mapGenericTypeToStoreType(genericType: MyNumberEnum): InnerTabComponentType {
   *   const mapping: Record<MyNumberEnum, InnerTabComponentType> = {
   *     [MyNumberEnum.Launcher]: InnerTabComponentType.GenericLauncher,
   *     // ... other mappings
   *   };
   *   return mapping[genericType] ?? InnerTabComponentType.GenericLauncher;
   * }
   * ```
   */
  protected mapGenericTypeToStoreType(genericType: TComponentType): InnerTabComponentType {
    // Default: Double cast for maximum flexibility
    // Override this method for custom type conversions
    return genericType as unknown as InnerTabComponentType;
  }

  /**
   * Opens a new inner tab within the parent tab context.
   * If the tab is marked as singleton and already exists, focuses the existing tab.
   * Uses canOpenTab() for additional custom validation.
   * 
   * Instead of directly adding the tab to the store, this method dispatches a request
   * that will be handled by the parent component via a selector-based mechanism.
   * 
   * @param config - Configuration for the new inner tab
   * @returns true if tab was opened, false if blocked (singleton exists or canOpenTab returned false)
   */
  protected openInnerTab(config: InnerTabConfig<TComponentType>): boolean {
    const tabs = this.currentTabs();
    
    // Check if singleton and already exists
    if (config.singleton) {
      const existingTab = tabs.find(tab => tab.componentType === config.componentType);
      if (existingTab) {    
        this.focusExistingTab(existingTab.id);
        return false;
      }
    }

    // Check custom validation
    if (!this.canOpenTab(config.componentType, config)) {
      return false;
    }

    // Convert generic config to store config
    const storeConfig: StoreInnerTabConfig = {
      ...config,
      componentType: this.mapGenericTypeToStoreType(config.componentType)
    };

    // Dispatch request action instead of directly adding the tab
    this.store.dispatch(InnerTabActions.requestAddInnerTab({
      parentTabId: this.parentTabId,
      tab: {
        ...storeConfig,
        parentTabId: this.parentTabId
      }
    }));

    return true;
  }

  /**
   * Determines if a tab of the given type can be opened.
   * Override this method in subclasses for custom validation logic.
   * 
   * @param componentType - The type of component to open
   * @param config - The full tab configuration
   * @returns true if the tab can be opened, false otherwise
   */
  protected canOpenTab(componentType: TComponentType, config: InnerTabConfig<TComponentType>): boolean {
    // Default implementation: always allow
    // Subclasses can override for custom logic
    return true;
  }

  /**
   * Checks if a tab of the given component type is currently open.
   * 
   * @param componentType - The component type to check
   * @returns true if a tab of this type exists
   */
  protected isTabTypeOpen(componentType: TComponentType): boolean {
    return this.currentTabs().some(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its component type.
   * 
   * @param componentType - The component type to find
   * @returns The tab item if found, undefined otherwise
   */
  protected findTabByType(componentType: TComponentType): InnerTabItem<TComponentType> | undefined {
    return this.currentTabs().find(tab => tab.componentType === componentType);
  }

  /**
   * Finds an existing tab by its ID.
   * 
   * @param tabId - The tab ID to find
   * @returns The tab item if found, undefined otherwise
   */
  protected findTabById(tabId: string): InnerTabItem<TComponentType> | undefined {
    return this.currentTabs().find(tab => tab.id === tabId);
  }

  /**
   * Focuses an existing tab by setting it as active.
   * Useful when trying to open a singleton that already exists.
   * 
   * @param tabId - The ID of the tab to focus
   */
  protected focusExistingTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Closes an inner tab by its ID.
   * 
   * @param tabId - The ID of the tab to close
   */
  protected closeInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.removeInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Sets the active inner tab.
   * 
   * @param tabId - The ID of the tab to activate
   */
  protected setActiveInnerTab(tabId: string): void {
    this.store.dispatch(InnerTabActions.setActiveInnerTab({
      parentTabId: this.parentTabId,
      tabId
    }));
  }

  /**
   * Updates properties of an existing inner tab.
   * 
   * @param tabId - The ID of the tab to update
   * @param updates - Partial properties to update
   */
  protected updateInnerTab(tabId: string, updates: Partial<InnerTabConfig<TComponentType>>): void {
    // Convert generic updates to store updates
    const storeUpdates: Partial<StoreInnerTabConfig> = {
      ...updates
    } as Partial<StoreInnerTabConfig>;
    
    // Handle componentType conversion separately to avoid type issues
    if (updates.componentType !== undefined) {
      storeUpdates.componentType = this.mapGenericTypeToStoreType(updates.componentType);
    }
    
    this.store.dispatch(InnerTabActions.updateInnerTab({
      parentTabId: this.parentTabId,
      tabId,
      updates: storeUpdates
    }));
  }

  /**
   * Generates a unique tab ID with an optional prefix.
   * 
   * @param prefix - Optional prefix for the ID
   * @returns A unique string ID
   */
  protected generateTabId(prefix: string = 'tab'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
