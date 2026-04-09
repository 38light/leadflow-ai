import type { ChannelType, OutboundMessage, SendResult } from "./types";
import { sendMessage } from "./router";

/**
 * Simple in-memory message queue for rate-limited channels (Meta platforms).
 *
 * Production note: this is a basic single-process implementation suitable for
 * development and low-traffic deployments. A production system should use a
 * proper job queue (e.g. BullMQ + Redis, Inngest, or Trigger.dev) for
 * persistence, retries, and multi-instance coordination.
 */

/** Messages per hour allowed for each rate-limited channel. */
const RATE_LIMITS: Partial<Record<ChannelType, number>> = {
  instagram: 200,
  facebook: 200,
};

interface QueuedMessage {
  message: OutboundMessage;
  enqueuedAt: number;
}

export class MessageQueue {
  private queues = new Map<ChannelType, QueuedMessage[]>();

  /** Tracks how many messages were sent in the current window per channel. */
  private sentCounts = new Map<ChannelType, { count: number; windowStart: number }>();

  /**
   * Add a message to the queue for its channel type.
   */
  enqueue(channelType: ChannelType, message: OutboundMessage): void {
    const queue = this.queues.get(channelType) ?? [];
    queue.push({ message, enqueuedAt: Date.now() });
    this.queues.set(channelType, queue);
  }

  /**
   * Process the next message across all queues, respecting per-channel rate
   * limits. Returns the send result, or null if no messages are available.
   */
  async process(): Promise<SendResult | null> {
    for (const [channelType, queue] of this.queues.entries()) {
      if (queue.length === 0) continue;

      if (this.isRateLimited(channelType)) {
        continue;
      }

      const item = queue.shift()!;
      this.recordSend(channelType);

      try {
        return await sendMessage(item.message);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[MessageQueue] Failed to send ${channelType} message:`,
          errorMessage
        );
        return { success: false, error: errorMessage };
      }
    }

    return null;
  }

  /**
   * Total number of messages waiting across all channels.
   */
  size(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Number of messages waiting for a specific channel.
   */
  sizeFor(channelType: ChannelType): number {
    return this.queues.get(channelType)?.length ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Rate-limit helpers
  // ---------------------------------------------------------------------------

  private isRateLimited(channelType: ChannelType): boolean {
    const limit = RATE_LIMITS[channelType];
    if (limit === undefined) return false; // no limit configured

    const record = this.sentCounts.get(channelType);
    if (!record) return false;

    const oneHourMs = 60 * 60 * 1000;
    if (Date.now() - record.windowStart > oneHourMs) {
      // Window expired — reset
      this.sentCounts.delete(channelType);
      return false;
    }

    return record.count >= limit;
  }

  private recordSend(channelType: ChannelType): void {
    const oneHourMs = 60 * 60 * 1000;
    const existing = this.sentCounts.get(channelType);

    if (!existing || Date.now() - existing.windowStart > oneHourMs) {
      this.sentCounts.set(channelType, { count: 1, windowStart: Date.now() });
    } else {
      existing.count += 1;
    }
  }
}

/** Singleton queue instance. */
export const messageQueue = new MessageQueue();
