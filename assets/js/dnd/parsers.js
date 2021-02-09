//
// Parsers are constructed from a list of matchers
// Matchers are either a regex or a Parser
// Effectively, the regexes act as the lexer, and the Parsers compose those tokens into more complex grammars
// Parser.parse yields a ParseResult which has a list representing the current Parser's child tokens, a status, and a length
//


DnD.Parsers = {}


DnD.Parsers.Result = class {
  constructor(matcher, children, length, status) {
    this.matcher = matcher;
    this.children = children;
    this.length = length;
    this.status = status;
  }
}


DnD.Parsers.Parser = class {
  constructor(...matchers) {
    // Force all matcher RegExps to match starting from the beginning of input
    this.matchers = matchers.map(function (matcher) {
      if (matcher instanceof RegExp && !matcher.source.startsWith("^")) {
        return RegExp("^" + matcher.source);
      }
      return matcher;
    });
  }

  match(matcher, s) {
    if (matcher instanceof RegExp) {
      let match = s.match(matcher);
      if (match) {
        return {
          result: new DnD.Parsers.Result(matcher, [match[0]], match[0].length, "ok"),
          s: s.slice(match[0].length),
        };
      }
      else {
        return {
          result: new DnD.Parsers.Result(matcher, [], 0, "NoMatch("+matcher.source+")"),
          s: s,
        };
      }
    }
    else if (matcher instanceof DnD.Parsers.Parser) {
      let result = matcher.parse(s);
      if (result.status == "ok") {
        return {
          result: new DnD.Parsers.Result(matcher, result.children, result.length, "ok"),
          s: s.slice(result.length),
        };
      }
      else {
        return {
          result: new DnD.Parsers.Result(matcher, [], 0, result.status),
          s: s,
        };
      }
    }
    else {
      throw "Unrecognized Matcher " + matcher + "!";
    }
  }

}


//
// Sequence Parser
//   Takes a list of matchers, requiring that they all match, in order
//
DnD.Parsers.Sequence = class extends DnD.Parsers.Parser {
  constructor(...matchers) { super(...matchers); }

  parse(inString) {
    let s = inString;
    let results = [];
    for (const matcher of this.matchers) {
      const result = super.match(matcher, s);
      results.push(result.result);
      s = result.s;
    }
    let fails = results.filter(function(result) { return result.status != "ok"; });
    if (fails.length == 0) {
      let length = results.reduce(function(sum, result) { return sum + parseInt(result.length); }, 0);
      return new DnD.Parsers.Result(this, results, length, "ok");
    }
    else {
      return new DnD.Parsers.Result(this, [], 0, fails.map(function(result) { return result.status; }).join(", "));
    }
  }
}


//
// OneOf Parser
//   Takes a list of matchers, requiring that exactly one match
//
DnD.Parsers.OneOf = class extends DnD.Parsers.Parser {
  constructor(...matchers) { super(...matchers); }

  parse(inString) {
    let results = [];
    for (const matcher of this.matchers) {
      const result = super.match(matcher, inString);
      results.push(result.result);
    }
    let successes = results.filter(function(result) { return result.status == "ok"; });
    if (successes.length == 1) {
      const success = results.filter(function(result) { return result.status == "ok" })[0];
      return new DnD.Parsers.Result(this, [success], success.length, "ok");
    }
    else if (successes.length == 0) {
      return new DnD.Parsers.Result(this, [], 0, "OneOf-NoMatches");
    }
    else {
      return new DnD.Parsers.Result(this, [], 0, "OneOf-MultipleMatches("+successes.map(function(result) { return result.matcher; }).join(", ")+")");
    }
  }
}


//
// LongestOf Parser
//   Takes a list of matchers, yielding the longest match
//
DnD.Parsers.LongestOf = class extends DnD.Parsers.Parser {
  constructor(...matchers) { super(...matchers); }

  parse(inString) {
    let result = new DnD.Parsers.Result(this, [], 0, "LongestOf-NoMatches");
    for (const matcher of this.matchers) {
      const currentResult = super.match(matcher, inString);
      if (currentResult.result.status == "ok" && currentResult.result.length > result.length) {
        result = currentResult.result;
      }
    }
    return new DnD.Parsers.Result(this, [result], result.length, "ok");
  }
}


//
// FirstOf Parser
//   Takes a list of matchers, yielding the first match
//
DnD.Parsers.FirstOf = class extends DnD.Parsers.Parser {
  constructor(...matchers) { super(...matchers); }

  parse(inString) {
    for (const matcher of this.matchers) {
      const result = super.match(matcher, inString);
      if (result.result.status == "ok") {
        return new DnD.Parsers.Result(this, [result.result], result.result.length, "ok");
      }
    }
    return new DnD.Parsers.Result(this, [], 0, "FirstOf-NoMatches");
  }
}


//
// Repeat Parser
//   Takes a matcher and a range of match counts, greedily expecting between min and max total matches.
//
DnD.Parsers.Repeat = class extends DnD.Parsers.Parser {
  constructor(min, max, matcher) { super(matcher); this.min = min; this.max = max; }

  parse(inString) {
    let s = inString;
    let successes = [];
    const matcher = this.matchers[0];
    for (let i = 0; i < this.max; ++i) {
      const result = super.match(matcher, s);
      if (result.result.status == "ok") {
        successes.push(result.result);
        s = result.s;
      }
      else {
        break;
      }
    }
    if (successes.length >= this.min) {
      let length = successes.reduce(function(sum, result) { return sum + parseInt(result.length); }, 0);
      return new DnD.Parsers.Result(this, successes, length, "ok");
    }
    else {
      return new DnD.Parsers.Result(this, [], 0, "Expected "+this.min+" to "+this.max+" matches, got "+successes.length);
    }
  }
}


DnD.Parsers.Optional = class extends DnD.Parsers.Repeat {
  constructor(matcher) { super(0, 1, matcher); }

  parse(inString) {
    let superResult = super.parse(inString);
    if (superResult.children.length == 1) {
      return new DnD.Parsers.Result(this, [superResult.children[0]], superResult.length, "ok");
    }
    return new DnD.Parsers.Result(this, [], 0, "ok");
  }

}


DnD.Parsers.Many = class extends DnD.Parsers.Repeat {
  constructor(matcher) { super(0, Number.MAX_SAFE_INTEGER, matcher); }
}


DnD.Parsers.Many1 = class extends DnD.Parsers.Repeat {
  constructor(matcher) { super(1, Number.MAX_SAFE_INTEGER, matcher); }
}


DnD.Parsers.SepBy = class extends DnD.Parsers.Parser {
  constructor(sep, matcher) { super(new DnD.Parsers.Sequence(matcher, new DnD.Parsers.Many(new DnD.Parsers.Sequence(sep, matcher)))); this.sep = sep; this.matcher = matcher; }

  parse(inString) {
    let sequenceResult = this.matchers[0].parse(inString);
    if (sequenceResult.status == "ok") {
      let flatChildren = sequenceResult.children[1].children.reduce(
        function(children, res) {
          children.push(res.children[1]);
          return children
        }, [sequenceResult.children[0]]
      );
      return new DnD.Parsers.Result(this, flatChildren, sequenceResult.length, "ok");
    }
    return sequenceResult;
  }

}

//
// Some common parser instances and helper functions
//

// Dice
DnD.Parsers.Die = new DnD.Parsers.Sequence(
  new DnD.Parsers.Optional(/\d+/),
  /d/,
  /(4|6|8|10|12|20|100)/
);
DnD.Parsers.RollValue = new DnD.Parsers.FirstOf(DnD.Parsers.Die, /\d+/);
DnD.Parsers.extractRollValue = function(ast) {
  if (ast.status == "ok") {
    // If it's a simple value
    if (ast.children[0].matcher instanceof RegExp) {
      return {
        count: parseInt(ast.children[0].children[0]),
        die: 1,
      }
    }
    // Otherwise, it's a die roll
    let hasCount = ast.children[0].children[0].children.length == 1;
    return {
      count: hasCount ? parseInt(ast.children[0].children[0].children[0].children[0]) : 1,
      die: parseInt(ast.children[0].children[2].children[0]),
    };
  }
  throw "Invalid RollValue '"+ast+"'";
}
DnD.Parsers.Roll = new DnD.Parsers.Sequence(
  DnD.Parsers.RollValue,
  new DnD.Parsers.Many(
    new DnD.Parsers.Sequence(
      /(\+|-)/,
      DnD.Parsers.RollValue
    )
  )
);
DnD.Parsers.extractRoll = function(ast) {
  if (ast.status == "ok") {
    let roll = [DnD.Parsers.extractRollValue(ast.children[0])];
    roll[0].sign = "+";
    return roll.concat(ast.children[1].children.map(function(child) {
      let rollValue = DnD.Parsers.extractRollValue(child.children[1]);
      console.log(rollValue, child);
      rollValue.sign = child.children[0].children[0];
      return rollValue;
    }));
  }
  throw "Invalid Roll '"+ast+"'";
}

// IDs and Attributes
DnD.Parsers.ElementId = /[a-zA-Z_][\w\.]*/;
DnD.Parsers.AttributeName = /[a-zA-Z_]\w*/;
DnD.Parsers.IdAttr  = new DnD.Parsers.Sequence(
  new DnD.Parsers.Optional(DnD.Parsers.ElementId),
  /:/,
  new DnD.Parsers.Optional(DnD.Parsers.AttributeName)
);
DnD.Parsers.IdAttrs = new DnD.Parsers.SepBy(/ /, DnD.Parsers.IdAttr);
DnD.Parsers.ValueOrIdAttr = new DnD.Parsers.OneOf(DnD.Parsers.IdAttr, /\d+/);
DnD.Parsers.extractIdAttr = function(ast) {
  if (ast.status == "ok") {
    let hasId = ast.children[0].children.length == 1;
    let id = hasId
           ? ast            // DnD.Parsers.IdAttr
              .children[0]  // DnD.Parsers.Optional(DnD.Parsers.ElementId)
              .children[0]  // DnD.Parsers.ElementId
              .children[0]  // ElementId
           : [];
    let hasAttr = ast.children[2].children.length == 1;
    let attr = hasAttr
           ? ast            // DnD.Parsers.IdAttr
              .children[2]  // DnD.Parsers.Optional(DnD.Parsers.AttributeName)
              .children[0]  // DnD.Parsers.AttributeName
              .children[0]  // AttributeName
           : [];
    return { id: id, attr: attr, };
  }
  else {
    throw "Invalid IdAttr '"+ast+"'";
  }
}
DnD.Parsers.extractIdAttrs = function(ast) {
  return ast.children.map(DnD.Parsers.extractIdAttr);
}

// Events
DnD.Parsers.Event = /(click|dblclick|auxclick|contextmenu)/;
DnD.Parsers.EventKey = /(alt|ctrl|shift)/;
DnD.Parsers.EventKeys = new DnD.Parsers.SepBy(/,/, DnD.Parsers.EventKey);
DnD.Parsers.EventWithKeys = new DnD.Parsers.Sequence(
  DnD.Parsers.Event,
  new DnD.Parsers.Optional(new DnD.Parsers.Sequence(
    /\[/,
    DnD.Parsers.EventKeys,
    /\]/
  ))
);
DnD.Parsers.extractEventWithKeys = function(ast) {
  if (ast.status == "ok") {
    let hasKeys = ast.children[1].children.length == 1;
    let keys = (hasKeys
             ? ast            // DnD.Parsers.SepBy(/ /, DnD.Parsers.EventWithKeys).children[N]
                .children[1]  // DnD.Parsers.Optional(DnD.Parsers.Sequence(/\[/, DnD.Parsers.EventKeys, /\]/)
                .children[0]  // DnD.Parsers.Sequence(/\[/, DnD.Parsers.EventKeys, /\]/)
                .children[1]  // DnD.Parsers.EventKeys
                .children.map(function(key) { return key.children[0]; })
             : [])
    .reduce(
      function (keys, key) { keys[key+"Key"] = true; return keys; },
      { altKey: false, ctrlKey: false, shiftKey: false }
    );
    return {
      event: ast.children[0].children[0],
      keys: keys,
    };
  }
  throw "Invalid EventWithKeys '"+ast+"'";
}
DnD.Parsers.EventsWithKeys = new DnD.Parsers.SepBy(/ /, DnD.Parsers.EventWithKeys);
DnD.Parsers.extractEventsWithKeys = function(ast) {
  return ast.children.map(DnD.Parsers.extractEventWithKeys);
}

// Actions
DnD.Parsers.Action = /(decrement|increment|input|prompt|reset|roll)/;
DnD.Parsers.ActionArgs = new DnD.Parsers.Sequence(
  /\(/,
  new DnD.Parsers.SepBy(/,/, /[^\),]+/),
  /\)/
);
DnD.Parsers.EventAction = new DnD.Parsers.Sequence(
  DnD.Parsers.EventWithKeys,
  /:/,
  DnD.Parsers.Action,
  new DnD.Parsers.Optional(DnD.Parsers.ActionArgs)
);
DnD.Parsers.extractEventAction = function(ast) {
  let eventAction = DnD.Parsers.extractEventWithKeys(ast.children[0]);
  eventAction.action = ast.children[2].children[0];
  let hasActionArgs = ast.children[3].children.length == 1;
  eventAction.actionArgs = hasActionArgs ? ast.children[3].children[0].children[1].children.map(function(child) { return child.children[0]; }) : [];
  return eventAction;
}
DnD.Parsers.EventActions = new DnD.Parsers.SepBy(/ /, DnD.Parsers.EventAction);
DnD.Parsers.extractEventActions = function(ast) {
  return ast.children.map(DnD.Parsers.extractEventAction);
}
