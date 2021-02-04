DnD.Entity = {

  initEntity: function(element) {
    let abilities = ["str", "dex", "con", "int", "wis", "cha"];

    abilities.map(function (ability) {
      if (!(ability in element.dataset)) { throw "data-" + ability + "not specified for entity!"; }
      let mod = Math.floor((parseInt(element.dataset[ability]) - 10) / 2);
      // let save = mod + getBonuses(element, ability);
      element.dataset[ability + "Mod"] = mod;
      // element.dataset[ability + "Save"] = save;
    })
    // element.dataset.initiative = parseInt(element.dataset.dexMod) + getBonuses(element, "initiative");
    // update(element);
  },

  initEntities: function() { Array.from(document.getElementsByClassName("entity")).map(DnD.Entity.initEntity); },

}


DnD.initFunctions.push(DnD.Entity.initEntities);
