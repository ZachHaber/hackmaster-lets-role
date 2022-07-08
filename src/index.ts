import { sheets, upgradeSheet } from './sheet';
// write your custom scripts here

// import { tableToArray, toMap } from './utils';

// const attributes = tableToArray(Tables.get('attribute_list'));

// const attributesMap = toMap(attributes, 'id');
//region STANDARD LET'S ROLE FUNCTIONS: these are pre-created as blank by Let's Role, customize each to enable script at different events

init = function (sheet) {
  // [triggered when any character sheet, craft, or dice roll is first displayed] This includes entries in the dice log.
  Bindings.clear(sheet.id()); // clear any remaining bindings in the item to avoid any unplanned messages at initialization
  upgradeSheet(sheet);
  if (sheet.id() === sheets.main) {
    // if item is a character sheet (currently, no code executed for any other type of item)
    log('Start initializing sheet');
    //log("Transferring data from old to new ids for components for which the id was changed");
    // //log("Initializing sheet ID");
    // //log("Sheet's ID is " + sheet.getData().uid);

    // //log('Initializing Attributes');
    // //initAttributes(sheet);

    // log('Initializing "race" string for Character Manager label');
    // // initRaceLabel(sheet);

    initSkills(sheet);
    // let values = sheet.getData().diceVisibility;
    // log(values)
  }
  log('Finished initializing sheet. Have fun!');
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
    return stats;
  }
  return {};
};
//endregion

//region SHEET INITIALIZATION FUNCTIONS: initialize every element of the sheet, tab by tab, to update dependent fields when modified and trigger rolls when clicked

const initRaceLabel = function (sheet: Sheet) {
  // [called in init] calculates the 'race' id component to pass info into the character manager, it's just neat fancy sparkles <3
  // const updateRaceLabel = function () {
  //     let fakeRaceLabel = '';
  //     let addSpace = Boolean(sheet.get('character_lvl').value()) && Boolean(sheet.get('character_race').value() && sheet.get('character_race').value() != 'default');
  //     if (sheet.get('character_lvl').value())
  //         fakeRaceLabel += _("Lvl") + " " + sheet.get('character_lvl').value()
  //     if (addSpace)
  //         fakeRaceLabel += " ";
  //     if (sheet.get('character_race').value() && sheet.get('character_race').value() != 'default')
  //         fakeRaceLabel += _(Tables.get("Races").get(sheet.get("character_race").value()).label);
  //     if (sheet.get('race').value() != fakeRaceLabel)
  //         sheet.get('race').value(fakeRaceLabel);
  // };
  // updateRaceLabel();
  // sheet.get('character_lvl').on('update', function () {
  //     updateRaceLabel();
  // })
  // sheet.get('character_race').on('update', function () {
  //     updateRaceLabel();
  // })
};

const initSkills = function (sheet: Sheet) {
  Tables.get('skills').each((skill) => {
    sheet.get(skill.id)?.on('click', function () {
      const data = sheet.getData();
      let pct = sheet.get<number>(''.concat(skill.id, '_pct'))?.value() || 0;
      if (skill.section === 'universal') {
        const trained = data[`${skill.id}_isTrained`];
        if (!trained) {
          const stats = skill.stats.split(',') as Attributes[];
          pct =
            Math.min.apply(
              undefined,
              stats.map((statId) => data[statId] || 0)
            ) || 0;
        }
      } else if (pct === 0) {
        return;
      }
      const diff = Tables.get('rolldiff').get(data.skillDifficulty);
      const diffMod = parseInt(diff.value);
      if (diff.id === 'competitive') {
        // 1d100p!
        const dice = Dice.create(
          '(1d100 < 100? reroll(1d100,100): 100 + (1d20 < 20? reroll(1d20,20) : 20 + expl(1d6)))'
        ).add(''.concat(pct.toString(), '[skillPercent]'));
        Dice.roll(
          sheet,
          dice,
          ''.concat(skill.label, ' ', diff.label, ' Check'),
          data.diceVisibility
        );
      } else {
        const dice = Dice.create('1d100').add(diffMod).compare('<', pct);
        Dice.roll(
          sheet,
          dice,
          ''.concat(skill.label, ' ', diff.label, ' Skill Check'),
          data.diceVisibility
        );
      }
    });
  });
};

//endregion

for (const val of generator()) {
  log(val);
}

function* generator() {
  yield 2;
  yield 1;
  return 5;
}
