import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Hls from 'hls.js';
import { catchError, map, of, startWith } from 'rxjs';
import { IptvChannel } from '../../core/interfaces/iptv-channel.types';
import { IptvService } from '../../core/services/iptv.service';

type ChannelsState = {
  channels: IptvChannel[];
  loading: boolean;
  error: string | null;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly iptvService = inject(IptvService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('player');
  private readonly pendingRequestedChannelId = signal(
    this.route.snapshot.queryParamMap.get('channel')?.trim() || null,
  );
  private readonly playerLoadTimeoutMs = 12000;

  private hls: Hls | null = null;
  private loadAttemptId = 0;
  private loadTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private removeVideoListeners: (() => void) | null = null;

  readonly selectedChannelId = signal<string | null>(null);
  readonly playerError = signal<string | null>(null);
  readonly playerLoading = signal(false);

  readonly animeChannelsState = toSignal(
    this.iptvService.getChannelsByTerm('anime').pipe(
      map(
        (channels): ChannelsState => ({
          channels,
          loading: false,
          error: null,
        }),
      ),
      startWith({
        channels: [],
        loading: true,
        error: null,
      } as ChannelsState),
      catchError(() =>
        of({
          channels: [],
          loading: false,
          error: 'No fue posible cargar los canales de anime.',
        } satisfies ChannelsState),
      ),
    ),
    {
      initialValue: {
        channels: [],
        loading: true,
        error: null,
      } satisfies ChannelsState,
    },
  );

  readonly allChannelsState = toSignal(
    this.iptvService.getChannels().pipe(
      map(
        (channels): ChannelsState => ({
          channels,
          loading: false,
          error: null,
        }),
      ),
      startWith({
        channels: [],
        loading: true,
        error: null,
      } as ChannelsState),
      catchError(() =>
        of({
          channels: [],
          loading: false,
          error: 'No fue posible cargar el canal solicitado desde la guia.',
        } satisfies ChannelsState),
      ),
    ),
    {
      initialValue: {
        channels: [],
        loading: true,
        error: null,
      } satisfies ChannelsState,
    },
  );

  readonly animeChannels = computed(() => this.animeChannelsState().channels);
  readonly requestedChannel = computed(() => {
    const requestedChannelId = this.pendingRequestedChannelId();

    if (!requestedChannelId) {
      return null;
    }

    return (
      this.allChannelsState().channels.find((channel) => channel.id === requestedChannelId) ?? null
    );
  });

  readonly selectedChannel = computed(() => {
    const selectedId = this.selectedChannelId();
    const animeChannels = this.animeChannels();
    const allChannels = this.allChannelsState().channels;

    if (selectedId) {
      return (
        animeChannels.find((channel) => channel.id === selectedId) ??
        allChannels.find((channel) => channel.id === selectedId) ??
        this.requestedChannel() ??
        animeChannels[0] ??
        null
      );
    }

    return this.requestedChannel() ?? animeChannels[0] ?? null;
  });

  constructor() {
    effect(() => {
      const animeChannels = this.animeChannels();
      const allChannels = this.allChannelsState().channels;
      const selectedId = this.selectedChannelId();
      const requestedChannelId = this.pendingRequestedChannelId();
      const requestedExists =
        !!requestedChannelId && allChannels.some((channel) => channel.id === requestedChannelId);

      if (!animeChannels.length && !requestedExists) {
        this.selectedChannelId.set(null);
        return;
      }

      if (requestedExists && !selectedId) {
        this.selectedChannelId.set(requestedChannelId);
        this.pendingRequestedChannelId.set(null);
        return;
      }

      if (!selectedId) {
        this.selectedChannelId.set(animeChannels[0]?.id ?? requestedChannelId);
        return;
      }

      const existsInAnime = animeChannels.some((channel) => channel.id === selectedId);
      const existsInAll = allChannels.some((channel) => channel.id === selectedId);

      if (!existsInAnime && !existsInAll) {
        this.selectedChannelId.set(animeChannels[0]?.id ?? null);
      }
    });

    effect(() => {
      const videoRef = this.videoElement();
      const channel = this.selectedChannel();

      if (!videoRef || !channel) {
        return;
      }

      this.loadChannel(videoRef.nativeElement, channel);
    });

    this.destroyRef.onDestroy(() => this.destroyPlayer());
  }

  selectChannel(channel: IptvChannel): void {
    this.pendingRequestedChannelId.set(null);
    this.selectedChannelId.set(channel.id);
  }

  trackByChannel(_: number, channel: IptvChannel): string {
    return channel.id;
  }

  private loadChannel(video: HTMLVideoElement, channel: IptvChannel): void {
    const attemptId = ++this.loadAttemptId;

    this.playerError.set(null);
    this.playerLoading.set(true);
    this.destroyPlayer();
    video.pause();
    video.removeAttribute('src');
    video.load();

    this.bindVideoEvents(video, attemptId);
    this.startLoadTimeout(attemptId);

    if (Hls.isSupported()) {
      const hls = new Hls({
        manifestLoadingTimeOut: this.playerLoadTimeoutMs,
        levelLoadingTimeOut: this.playerLoadTimeoutMs,
        fragLoadingTimeOut: this.playerLoadTimeoutMs,
      });

      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (attemptId !== this.loadAttemptId) {
          return;
        }

        void video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (attemptId !== this.loadAttemptId || !data.fatal) {
          return;
        }

        this.failPlayback(video, attemptId, 'No se pudo reproducir este canal.');
      });
      this.hls = hls;
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      void video.play().catch(() => undefined);
      return;
    }

    this.failPlayback(video, attemptId, 'Tu navegador no soporta la reproduccion de este stream.');
  }

  private bindVideoEvents(video: HTMLVideoElement, attemptId: number): void {
    const onLoadedData = () => {
      if (attemptId !== this.loadAttemptId) {
        return;
      }

      this.clearLoadTimeout();
      this.playerLoading.set(false);
      this.playerError.set(null);
    };

    const onPlaying = () => {
      if (attemptId !== this.loadAttemptId) {
        return;
      }

      this.clearLoadTimeout();
      this.playerLoading.set(false);
    };

    const onError = () => {
      if (attemptId !== this.loadAttemptId) {
        return;
      }

      this.failPlayback(video, attemptId, 'No se pudo reproducir este canal.');
    };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    this.removeVideoListeners = () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
    };
  }

  private startLoadTimeout(attemptId: number): void {
    this.clearLoadTimeout();
    this.loadTimeoutId = setTimeout(() => {
      if (attemptId !== this.loadAttemptId) {
        return;
      }

      const video = this.videoElement()?.nativeElement;

      if (!video) {
        return;
      }

      this.failPlayback(video, attemptId, 'Este canal no respondio a tiempo. Prueba con otro.');
    }, this.playerLoadTimeoutMs);
  }

  private clearLoadTimeout(): void {
    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = null;
    }
  }

  private failPlayback(video: HTMLVideoElement, attemptId: number, message: string): void {
    if (attemptId !== this.loadAttemptId) {
      return;
    }

    this.playerError.set(message);
    this.playerLoading.set(false);
    this.clearLoadTimeout();
    this.destroyPlayer();
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  private destroyPlayer(): void {
    this.clearLoadTimeout();

    if (this.removeVideoListeners) {
      this.removeVideoListeners();
      this.removeVideoListeners = null;
    }

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    this.playerLoading.set(false);
  }
}
