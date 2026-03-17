import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-error-page',
  imports: [],
  templateUrl: './error-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage { }
