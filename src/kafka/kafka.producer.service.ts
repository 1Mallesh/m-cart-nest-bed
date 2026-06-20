import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { KafkaTopic } from './kafka.topics';

/**
 * Publishes domain events to Kafka when `KAFKA_BROKERS` is configured
 * (comma-separated host:port list). Without it, events are logged only — so
 * the app runs locally without a broker. Set KAFKA_BROKERS in real deployments.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer?: Producer;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const brokers = this.config.get<string>('KAFKA_BROKERS');
    if (!brokers) {
      this.logger.warn(
        'KAFKA_BROKERS not set — events will be logged, not published.',
      );
      return;
    }
    const kafka = new Kafka({
      clientId: this.config.get<string>('KAFKA_CLIENT_ID', 'M-Cart'),
      brokers: brokers.split(',').map((b) => b.trim()),
    });
    this.producer = kafka.producer();
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.error(`Kafka connect failed: ${(err as Error).message}`);
      this.producer = undefined;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer?.disconnect();
  }

  async emit(topic: KafkaTopic | string, message: unknown): Promise<void> {
    if (!this.producer) {
      this.logger.log(`[kafka:log] ${topic}: ${JSON.stringify(message)}`);
      return;
    }
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
