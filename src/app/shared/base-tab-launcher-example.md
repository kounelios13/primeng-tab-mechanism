# BaseTabLauncher Generic Type Example

## Overview

The `BaseTabLauncher` class now accepts a generic type parameter that allows you to specify a custom enum for component types. This provides better type safety and flexibility for different tab contexts. **The enum can be string-based or number-based.**

## Default Usage (Backward Compatible)

By default, `BaseTabLauncher` uses `InnerTabComponentType`:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType } from '../../../store';

export class TaskLauncherComponent extends BaseTabLauncher<InnerTabComponentType> {
  protected parentTabId = PARENT_TAB_IDS.TASKS;
  readonly componentType = InnerTabComponentType.TaskLauncher;

  override componentRegistry = new Map<InnerTabComponentType, Type<unknown>>([
    [InnerTabComponentType.TaskDetail, TaskDetailComponent],
    [InnerTabComponentType.TaskForm, TaskFormComponent]
  ]);

  openNewTaskForm(): void {
    this.openInnerTab({
      id: 'task-new-form',
      title: 'New Task',
      componentType: InnerTabComponentType.TaskForm,
      icon: 'pi pi-plus',
      closable: true,
      singleton: true
    });
  }
}
```

## Custom String Enum Usage

You can now define your own string-based enum and use it with `BaseTabLauncher`:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS, InnerTabConfig } from '../../../shared';
import { InnerTabComponentType } from '../../../store';

// Define a custom string enum for your feature
enum MyFeatureComponentType {
  MyFeatureLauncher = 'my-feature-launcher',
  MyFeatureDetail = 'my-feature-detail',
  MyFeatureForm = 'my-feature-form',
  MyFeatureSettings = 'my-feature-settings'
}

export class MyFeatureLauncherComponent extends BaseTabLauncher<MyFeatureComponentType> {
  protected parentTabId = PARENT_TAB_IDS.MY_FEATURE;
  readonly componentType = MyFeatureComponentType.MyFeatureLauncher;

  override componentRegistry = new Map<MyFeatureComponentType, Type<unknown>>([
    [MyFeatureComponentType.MyFeatureDetail, MyFeatureDetailComponent],
    [MyFeatureComponentType.MyFeatureForm, MyFeatureFormComponent],
    [MyFeatureComponentType.MyFeatureSettings, MyFeatureSettingsComponent]
  ]);

  openFeatureDetail(id: string): void {
    this.openInnerTab({
      id: `feature-detail-${id}`,
      title: 'Feature Detail',
      componentType: MyFeatureComponentType.MyFeatureDetail, // Type-safe!
      icon: 'pi pi-file',
      closable: true,
      data: { featureId: id }
    });
  }

  // The canOpenTab method now uses your custom enum type
  protected override canOpenTab(
    componentType: MyFeatureComponentType, 
    config: InnerTabConfig<MyFeatureComponentType>
  ): boolean {
    if (componentType === MyFeatureComponentType.MyFeatureDetail) {
      // Custom logic for your feature
      return this.currentTabs().filter(
        tab => tab.componentType === MyFeatureComponentType.MyFeatureDetail
      ).length < 10;
    }
    return true;
  }
  
  // Override mapping methods to convert between your enum and the store enum
  protected override mapStoreTypeToGenericType(storeType: InnerTabComponentType): MyFeatureComponentType {
    // Custom mapping logic based on your requirements
    switch (storeType) {
      case InnerTabComponentType.GenericLauncher:
        return MyFeatureComponentType.MyFeatureLauncher;
      // ... add other mappings as needed
      default:
        return storeType as unknown as MyFeatureComponentType;
    }
  }
  
  protected override mapGenericTypeToStoreType(genericType: MyFeatureComponentType): InnerTabComponentType {
    // Custom mapping logic based on your requirements
    switch (genericType) {
      case MyFeatureComponentType.MyFeatureLauncher:
        return InnerTabComponentType.GenericLauncher;
      // ... add other mappings as needed
      default:
        return genericType as unknown as InnerTabComponentType;
    }
  }
}
```

## Custom Number Enum Usage

You can also use number-based enums:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS, InnerTabConfig } from '../../../shared';
import { InnerTabComponentType } from '../../../store';

// Define a custom number enum
enum FeatureTabType {
  Launcher = 0,
  Detail = 1,
  Form = 2,
  Settings = 3
}

export class FeatureLauncherComponent extends BaseTabLauncher<FeatureTabType> {
  protected parentTabId = PARENT_TAB_IDS.FEATURE;
  readonly componentType = FeatureTabType.Launcher;

  override componentRegistry = new Map<FeatureTabType, Type<unknown>>([
    [FeatureTabType.Detail, FeatureDetailComponent],
    [FeatureTabType.Form, FeatureFormComponent],
    [FeatureTabType.Settings, FeatureSettingsComponent]
  ]);

  openDetail(id: string): void {
    this.openInnerTab({
      id: `feature-detail-${id}`,
      title: 'Feature Detail',
      componentType: FeatureTabType.Detail, // Number enum - fully type-safe!
      icon: 'pi pi-file',
      closable: true,
      data: { featureId: id }
    });
  }

  // Override mapping methods for number enum
  protected override mapStoreTypeToGenericType(storeType: InnerTabComponentType): FeatureTabType {
    // Map store string enum to number enum
    const mapping: Record<string, FeatureTabType> = {
      'generic-launcher': FeatureTabType.Launcher,
      'feature-detail': FeatureTabType.Detail,
      'feature-form': FeatureTabType.Form,
      'settings': FeatureTabType.Settings
    };
    return mapping[storeType] ?? FeatureTabType.Launcher;
  }
  
  protected override mapGenericTypeToStoreType(genericType: FeatureTabType): InnerTabComponentType {
    // Map number enum to store string enum
    const mapping: Record<FeatureTabType, InnerTabComponentType> = {
      [FeatureTabType.Launcher]: InnerTabComponentType.GenericLauncher,
      [FeatureTabType.Detail]: InnerTabComponentType.Settings, // or a custom type
      [FeatureTabType.Form]: InnerTabComponentType.Settings,
      [FeatureTabType.Settings]: InnerTabComponentType.Settings
    };
    return mapping[genericType] ?? InnerTabComponentType.GenericLauncher;
  }
}
```

## Benefits

1. **Type Safety**: Your custom enum provides compile-time type checking for component types
2. **Better IntelliSense**: IDEs can provide autocomplete for your custom enum values
3. **Flexibility**: Each feature can have its own set of component types
4. **Number Enums Supported**: Use number-based enums if that suits your architecture
5. **Backward Compatible**: Existing code continues to work without changes
6. **Full Control**: Override mapping methods to control conversion between your enum and the store

## Mapping Methods

The `BaseTabLauncher` provides two methods you can override for custom type conversions:

- `mapStoreTypeToGenericType(storeType: InnerTabComponentType): TComponentType` - Converts store types to your generic type
- `mapGenericTypeToStoreType(genericType: TComponentType): InnerTabComponentType` - Converts your generic type to store types

The default implementation uses type casting (`as unknown as`), which works fine when your enum values match the store enum values. For custom mappings (especially with number enums), override these methods.

## Important Notes

- The generic type parameter has no constraints - it can be any type (string enum, number enum, etc.)
- The `BaseTabLauncher` handles all conversions between your custom type and the store's `InnerTabComponentType`
- Override the mapping methods (`mapStoreTypeToGenericType` and `mapGenericTypeToStoreType`) when you need custom conversion logic
- All tab-related methods (`openInnerTab`, `canOpenTab`, `isTabTypeOpen`, `findTabByType`, etc.) work with your custom type

