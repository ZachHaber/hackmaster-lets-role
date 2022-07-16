import { AbortSignal, Emitter, Event } from './utility/abortcontroller';
import { debug } from './utils';

export type ComponentEvent<C extends ComponentValue> = Event & {
  target: Component<C>;
};

const eventHandlers: {
  [sheetUid: string]: {
    [componentId: string]: Emitter<ComponentEvent<any>>;
  };
} = {};
interface EventListenerOptions {
  once?: boolean;
  signal?: AbortSignal;
}
type Callback<C extends ComponentValue> = (event: ComponentEvent<C>) => void;
export function addEventListener<
  Sheet extends Sheets,
  ID extends keyof SheetSetup[GetSheetType<Sheet>] & string
>(
  sheet: Sheet,
  elementId: ID,
  type: EventType, // @ts-ignore
  callback: Callback<SheetSetup[GetSheetType<Sheet>][ID]>,
  options: EventListenerOptions = {}
) {
  const sheetId = sheet.getSheetId();
  eventHandlers[sheetId] ??= {};
  eventHandlers[sheetId][elementId] ??= new Emitter();
  eventHandlers[sheetId][elementId].hook ??= (type) => {
    const element = sheet.get(elementId);
    if (!element) {
      log(`Error: could not find ${elementId} to add a listener`);
      throw new Error('element not found');
    }
    element.on(type as EventType, (component) => {
      const event = new Event(type) as ComponentEvent<ComponentValue>;
      event.target = component;
      debug(
        `dispatching ${sheetId}->${elementId}:${event.type} to ${
          eventHandlers[sheetId][elementId].listeners[event.type]?.length
        } items`
      );
      eventHandlers[sheetId][elementId].dispatchEvent(event);
    });
  };
  const emitter = eventHandlers[sheet.getSheetId()][elementId];
  emitter.addEventListener(type, callback, options);
  if (options.signal) {
    options.signal.addEventListener('abort', (e) => {
      emitter.removeEventListener(type, callback);
    });
  }
}
