# BaseTabLauncher Generic Type Example

## Overview

The `BaseTabLauncher` class now accepts a generic type parameter that allows you to specify a custom enum for component types. This provides better type safety and flexibility for different tab contexts.

## Default Usage (Backward Compatible)

By default, `BaseTabLauncher` uses `InnerTabComponentType`:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType } from '../../../store';

export class TaskLauncherComponent extends BaseTabLauncher {
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

## Custom Enum Usage

You can now define your own enum and use it with `BaseTabLauncher`:

```typescript
import { BaseTabLauncher, PARENT_TAB_IDS } from '../../../shared';
import { InnerTabComponentType } from '../../../store';

// Define a custom enum for your feature
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
    config: InnerTabConfig
  ): boolean {
    if (componentType === MyFeatureComponentType.MyFeatureDetail) {
      // Custom logic for your feature
      return this.currentTabs().filter(
        tab => tab.componentType === MyFeatureComponentType.MyFeatureDetail as InnerTabComponentType
      ).length < 10;
    }
    return true;
  }
}
```

## Benefits

1. **Type Safety**: Your custom enum provides compile-time type checking for component types
2. **Better IntelliSense**: IDEs can provide autocomplete for your custom enum values
3. **Flexibility**: Each feature can have its own set of component types
4. **Backward Compatible**: Existing code continues to work without changes

## Important Notes

- The custom enum values must be strings (extending `string` type)
- The enum values should match the values in the global `InnerTabComponentType` enum or be registered in the component registry
- When using custom enums, you may need to cast to `InnerTabComponentType` when comparing with store data (as shown in the `canOpenTab` example)
