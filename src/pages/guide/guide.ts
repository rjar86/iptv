import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-guide',
  imports: [],
  templateUrl: './guide.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Guide { }
