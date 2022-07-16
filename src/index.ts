import { addEventListener, ComponentEvent } from './listeners';
import {
  ensureUniversalSkillsExist,
  isMainSheet,
  MainSheet,
  MainSheetData,
  sheets,
  SkillRepeaters,
  sortSkills,
  upgradeSheet,
} from './sheet';
import { debug, debugFunc } from './utils';
// write your custom scripts here

// import { tableToArray, toMap } from './utils';

// const attributesMap = toMap(attributes, 'id');
//#region STANDARD LET'S ROLE FUNCTIONS: these are pre-created as blank by Let's Role, customize each to enable script at different events

init = function (sheet) {
  // [triggered when any character sheet, craft, or dice roll is first displayed] This includes entries in the dice log.
  Bindings.clear(sheet.id()); // clear any remaining bindings in the item to avoid any unplanned messages at initialization
  debug('Start Upgrading sheet');
  debugFunc(() => sheet.getData());
  upgradeSheet(sheet);
  if (isMainSheet(sheet)) {
    log('Start initializing main sheet');
    //log("Transferring data from old to new ids for components for which the id was changed");
    // //log("Initializing sheet ID");
    // //log("Sheet's ID is " + sheet.getData().uid);

    // //log('Initializing Attributes');
    // //initAttributes(sheet);

    // log('Initializing "race" string for Character Manager label');
    initRaceLabel(sheet);
    initSkills(sheet);
    debugFunc(() => sheet.getData());
    // let values = sheet.getData().diceVisibility;
    // log(values)
    // log("Finished initializing sheet. Have fun!");
  }
};

// initRoll = function (result, callback) {
//   // [triggered at every dice roll (pop-up AND dice log), also triggered at table load for each item in the dice log]
//   // DETERMINING WHO'S ROLLING, whether it's the current player (or GM) or another player.
//   let id = getIdFromTags(result.allTags); // search for id in the roll tags (form "ID_XXXXX")
//   let rollingPlayer = ''; // the upcoming displayResultWithHunger function will display results slightly differently if the player is the roller or not (ex: won't display interactive buttons to other players)

//   if (id && dataForRolls.hasOwnProperty(id))
//     // if current instance contains the roller's id, then it is either the GM or the roller
//     rollingPlayer = 'thisPlayer';
//   else {
//     // if current instance doesn't have the roller's id in dataForRolls, then it's either another player... or no sheet has been initialized yet. So we'll add a condition to check that dataForRolls contains the necessary info
//     let thisPlayersSheet = dataForRolls[Object.keys(dataForRolls)[0]]; // if not, then the essential info from the rolling player should be stored within the first element (sheet) of dataForRolls
//     if (
//       thisPlayersSheet &&
//       thisPlayersSheet.getData().hasOwnProperty('dataSharedBy_' + id)
//     )
//       // avoids any crashing at first table load before any sheet is opened (dice log entries): dataForRolls will be empty at first launch, and the player's sheet may not have any info if it's the first time it's opened
//       rollingPlayer = 'anotherPlayer';
//   }
//   // callback('resultCustom', function (resultView) {
//   //   // resultCustom is the id of the view to display for dice rolls
//   //   if (
//   //     rollingPlayer &&
//   //     !result.containsTag('humanity') &&
//   //     !result.containsTag('remorse') &&
//   //     !result.containsTag('willpower') &&
//   //     !result.containsTag('frenzy') &&
//   //     !result.containsTag('rouse_check')
//   //   )
//   //     // humanity, willpower and rousecheck rolls are excluded from the view with hunger dice, because hunger does not apply
//   //     displayResultWithHunger(result, id, resultView, rollingPlayer);
//   //   // executed only if the instance has info from the rolling player AND it's a roll that applies hunger dice (humanity, willpower and rouse check rolls do not)
//   //   else displayResultDefault(result, id, resultView); // default view that does not require any info from the roller, is called when the page is loaded to initialize the dice log entries
//   // });
// };

getBarAttributes = function (sheet) {
  const stats: ReturnType<typeof getBarAttributes> = {};
  // [triggered when dropping a token onto a scene] adds options to the "Connect to" dropdown menu. The selected field will be displayed as a dynamic gauge on the token
  if ([sheets.main, sheets.monster].includes(sheet.id())) {
    // limits the code to the cases where it's a character being dropped onto the scene, as opposed to a craft for example.
    stats[_('Health')] = ['hp', 'hpmax'];
  }
  return stats;
};
//#endregion

//#region SHEET INITIALIZATION FUNCTIONS: initialize every element of the sheet, tab by tab, to update dependent fields when modified and trigger rolls when clicked

const initRaceLabel = function (sheet: MainSheet) {
  // [called in init] calculates the 'race' id component to pass info into the character manager

  const updateRaceLabel = function () {
    const data = sheet.getData();

    const entries: string[] = [];
    if (data.characterLevel) {
      entries.push(`${_('lvl')} ${data.characterLevel}`);
    }
    if (data.characterRace || 'default' !== 'default') {
      const race = Tables.get('Races').get(data.characterRace).value;
      entries.push(_(race));
    }
    const raceLabel = entries.join(' ');
    if (data.race !== raceLabel) {
      sheet.get('race').value(raceLabel);
    }
  };
  updateRaceLabel();
  addEventListener(sheet, 'characterLevel', 'update', (event) => {
    updateRaceLabel();
  });
  addEventListener(sheet, 'characterRace', 'update', (event) => {
    updateRaceLabel();
  });
};

const initSkills = function (sheet: Sheet<sheets.main>) {
  debug(`init skills`);
  ensureUniversalSkillsExist(sheet);
  type SortId = 'sortSkillsName' | 'sortSkillsPercent';
  const sortIds: SortId[] = ['sortSkillsName', 'sortSkillsPercent'];
  function sortHandler(ev: ComponentEvent<string>) {
    const component = ev.target;
    const sorts: Record<
      SortId,
      { states: string[]; property: 'label' | 'percentDisplay'; other: SortId }
    > = {
      sortSkillsPercent: {
        states: ['Sort by Percent Desc', 'Sort by Percent Asc'],
        property: 'percentDisplay',
        other: 'sortSkillsName',
      },
      sortSkillsName: {
        states: ['Sort by Name Desc', 'Sort by Name Asc'],
        property: 'label',
        other: 'sortSkillsPercent',
      },
    };
    const repeater = sheet.get('skills');
    const skills = Object.entries(repeater.value());
    const dirs = ['asc', 'desc'] as const;
    const { states, property, other } = sorts[component.id() as SortId];
    const index = (states.indexOf(component.value()) + 1) % states.length;
    const update: Partial<MainSheetData> = {
      skills: Object.fromEntries(sortSkills(skills, property, dirs[index])),
    };

    update[component.id() as unknown as SortId] = states[index];
    update[other] = sorts[other].states[1];
    debug('setting data in sortHandler');
    sheet.setData(update);
  }
  sortIds.forEach((id) => {
    addEventListener(sheet, id, 'click', sortHandler);
  });

  function clearFilterSkills() {
    const filterSkills = sheet.get('filterSkills');
    if (filterSkills.value()) {
      filterSkills.value('');
    }
  }
  addEventListener(sheet, 'filterSkillsIcon', 'click', clearFilterSkills);

  addEventListener(sheet, 'filterSkills', 'update', function (event) {
    const search = event.target.value().toLocaleLowerCase();
    const filterSkillsIcon = sheet.get('filterSkillsIcon');
    const newIcon = search ? 'times' : 'search';
    if (filterSkillsIcon.value() !== newIcon) {
      filterSkillsIcon.value(newIcon);
      filterSkillsIcon[search ? 'addClass' : 'removeClass']('clickable');
    }

    const repeater = sheet.get('skills');
    const table = Tables.get('skills');
    each(repeater.value(), (entry, entryId) => {
      const skill = table.get(entry.skill);
      if (!skill) {
        debug(`${entry.skill} does not exist in the table!`);
        return;
      }
      const entryComponent = repeater.find(entryId as string);
      if (!entryComponent) {
        return;
      }
      const visible = entryComponent.visible();
      if (skill.label.toLocaleLowerCase().includes(search)) {
        if (!visible) {
          entryComponent.show();
        }
      } else {
        if (visible) {
          entryComponent.hide();
        }
      }
    });
  });
  clearFilterSkills();

  const createSkillHandler = (repeaterId: SkillRepeaters) =>
    function skillClickHandler(input: Component<string | undefined>) {
      const entryId = input.index();
      if (!entryId) {
        // something went wrong
        debug(new Error('invalid entryId'));
        return;
      }
      const data = sheet.getData();
      const entryData = data[repeaterId][entryId];
      if (!entryData) {
        return debug('could not find ' + entryId + ' in the repeater');
      }
      debug(entryData);

      const { percent, skill: skillId, defaultPercent } = entryData;
      const skill: Skill =
        repeaterId === 'languages'
          ? {
              label: `${skillId} Language`,
              stats: 'int',
              id: '',
              section: undefined,
            }
          : Tables.get('skills').get(skillId);
      if (!skill) {
        debug(`${skillId} not found`);
        return;
      }
      const skillPercent = percent || defaultPercent || 0;
      const diff = Tables.get('rolldiff').get(
        data.skillDifficulty || 'default'
      );
      const diffMod = parseInt(diff.value);
      if (diff.id === 'default') {
        // TODO, add a prompt to select the difficult
        log('No difficulty Selected');
      } else if (diff.id === 'competitive') {
        if (repeaterId === 'languages') {
          return;
        }
        // 1d100p!
        const dice = Dice.create(
          '(1d100 < 100? reroll(1d100,100): 100 + (1d20 < 20? reroll(1d20,20) : 20 + expl(1d6)))'
        ).add(`${skillPercent}[skillPercent]`);
        Dice.roll(
          sheet,
          dice,
          ''.concat(skill.label, ' ', diff.label, ' Check'),
          data.diceVisibility
        );
      } else {
        const dice = Dice.create('1d100')
          .add(`${diffMod}[difficulty]`)
          .compare('<', `${skillPercent}[skillPercent]`);
        Dice.roll(
          sheet,
          dice,
          ''.concat(skill.label, ' ', diff.label, ' Skill Check'),
          data.diceVisibility
        );
      }
    };
  function updateRepeaterDisplay(repeaterId: SkillRepeaters) {
    const repeater = sheet.get(repeaterId);
    const table = Tables.get('skills');
    const skillClickHandler = createSkillHandler(repeaterId);
    each(repeater.value(), (item, entryId) => {
      const entryComponent = repeater.find(entryId as string);
      if (!entryComponent) {
        return;
      }
      const usedDisplay = entryComponent.find('usedDisplay');
      if (usedDisplay) {
        if (item.used) {
          usedDisplay.removeClass('invisible');
        } else {
          usedDisplay.addClass('invisible');
        }
      }
      const skillDisplay = entryComponent.find('skillDisplay');
      if (skillDisplay) {
        skillDisplay.on('click', skillClickHandler);
        if (repeaterId === 'skills') {
          // For the main skills list, we need to use
          if (!item.skill) {
            skillDisplay.text('N/A');
            return;
          } else {
            const skill = table.get(item.skill);
            if (skill.label !== item.skillDisplay) {
              if (!skill) {
                skillDisplay.text(`Skill ${item.skill} not found`);
              } else {
                skillDisplay.text(skill.label);
              }
            }
          }
        } else {
          skillDisplay.text(item.skill);
        }
      }
    });
  }
  const skillRepeaters: SkillRepeaters[] = ['skills', 'languages'];
  skillRepeaters.forEach((repeaterId) => {
    const repeater = sheet.get(repeaterId);
    updateRepeaterDisplay(repeaterId);
    repeater.on('update', () => {
      updateRepeaterDisplay(repeaterId);
    });
  });
  const skillRepeater = sheet.get('skills');
  Tables.get('attributes').each((attribute) => {
    addEventListener(sheet, attribute.id, 'update', (event) => {
      const skillTable = Tables.get('skills');
      const entries = Object.entries(skillRepeater.value());
      const data = sheet.getData();
      let hasUpdate = false;
      const update = Object.fromEntries(
        entries.map((entry) => {
          const skill = skillTable.get(entry[1].skill);
          if (
            !skill ||
            skill.section !== 'universal' ||
            event.target.value() == entry[1].defaultPercent ||
            !skill.stats.includes(event.target.id())
          ) {
            return entry;
          }
          const stats = skill.stats.split(',') as Attributes[];
          const defaultPercent =
            Math.min.apply(
              undefined,
              stats.map((statId) => data[statId] || 0)
            ) || 0;
          if (defaultPercent === entry[1].defaultPercent) {
            return entry;
          }
          hasUpdate = true;
          return [entry[0], { ...entry[1], defaultPercent }];
        })
      );
      if (hasUpdate) {
        skillRepeater.value(update);
      }
    });
  });
};

//#endregion
