import { isObject, length } from './utils';

export enum sheets {
  main = 'main',
  monster = 'monster',
}
export const ID_PREFIX = 'ID_';

// Used to set up sheets via versions.
export const versions: Record<sheets, number> = {
  main: 1,
  monster: 1,
};

export type MainSheet = Sheet<sheets.main>;
export type MonsterSheet = Sheet<sheets.monster>;

export type AllSheets = MainSheet | MonsterSheet;

export function isMainSheet<ST extends Sheets>(
  sheet: Sheet<ST>
): // @ts-ignore
sheet is MainSheet {
  return sheet.id() === sheets.main;
}
export function isMonsterSheet<ST extends Sheets>(
  sheet: Sheet<ST>
): // @ts-ignore
sheet is MonsterSheet {
  return sheet.id() === sheets.monster;
}

type ModifyIds<ST extends Sheets> = { [id: string]: keyof SheetSetup[ST] };

interface Update<ST extends Sheets> {
  /**
   * The updates to apply to the sheet.
   */
  updates: Partial<SheetSetup[ST]>;
  /**
   * Automagical translation from one sheet id to another, while removing data from the original
   * It will hopefully work for changing a property and then updating it updates as well. i.e.
   * @example
   * updates.name = 'test';
   * modifiedComponentIds.name = 'newName';
   * // sheetData.name==='test' && sheetData.newName === oldData.name;
   */
  modifiedComponentIds: ModifyIds<ST>;
  /**
   * Automatical translation of ids in a repeater to new ids
   * If the repeater also changed ids (in modifiedComponentIds), this will use the old id to get data and put it into the new id
   */
  modifiedRepeaterIds: { [repeaterId: string]: ModifyIds<ST> };
}

function getVersionTransformations<ST extends Sheets>(
  curSheet: Sheet<ST>,
  version: number
): Update<ST> {
  const updates: Update<ST> = {
    updates: {},
    modifiedComponentIds: {},
    modifiedRepeaterIds: {},
  };

  // const sheetType = curSheet.id();
  switch (version) {
    // for changes that need to be made to all sheets at a particular version (mainly first init)
    case 0:
      {
        updates.updates.uid = convertIdToString(curSheet.getSheetId());
      }
      break;
  }
  if (isMainSheet(curSheet)) {
    const sheet: MainSheet = curSheet;
    switch (version) {
      case 0: {
      }
    }
  } else if (isMonsterSheet(curSheet)) {
    const sheet: MonsterSheet = curSheet;
    switch (version) {
      case 0: {
      }
    }
  }

  return updates;
}

export type UniversalSheetData = {
  uid: string;
  version: number;
  diceVisibility: DiceVisibility;
  [componentId: string]: ComponentValue;
};

export type MainSheetData = {
  skillDifficulty: string;
} & UniversalSheetData &
  Record<Attributes, number | undefined>;

export type MonsterSheetData = UniversalSheetData;
declare global {
  interface SheetSetup {
    [sheets.main]: MainSheetData;
    [sheets.monster]: MonsterSheetData;
  }
}

export function upgradeSheet(sheet: Sheet) {
  const newVersion = versions[sheet.id()];
  for (
    let oldVersion = sheet.getData().version || 0;
    oldVersion < newVersion;
    ++oldVersion
  ) {
    log(
      `Updating ${sheet.id()}.${sheet.getSheetId()} from ${oldVersion} to ${
        oldVersion + 1
      }`
    );
    const allUpdates = getVersionTransformations(sheet, oldVersion);

    // Make the modify updates apply first, so that you can change an id and still re-use the old id for a new data value without skipping a version
    const updates = {
      ...getModificationUpdates(sheet, allUpdates.modifiedComponentIds),
      ...allUpdates.updates,
      // ...repeaterUpdates,
    };
    // Apply the next version number (old + 1) to the sheet!
    updates.version = oldVersion + 1;
    applyUpdates(sheet, updates);

    // Apply repeater updates after the others repeater changes ids, you can apply the updates based on the new id.
    const repeaterUpdates = getRepeaterUpdates(
      sheet,
      allUpdates.modifiedRepeaterIds
    );
    if (repeaterUpdates) {
      applyUpdates(sheet, repeaterUpdates);
    }
    //// In case it turns out to be needed (mention of a glitch before)
    // for(const repeaterId of Object.keys(repeaterUpdates)){
    //   cleanRepeater(sheet,repeaterId);
    // }
  }
}

function convertIdToString(id: number) {
  const numToLetter = 'A'.charCodeAt(0) - '0'.charCodeAt(0);
  return (
    ID_PREFIX +
    id
      .toString(10)
      .split('')
      .map((char) => {
        return String.fromCharCode(char.charCodeAt(0) + numToLetter);
      })
      .join('')
  );
}

export function applyUpdates<ST extends Sheets>(
  sheet: Sheet<ST>,
  updates: Partial<SheetSetup[ST]>
) {
  const arr = Object.entries(updates);
  for (let i = 0; i < arr.length; i += 20) {
    const batch = Object.fromEntries(arr.slice(i, i + 20)) as Partial<
      SheetSetup[ST]
    >;
    sheet.setData(batch);
  }
}

function getModificationUpdates<ST extends Sheets>(
  sheet: Sheet<ST>,
  modifiedComponentIds: Record<string, keyof SheetSetup[ST]>
): Partial<SheetSetup[ST]> {
  const data = sheet.getData();
  const modifyUpdates: Partial<SheetSetup[ST]> = {};
  each(modifiedComponentIds, (newId, oldId) => {
    // const B : ST = 'main';
    const oldIdCast = oldId as unknown as keyof UniversalSheetData;
    // cast oldId to pretend to be an actual ID, because there's no guarantee we are keeping it around
    if (data[oldIdCast] != null) {
      // Clear out old data to save space
      // See if we can set it to undefined to fully remove the data.
      modifyUpdates[oldIdCast as keyof SheetSetup[ST]] = undefined;
      // If there's old data, transfer it to the new property
      modifyUpdates[newId] = data[oldIdCast] as any;
    }
  });

  return modifyUpdates;
}

function getRepeaterUpdates<ST extends Sheets>(
  sheet: Sheet<ST>,
  modifiedRepeaterIds: { [repeaterId: string]: ModifyIds<ST> }
  // modifiedComponentIds: Record<string, string>
) {
  const updates: Partial<SheetSetup[ST]> = {};
  // const invertedComponentIds = Object.fromEntries(
  //   Object.entries(modifiedComponentIds).map((entry) => entry.reverse())
  // );
  for (const repeaterId of Object.keys(modifiedRepeaterIds)) {
    let hasUpdate = false;
    const modifiedIds = modifiedRepeaterIds[repeaterId];
    if (!length(modifiedIds)) {
      continue;
    }
    // if there's an old ID associated with the repeaterId, use the originalId for getting the data for the mods
    // const originalId = invertedComponentIds(repeaterId) || repeaterId;
    const repeater = sheet.get<RepeaterValue>(repeaterId);
    if (!repeater) {
      // Couldn't find the repeater!
      continue;
    }
    each(repeater.value(), (values, entryId) => {
      if (!values || typeof values !== 'object') {
        return;
      }
      (updates[repeaterId] as RepeaterValue)[entryId] = Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          const newKey = modifiedIds[key] || key;
          if (newKey !== key) {
            hasUpdate = true;
          }
          return [newKey, value];
        })
      );
    });
    if (!hasUpdate) {
      delete updates[repeaterId];
    }
  }
  if (!Object.keys(updates).length) {
    return undefined;
  }
  return updates;
}

/**
 * Is this needed? Need to check.
 */
const cleanRepeater = function (sheet: Sheet, repeater: string) {
  const data = sheet.get(repeater)?.value();
  // [called in transferValuesToModifiedIds] a bug currently doubles and glitches some entries when updating repeater data; this can be solved by clearing the repeater multiple times before setting the data. As I use setData as often as possible in this script to avoid excessive calls to the server, I need a function that clears the repeaters of bugs after each update
  if (isObject(data)) {
    // first check if repeater does contain an entry; otherwise the rest of the function will crash
    //Store original values before cleaning
    // let originalData = sheet.get(repeater).value();

    //Clearing repeater as many times as half its number of entries to avoid the bug that doubles some entries after updating values
    let numberOfClears = length(data);
    for (let i = 1; i <= numberOfClears; i++) {
      sheet.setData({ [repeater]: {} });
    }

    // Putting the original data back into the repeater
    sheet.setData({ [repeater]: data });
  }
};

function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here");
}
