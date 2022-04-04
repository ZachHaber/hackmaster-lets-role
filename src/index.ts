// write your custom scripts here

import { tableToArray, toMap } from './utils';

const attributes = tableToArray(Tables.get('attribute_list'));

const attributesMap = toMap(attributes, 'id');

// const modifiedComponentIDs = {};

//region STANDARD LET'S ROLE FUNCTIONS: these are pre-created as blank by Let's Role, customize each to enable script at different events

init = function (sheet) {
  // [triggered when any character sheet, craft, or dice roll is first displayed] This includes entries in the dice log.
  Bindings.clear(sheet.id()); // clear any remaining bindings in the item to avoid any unplanned messages at initialization
  if (sheet.id() === 'main') {
    // if item is a character sheet (currently, no code executed for any other type of item)
    log('Start initializing sheet');
    //log("Transferring data from old to new ids for components for which the id was changed");
    // transferValuesToModifiedIds(sheet);

    // //log("Initializing sheet ID");
    // addIdToSheet(sheet); //if the sheet doesn't yet have a customized ID, convert the numeric Let's Role sheet ID into one that can be used in roll tags to interpret rolls according to sheet stats (hunger)
    // //log("Sheet's ID is " + sheet.getData().uid);

    // //log('Initializing Attributes');
    // //initAttributes(sheet);

    // log('Initializing "race" string for Character Manager label');
    // // initRaceLabel(sheet);

    initSkills(sheet);
    // let values = sheet.getData().diceVisibility;
    // log(values)
    // log("Finished initializing sheet. Have fun!");
  }
};

/*initRoll = function (result, callback) { // [triggered at every dice roll (pop-up AND dice log), also triggered at table load for each item in the dice log]

    // DETERMINING WHO'S ROLLING, whether it's the current player (or GM) or another player.
    let id = getIdFromTags(result.allTags); // search for id in the roll tags (form "ID_XXXXX")
    let rollingPlayer = ""; // the upcoming displayResultWithHunger function will display results slightly differently if the player is the roller or not (ex: won't display interactive buttons to other players)

    if (dataForRolls.hasOwnProperty(id)) // if current instance contains the roller's id, then it is either the GM or the roller
        rollingPlayer = "thisPlayer"; 

    else { // if current instance doesn't have the roller's id in dataForRolls, then it's either another player... or no sheet has been initialized yet. So we'll add a condition to check that dataForRolls contains the necessary info
        let thisPlayersSheet = dataForRolls[Object.keys(dataForRolls)[0]]; // if not, then the essential info from the rolling player should be stored within the first element (sheet) of dataForRolls
        if (thisPlayersSheet && thisPlayersSheet.getData().hasOwnProperty("dataSharedBy_" + id)) // avoids any crashing at first table load before any sheet is opened (dice log entries): dataForRolls will be empty at first launch, and the player's sheet may not have any info if it's the first time it's opened
            rollingPlayer = "anotherPlayer";
    }

    callback('resultCustom', function (resultView) { // resultCustom is the id of the view to display for dice rolls
        if (rollingPlayer && !result.containsTag("humanity") && !result.containsTag("remorse") && !result.containsTag("willpower") && !result.containsTag("frenzy") && !result.containsTag("rouse_check") ) // humanity, willpower and rousecheck rolls are excluded from the view with hunger dice, because hunger does not apply
            displayResultWithHunger(result, id, resultView, rollingPlayer); // executed only if the instance has info from the rolling player AND it's a roll that applies hunger dice (humanity, willpower and rouse check rolls do not)

        else
            displayResultDefault(result, id, resultView); // default view that does not require any info from the roller, is called when the page is loaded to initialize the dice log entries
    });
};*/

getBarAttributes = function (sheet) {
  // [triggered when dropping a token onto a scene] adds options to the "Connect to" dropdown menu. The selected field will be displayed as a dynamic gauge on the token
  log(sheet.id());
  if (['main', 'monster'].includes(sheet.id())) {
    // limits the code to the cases where it's a character being dropped onto the scene, as opposed to a craft for example.

    let stats: ReturnType<typeof getBarAttributes> = {
      [_('Health')]: ['hp', 'hpmax'],
    };
    return stats;
  }
};
//endregion

//region "BACK-OFFICE" DATA MANAGEMENT FUNCTIONS: fix sheet data in the background to avoid bugs and data loss.

/* const transferValuesToModifiedIds = function (sheet) { //[called in init] Avoids losing information with a new commit after changing ids for some fields, by transferring the info from the old fields to the re-id-ed fields
    let updateArray = [{}]; // log the fields to update ahead of calling the setData function: split the data into multiple objects of 20 entries max thanks to the addToUpdates function, as that is the limit of the setData function

    const addToUpdates = function (id, value) { // [local function] used to follow .setData() function's limit of 20 objects == updateArray must be initialized at [{}] before calling this function, and then a loop should run through updateArray to setData each item of updateArray
        let sizeOfLastObject = Object.keys(updateArray[updateArray.length - 1]).length;
        if (sizeOfLastObject == 20) // if latest element in updateArray has reached the 20-object limit, create a new element
            updateArray.push({});

        updateArray[updateArray.length - 1][id] = value; // and add the value to update into that element
    };

    // Running through ORDINARY COMPONENTS (EVERYTHING EXCEPT REPEATERS)
    each(modifiedComponentIds, function (newID, oldID) { 
        if (sheet.getData()[oldID] && sheet.getData()[oldID] !== {}) { // if sheet has a field matching the old id (might not if it's a sheet first created after the switch), and the value in the old id is not empty (no use transferring it in that case)
            if (!sheet.getData()[newID] || sheet.getData()[newID] === {}) // then, if the sheet also has no value yet in the renamed field (wouldn't want to erase something)
                addToUpdates(newID, sheet.getData()[oldID]); // log the old value in front of the new ID, to be updated when setData function is called further on

            switch (typeof sheet.getData()[oldID]) { // then, also set the component with the old ID to empty, to avoid the sheet becoming too heavy in the future if too many components are renamed (Let's Role doesn't allow actually deleting fields)
                case 'string':
                    addToUpdates(oldID, '');
                    break;

                case 'number':
                    addToUpdates(oldID, 0);
                    break;

                case 'boolean':
                    addToUpdates(oldID, false);
                    break;

                case 'object':
                    addToUpdates(oldID, {});
                    break;
            }
        }
    });

    each(updateArray, function (object) { // pass to the sheet all the data logged to modify
        sheet.setData(object);
    });

    // Running through REPEATER COMPONENTS -- won't use addToUpdates for these because there's ever only one value (which contains every sub element) for each repeater id, and we'll setData them  one by one in order to set the new data BEFORE cleaning the repeater inside the loop
    each(repeaterComponents, function (repeater) {
        if (sheet.get(repeater).value()) { // only execute code if repeater is not empty; which it may be, like at first launch of a new sheet
            let repeaterContainsAModifiedComponent = false; // will tag whether repeater should be modified or not, aka whether or not its elements include a modified component id
            let repeaterUpdate = {};
            for (entry in sheet.get(repeater).value()) { // running through every element in said repeater
                let originalValues = sheet.get(repeater).find(entry).value(); // list of properties, aka filled components, in the entry value
                let newValues = {}; // create an object to pass the new values for this element

                each(Object.keys(originalValues), function (key) { //running through every field in the element
                    if (modifiedComponentIds.hasOwnProperty(key) && (originalValues[key] && originalValues[key] != {}) && (!originalValues[modifiedComponentIds[key]] || originalValues[modifiedComponentIds[key]] == {})) {
                        // if current field is within modifiedComponentIds, and the value of oldID in element is not empty string or zero or empty object, but the value of newID in the entry is indeed empty
                        repeaterContainsAModifiedComponent = true; // we will trigger the passing of this new element values object
                        newValues[modifiedComponentIds[key]] = originalValues[key]; // new id in new entry values is now value of old id in initial entry values
                    }
                    else // if current field is not within modifiedComponentIds, just copy its original value
                        newValues[key] = originalValues[key];
                });

                repeaterUpdate[entry] = newValues; // logging the new values to be passed into the repeater when using setData later
            }

            if (repeaterContainsAModifiedComponent) { // if we've logged a component with modified id in the current repeater, then we add it to updates, and clear it to avoid the glitch that doubles entries
                let updatedRepeater = {};
                updatedRepeater[repeater] = repeaterUpdate;
                sheet.setData(updatedRepeater);
                cleanRepeater(sheet, repeater); // cleans out any double entries in the repeater (known glitch, see below)
            }
        }
    });
};

const cleanRepeater = function (sheet, repeater) { // [called in transferValuesToModifiedIds] a bug currently doubles and glitches some entries when updating repeater data; this can be solved by clearing the repeater multiple times before setting the data. As I use setData as often as possible in this script to avoid excessive calls to the server, I need a function that clears the repeaters of bugs after each update
    if (sheet.get(repeater).value()) { // first check if repeater does contain an entry; otherwise the rest of the function will crash
        //Store original values before cleaning
        let originalData = sheet.get(repeater).value();

        //Clearing repeater as many times as half its number of entries to avoid the bug that doubles some entries after updating values
        let clearRepeater = {};
        clearRepeater[repeater] = {}; // the item will look like {repeaterID: {}}, we'll set it as many times as half the number of entry rounded down, because this is the number of doubles created by the glitch
        let numberOfClears = Object.keys(sheet.get(repeater).value()).length;
        for (i = 1; i <= numberOfClears; i++) {
            sheet.setData(clearRepeater);
        }

        // Putting the original data back into the repeater
        let fieldsToUpdate = {};
        fieldsToUpdate[repeater] = originalData;
        sheet.setData(fieldsToUpdate);
    }
}; 
*/
//endregion

//region SHEET ID GENERATION FUNCTIONS: for calling information from specific sheets to be used to format the resultCustom, by passing the ID into the roll's tags

// const convertIdToString = function (sheet) { // [called in addIdToSheet] we can't use getSheetId() directly in dice roll tags because tags don't tolerate numbers. We CAN however convert the numbers into letters, guaranteeing better unicity than by generating new IDs ourselves
//     let alphabet = "ABCDEFGHIJ"; // 10 letters, because the ID will be comprised of numbers aka 0 to 9 = 10 possible values
//     let result = "";
//     each(sheet.getSheetId().toString(), function (digit) { // convert each number of the ID into it's letter equivalent
//         result += alphabet.charAt(parseInt(digit));
//     });
//     return result;
// };

// const addIdToSheet = function (sheet) { // [called in init] create an invisible "uid" property in the sheet's data; it will be unique identifier that can be passed into a roll's tags to customize the roll result display
//     let data = sheet.getData();

//     if (!data.uid || data.uid !== (idPrefix + convertIdToString(sheet))) { // if sheet doesn't already have its unique ID, or it's incorrect (another ID formula was used before)
//         let newID = idPrefix + convertIdToString(sheet);
//         sheet.setData({ uid: newID });
//         log("Sheet's ID set to " + newID);
//     }

//     dataForRolls[data.uid] = sheet; // storing the sheet into the global dataForRolls object, called by result display functions
// };

// const getIdFromTags = function (tags) { // [called in initRoll] extracts the id (string in the format of "ID_XXXXX") from the diceRoll's tags
//     let id;
//     each(tags, function (tag) { //run through every tag
//         if (tag.includes(idPrefix)) // find if one of them includes the "ID_" prefix, which designates which sheet made the roll
//             id = tag;
//     });

//     return id;
// };
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
          const stats = skill.stats.split(',');
          pct =
            Math.min.apply(
              undefined,
              stats.map((statId) => data[statId])
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
