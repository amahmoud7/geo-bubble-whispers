type AppEventMap = {
  refreshMessages: void;
  createMessage: void;
  messageCreated: { id: string };
  navigateToMessage: { lat: number; lng: number; messageId?: string };
  streetViewClick: { lat: number; lng: number };
  notificationAction: { action: string; messageId?: string };
  livestreamVideoReady: { file: File; event: Event };
};

type AppEventKey = keyof AppEventMap;

class AppEventBus extends EventTarget {
  emit<T extends AppEventKey>(type: T, detail: AppEventMap[T]) {
    const event = new CustomEvent(type, { detail });
    this.dispatchEvent(event);
  }

  on<T extends AppEventKey>(type: T, listener: (detail: AppEventMap[T]) => void) {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<AppEventMap[T]>;
      listener(custom.detail);
    };

    this.addEventListener(type, handler);

    return () => this.removeEventListener(type, handler);
  }
}

export const eventBus = new AppEventBus();
