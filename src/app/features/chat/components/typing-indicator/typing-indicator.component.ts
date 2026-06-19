import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `,
  styles: [`.typing-dots { display: flex; gap: 4px; align-items: center; padding: 4px 0; }`],
})
export class TypingIndicatorComponent {}
