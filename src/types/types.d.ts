declare type Attributes = 'str' | 'dex' | 'int' | 'wis' | 'lks' | 'cha' | 'con';

declare type DiceVisibility = 'all' | 'gm' | 'gmonly';

declare interface Attribute {
  id: Attributes;
  label: string;
}

declare interface Skill {
  id: string;
  label: string;
  section: 'universal';
  stats: string;
}

declare interface Race {
  id: string;
  value: string;
}

declare interface Class {
  id: string;
  value: string;
}

declare interface Visibility {
  id: DiceVisibility;
  value: string;
}

declare interface Alignment {
  id: string;
  value: string;
}

declare interface SkillDifficulty {
  id: string;
  value: string;
  label: string;
}

declare interface DamageType {
  id: string;
  value: string;
}

declare interface Init {
  id: string;
  value: string;
}

declare interface Size {
  id: string;
  value: string;
}

interface TableMap {
  Races: Table<Race>;
  Classes: Table<Class>;
  'dice-visi': Table<Visibility>;
  Alignment: Table<Alignment>;
  myTabs: Table<unknown>;
  skillstabs: Table<unknown>;
  rolldiff: Table<SkillDifficulty>;
  attribute_list: Table<Attribute>;
  damage_type: Table<DamageType>;
  init_select: Table<Init>;
  size_choice: Table<Size>;
  skills: Table<Skill>;
}

declare interface Tables {
  get<T extends keyof TableMap>(name: T): TableMap[T];
}
declare const Tables: Tables;

declare class Table<T> {
  each(cb: (line: T) => void): void;
  get(id: string): T;
  random(cb: (line: T) => void): void;
}

declare class Sheet {
  /** Get a component by its id */
  get<T extends ComponentValue>(id: string): Component<T> | null;
  /** Get a variable's value by its id */
  getVariable(id: string): string | number | null;
  /** Get the id of the sheet */
  id(): string;
  /** Get the name of the sheet */
  name(): string;
  /** Prompt the user for additional information */
  prompt(title: string, view: string, callback: any): void;
  /** Set multiple components values at the same time. */
  setData(data: any): void;

  getData(): record<string, ComponentValue> & {
    skillDifficulty: string;
    diceVisibility: DiceVisibility;
  };
}

declare class Component<T = ComponentValue> {
  /** @returns the Sheet associated with this component */
  sheet(): Sheet;
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
  find(id: string): Component | null;

  /**
   *
   * @param event
   * @param delegate Subcomponent to delegate the event to.
   * @param callback The function to call when the event is triggered. The first argument is the event.
   *
   * If the event is triggered from code, it will have the property `computed` to `true`. It’s possible to delegate events to a subcomponent, useful when using repeaters. It’s only possible to have one event of the same type for a component at once.
   */
  on(event: EventType, callback: (event: any) => void): void;
  on(event: EventType, delegate: string, callback: (event: any) => void): void;

  /**
   *
   * @param event
   * @param delegate  Subcomponent to delegate the event to.
   *
   * Remove an event on the component or one of its delegates.
   */
  off(event: EventType): void;
  off(event: EventType, delegate): void;

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

type ComponentValue = null | number | string | object;

declare let init: (sheet: Sheet) => void;
declare let getBarAttributes: (
  sheet: Sheet
) => Record<string, string[]> | undefined;

declare function _(string: string): string;

declare function log(...data: any[]): void;

/**
 * Bindings allow players to reference an element of their character sheet in the chat. With this API, you have full control over what bindings are available, and how they are displayed.

A binding is created with 4 elements :

- name : the name used in the chat to reference the binding
- componentId : the id of the component referenced. You can have several bindings for a single componentId, for example in repeaters
- viewId : the id of the view used to display the binding
- data `Function` : a function that returns an object of data passed to the view for rendering. This data will be available in the view
 */
class Binding {
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
    dataCallback: () => object
  );

  /**
   *
   * @param sheet The sheet element attached to the binding
   * @param name The name of the bidning
   *
   * Sends a binding into the chat. The binding must have been registered with Binding.{@link add()}
   */
  send(sheet: Sheet, name: string): void;

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
  constructor(input: DiceValue): DiceBuilder;
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
  rerolln(...reroll: number[], max: number): DiceBuilder;
  ternary(then: DiceValue, elseValue: DiceValue): DiceBuilder;
  toString(): string;
}

declare const Dice: {
  create(input: DiceValue): DiceBuilder;
  roll(
    sheet: Sheet,
    expression: DiceValue,
    title?: string,
    visibility?: DiceVisibility,
    actions?: any
  ): void;
};

type DiceValue = string | number | DiceBuilder;
