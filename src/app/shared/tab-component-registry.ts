import { Type } from '@angular/core';
import { InnerTabComponentType } from '../store';

// Import task components for registration
import { TaskLauncherComponent } from '../components/tasks/task-launcher/task-launcher.component';
import { TaskDetailComponent } from '../components/tasks/task-detail/task-detail.component';
import { TaskFormComponent } from '../components/tasks/task-form/task-form.component';

// Import overview components for registration
import { OverviewLauncherComponent } from '../components/overview/overview-launcher/overview-launcher.component';
import { OverviewChartComponent } from '../components/overview/overview-chart/overview-chart.component';
import { OverviewReportComponent } from '../components/overview/overview-report/overview-report.component';

// Import projects components for registration
import { ProjectLauncherComponent } from '../components/projects/project-launcher/project-launcher.component';
import { ProjectDetailComponent } from '../components/projects/project-detail/project-detail.component';
import { ProjectSettingsComponent } from '../components/projects/project-settings/project-settings.component';

/**
 * Registry mapping InnerTabComponentType enum values to their corresponding Angular components.
 * 
 * When you create a new inner tab component, register it here so the
 * InnerTabContainerComponent can dynamically load it.
 * 
 * @example
 * To add a new component:
 * 1. Add the component type to InnerTabComponentType enum
 * 2. Create the component
 * 3. Register it here: [InnerTabComponentType.NewType]: NewComponent
 */
export const TAB_COMPONENT_REGISTRY: Partial<Record<InnerTabComponentType, Type<unknown>>> = {
  // Task-related components
  [InnerTabComponentType.TaskLauncher]: TaskLauncherComponent,
  [InnerTabComponentType.TaskDetail]: TaskDetailComponent,
  [InnerTabComponentType.TaskForm]: TaskFormComponent,
  
  // Overview-related components
  [InnerTabComponentType.OverviewLauncher]: OverviewLauncherComponent,
  [InnerTabComponentType.OverviewChart]: OverviewChartComponent,
  [InnerTabComponentType.OverviewReport]: OverviewReportComponent,

  // Projects-related components
  [InnerTabComponentType.ProjectLauncher]: ProjectLauncherComponent,
  [InnerTabComponentType.ProjectDetail]: ProjectDetailComponent,
  [InnerTabComponentType.ProjectSettings]: ProjectSettingsComponent,
};

/**
 * Gets a component from the registry by its type.
 * 
 * @param type - The InnerTabComponentType enum value
 * @returns The component class or undefined if not registered
 */
export function getTabComponent(type: InnerTabComponentType): Type<unknown> | undefined {
  return TAB_COMPONENT_REGISTRY[type];
}

/**
 * Checks if a component type is registered.
 * 
 * @param type - The InnerTabComponentType enum value
 * @returns true if the component is registered
 */
export function isTabComponentRegistered(type: InnerTabComponentType): boolean {
  return type in TAB_COMPONENT_REGISTRY;
}
