DnD.Entity = class Entity extends HTMLTableRowElement {
  static abilities = [ "str", "dex", "con", "int", "wis", "cha", ];
  static attributeMappers = {
    proficiency: parseInt,
    ac: parseInt,
    hp: parseInt,
    initiative: parseInt,
    ...(Entity.abilities.reduce(function(abilityMap, ability) { abilityMap[ability] = parseInt; return abilityMap }, {})),
  };

  constructor() {
    super();
    // Store off the initial values
    this.initialDataset = { ...this.dataset };
    // Initialize attributes
    this.initializeAttributes();
    // Initialize modifiers and saving throws
    this.initializeModifiersAndSavingThrows();
    // Actions
    this.initializeActions();

    // Add mutation observer to get a callback when data is changed
    this.inputObserver = new MutationObserver(Entity.update);
    this.inputObserver.observe(this, { attributeFilter: [
      "data-initiative-check",
      "data-str-save",
      "data-dex-save",
      "data-con-save",
      "data-int-save",
      "data-wis-save",
      "data-cha-save",
      "data-str-check",
      "data-dex-check",
      "data-con-check",
      "data-int-check",
      "data-wis-check",
      "data-cha-check",
      // "data-hp",  // HP is handled independently since it makes other changes
    ]});
    this.hpObserver = new MutationObserver(Entity.handleHpMutation);
    this.hpObserver.observe(this, { attributeFilter: [ "data-hp" ] });
    // Do an initial update pass to render the page once it's loaded
    this.update();
    this.updateHp();
  }

  initializeAttributes() {
    // Initialize attributes
    this.proficiency = parseInt(this.dataset.proficiency);
    this.maxHp = parseInt(this.dataset.maxHp);
    this.hp = this.maxHp;
    this.str = parseInt(this.dataset.str) + this.getBonuses("str");
    this.dex = parseInt(this.dataset.dex) + this.getBonuses("dex");
    this.con = parseInt(this.dataset.con) + this.getBonuses("con");
    this.int = parseInt(this.dataset.int) + this.getBonuses("int");
    this.wis = parseInt(this.dataset.wis) + this.getBonuses("wis");
    this.cha = parseInt(this.dataset.cha) + this.getBonuses("cha");
  }

  initializeModifiersAndSavingThrows() {
    // Initialize modifiers and saving throws
    for (let ability of Entity.abilities) {
      this[ability+"Mod"] = Math.floor((this[ability] - 10) / 2) + this.getBonuses(ability+"Mod");
      this[ability+"Save"] = this[ability+"Mod"] + this.getBonuses(ability+"Save");
    }
    this.initiativeMod = this.dexMod + this.getBonuses("initiative");
    // Attribute value bounds
    this.attributeBounds = {
      hp: { lower: 0, upper: this.maxHp},
      initiative: { lower: this.initiativeMod + 1, upper: this.initiativeMod + 21},
    };
    for (let ability of Entity.abilities) {
      this.attributeBounds[ability+"Mod"] = { lower: this[ability+"Mod"] + 1, upper: this[ability+"Mod"] + 21 };
      this.attributeBounds[ability+"Save"] = { lower: this[ability+"Save"] + 1, upper: this[ability+"Save"] + 21 };
    };
  }

  initializeActions() {
    let eventListenerWrappers = {
      click: function (f) { return f; },
      auxclick: function (f) { return f; },
      dblclick: function (f) { return f; },
      contextmenu: function (f) { return function (event) { event.preventDefault(); f(event); }; },
    }
    let entity = this;
    for (let element of this.getElementsByClassName("dnd-action")) {
      let eventActions = DnD.Parsers.extractEventActions(DnD.Parsers.EventActions.parse(element.dataset.actions));
      for (let eventAction of eventActions) {
        element.addEventListener(
          eventAction.event,
          eventListenerWrappers[eventAction.event](
            function(event) {
              if (
                Object.keys(eventAction.keys).reduce(
                  function(value, key) { return value && eventAction.keys[key] == event[key]; },
                  true
                )
              ) {
                entity[eventAction.action](...eventAction.actionArgs);
              }
            }
          )
        );
      }
    }
  }

  getBonuses(attribute) {
    let bonusesName = attribute+"Bonuses";
    let bonus = 0;
    if (bonusesName in this.dataset) {
      for (let bonusAttr of this.dataset[bonusesName].split(" ")) {
        bonus += this[bonusAttr];
      }
    }
    return bonus;
  }

  update() {
    // Name
    for (let element of this.getElementsByTagName("dnd-entity-name")) {
      element.dataset.name = this.dataset.name;
    }
    // Link
    for (let element of this.querySelectorAll(".dnd-entity-link a")) {
      element.href = this.dataset.link;
    }
    // Ability Checks
    for (let element of this.getElementsByTagName("dnd-entity-ability")) {
      let ability = element.dataset.ability;
      element.dataset.abilityValue = this[ability+element.dataset.abilitySuffix];
      if (ability+"Check" in this.dataset) {
        element.dataset.abilityCheck = this.dataset[ability+"Check"];
      }
      else {
        delete element.dataset.abilityCheck;
      }
    }
    // Arbitrary Attributes
    for (let element of this.getElementsByTagName("dnd-entity-attribute")) {
      let attribute = element.dataset.attribute;
      element.dataset.value = this[attribute];
    }
  }

  updateHp() {
    if (this.hp == 0) {
      this.classList.remove("bloodied");
      this.classList.remove("healthy");
      this.classList.add("unconscious");
    }
    else if (this.hp > Math.floor(this.maxHp / 2)) {
      this.classList.remove("bloodied");
      this.classList.remove("unconscious");
      this.classList.add("healthy");
    }
    else if (this.hp <= Math.floor(this.maxHp / 2)) {
      this.classList.remove("healthy");
      this.classList.remove("unconscious");
      this.classList.add("bloodied");
    }
  }

  isInBounds(attribute, value) {
    return this.attributeBounds[attribute].lower <= value && value <= this.attributeBounds[attribute].upper;
  }

  bound(attribute, value) {
    return Math.min(
      Math.max(this.attributeBounds[attribute].lower, value),
      this.attributeBounds[attribute].upper
    );
  }

  decrement(attribute, step="1") {
    this[attribute] = this.bound(attribute, this[attribute] - parseInt(step));
    this.dataset[attribute] = this[attribute]
  }

  increment(attribute, step="1") {
    this[attribute] = this.bound(attribute, this[attribute] + parseInt(step));
    this.dataset[attribute] = this[attribute]
  }

  input(attribute) {
    let value = prompt("Input "+attribute+" ("+this.attributeBounds[attribute].lower+" to "+this.attributeBounds[attribute].upper+")");
    if (value != null) {
      if (/^(\-?)[0-9]+$/.test(value)) {
        value = parseInt(value);
        if (this.isInBounds(attribute, value)) {
          this.dataset[attribute+"Check"] = value;
          return;
        }
      }
      this.input(attribute);
    }
  }

  reset(attribute) {
    this.dataset[attribute] = this.initialDataset[attribute];
    this.initializeAttributes();
    this.initializeModifiersAndSavingThrows();
  }

  clear(attribute) {
    delete this.dataset[attribute+"Check"];
  }

  roll(attribute, suffix="Mod", roll="d20") {
    let result = DnD.rollDie(DnD.Parsers.extractRoll(DnD.Parsers.Roll.parse(roll))) + this[attribute+suffix];
    this.dataset[attribute+"Check"] = result;
  }

  static update(mutationsList, observer) {
    for (const mutation of mutationsList) {
      mutation.target.update();
    }
  }

  static handleHpMutation(mutationsList, observer) {
    for (const mutation of mutationsList) {
      mutation.target.update();
      mutation.target.updateHp();
    }
  }

};
customElements.define("dnd-entity", DnD.Entity, { extends: "tr" });


DnD.EntityName = class extends HTMLElement {
  constructor() {
    super();
    this.name = "";
    this.a = document.createElement("a");
    this.appendChild(this.a);
  }

  static get observedAttributes() { return [ "data-name" ]; }
  attributeChangedCallback(name, oldValue, newValue) {
    this.a.innerHTML = this.dataset.name;
  }
};
customElements.define("dnd-entity-name", DnD.EntityName);


DnD.EntityAbility = class extends HTMLElement {
  constructor() {
    super();
    if (!("abilitySuffix" in this.dataset)) {
      // Default to "Mod" values
      this.dataset.abilitySuffix = "Mod";
    }
  }

  static get observedAttributes() { return [ "data-ability-value", "data-ability-suffix", "data-ability-check" ]; }
  attributeChangedCallback(name, oldValue, newValue) {
    if ("abilityCheck" in this.dataset) {
      this.innerHTML = this.dataset.abilityCheck;
      if (this.parentElement instanceof HTMLButtonElement) {
        this.parentElement.classList.remove("border-outset");
        this.parentElement.classList.add("border-inset");
      }
    }
    else if ("abilityValue" in this.dataset) {
      if (this.parentElement instanceof HTMLButtonElement) {
        this.parentElement.classList.add("border-outset");
        this.parentElement.classList.remove("border-inset");
      }
      if (this.dataset.abilitySuffix == "") {
        this.innerHTML = "(" + this.dataset.abilityValue + ")";
      }
      else {
        this.innerHTML = (this.dataset.abilityValue >= 0 ? "+" : "") + this.dataset.abilityValue;
      }
    }
    else {
      this.innerHTML = "?";
    }
  }
};
customElements.define("dnd-entity-ability", DnD.EntityAbility);


DnD.EntityAttribute = class extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() { return [ "data-value" ]; }
  attributeChangedCallback(name, oldValue, newValue) {
    if ("value" in this.dataset) {
      this.innerHTML = this.dataset.value;
    }
    else {
      this.innerHTML = "?";
    }
  }
};
customElements.define("dnd-entity-attribute", DnD.EntityAttribute);


// Do an initial update/updateHp on all entity instances
DnD.addInitFunction(function() {
  for (let element of document.getElementsByClassName("entity")) {
    if (element instanceof DnD.Entity) {
      element.update();
      element.updateHp();
    }
  }
});
