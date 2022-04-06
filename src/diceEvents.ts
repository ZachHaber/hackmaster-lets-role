import { ID_PREFIX } from './sheet';
import { ensureArray } from './utils';
type Conditions = string[][];
let listeners: [Sheet, Conditions, InitRollFunction][] = [];
let overallListeners: [Conditions, InitRollFunction][] = [];

type TagListBase = string[] | string;
/**
 * Boolean conditions are simulated by
 * * within a single array - AND is applied
 * * between two arrays - OR is applied
 *
 * E.G. `['A','B']` would be equivalent to `[['A'],['B']]` which would require tag A OR tag B
 *
 * `[['A','B']]` would require tag A AND tag B
 *
 * To combine the logic together:
 * `[['A','C'],['B','C']]` would require (A and C) OR (B an C) tags
 */
export type TagList = TagListBase[] | TagListBase;

/**
 * Listen to specific rolls from a particular sheet
 * @param sheet
 * @param tagList the tags to listen to
 * @param callback Normal callback for {@link init}.
 *
 * If the function handles the event, return false, from the callback, so that nothing further is called
 * @example
 * // Listen to the 'attack' tag only
 * addDiceListener(sheet,'attack',cb)
 * // Listen to either 'attack' OR 'heal' tags
 * addDiceListener(sheet,['attack','heal'],cb);
 * // Listen to ('attack' AND 'monster') OR 'heal;
 * addDiceListener(sheet,[['attack','monster'],'heal'])
 */
export function addDiceListener(
  sheet: Sheet,
  tagList: TagList,
  callback: InitRollFunction
): void;
/**
 * Listen to specific rolls from anywhere.
 * These will only be called if no "sheets" were matches
 * @param tagList the tags to listen to
 * @param callback
 * @example
 * // Listen to the 'attack' tag only
 * addDiceListener('attack',cb)
 * // Listen to either 'attack' OR 'heal' tags
 * addDiceListener(['attack','heal'],cb);
 * // Listen to ('attack' AND 'monster') OR 'heal;
 * addDiceListener([['attack','monster'],'heal'])
 */
export function addDiceListener(
  tagList: TagList,
  callback: InitRollFunction,
  _: never
): void;
export function addDiceListener(
  sheetOrConditions: Sheet | TagList,
  conditionsOrCallback: TagList | InitRollFunction,
  callback: InitRollFunction | never
): void {
  if (callback) {
    listeners.push([
      sheetOrConditions as Sheet,
      tagListToInternal(conditionsOrCallback as TagList),
      callback,
    ]);
  } else {
    overallListeners.push([
      tagListToInternal(sheetOrConditions as TagList),
      conditionsOrCallback as InitRollFunction,
    ]);
  }
}
export function removeDiceListener(tagList: TagList, _: never): void;
export function removeDiceListener(sheetId: string, tagList: TagList): void;
export function removeDiceListener(
  sheetOrConditions: Sheet | TagList,
  tagList: TagList | never
): void {
  const conditions = tagListToInternal(
    tagList ? tagList : (sheetOrConditions as TagList)
  );
  const conditionString = conditionsToString(conditions);
  if (tagList) {
    listeners = listeners.filter(
      (listener) =>
        !(
          listener[0] === sheetOrConditions &&
          conditionsToString(listener[1]) === conditionString
        )
    );
  } else {
    overallListeners = overallListeners.filter(
      (listener) => conditionsToString(listener[0]) === conditionString
    );
  }
}
initRoll = function (result, callback) {
  // [triggered at every dice roll (pop-up AND dice log), also triggered at table load for each item in the dice log]
  // DETERMINING WHO'S ROLLING, whether it's the current player (or GM) or another player.
  let id = getIdFromTags(result.allTags); // search for id in the roll tags (form "ID_XXXXX")
  const tags = result.allTags;
  for (const [sheet, conditions, cb] of listeners) {
    const { uid } = sheet.getData();
    if (uid && uid !== id) {
      continue;
    }
    if (matchConditions(conditions, tags)) {
      if (cb(result, callback) === false) {
        // match returned false - time to stop processing!
        return;
      }
    }
  }
  for (const [conditions, cb] of overallListeners) {
    if (matchConditions(conditions, tags)) {
      if (cb(result, callback) === false) {
        // match returned false - time to stop processing
        return;
      }
    }
  }
  // callback('resultCustom', function (resultView) {
  //   // resultCustom is the id of the view to display for dice rolls
  //   if (
  //     rollingPlayer &&
  //     !result.containsTag('humanity') &&
  //     !result.containsTag('remorse') &&
  //     !result.containsTag('willpower') &&
  //     !result.containsTag('frenzy') &&
  //     !result.containsTag('rouse_check')
  //   )
  //     // humanity, willpower and rousecheck rolls are excluded from the view with hunger dice, because hunger does not apply
  //     displayResultWithHunger(result, id, resultView, rollingPlayer);
  //   // executed only if the instance has info from the rolling player AND it's a roll that applies hunger dice (humanity, willpower and rouse check rolls do not)
  //   else displayResultDefault(result, id, resultView); // default view that does not require any info from the roller, is called when the page is loaded to initialize the dice log entries
  // });
};

/**
 * [called in initRoll] extracts the id (string in the format of "ID_XXXXX") from the diceRoll's tags
 * @param tags DiceResult's tags
 * @returns sheet's id or undefined if not found
 */
const getIdFromTags = function (tags: string[]): string | undefined {
  return tags.find((tag) => tag.startsWith(ID_PREFIX));
};

function tagListToInternal(tagList: TagList) {
  return ensureArray(tagList)
    .map((set) => ensureArray(set))
    .filter((set) => set.length > 0);
}
const conditionsToString = (conditions: Conditions) =>
  conditions.map((set) => set.join('||')).join('&&');
const matchConditions = (conditions: Conditions, tags: string[]) => {
  if (!conditions.length) {
    // There are no conditions!
    return true;
  }
  if (!tags.length) {
    // There are conditions, but no tags!
    return false;
  }
  return conditions.some((set) => set.every((role) => tags.includes(role)));
};
