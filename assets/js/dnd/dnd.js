var DnD = {
  range: function*(start, end) { for (let i = start; i <= end; i++) { yield i; } },

  rollDieRandom: function(die) { return Math.floor(Math.random() * die) + 1; },
  rollDieMin: function(die) { return 1; },
  rollDieMax: function(die) { return die; },
  rollDie: function(roll, rollFunction=DnD.rollDieRandom) {
    return roll.reduce(
      function(sum, value) {
        for (let _ of DnD.range(1, value.count)) {
          if      (value.sign == "+") { return sum + rollFunction(value.die); }
          else if (value.sign == "-") { return sum - rollFunction(value.die); }
        }
        throw "Unrecognized sign for roll '"+value.sign+"'";
      }, 0
    );
  },

  initFunctions: [],
  addInitFunction: function(f) {
    if (document.readyState === 'loading') {  // Loading hasn't finished yet
      DnD.initFunctions.push(f);
    }
    else {
      f();
    }
  },
  initDnD: function() { DnD.initFunctions.map(function(f) { f(); }); },

  classes: {},

};


document.addEventListener("DOMContentLoaded", DnD.initDnD);
