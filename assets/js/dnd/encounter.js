DnD.Encounter = class Encounter extends HTMLDetailsElement {
  constructor() {
    super();
    this.initiativeObserver = new MutationObserver(DnD.Encounter.sort);
    this.initiativeObserver.observe(this, { attributeFilter: [ "data-initiative-roll" ], subtree: true });
    this.sort();
  }

  rows() {
    let tbody = this.getElementsByTagName("tbody")[0];
    return Array.from(tbody.getElementsByTagName("tr")).filter(
      function(element) { return element instanceof DnD.Entity; }
    );
  }

  sort() {
    let tbody = this.getElementsByTagName("tbody")[0];
    let rows = this.rows();
    rows.sort(function(lhs, rhs) {
      if ("initiativeRoll" in lhs.dataset && "initiativeRoll" in rhs.dataset) {
        return parseInt(rhs.dataset.initiativeRoll) - parseInt(lhs.dataset.initiativeRoll);
      }
      else if ("initiativeRoll" in lhs.dataset) {
        return -1;
      }
      else if ("initiativeRoll" in rhs.dataset) {
        return 1;
      }
      else {
        return rhs.initiativeMod - lhs.initiativeMod;
      }
    });
    for (let row of rows) {
      tbody.removeChild(row);
    }
    for (let row of rows) {
      row.classList.remove("selected");
      tbody.appendChild(row);
    }
    this.select(rows[0]);
  }

  select(element) {
    element.classList.add("selected");
    for (let details of this.querySelectorAll(".dnd-entity-details")) {
      details.classList.add("hidden");
    }
    let details = this.querySelector(".dnd-entity-details[data-entity-name='"+element.dataset.path+"']");
    if (details) {
      details.classList.remove("hidden");
    }
  }

  selectPrevious() {
    let current = this.querySelector(".entity.selected");
    let previous = null;
    if (current == null) {
      previous = this.querySelector("tr:last-child.entity:not(.unconscious)");
      if (previous != null) {
        this.select(previous);
      }
    }
    else {
      current.classList.remove("selected");
      previous = current.previousElementSibling;
      for (let _ in this.rows()) {
        if (previous == null) {
          previous = this.querySelector("tr:last-child.entity:not(.unconscious)");
          if (previous != null) {
            this.select(previous);
          }
          break;
        }
        else if (previous.classList.contains("unconscious")) {
          previous = previous.previousElementSibling;
        }
        else {
          this.select(previous);
          break;
        }
      }
    }
  }

  selectNext() {
    let current = this.querySelector(".entity.selected");
    let next = this.querySelector(".entity.selected ~ .entity:not(.unconscious)");
    if (next == null) {
      next = this.querySelector(".entity:not(.unconscious)");
    }
    if (current != null) {
      current.classList.remove("selected");
    }
    if (next != null) {
      this.select(next);
    }
  }

  setAbilitySuffix(suffix) {
    if (['', 'Mod', 'Save'].includes(suffix)) {
      for (let element of Array.from(this.getElementsByTagName("dnd-entity-ability")).filter(
        function(e) { return DnD.Entity.abilities.includes(e.dataset.ability); })
      ) {
        element.dataset.abilitySuffix = suffix;
      }
      for (let element of Array.from(this.getElementsByTagName("tr")).filter(function (e) { return e instanceof DnD.Entity; })) {
        element.update();
      }
    }
    else {
      throw "Unrecognized ability suffix '"+suffix+"'.  Expected '', 'Mod', or 'Save'";
    }
  }

  static getEncounter(element) {
    if (element.parentElement == null) {
      return null;
    }
    else if (element.parentElement instanceof DnD.Encounter) {
      return element.parentElement;
    }
    else {
      return DnD.Encounter.getEncounter(element.parentElement)
    }
  }

  static sort(mutationsList, observer) {
    for (const mutation of mutationsList) {
      DnD.Encounter.getEncounter(mutation.target).sort();
    }
  }

}
customElements.define("dnd-encounter", DnD.Encounter, { extends: "details" });


DnD.EncounterButton = class EncounterButton extends HTMLButtonElement {
  constructor() {
    super();
    this.encounter = DnD.Encounter.getEncounter(this);
  }

}
customElements.define("dnd-encounter-button", DnD.EncounterButton, { extends: "button" });
