import { createActionGroup, props } from '@ngrx/store';

export interface TabItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
  disabled?: boolean;
  closable?: boolean;
}

// Actions using createActionGroup
export const TabActions = createActionGroup({
  source: 'Tab',
  events: {
    'Add Tab': props<{ tab: TabItem }>(),
    'Remove Tab': props<{ id: string }>(),
    'Set Active Tab': props<{ id: string }>(),
    'Update Tab': props<{ id: string; updates: Partial<TabItem> }>()
  }
});