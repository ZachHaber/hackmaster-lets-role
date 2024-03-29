import {
  Attributes,
  MainSheet,
  MonsterSheet,
  sheets,
  Skill,
  SkillEntry,
  UniversalSheetData,
} from './types/systemTypes';
import { debug, debugFunc, isObject, length, tableToArray } from './utils';

export const ID_PREFIX = 'ID_';

// Used to set up sheets via versions.
export const versions: Record<sheets, number> = {
  main: 1,
  monster: 1,
};

export function isMainSheet(sheet: Sheets): sheet is MainSheet {
  return sheet.id() === sheets.main;
}
export function isMonsterSheet(sheet: Sheets): sheet is MonsterSheet {
  return sheet.id() === sheets.monster;
}

type ModifyIds<ST extends SheetTypes> = Record<
  string,
  Keyof<SheetSetup[ST]> | string
>;
//  {
//   [id: string]: Keyof<SheetSetup[ST]> | string;
// };

interface Update<ST extends SheetTypes> {
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

function getVersionTransformations<Sheet extends Sheets>(
  sheet: Sheet,
  version: number
): Update<GetSheetType<Sheet>> {
  const updates: Update<GetSheetType<Sheet>> = {
    updates: {},
    modifiedComponentIds: {},
    modifiedRepeaterIds: {},
  };

  // const sheetType = curSheet.id();
  switch (version) {
    // for changes that need to be made to all sheets at a particular version (mainly first init)
    case 0:
      {
        updates.updates.uid = convertIdToString(sheet.getSheetId());
      }
      break;
  }

  if (isMainSheet(sheet)) {
    const mainUpdates: Update<GetSheetType<typeof sheet>> =
      updates as unknown as Update<GetSheetType<typeof sheet>>;
    switch (version) {
      case 0: {
        // Set all attributes to a base 10
        Tables.get('attributes').each((attribute) => {
          mainUpdates.updates[attribute.id] = 10;
          mainUpdates.updates[`${attribute.id}Frac`] = 10;
        });
        break;
      }
    }
  } else if (isMonsterSheet(sheet)) {
    switch (version) {
      case 0: {
      }
    }
  } else {
    assertUnreachable(sheet);
  }

  return updates;
}

export function upgradeSheet(sheet: Sheets) {
  const newVersion = versions[sheet.id()];
  for (
    // Change this for prod!
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

export function applyUpdates<Sheet extends Sheets>(
  sheet: Sheet,
  updates: Partial<SheetSetup[GetSheetType<Sheet>]>
) {
  const arr = Object.entries(updates);
  for (let i = 0; i < arr.length; i += 20) {
    const batch = Object.fromEntries(arr.slice(i, i + 20));
    sheet.setData(batch);
  }
}

function getModificationUpdates<Sheet extends Sheets>(
  sheet: Sheet,
  modifiedComponentIds: ModifyIds<GetSheetType<Sheet>>
): Partial<SheetSetup[GetSheetType<Sheet>]> {
  const data = sheet.getData();
  const modifyUpdates: Partial<SheetSetup[GetSheetType<Sheet>]> = {};
  each(modifiedComponentIds, (newId, oldId) => {
    // cast oldId to pretend to be an actual ID, because there's no guarantee we are keeping it around
    const oldIdCast = oldId as unknown as keyof UniversalSheetData;
    if (!data.hasOwnProperty(oldId) || !data[oldIdCast]) {
      // Skip this if it doesn't exist in the data currently or it's empty
      return;
    }
    // Clear out old data to save space...
    // let's role won't save if you try to set `null` or `undefined`
    // so `''` is likely the smallest data that can actually be used.
    modifyUpdates[oldIdCast] = '' as any;
    // If there's old data, transfer it to the new property
    modifyUpdates[newId as Keyof<typeof modifyUpdates>] = data[
      oldIdCast
    ] as any;
  });

  return modifyUpdates;
}

function getRepeaterUpdates<Sheet extends Sheets>(
  sheet: Sheets,
  modifiedRepeaterIds: { [repeaterId: string]: ModifyIds<GetSheetType<Sheet>> }
  // modifiedComponentIds: Record<string, string>
) {
  const updates: Partial<SheetSetup[GetSheetType<Sheet>]> = {};
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
    const repeater = sheet.get(
      repeaterId as keyof UniversalSheetData
    ) as unknown as Component<RepeaterValue>;
    if (!repeater) {
      // Couldn't find the repeater!
      continue;
    }
    each(repeater.value(), (values, entryId) => {
      if (!values || typeof values !== 'object') {
        return;
      }
      (
        updates[
          repeaterId as keyof SheetSetup[GetSheetType<Sheet>]
        ] as unknown as RepeaterValue
      )[entryId] = Object.fromEntries(
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
      delete updates[repeaterId as keyof SheetSetup[GetSheetType<Sheet>]];
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
const cleanRepeater = function (
  sheet: Sheets,
  repeater: string,
  numClears: number = 0
) {
  const data = sheet.get(repeater as any)?.value();
  // [called in transferValuesToModifiedIds] a bug currently doubles and glitches some entries when updating repeater data; this can be solved by clearing the repeater multiple times before setting the data. As I use setData as often as possible in this script to avoid excessive calls to the server, I need a function that clears the repeaters of bugs after each update
  if (isObject(data)) {
    // first check if repeater does contain an entry; otherwise the rest of the function will crash
    //Store original values before cleaning
    // let originalData = sheet.get(repeater).value();

    //Clearing repeater as many times as half its number of entries to avoid the bug that doubles some entries after updating values
    let numberOfClears = numClears || 2; //Math.ceil(length(data) / 2);
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

export function ensureUniversalSkillsExist(sheet: MainSheet) {
  debug('initializing universal skills');
  const skillTable = Tables.get('skills');
  const skills = tableToArray(skillTable);
  const universalSkills = skills.filter(
    (skill) => skill.section === 'universal'
  );
  const repeater = sheet.get('skills');
  const entries = repeater.value();
  let allValues = Object.entries(entries || {});
  const extantSkills = Object.fromEntries(
    allValues.map((skill) => [skill[1].skill, true])
  );
  const skillsToAdd = universalSkills.filter(
    (skill) => !extantSkills[skill.id]
  );
  const data = sheet.getData();

  if (skillsToAdd.length) {
    debugFunc(
      () => `Adding skills ${skillsToAdd.map((skill) => skill.id).join(', ')}`
    );
    const skills = skillsToAdd.map<[string, SkillEntry]>((skill) => {
      const stats = skill.stats.split(',') as Attributes[];
      const defaultPercent =
        Math.min.apply(
          undefined,
          stats.map((statId) => data[statId] || 0)
        ) || 0;
      return [
        skill.id,
        {
          percent: 0,
          skill: skill.id,
          defaultPercent,
          used: false,
        },
      ];
    });
    repeater.value(
      Object.fromEntries(sortSkills(skills.concat(allValues), 'label'))
    );
    cleanRepeater(sheet, 'skills');
  }
}

export function sortSkills(
  skillsEntries: [entryId: string, entry: SkillEntry][],
  property: 'label' | 'percentDisplay',
  dir: 'asc' | 'desc' = 'asc'
) {
  const skillTable = Tables.get('skills');
  return skillsEntries.sort((a, b) => {
    const dirMul = dir === 'asc' ? 1 : -1;
    return compareSkill(skillTable, a[1], b[1], property, dirMul);
  });
}
function compareSkill(
  table: Table<Skill>,
  a: SkillEntry,
  b: SkillEntry,
  property: 'label' | 'percentDisplay',
  dirMul: -1 | 1
): number {
  if (property === 'percentDisplay') {
    return (
      dirMul *
        ((a.percent || a.defaultPercent || 0) -
          (b.percent || b.defaultPercent || 0)) ||
      compareSkill(table, a, b, 'label', 1)
    );
  }
  const aSkill = table.get(a.skill);
  const bSkill = table.get(b.skill);
  if (!aSkill && !bSkill) {
    return 0;
  }
  if (!aSkill) {
    return 1;
  }
  if (!bSkill) {
    return -1;
  }
  return (
    aSkill.label.localeCompare(bSkill.label, undefined, {
      sensitivity: 'base',
    }) * dirMul
  );
}
