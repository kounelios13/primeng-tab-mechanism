import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabPanelComponent } from './tab-panel/tab-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'primeng-tab-mechanism';
}
