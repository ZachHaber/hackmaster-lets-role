import type { IconName } from '@fortawesome/fontawesome-common-types';

export type Attributes = 'str' | 'dex' | 'int' | 'wis' | 'lks' | 'cha' | 'con';

//#region Tables

export interface Attribute {
  id: Attributes;
  label: string;
}

export interface Skill {
  id: string;
  label: string;
  section?: 'universal';
  stats: string;
}

export interface Race {
  id: string;
  value: string;
}

export interface Class {
  id: string;
  value: string;
}

export interface Visibility {
  id: DiceVisibility;
  value: string;
}

export interface Alignment {
  id: string;
  value: string;
}

export interface SkillDifficulty {
  id:
    | 'default'
    | 'diff_verydifficult'
    | 'diff_difficult'
    | 'diff_average'
    | 'diff_easy'
    | 'diff_trivial'
    | 'competitive';
  value: `${number}`;
  label: string;
}

export interface DamageType {
  id: string;
  value: string;
}

export interface Init {
  id: string;
  value: string;
}

export interface Size {
  id: string;
  value: string;
}

declare global {
  interface TableMap {
    Races: Table<Race>;
    Classes: Table<Class>;
    diceVisibility: Table<Visibility>;
    Alignment: Table<Alignment>;
    myTabs: Table<unknown>;
    skillstabs: Table<unknown>;
    rolldiff: Table<SkillDifficulty>;
    attributes: Table<Attribute>;
    damage_type: Table<DamageType>;
    init_select: Table<Init>;
    size_choice: Table<Size>;
    skills: Table<Skill>;
  }
}

//#endregion

//#region Sheets

export enum sheets {
  main = 'main',
  monster = 'monster',
}

export type MainSheet = Sheet<sheets.main>;
export type MonsterSheet = Sheet<sheets.monster>;

export type UniversalSheetData = {
  uid: string;
  version: number;
  diceVisibility: DiceVisibility;
  // [componentId: string]: ComponentValue;
};

export interface SkillEntry {
  skill: string;
  skillDisplay?: string;
  percent: number;
  percentDisplay?: string;
  defaultPercent?: number;
  used: boolean;
  usedDisplay?: 'history';
}

export type SkillRepeaters = 'skills' | 'languages';

export type SkillRepeater = { [entryId: string]: SkillEntry };

// export interface

export type MainSheetData = {
  skillDifficulty: string;
  sortSkillsName: string;
  sortSkillsPercent: string;
  filterSkills: string;
  filterSkillsIcon: IconName;

  characterLevel: number;
  characterName: string;
  characterRace: string;
  characterClass: string;

  /**
   * A fake "magical" entry that populates into the character selector
   */
  race: string;
} & UniversalSheetData &
  Record<Attributes, number | undefined> &
  Record<`${Attributes}Frac`, number | undefined> &
  Record<SkillRepeaters, SkillRepeater>;

export type MonsterSheetData = {} & UniversalSheetData;

//#endregion

declare global {
  interface SheetSetup {
    [sheets.main]: MainSheetData;
    [sheets.monster]: MonsterSheetData;
  }

  interface SheetMap {
    [sheets.main]: Sheet<sheets.main>;
    [sheets.monster]: Sheet<sheets.monster>;
  }
}
