import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheEntry {
  value: unknown;
  expiresAt?: number;
}

/**
 * Cache abstraction backed by Redis (ioredis) when `REDIS_URL` is configured.
 * Falls back to a process-local in-memory map for local development / tests so
 * the app still boots without a Redis server. The in-memory fallback is NOT
 * safe across multiple instances — set REDIS_URL in any real deployment.
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client?: Redis;
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn(
        'REDIS_URL not set — using in-memory cache (single-instance only).',
      );
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
    this.client.on('error', (err) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
    this.client.on('connect', () => this.logger.log('Redis connected'));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.client) {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, val: unknown, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      const payload = JSON.stringify(val);
      if (ttlSeconds !== undefined) {
        await this.client.set(key, payload, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, payload);
      }
      return;
    }
    const expiresAt =
      ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value: val, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(key);
      return;
    }
    this.store.delete(key);
  }
}
