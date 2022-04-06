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

declare global {
  interface Sheet {
    id(): sheets;
  }
  interface SheetData extends Record<Attributes, number | undefined> {
    skillDifficulty: string;
    diceVisibility: DiceVisibility;
    version: number;
  }
}

export function upgradeSheet(sheet: Sheet) {
  const newVersion = versions[sheet.id()];
  for (
    let oldVersion = sheet.getData().version || 0;
    oldVersion < newVersion;
    ++oldVersion
  ) {
    const data = sheet.getData();
    /**
     * The updates to apply to the sheet.
     */
    let updates: Partial<SheetData> = {};
    /**
     * Automagical translation from one sheet id to another, while removing data from the original
     * It will hopefully work for changing a property and then updating it updates as well. i.e.
     * @example
     * updates.name = 'test';
     * modifiedComponentIds.name = 'newName';
     * // sheetData.name==='test' && sheetData.newName === oldData.name;
     */
    let modifiedComponentIds: Record<string, string> = {};
    /**
     * Automatical translation of ids in a repeater to new ids
     * If the repeater also changed ids (in modifiedComponentIds), this will use the old id to get data and put it into the new id
     */
    let modifiedRepeaterIds: { [repeaterId: string]: Record<string, string> } =
      {};
    // Apply updates independently by sheet type. - Each sheet type is versioned independently
    switch (sheet.id()) {
      case sheets.main: {
        switch (oldVersion) {
          case 0:
            {
              // Initial sheet creation (i.e. updating from version 0 to 1)
              updates.uid = convertIdToString(sheet.getSheetId());
              // Add values to modifiedComponentIds here to automatically add to updates.
            }
            break;
        }

        break;
      }
      case sheets.monster: {
        switch (oldVersion) {
          case 0:
            {
              // Initial sheet creation (i.e. updating from version 0 to 1)
              updates.uid = convertIdToString(sheet.getSheetId());
              // Add values to modifiedComponentIds here to automatically add to updates.
            }
            break;
        }
        break;
      }
    }

    const repeaterUpdates = getRepeaterUpdates(sheet, modifiedRepeaterIds);
    // Make the modify updates apply first, so that you can change an id and still re-use the old id for a new data value without skipping a version
    updates = {
      ...getModificationUpdates(sheet, modifiedComponentIds),
      ...updates,
      ...repeaterUpdates,
    };
    // Apply the next version number (old + 1) to the sheet!
    updates.version = oldVersion + 1;
    log(
      `Updating ${sheet.id()}.${sheet.getSheetId()} from ${oldVersion} to ${
        updates.version
      }`
    );
    applyUpdates(sheet, updates);
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
        return char.charCodeAt(0) + numToLetter;
      })
      .join('')
  );
}

export function applyUpdates(sheet: Sheet, updates: Partial<SheetData>) {
  const arr = Object.entries(updates);
  for (let i = 0; i < arr.length; i += 20) {
    const batch = Object.fromEntries(arr.slice(i, i + 20));
    sheet.setData(batch);
  }
}

function getModificationUpdates(
  sheet: Sheet,
  modifiedComponentIds: Record<string, string>
): Partial<SheetData> {
  const data = sheet.getData();
  const modifyUpdates: Partial<SheetData> = {};
  each(modifiedComponentIds, (newId, oldId) => {
    if (data[oldId] != null) {
      // Clear out old data to save space
      // See if we can set it to undefined to fully remove the data.
      modifyUpdates[oldId] = undefined;
      // If there's old data, transfer it to the new property
      modifyUpdates[newId] = data[oldId];
    }
  });

  return modifyUpdates;
}

function getRepeaterUpdates(
  sheet: Sheet,
  modifiedRepeaterIds: { [repeaterId: string]: Record<string, string> }
  // modifiedComponentIds: Record<string, string>
) {
  const updates: Partial<SheetData> = {};
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
    const repeater = sheet.get<string[]>(repeaterId);
    if (!repeater) {
      // Couldn't find the repeater!
      continue;
    }
    for (const entryId of repeater.value()) {
      const values = repeater.find(entryId)?.value();
      if (!values) {
        continue;
      }
      updates[repeaterId] = {
        ...((updates[repeaterId] as {}) || {}),
        [entryId]: Object.entries(values).map(([key, value]) => {
          const newKey = modifiedIds[key] || key;
          if (newKey !== key) {
            hasUpdate = true;
          }
          return [newKey, value];
        }),
      };
    }
    if (!hasUpdate) {
      delete updates[repeaterId];
    }
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
