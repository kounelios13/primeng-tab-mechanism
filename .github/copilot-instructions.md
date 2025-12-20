# Copilot Instructions for PrimeNG Tab Mechanism Project

## Project Overview
This is an Angular 19 standalone application designed to implement and experiment with PrimeNG tab functionality. The project uses the latest Angular features including standalone components and modern build tools. PrimeNG 19 and PrimeIcons are installed and configured.

## Architecture & Key Conventions

### Angular 19 Standalone Architecture
- **No NgModules**: This project uses standalone components exclusively
- **Component Structure**: Components use `imports` array instead of module declarations
- **Bootstrap**: Application bootstrapped via `bootstrapApplication()` in `main.ts`
- **Routing**: Uses function-based routing with `provideRouter()` in `app.config.ts`

### Project Structure
```
src/app/
├── app.component.*     # Root component (standalone)
├── app.config.ts       # Application configuration & providers
└── app.routes.ts       # Routing configuration
```

## Development Workflow

### Essential Commands
```bash
# Development server (runs on http://localhost:4200)
npm start
ng serve

# Build for production
npm run build
ng build

# Run tests
npm test
ng test

# Generate components (will be standalone by default)
ng generate component <name>
```

### Code Generation Patterns
- **Components**: Always generated as standalone (`ng g c component-name`)
- **Styling**: Project uses SCSS (configured in angular.json)
- **Prefix**: Components use `app-` prefix (configured in angular.json)

## PrimeNG Integration ✅ Installed

### Current Setup:
- **PrimeNG 19**: Installed and compatible with Angular 19
- **PrimeNG Themes**: @primeng/themes package installed (configured via providers, not CSS)
- **PrimeIcons**: Installed for icon support
- **Styling**: Modern theme system using JavaScript configuration
- **NgRx 19**: Store, Effects, and DevTools configured for state management

### Using PrimeNG Components:
```typescript
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [CommonModule, TabViewModule, ButtonModule],
  template: `
    <p-tabView>
      <p-tabPanel header="Tab 1">Content 1</p-tabPanel>
      <p-tabPanel header="Tab 2">Content 2</p-tabPanel>
    </p-tabView>
  `
})
```

### Tab Implementation Patterns

#### Basic Static Tabs:
```html
<p-tabView>
  <p-tabPanel header="Overview" leftIcon="pi pi-info-circle">
    <p>Overview content here</p>
  </p-tabPanel>
  <p-tabPanel header="Details" leftIcon="pi pi-list">
    <p>Details content here</p>
  </p-tabPanel>
</p-tabView>
```

#### Dynamic Tabs:
```typescript
tabs = [
  { title: 'Tab 1', content: 'Content 1', icon: 'pi pi-home' },
  { title: 'Tab 2', content: 'Content 2', icon: 'pi pi-user', disabled: false }
];
```

```html
<p-tabView (onChange)="onTabChange($event)">
  <p-tabPanel 
    *ngFor="let tab of tabs" 
    [header]="tab.title" 
    [leftIcon]="tab.icon"
    [disabled]="tab.disabled">
    {{ tab.content }}
  </p-tabPanel>
</p-tabView>
```

## State Management with NgRx ✅ Configured

### Tab State Structure:
```typescript
interface TabItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
  disabled?: boolean;
  closable?: boolean;
}

interface TabState {
  tabs: TabItem[];
  activeTabId: string | null;
}
```

### Using Tab State in Components:
```typescript
import { Store } from '@ngrx/store';
import { selectAllTabs, selectActiveTab, TabActions } from './store';

@Component({
  // ...
})
export class TabComponent {
  tabs$ = this.store.select(selectAllTabs);
  activeTab$ = this.store.select(selectActiveTab);

  constructor(private store: Store) {}

  onTabChange(event: any) {
    const tabId = this.tabs[event.index].id;
    this.store.dispatch(TabActions.setActiveTab({ id: tabId }));
  }

  addNewTab() {
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      content: 'New tab content'
    };
    this.store.dispatch(TabActions.addTab({ tab: newTab }));
  }
}
```

### Available Actions:
- `TabActions.addTab({ tab })` - Add a new tab
- `TabActions.removeTab({ id })` - Remove a tab by ID
- `TabActions.setActiveTab({ id })` - Set the active tab
- `TabActions.updateTab({ id, updates })` - Update tab properties

### Store Structure:
- **State**: `src/app/store/tab.reducer.ts`
- **Actions**: `src/app/store/tab.actions.ts`
- **Selectors**: `src/app/store/tab.selectors.ts`
- **DevTools**: Enabled in development mode

## Testing Considerations
- **Karma + Jasmine**: Default testing setup
- **Component Testing**: Test tab switching behavior and dynamic content loading
- **Accessibility**: Ensure proper ARIA attributes for tab navigation

## Build Configuration
- **Bundle Size Limits**: 
  - Initial: 500kB warning, 1MB error
  - Component styles: 4kB warning, 8kB error
- **Source Maps**: Enabled in development
- **Output**: `dist/primeng-tab-mechanism/`

## Common Patterns to Follow

### Component Structure
```typescript
@Component({
  selector: 'app-feature',
  imports: [CommonModule, /* PrimeNG modules */],
  templateUrl: './feature.component.html',
  styleUrl: './feature.component.scss'
})
export class FeatureComponent {
  // Implementation
}
```

### Modern SCSS Imports (Use @use instead of @import)
```scss
@use 'primeicons/primeicons.css';
```

### Theme Configuration
PrimeNG 19 uses JavaScript-based themes configured via providers in `app.config.ts`:
```typescript
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({ theme: { preset: Aura } }),
    // other providers
  ]
};
```

### Tab Data Structure
```typescript
interface TabItem {
  header: string;
  content?: string;
  disabled?: boolean;
  closable?: boolean;
}
```

## Performance Notes
- Consider virtual scrolling for large numbers of tabs
- Implement lazy loading for heavy tab content
- Use OnPush change detection strategy for better performance
- Keep bundle size in mind when adding PrimeNG components