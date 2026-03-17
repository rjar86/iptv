import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { IptvChannel } from '../interfaces/iptv-channel.types';

@Injectable({
  providedIn: 'root'
})
export class IptvService {
  private readonly _apiUrl = environment.apiUrl;
  private readonly _http = inject(HttpClient);

  getChannels() { }

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
      const group = this.extractAttribute(pendingMeta, 'group-title');
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
    return match?.[1]
  }
}
