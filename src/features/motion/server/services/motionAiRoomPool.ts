import { MOTION_STORY_CONFIG } from "../../../../constants/motionVideo.js";
import { MOTION_BROWSER_HANDOFF } from "../../../../constants/browserLifecycle.js";
export interface MotionAiRoomIdentity {
  provider: string;
  projectId: string;
  workerId: string;
}
interface RoomRecord {
  identity: MotionAiRoomIdentity;
  onClose: () => void;
}
interface RoomSlot {
  drawing: boolean;
  busy: boolean;
  used: number;
  room?: RoomRecord;
  reserved?: MotionAiRoomIdentity;
  closing?: Promise<void>;
}
interface RoomWaiter {
  identity: MotionAiRoomIdentity;
  onClose: () => void;
  signal?: AbortSignal;
  resolve: (release: () => void) => void;
  reject: (reason: unknown) => void;
  stop: () => void;
}
export class MotionAiRoomPool {
  private readonly slots: RoomSlot[] = [...MOTION_STORY_CONFIG.SCENE_WORKER_IDS.map(() => ({ drawing: true, busy: false, used: 0 })), ...MOTION_STORY_CONFIG.WORKER_IDS.map(() => ({ drawing: false, busy: false, used: 0 }))];
  private waiting: RoomWaiter[] = [];
  private clock = 0;
  constructor(private readonly closeRoom: (identity: MotionAiRoomIdentity) => Promise<void>) {}
  acquire(identity: MotionAiRoomIdentity, onClose: () => void, signal?: AbortSignal): Promise<() => void> {
    signal?.throwIfAborted();
    return new Promise((resolve, reject) => {
      const waiter: RoomWaiter = {
        identity,
        onClose,
        signal,
        resolve,
        reject,
        stop: () => {
          this.waiting = this.waiting.filter((entry) => entry !== waiter);
          reject(signal?.reason);
          this.pump();
        },
      };
      signal?.addEventListener(MOTION_BROWSER_HANDOFF.ABORT, waiter.stop, { once: true });
      this.waiting.push(waiter);
      this.pump();
    });
  }
  private pump(): void {
    for (const waiter of [...this.waiting]) {
      const drawing = MOTION_STORY_CONFIG.SCENE_WORKER_IDS.some((workerId) => workerId === waiter.identity.workerId);
      const slots = this.slots.filter((slot) => slot.drawing === drawing);
      const owned = slots.find((slot) => [slot.reserved, slot.room?.identity].some((identity) => identity?.projectId === waiter.identity.projectId && identity.workerId === waiter.identity.workerId));
      const slot = owned ? (!owned.busy && !owned.closing ? owned : undefined) : slots.filter((slot) => !slot.busy && !slot.closing).sort((a, b) => Number(!!a.room) - Number(!!b.room) || a.used - b.used)[0];
      if (!slot) continue;
      this.waiting = this.waiting.filter((entry) => entry !== waiter);
      waiter.signal?.removeEventListener(MOTION_BROWSER_HANDOFF.ABORT, waiter.stop);
      slot.busy = true;
      slot.reserved = waiter.identity;
      void this.grant(slot, waiter);
    }
  }
  private async clear(slot: RoomSlot): Promise<void> {
    if (slot.closing) return slot.closing;
    const room = slot.room;
    if (!room) return;
    const closing = (async () => {
      await this.closeRoom(room.identity);
      room.onClose();
      slot.room = undefined;
    })();
    slot.closing = closing;
    try {
      await closing;
    } finally {
      slot.closing = undefined;
    }
  }
  private async grant(slot: RoomSlot, waiter: RoomWaiter): Promise<void> {
    try {
      waiter.signal?.throwIfAborted();
      const previous = slot.room?.identity;
      if (previous && (previous.provider !== waiter.identity.provider || previous.projectId !== waiter.identity.projectId || previous.workerId !== waiter.identity.workerId)) await this.clear(slot);
      waiter.signal?.throwIfAborted();
      slot.room = { identity: waiter.identity, onClose: waiter.onClose };
      let released = false;
      waiter.resolve(() => {
        if (released) return;
        released = true;
        slot.busy = false;
        slot.reserved = undefined;
        slot.used = ++this.clock;
        this.pump();
      });
    } catch (error) {
      slot.busy = false;
      slot.reserved = undefined;
      slot.used = ++this.clock;
      waiter.reject(error);
      this.pump();
    }
  }
  async close(identity: MotionAiRoomIdentity): Promise<boolean> {
    const slot = this.slots.find((entry) => entry.room?.identity.provider === identity.provider && entry.room.identity.projectId === identity.projectId && entry.room.identity.workerId === identity.workerId);
    if (!slot) return false;
    const busy = slot.busy;
    slot.busy = true;
    try {
      await this.clear(slot);
      return true;
    } finally {
      if (!busy) slot.busy = false;
      this.pump();
    }
  }
  async closeProject(projectId: string): Promise<void> {
    await Promise.all(this.slots.filter((slot) => slot.room?.identity.projectId === projectId).map((slot) => this.close(slot.room!.identity)));
  }
}
