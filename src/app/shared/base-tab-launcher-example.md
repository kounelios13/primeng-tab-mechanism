# BaseTabLauncher Generic Type Example

## Overview

The `BaseTabLauncher` class accepts a generic type parameter for component types, and the store is fully agnostic - it accepts `string | number | undefined` for component types. This provides maximum flexibility for different tab contexts.

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

You can define your own string-based enum:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabConfig } from '../../../store';

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

  // The canOpenTab method uses your custom enum type
  protected override canOpenTab(
    componentType: MyFeatureComponentType, 
    config: InnerTabConfig
  ): boolean {
    if (componentType === MyFeatureComponentType.MyFeatureDetail) {
      // Custom logic for your feature
      return this.currentTabs().filter(
        tab => tab.componentType === MyFeatureComponentType.MyFeatureDetail
      ).length < 10;
    }
    return true;
  }
}
```

## Custom Number Enum Usage

You can also use number-based enums directly:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabConfig } from '../../../store';

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

  protected override canOpenTab(
    componentType: FeatureTabType,
    config: InnerTabConfig
  ): boolean {
    if (componentType === FeatureTabType.Detail) {
      return this.currentTabs().filter(
        tab => tab.componentType === FeatureTabType.Detail
      ).length < 5;
    }
    return true;
  }
}
```

## Benefits

1. **Type Safety**: Your custom enum provides compile-time type checking for component types
2. **Better IntelliSense**: IDEs provide autocomplete for your custom enum values
3. **Flexibility**: Each feature can have its own set of component types
4. **Number Enums Supported**: Use number-based enums if that suits your architecture
5. **Store Agnostic**: The store accepts `string | number | undefined`, no conversion needed
6. **No Mapping Required**: Direct usage of your enum values without conversion layers

## Store Agnostic Design

The `InnerTabItem` interface in the store uses `componentType: string | number | undefined`, making it fully agnostic to the type of enum you use. This means:

- **No type conversion** - Your enum values are stored directly
- **Maximum flexibility** - Use any enum type (string, number, or even undefined)
- **Simple implementation** - No need to override mapping methods
- **Backward compatible** - Existing `InnerTabComponentType` enum still works

## Important Notes

- The generic type parameter must extend `string | number | undefined`
- The store is fully agnostic and stores your enum values directly
- All tab-related methods (`openInnerTab`, `canOpenTab`, `isTabTypeOpen`, `findTabByType`, etc.) work with your custom type
- No conversion or mapping is required between your enum and the store

