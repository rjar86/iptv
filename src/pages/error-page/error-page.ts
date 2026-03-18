import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [],
  templateUrl: './error-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage { }
