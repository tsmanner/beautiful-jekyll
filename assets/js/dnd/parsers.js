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
// Alternatives Parser
//   Takes a list of matchers, requiring that exactly one match
//
DnD.Parsers.Alternatives = class extends DnD.Parsers.Parser {
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
      return new DnD.Parsers.Result(this, [], 0, "NoAlternatives");
    }
    else {
      return new DnD.Parsers.Result(this, [], 0, "MultipleAlternatives("+successes.map(function(result) { return result.matcher; }).join(", ")+")");
    }
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
      return new DnD.Parsers.Result(this, superResult.children[0], superResult.length, "ok");
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


DnD.Parsers.SepBy = class extends DnD.Parsers.Repeat {
  constructor(sep, matcher) { super(1, Number.MAX_SAFE_INTEGER, new DnD.Parsers.Sequence(matcher, new DnD.Parsers.Many(new DnD.Parsers.Sequence(sep, matcher)))); this.sep = sep; this.matcher = matcher; }

  parse(inString) {
    let superResult = super.parse(inString);
    if (superResult.status == "ok") {
      console.log(superResult);
      let flatChildren = superResult.children[0].children[1].children.reduce(
        function(children, res) {
          children.push(res.children[0].children[1]);
          return children
        }, [superResult.children[0].children[0]]
      );
      return new DnD.Parsers.Result(this, flatChildren, superResult.length, "ok");
    }
    return superResult;
  }

}

//
// Some common parser instances and helper functions
//

DnD.Parsers.ElementId = /[a-zA-Z_][\w\.]*/;
DnD.Parsers.AttributeName = /[a-zA-Z_]\w*/;
DnD.Parsers.IdAttr  = new DnD.Parsers.Sequence(new DnD.Parsers.Optional(DnD.Parsers.ElementId), /:/, new DnD.Parsers.Optional(DnD.Parsers.AttributeName));
DnD.Parsers.IdAttrs = new DnD.Parsers.SepBy(/ /, DnD.Parsers.IdAttr);

DnD.extractIdAttr = function(ast) {
  if (ast.status == "ok") {
    let idOptional = ast.children[0].children;
    let id = ("children" in idOptional && idOptional.children.length == 1) ? idOptional.children[0] : null;
    let attrOptional = ast.children[2].children;
    let attr = ("children" in attrOptional && attrOptional.children.length == 1) ? attrOptional.children[0] : null;
    return { id: id, attr: attr, };
  }
  else {
    throw "Invalid IdAttr '"+inString+"'";
  }
}

DnD.extractIdAttrs = function(ast) {
  return ast.children.map(DnD.extractIdAttr);
}


