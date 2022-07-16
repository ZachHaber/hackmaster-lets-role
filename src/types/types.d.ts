declare interface TableMap {}

declare type Keyof<T> = Extract<keyof T, string>;

declare type ValueOf<T extends object> = T[Keyof<T>];

declare interface Tables {
  get<T extends keyof TableMap & string>(name: T): TableMap[T];
}
declare const Tables: Tables;

declare class Table<T> {
  each(cb: (line: T) => void): void;
  get(id: string): T;
  random(cb: (line: T) => void): void;
}

declare interface SheetData extends Record<string, ComponentValue> {
  uid: string;
}

declare interface SheetSetup {}

declare type SheetTypes = Keyof<SheetSetup>;

declare type GetSheetType<TypedSheet extends Sheet<any>> = ReturnType<
  TypedSheet['id']
>;

declare interface SheetMap {}

declare type Sheets = ValueOf<SheetMap>;

declare class Sheet<ST extends SheetTypes> {
  private constructor();
  /** Get a component by its id */
  get<T extends Keyof<SheetSetup[ST]>>(is: T): Component<SheetSetup[ST][T]>;
  get<T extends ComponentValue>(id: string): Component<T> | null;
  /** Get a variable's value by its id */
  getVariable(id: string): string | number | null;

  /** Get the id of the sheet (the id of the top view component) */
  id(): ST;
  /** The unique ID of the sheet (ie a sheet creation order index on Let's Role). Used to distinguish a leaf from another leaf of the same type */
  getSheetId(): number;
  /** Get the name of the sheet */
  name(): string;
  /** Prompt the user for additional information
   * The Prompt API allows you to ask the user to fill a small form before an action For example, if you need a modifier before a dice roll, you can prompt a small pop-in asking the modifier's value.
   *
   * The prompt itself consists of a title, a view's id, and a callback with the data colected form the view The view is initialized in the global {@link init}(sheet) function.
   *
   * @param title The title of the prompt window
   * @param view The id of the view to use
   * @param callback The callback to get the data once the user clicks the "next" button. The first argument is the view's data.
   * @param callbackInit The callback called when opening the prompt which allows to modify elements of the prompt view from information coming from the sheet which calls `sheet.prompt(...)`
   * @example
    sheet.get('attack')?.on('click', () => {
      sheet.prompt(
        'Modifiers ?',
        // rollprompt is the id of the view
        'rollPrompt',
        (result) => {
          // result is an object of the data of the view
          // after the user clicks "next" or "continue"
          // if the user cancels the prompt, this function is not called
          if (result.advantage) {
            Dice.roll(sheet, `keeph(2d20) + ${result.promptModifier}`);
          } else {
            Dice.roll(sheet, `1d20 + ${result.promptModifier}`);
          }
        },
        (promptView) => {
          // the callbackInit function can access the sheet which calls the prompt and the prompt sheet
          // dexModifier is on the character sheet
          const dexModifier = sheet.get('dexModifier')?.value() || 0;
          // promptModifier is on the prompt sheet
          promptView.get('promptModifier')?.value(dexModifier);
        }
      );
    });
   */
  prompt(
    title: string,
    view: string,
    callback: (data: SheetSetup[ST]) => void,
    callbackInit?: (view: Sheet<ST>) => void
  ): void;
  /** Set multiple sheet data at once (including components values).
   *
   * You can only set __20__ values at a time. */
  setData(data: Partial<SheetSetup[ST]>): void;

  getData(): SheetSetup[ST];
}

declare class Component<T = ComponentValue> {
  /** @returns the Sheet associated with this component */
  sheet(): Sheets;
  /** Get the parent component */
  parent(): Component | null;

  /** @returns the name of the component as indicated in the system builder. */
  name(): string;

  /** @returns the id of the component as indicated in the system builder. */
  id(): string;

  /** @returns the entry id of the component when contained in a repeater, null if the component is not in a repeater. */
  index(): string | null;

  /**
   *
   * @param id  The id of the child component
   *
   * Get a child component.
   */
  find<SubPath extends Keyof<T>>(id: SubPath): Component<T[SubPath]> | null;

  /**
   *
   * @param event The name of the event. Possible values : click, update, mouseenter, mouseleave, keyup
   * @param callback The function to call when the event is triggered. The first argument is the event.
   *
   * If the event is triggered from code, it will have the property `computed` to `true`. It’s possible to delegate events to a subcomponent, useful when using repeaters. It’s only possible to have one event of the same type for a component at once.
   */
  on(event: EventType, callback: (event: this) => void): void;
  on(event: 'click', callback: (event: this) => void): void;
  /**
   *
   * @param event The name of the event. Possible values : click, update, mouseenter, mouseleave, keyup
   * @param delegate Subcomponent to delegate the event to.
   * @param callback The function to call when the event is triggered. The first argument is the event.
   *
   * If the event is triggered from code, it will have the property `computed` to `true`. It’s possible to delegate events to a subcomponent, useful when using repeaters. It’s only possible to have one event of the same type for a component at once.
   */
  on(event: EventType, delegate: string, callback: (event: this) => void): void;

  /**
   *
   * @param event
   *
   * Remove an event on the component or one of its delegates.
   */
  off(event: EventType): void;
  /**
   *
   * @param event The name of the event. Possible values : click, update, mouseenter, mouseleave, keyup
   * @param delegate  Subcomponent to delegate the event to.
   *
   * Remove an event on the component or one of its delegates.
   */
  off(event: EventType, delegate: string): void;

  /** Hide the component */
  hide(): void;

  /** Display the component if it has been hidden */
  show(): void;

  /** @returns `true` if the component is not hidden */
  visible(): boolean;

  /** Add a CSS class to the component */
  addClass(className: string): void;
  /** Remove a CSS class from the component */
  removeClass(className: string): void;

  /**
   * 
   * @param newValue the new value to set.
   * 
   * gets or sets the value of the component. If the component is persisted, the value is permanently saved. Be carefull of not using this setter too often on persisted components, as the server has a limit of possible calls. If the component has a virtual value, it is returned. Use component.rawValue() to get the base, “non-virtual” value.
   * 
   * @example
   * ```
   * let hp = sheet.get("hp"); // hp is a persisted component
log(hp.value()); // 5
hp.value(11); // update and save the new value
```
1. `rawValue()` type: `null|number|string|object`

Get or the base, “non-virtual” value of the component.
```
let hp = sheet.get("hp");
hp.value(17);
log(hp.value()); // 17

hp.virtualValue(20);
log(hp.value()); // 20
log(hp.rawValue()); // 17
```
   */
  value(): T;
  value(newValue: T): T;

  /**
   * @param newValue The new value to set
   *
   * Get or set the virtual value of the component. Virtual values are usefull when you want to change a value based on calculation. For example, you could have a armor that give the character +2 HP, and set the virtual value of the hp component to its base value + 2. The the component would diplay the virtual value by default, and the raw value when hovering.
   *
   * @example
   * let hp = sheet.get("hp");
   * hp.virtualValue(hp.rawValue() + 2);
   *
   */
  virtualValue(): NonNullable<T>;
  virtualValue(newValue: T): NonNullable<T>;

  /**
   * @param replacement The text to write
   *
   * Get or set the text content of the label. The value is not computed and HTML is not allowed. Using `text` on a Label does not change the data of the sheet. If you use `value` instead, the text will be changed but the data of the sheet also (adding a new data in the sheet). This data will then be sent over internet to all other (this does not occur when using `text`).
   *
   * @example sheet.get("job").text("Warrior");
   *
   */
  text(): null | string;
  text(replacement: string): null | string;

  /**
   *
   * @param choices The choices
   *
   * Only available on Choice components, change the possible choices.
   */
  setChoices(choices: Record<string, string>): void;
}

type EventType = 'click' | 'update' | 'mouseenter' | 'mouseleave' | 'keyup';

type BaseComponentValue = undefined | null | number | string | boolean;
type RepeaterValue = Record<string, Record<string, BaseComponentValue>>;
type ComponentValue = BaseComponentValue | RepeaterValue;

/// Global!
/**
 * Initialize a sheet, as a character sheet or a craft. You can see what type of sheet it is via {@link Sheet.id}
 * 
 * Table entries are not initialized individually, and should be initialized as if they were part of the parent view.
 * 
 * @example
  init = (sheet) => {
    if (sheet.id() === 'main') {
      initMain(sheet);
    } else if (sheet.id() === 'weapon') {
      initWeapon(sheet);
    }
  };
  // initialize the main sheet
  const initMain = (sheet: Sheet) => {
    const hp = sheet.get('hp');
    // ...
  };
  // Initialize a weapon sheet
  const initWeapon = (sheet: Sheet) => {
    const damage = sheet.get('damage');
    // ...
  };

 */
declare let init: (sheet: Sheets) => void;

/**
 * Called when dropping a craft onto a character sheet.
 * If you simply want to append the data to a repeater, return the repeater's id. Otherwise you'll have to manipulate the target sheet data.
 * 
 * For now, it is only possible to drop crafts into character sheets.
 * @example
  drop = (from, to) => from.id() === 'weapon' && to.id() === 'main' ? 'weapons' : undefined;
 * @example
  drop = (from, to) => {
    if (from.id() === 'heal' && to.id() === 'main') {
      // set the target's hp to the source maxhp
      to.get('hp')?.value(from.get('maxhp')?.value());
    }
  };
 * @param from Source Sheet
 * @param to Target's Sheet
 */
declare let drop: (from: Sheets, to: Sheets) => void | string;

/**
 * For some systems, it can be useful to drag'n'drop a dice result onto the sheet
 * 
 * With this function, you can create interaction between the dice log and a character sheet or craft.
 * @param result A dice result from the dice log
 * @param to Target's sheet
 * @example
  dropDice = (result, sheet) => {
    if (result.containsTag('heal')) {
      let hp = sheet.get('hp');
      // the character is healed by the total of the roll
      hp?.value(hp.value() + result.total);
    }
  };
 */

declare let dropDice: (result: DiceResult, to: Sheets) => void;

/**
 *
 *
 * This function allows you to customize the rendering of a dice
 * @param view the id of the view you want to render the dice result
 * @param onRender: A function called when rendering the view, where you can change view values. Please note the view is also initialized in the global `init` function.
 */
declare type InitRollCallback = (
  view: string,
  onRender: (sheet: Sheets) => void
) => void;

/**
 * This function allows you to customize the rendering of the dice result
 * @param result A dice result from the dice log
 * @param {InitRollCallback} callback A callback to render the dice result.
 * @example
  initRoll = (result, callback) => {
    // diceresult is the id of the view you want to use
    callback('diceresult', (sheet) => {
      // apply various changes to the view
      sheet.get('total')?.text(result.total);
      if (result.total > 20) {
        sheet.get('toal')?.addClass('text-large');
      }
    });
  };
 */
declare type InitRollFunction = (
  result: DiceResult,
  callback: InitRollCallback
) => void | boolean;
/**
 * This function allows you to customize the rendering of the dice result
 * @param result A dice result from the dice log
 * @param {InitRollCallback} callback A callback to render the dice result.
 * @example
  initRoll = (result, callback) => {
    // diceresult is the id of the view you want to use
    callback('diceresult', (sheet) => {
      // apply various changes to the view
      sheet.get('total')?.text(result.total);
      if (result.total > 20) {
        sheet.get('toal')?.addClass('text-large');
      }
    });
  };
 */
declare let initRoll: InitRollFunction;
/**
 * Players can connect bars to some attributs with this method. it is required to have a value, and a maximum value.
 *
 * The bar updates when the sheet is changes, and the sheet updates when the bar is changed.
 *
 * @returns Object with `[min:string,max:string]`
 * @example
  getBarAttributes = (sheet) => {
    const hp = ['hp', 'hpmax'] as const;
    if (sheet.id() === 'main') {
      return {
        HP: hp,
        'Quick Resource': ['quickResource', 'quickResourceMax'],
      };
    }
    if (sheet.id() === 'monster') {
      return {
        HP: hp,
        // You can use numbers directly for maximums
        Mana: ['mana', 30],
      };
    }
    return {};
  };
 */
declare let getBarAttributes: (
  sheet: Sheets
) => Record<string, readonly [string, string | number] | undefined>;

/**
 * Bindings allow players to reference an element of their character sheet in the chat. With this API, you have full control over what bindings are available, and how they are displayed.

A binding is created with 4 elements :

- name : the name used in the chat to reference the binding
- componentId : the id of the component referenced. You can have several bindings for a single componentId, for example in repeaters
- viewId : the id of the view used to display the binding
- data `Function` : a function that returns an object of data passed to the view for rendering. This data will be available in the view
 */
declare class Binding {
  /**
   *
   * @param name The name used in the chat
   * @param componentId the id of the component used
   * @param viewId the view used for rendering
   * @param dataCallback A function returning an object that will be passed to the view The object must be serializable in JSON
   *
   */
  add(
    name: string,
    componentId: string,
    viewId: string,
    dataCallback?: () => object
  ): void;

  /**
   *
   * @param sheet The sheet element attached to the binding
   * @param name The name of the bidning
   *
   * Sends a binding into the chat. The binding must have been registered with Binding.{@link add()}
   */
  send(sheet: Sheets, name: string): void;

  /**
   *
   * @param name The name of the binding
   *
   * Remove one binding by its name
   */
  remove(name: string): void;

  /**
   *
   * @param componentId The component's id to clear
   */
  clear(componentId: string): void;
}
declare const Bindings: Binding;

declare class DiceBuilder {
  constructor(input: DiceValue);
  add(value: DiceValue): DiceBuilder;
  minus(value: DiceValue): DiceBuilder;
  multiply(value: DiceValue): DiceBuilder;
  divide(value: DiceValue): DiceBuilder;
  tag(...tags: string[]): DiceBuilder;
  compare(type: string, right: DiceValue, weights?: string): DiceBuilder;
  round(): DiceBuilder;
  ceil(): DiceBuilder;
  floor(): DiceBuilder;
  keeph(max: number): DiceBuilder;
  keepl(max: number): DiceBuilder;
  remh(max: number): DiceBuilder;
  reml(max: number): DiceBuilder;
  expl(...explode: number[]): DiceBuilder;
  expladd(...explode: number[]): DiceBuilder;
  mul(multiplier: number): DiceBuilder;
  reroll(...reroll: number[]): DiceBuilder;
  rerolln<T extends number>(
    ...args: [...reroll: T[], max: number]
  ): DiceBuilder;
  ternary(then: DiceValue, elseValue: DiceValue): DiceBuilder;
  toString(): string;
}

declare const Dice: {
  create(input: DiceValue): DiceBuilder;
  roll(
    sheet: Sheet<any>,
    expression: DiceValue,
    title?: string,
    visibility?: DiceVisibility,
    actions?: any
  ): void;
};

declare type DiceValue = string | number | DiceBuilder;

declare type DiceVisibility = 'all' | 'gm' | 'gmonly';
declare type DiceType = 'number' | 'dice' | 'comparison';

declare interface SingleDiceResult {
  /** The number of faces of the dice */
  dimension: number;
  /** The rolled number */
  value: number;
  /** is this roll discarded? (for example when using `keeph`) */
  discarded: boolean;
}

declare interface BaseTopDiceResult {
  /** Only available in the top result. */
  title: string;
  /** Only available in the top result. */
  expression: string;
  /** The visibility of the current roll. Only available in the top result */
  visibility: DiceVisibility;
}

declare interface BaseDiceResult {
  /** The type of the current roll. */
  type: DiceType;
  /** * For a `'dice'` roll: the total value of the rolls
   *  * For a `'number'` roll: the result of the operation
   *  * For a `'comparison'` roll: the number of successes
   */
  total: number;
  /** Get the tags for the current roll. If you want all the tags, include in the children, use {@link allTags} */
  tags: string[];
  /** Get the tags, including the ones in the children */
  allTags: string[];
  /** Get all the results of the rolled dice, including in the children */
  all: SingleDiceResult[];
  /** Get the children of the curent roll */
  children: DiceResultChild[];
  /**
   * Checks if the current roll or any of its children contains this tag
   * @param tag The tag to lookup
   */
  containsTag(tag: string): boolean;
}

declare interface DiceResultDice extends BaseDiceResult {
  type: 'dice';
  /** The number of rolled dice. For example, 3d6, returns 3. Returns null if the roll is not of type `dice` */
  size: number;
  /** The dimension of the dice For example 3d6 returns 6. Returns null if the roll is not of type `dice` */
  dimension: number;
  /** The results of the roll. Does not include the discarded values. Returns null if the roll is not of type `dice` */
  values: number[];
  /** The discarded results of the roll Returns null if the roll is not of type `dice` */
  discarded: number[];
}
declare interface DiceResultComparison extends BaseDiceResult {
  type: 'comparison';
  /** The left part of the comparison. Returns null if the roll is not of type `comparison` */
  left: DiceResultChild[];
  /** The right part of the comparison. Returns null if the roll is not of type `comparison` */
  right: DiceResultChild[];
  /** The number of successes of the comparison. Returns null if the roll is not of type `comparison` */
  success: number;
  /** The number of failures of the comparison. Returns null if the roll is not of type `comparison` */
  failure: number;
}
declare type DiceResultNumber = BaseDiceResult & { type: 'number' };
declare type DiceResultChild =
  | DiceResultComparison
  | DiceResultDice
  | DiceResultNumber;
declare type DiceResult = DiceResultChild & BaseTopDiceResult;

// Utilities
/** Log variables to the console */
declare function log(data: any): void;

/**
 * Call a function after a wait time
 * @param ms Duration in miliseconds to wait
 * @param callback The function to call when the timer is done.
 */
declare function wait(ms: number, callback: () => void): void;

/**
 * Converts any value to an integer
 * @param value The value to convert
 */
declare function parseInt(value: any): number;

/**
 * Translate a message to the current locale.
 * @param text The text to translate.
 */
declare function _(text: string): string;

/**
 * Iterates over an object or array
 * @param collection The data to iterate over
 * @param iterator The function called for each element in the data Return `false` if you want to stop the iteration. The first argument is the item, the second is the index.
 * @example
 * const animals = {
 *    cat: 'Meow',
 *    dog: 'Woof',
 *    bird: 'Chirp'
 * };
 * each(animals, (noise, type)=>log(noise));
 */
declare function each<T>(
  collection: T[],
  iterator: (item: T, index: number) => void | false
): void;
declare function each<T extends object>(
  collection: T,
  iterator: (item: ValueOf<T>, key: Keyof<T>) => void | false
): void;
declare function each<T>(
  collection: Table<T>,
  iterator: (item: T, id: string) => void | false
): void;
declare function each(
  collection: string,
  iterator: (char: string, index: number) => void | false
): void;
