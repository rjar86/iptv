import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { IptvChannel } from '../interfaces/iptv-channel.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IptvService {
  private readonly _apiUrl = environment.apiUrl;
  private readonly _http = inject(HttpClient);
  private readonly _channels$ = this._http
    .get(this._apiUrl, { responseType: 'text' })
    .pipe(
      map((playlist) => this.parsePlaylist(playlist)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  getChannels(): Observable<IptvChannel[]> {
    return this._channels$;
  }

  getChannelsByGroup(groupName: string): Observable<IptvChannel[]> {
    const normalizedGroup = this.normalizeGroupName(groupName).toLowerCase();

    return this.getChannels().pipe(
      map((channels) =>
        channels.filter((channel) => this.normalizeGroupName(channel.group).toLowerCase() === normalizedGroup),
      ),
    );
  }

  getChannelsByTerm(searchTerm: string): Observable<IptvChannel[]> {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return this.getChannels().pipe(
      map((channels) =>
        channels.filter((channel) => {
          const searchableText =
            `${channel.name} ${channel.group ?? ''} ${channel.country ?? ''}`.toLowerCase();

          return searchableText.includes(normalizedSearchTerm);
        }),
      ),
    );
  }

  private parsePlaylist(playlist: string): IptvChannel[] {
    const lines = playlist.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const channels: IptvChannel[] = [];

    let pendingMeta: string | null = null;

    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        pendingMeta = line;
        continue;
      }

      if (line.startsWith('#')) {
        continue;
      }

      if (!pendingMeta) {
        continue;
      }

      const name = this.extractName(pendingMeta);
      const logo = this.extractAttribute(pendingMeta, 'tvg-logo');
      const group = this.normalizeGroupName(this.extractAttribute(pendingMeta, 'group-title'));
      const country = this.extractAttribute(pendingMeta, 'tvg-country');

      channels.push({
        id: `${name}-${channels.length}`,
        name,
        url: line,
        logo,
        group,
        country,
      });

      pendingMeta = null;
    }

    return channels.filter((channel) => channel.url.startsWith('http'));
  }

  private extractName(metadata: string): string {
    return metadata.split(',').pop()?.trim() || 'Sin nombre';
  }

  private extractAttribute(metadata: string, attribute: string): string | undefined {
    const match = metadata.match(new RegExp(`${attribute}="([^"]+)"`));
    return match?.[1];
  }

  private normalizeGroupName(groupName?: string): string {
    if (!groupName?.trim()) {
      return 'Sin categoria';
    }

    return groupName
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join(' / ');
  }
}
