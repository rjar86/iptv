import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, of, startWith } from 'rxjs';
import { IptvChannel } from '../../core/interfaces/iptv-channel.types';
import { IptvService } from '../../core/services/iptv.service';

type GuideState = {
  channels: IptvChannel[];
  loading: boolean;
  error: string | null;
};

type ChannelCategory = {
  name: string;
  channels: IptvChannel[];
};

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './guide.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Guide {
  private readonly iptvService = inject(IptvService);
  private readonly router = inject(Router);

  readonly guideState = toSignal(
    this.iptvService.getChannels().pipe(
      map(
        (channels): GuideState => ({
          channels,
          loading: false,
          error: null,
        }),
      ),
      startWith({
        channels: [],
        loading: true,
        error: null,
      } as GuideState),
      catchError(() =>
        of({
          channels: [],
          loading: false,
          error: 'No fue posible cargar la guia de canales.',
        } satisfies GuideState),
      ),
    ),
    {
      initialValue: {
        channels: [],
        loading: true,
        error: null,
      } satisfies GuideState,
    },
  );

  readonly categories = computed(() => {
    const groupedChannels = new Map<string, IptvChannel[]>();

    for (const channel of this.guideState().channels) {
      const categoryName = channel.group?.trim() || 'Sin categoria';
      const currentGroup = groupedChannels.get(categoryName) ?? [];
      currentGroup.push(channel);
      groupedChannels.set(categoryName, currentGroup);
    }

    return Array.from(groupedChannels.entries())
      .map(
        ([name, channels]): ChannelCategory => ({
          name,
          channels: [...channels].sort((a, b) => a.name.localeCompare(b.name)),
        }),
      )
      .sort((a, b) => {
        if (a.name === 'Sin categoria') {
          return 1;
        }

        if (b.name === 'Sin categoria') {
          return -1;
        }

        return a.name.localeCompare(b.name);
      });
  });

  playChannel(channel: IptvChannel): void {
    void this.router.navigate(['/home'], {
      queryParams: {
        channel: channel.id,
      },
    });
  }

  trackByCategory(_: number, category: ChannelCategory): string {
    return category.name;
  }

  trackByChannel(_: number, channel: IptvChannel): string {
    return channel.id;
  }
}
