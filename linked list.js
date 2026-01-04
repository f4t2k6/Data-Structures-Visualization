(function () {
  var node_id = 1;

  function newid() {
    node_id = node_id + 1;
    return node_id - 1;
  }

  function step(action, msg, list, highlight) {
    var hl = [];
    if (highlight && highlight.length) {
      hl = highlight.slice();
    }
    return {
      action: action,
      message: msg,
      state: list.snapshot(),
      highlight: hl
    };
  }

  /* =======================
   SINGLY (head only)
======================= */
function snode(value) {
  this.id = newid();
  this.value = value;
  this.next = null;
}

function singlyll() {
  this.head = null;
  this.size = 0;
}

singlyll.prototype.snapshot = function () {
  var nodes = [];
  var cur = this.head;
  var guard = 0;
  var lastid = null;

  while (cur && guard < 100000) {
    nodes.push({
      id: cur.id,
      value: cur.value,
      nextid: cur.next ? cur.next.id : null
    });
    lastid = cur.id;
    cur = cur.next;
    guard = guard + 1;
  }

  return {
    type: "singly",
    size: this.size,
    headid: this.head ? this.head.id : null,
    tailid: lastid, 
    nodes: nodes
  };
};

singlyll.prototype._getnode = function (index, steps) {
  var cur = this.head;
  var i = 0;

  while (cur && i < index) {
    steps.push(step("visit", "visit index " + i, this, [cur.id]));
    cur = cur.next;
    i = i + 1;
  }

  if (cur) {
    steps.push(step("visit", "reach index " + index, this, [cur.id]));
  }
  return cur;
};

singlyll.prototype._getlast = function (steps) {
  var cur = this.head;

  if (!cur) {
    return null;
  }

  while (cur.next) {
    steps.push(step("visit", "walk to tail", this, [cur.id]));
    cur = cur.next;
  }

  steps.push(step("visit", "reach tail", this, [cur.id]));
  return cur;
};

singlyll.prototype.insertat = function (index, value) {
  var steps = [];
  steps.push(step("start", "insertat(" + index + ", " + value + ")", this));

  if (index < 0 || index > this.size) {
    steps.push(step("error", "index out of range", this));
    return steps;
  }

  var node = new snode(value);

  // empty list
  if (this.size === 0) {
    steps.push(step("insert", "empty list -> make head", this));
    this.head = node;
    this.size = 1;
    steps.push(step("insert", "done insert", this, [node.id]));
    return steps;
  }

  // insert head
  if (index === 0) {
    steps.push(step("insert", "insert at head", this, [this.head.id]));
    node.next = this.head;
    this.head = node;
    this.size = this.size + 1;
    steps.push(step("insert", "head updated", this, [node.id]));
    return steps;
  }

  // insert tail (index == size) -> traverse to last
  if (index === this.size) {
    var last = this._getlast(steps);
    steps.push(step("insert", "insert at tail", this, [last.id]));
    last.next = node;
    this.size = this.size + 1;
    steps.push(step("insert", "tail linked", this, [node.id]));
    return steps;
  }

  // insert middle
  var prev = this._getnode(index - 1, steps);
  steps.push(step("insert", "link new node", this, [prev.id]));
  node.next = prev.next;
  prev.next = node;
  this.size = this.size + 1;
  steps.push(step("insert", "inserted in middle", this, [node.id]));
  return steps;
};

singlyll.prototype.removeat = function (index) {
  var steps = [];
  steps.push(step("start", "removeat(" + index + ")", this));

  if (index < 0 || index >= this.size) {
    steps.push(step("error", "index out of range", this));
    return steps;
  }

  if (this.size === 0) {
    steps.push(step("error", "empty list", this));
    return steps;
  }

  // remove head
  if (index === 0) {
    var removedh = this.head;
    steps.push(step("remove", "remove head", this, [removedh.id]));
    this.head = removedh.next;
    this.size = this.size - 1;
    steps.push(step("remove", "removed value " + removedh.value, this));
    return steps;
  }

  // remove middle/tail: find prev
  var prev = this._getnode(index - 1, steps);
  var removed = prev.next;

  steps.push(step("remove", "remove index " + index, this, [removed.id]));
  prev.next = removed.next;

  this.size = this.size - 1;
  steps.push(step("remove", "removed value " + removed.value, this));
  return steps;
};

singlyll.prototype.find = function (value) {
  var steps = [];
  steps.push(step("start", "find(" + value + ")", this));

  var cur = this.head;
  var i = 0;

  while (cur) {
    steps.push(step("visit", "compare index " + i, this, [cur.id]));
    if (cur.value === value) {
      steps.push(step("found", "found at index " + i, this, [cur.id]));
      return steps;
    }
    cur = cur.next;
    i = i + 1;
  }

  steps.push(step("done", "not found", this));
  return steps;
};

singlyll.prototype.updateat = function (index, value) {
  var steps = [];
  steps.push(step("start", "updateat(" + index + ", " + value + ")", this));

  if (index < 0 || index >= this.size) {
    steps.push(step("error", "index out of range", this));
    return steps;
  }

  var cur = this._getnode(index, steps);
  steps.push(step("update", "update value " + cur.value + " -> " + value, this, [cur.id]));
  cur.value = value;
  steps.push(step("update", "updated", this, [cur.id]));
  return steps;
};

// bubble sort (swap value)
singlyll.prototype.sort = function () {
  var steps = [];
  steps.push(step("start", "sort() bubble", this));

  if (this.size <= 1) {
    steps.push(step("done", "already sorted", this));
    return steps;
  }

  var pass = 0;
  while (pass < this.size - 1) {
    steps.push(step("pass", "pass " + (pass + 1), this));

    var cur = this.head;
    var idx = 0;

    while (cur && cur.next) {
      var a = cur;
      var b = cur.next;

      steps.push(step("compare", "compare " + idx + " and " + (idx + 1), this, [a.id, b.id]));

      if (a.value > b.value) {
        steps.push(step("swap", "swap " + a.value + " <-> " + b.value, this, [a.id, b.id]));
        var tmp = a.value;
        a.value = b.value;
        b.value = tmp;
        steps.push(step("swap", "swapped", this, [a.id, b.id]));
      }

      cur = cur.next;
      idx = idx + 1;
    }

    pass = pass + 1;
  }

  steps.push(step("done", "sorted", this));
  return steps;
};

  /* =======================
     DOUBLY
  ======================= */
  function dnode(value) {
    this.id = newid();
    this.value = value;
    this.prev = null;
    this.next = null;
  }

  function doublyll() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  doublyll.prototype.snapshot = function () {
    var nodes = [];
    var cur = this.head;
    var guard = 0;

    while (cur && guard < 100000) {
      nodes.push({
        id: cur.id,
        value: cur.value,
        previd: cur.prev ? cur.prev.id : null,
        nextid: cur.next ? cur.next.id : null
      });
      cur = cur.next;
      guard = guard + 1;
    }

    return {
      type: "doubly",
      size: this.size,
      headid: this.head ? this.head.id : null,
      tailid: this.tail ? this.tail.id : null,
      nodes: nodes
    };
  };

  doublyll.prototype._getnode = function (index, steps) {
    // đi từ head hay tail tùy index (không xài ternary)
    if (index <= this.size / 2) {
      var cur = this.head;
      var i = 0;
      while (cur && i < index) {
        steps.push(step("visit", "visit index " + i, this, [cur.id]));
        cur = cur.next;
        i = i + 1;
      }
      if (cur) steps.push(step("visit", "reach index " + index, this, [cur.id]));
      return cur;
    } else {
      var cur2 = this.tail;
      var j = this.size - 1;
      while (cur2 && j > index) {
        steps.push(step("visit", "visit index " + j, this, [cur2.id]));
        cur2 = cur2.prev;
        j = j - 1;
      }
      if (cur2) steps.push(step("visit", "reach index " + index, this, [cur2.id]));
      return cur2;
    }
  };

  doublyll.prototype.insertat = function (index, value) {
    var steps = [];
    steps.push(step("start", "insertat(" + index + ", " + value + ")", this));

    if (index < 0 || index > this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    var node = new dnode(value);

    if (this.size === 0) {
      this.head = node;
      this.tail = node;
      this.size = 1;
      steps.push(step("insert", "empty -> head/tail", this, [node.id]));
      return steps;
    }

    if (index === 0) {
      steps.push(step("insert", "insert head", this, [this.head.id]));
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
      this.size = this.size + 1;
      steps.push(step("insert", "head updated", this, [node.id]));
      return steps;
    }

    if (index === this.size) {
      steps.push(step("insert", "insert tail", this, [this.tail.id]));
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
      this.size = this.size + 1;
      steps.push(step("insert", "tail updated", this, [node.id]));
      return steps;
    }

    var cur = this._getnode(index, steps);
    var prev = cur.prev;

    steps.push(step("insert", "insert before index " + index, this, [cur.id]));
    node.prev = prev;
    node.next = cur;
    prev.next = node;
    cur.prev = node;

    this.size = this.size + 1;
    steps.push(step("insert", "inserted", this, [node.id]));
    return steps;
  };

  doublyll.prototype.removeat = function (index) {
    var steps = [];
    steps.push(step("start", "removeat(" + index + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    var cur = this._getnode(index, steps);
    steps.push(step("remove", "remove index " + index, this, [cur.id]));

    var prev = cur.prev;
    var next = cur.next;

    if (prev) {
      prev.next = next;
    } else {
      this.head = next;
    }

    if (next) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }

    this.size = this.size - 1;

    steps.push(step("remove", "removed value " + cur.value, this));
    return steps;
  };

  doublyll.prototype.find = function (value) {
    var steps = [];
    steps.push(step("start", "find(" + value + ")", this));

    var cur = this.head;
    var i = 0;

    while (cur) {
      steps.push(step("visit", "compare index " + i, this, [cur.id]));
      if (cur.value === value) {
        steps.push(step("found", "found at index " + i, this, [cur.id]));
        return steps;
      }
      cur = cur.next;
      i = i + 1;
    }

    steps.push(step("done", "not found", this));
    return steps;
  };

  doublyll.prototype.updateat = function (index, value) {
    var steps = [];
    steps.push(step("start", "updateat(" + index + ", " + value + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    var cur = this._getnode(index, steps);
    steps.push(step("update", "update " + cur.value + " -> " + value, this, [cur.id]));
    cur.value = value;
    steps.push(step("update", "updated", this, [cur.id]));
    return steps;
  };

  doublyll.prototype.sort = function () {
    var steps = [];
    steps.push(step("start", "sort() bubble", this));

    if (this.size <= 1) {
      steps.push(step("done", "already sorted", this));
      return steps;
    }

    var pass = 0;
    while (pass < this.size - 1) {
      steps.push(step("pass", "pass " + (pass + 1), this));

      var cur = this.head;
      var idx = 0;

      while (cur && cur.next) {
        var a = cur;
        var b = cur.next;
        steps.push(step("compare", "compare " + idx + " and " + (idx + 1), this, [a.id, b.id]));

        if (a.value > b.value) {
          steps.push(step("swap", "swap " + a.value + " <-> " + b.value, this, [a.id, b.id]));
          var tmp = a.value;
          a.value = b.value;
          b.value = tmp;
          steps.push(step("swap", "swapped", this, [a.id, b.id]));
        }

        cur = cur.next;
        idx = idx + 1;
      }

      pass = pass + 1;
    }

    steps.push(step("done", "sorted", this));
    return steps;
  };

  /* =======================
     CIRCULAR (singly)
  ======================= */
  function cnode(value) {
    this.id = newid();
    this.value = value;
    this.next = null;
  }

  function circularll() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  circularll.prototype.snapshot = function () {
    var nodes = [];

    if (this.size === 0) {
      return {
        type: "circular",
        size: 0,
        headid: null,
        tailid: null,
        nodes: nodes,
        tailnextishead: false
      };
    }

    var cur = this.head;
    var count = 0;

    while (cur && count < this.size) {
      nodes.push({
        id: cur.id,
        value: cur.value,
        nextid: cur.next ? cur.next.id : null
      });
      cur = cur.next;
      count = count + 1;
    }

    return {
      type: "circular",
      size: this.size,
      headid: this.head ? this.head.id : null,
      tailid: this.tail ? this.tail.id : null,
      nodes: nodes,
      tailnextishead: (this.tail && this.tail.next === this.head)
    };
  };

  circularll.prototype._getnode = function (index, steps) {
    var cur = this.head;
    var i = 0;

    while (i < index) {
      steps.push(step("visit", "visit index " + i, this, [cur.id]));
      cur = cur.next;
      i = i + 1;
    }

    steps.push(step("visit", "reach index " + index, this, [cur.id]));
    return cur;
  };

  circularll.prototype.insertat = function (index, value) {
    var steps = [];
    steps.push(step("start", "insertat(" + index + ", " + value + ")", this));

    if (index < 0 || index > this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    var node = new cnode(value);

    if (this.size === 0) {
      steps.push(step("insert", "empty circular -> self loop", this));
      this.head = node;
      this.tail = node;
      node.next = node;
      this.size = 1;
      steps.push(step("insert", "head/tail created", this, [node.id]));
      return steps;
    }

    if (index === 0) {
      steps.push(step("insert", "insert head", this, [this.head.id, this.tail.id]));
      node.next = this.head;
      this.head = node;
      this.tail.next = this.head;
      this.size = this.size + 1;
      steps.push(step("insert", "head updated + tail.next fixed", this, [node.id]));
      return steps;
    }

    if (index === this.size) {
      steps.push(step("insert", "insert tail", this, [this.tail.id]));
      node.next = this.head;
      this.tail.next = node;
      this.tail = node;
      this.size = this.size + 1;
      steps.push(step("insert", "tail updated", this, [node.id]));
      return steps;
    }

    var prev = this._getnode(index - 1, steps);
    steps.push(step("insert", "insert middle", this, [prev.id]));
    node.next = prev.next;
    prev.next = node;
    this.size = this.size + 1;
    steps.push(step("insert", "inserted", this, [node.id]));
    return steps;
  };

  circularll.prototype.removeat = function (index) {
    var steps = [];
    steps.push(step("start", "removeat(" + index + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    if (this.size === 1) {
      steps.push(step("remove", "remove only node", this, [this.head.id]));
      var val = this.head.value;
      this.head = null;
      this.tail = null;
      this.size = 0;
      steps.push(step("remove", "removed value " + val, this));
      return steps;
    }

    if (index === 0) {
      var removedh = this.head;
      steps.push(step("remove", "remove head", this, [removedh.id, this.tail.id]));
      this.head = removedh.next;
      this.tail.next = this.head;
      this.size = this.size - 1;
      steps.push(step("remove", "removed head value " + removedh.value, this));
      return steps;
    }

    var prev = this._getnode(index - 1, steps);
    var removed = prev.next;
    steps.push(step("remove", "remove index " + index, this, [removed.id]));

    prev.next = removed.next;

    if (removed === this.tail) {
      this.tail = prev;
      this.tail.next = this.head;
      steps.push(step("remove", "tail updated + tail.next fixed", this, [this.tail.id]));
    }

    this.size = this.size - 1;
    steps.push(step("remove", "removed value " + removed.value, this));
    return steps;
  };

  circularll.prototype.find = function (value) {
    var steps = [];
    steps.push(step("start", "find(" + value + ")", this));

    if (this.size === 0) {
      steps.push(step("done", "not found", this));
      return steps;
    }

    var cur = this.head;
    var i = 0;

    while (i < this.size) {
      steps.push(step("visit", "compare index " + i, this, [cur.id]));
      if (cur.value === value) {
        steps.push(step("found", "found at index " + i, this, [cur.id]));
        return steps;
      }
      cur = cur.next;
      i = i + 1;
    }

    steps.push(step("done", "not found", this));
    return steps;
  };

  circularll.prototype.updateat = function (index, value) {
    var steps = [];
    steps.push(step("start", "updateat(" + index + ", " + value + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    var cur = this._getnode(index, steps);
    steps.push(step("update", "update " + cur.value + " -> " + value, this, [cur.id]));
    cur.value = value;
    steps.push(step("update", "updated", this, [cur.id]));
    return steps;
  };

  circularll.prototype.sort = function () {
    var steps = [];
    steps.push(step("start", "sort() bubble", this));

    if (this.size <= 1) {
      steps.push(step("done", "already sorted", this));
      return steps;
    }

    var pass = 0;
    while (pass < this.size - 1) {
      steps.push(step("pass", "pass " + (pass + 1), this));

      var cur = this.head;
      var idx = 0;

      while (idx < this.size - 1) {
        var a = cur;
        var b = cur.next;
        steps.push(step("compare", "compare " + idx + " and " + (idx + 1), this, [a.id, b.id]));

        if (a.value > b.value) {
          steps.push(step("swap", "swap " + a.value + " <-> " + b.value, this, [a.id, b.id]));
          var tmp = a.value;
          a.value = b.value;
          b.value = tmp;
          steps.push(step("swap", "swapped", this, [a.id, b.id]));
        }

        cur = cur.next;
        idx = idx + 1;
      }

      pass = pass + 1;
    }

    steps.push(step("done", "sorted", this));
    return steps;
  };

  // expose
  window.llbrain = {
    singlyll: singlyll,
    doublyll: doublyll,
    circularll: circularll
  };
})();
