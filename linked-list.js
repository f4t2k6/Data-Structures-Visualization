(function () {

  function step(action, msg, list, highlight) {
    var hl = [];
    if (highlight && highlight.length) hl = highlight.slice();
    return {
      action: action,
      message: msg,
      state: list.snapshot(),
      highlight: hl
    };
  }

  // ===== SINGLY LINKED LIST =====
  // Node nhận id từ list
  function snode(id, value) {
    this.id = id;
    this.value = value;
    this.next = null;
  }

  function singlyll() {
    this.head = null;
    this.size = 0;

    // ID riêng cho từng list
    this._id = 1;
  }

  singlyll.prototype._newid = function () {
    var id = this._id;
    this._id = this._id + 1;
    return id;
  };

  // render / check helpers
  singlyll.prototype.clear = function () {
    var steps = [];
    steps.push(step("start", "clear()", this));

    this.head = null;
    this.size = 0;

    // Reset ID riêng của singly linked list
    this._id = 1;

    steps.push(step("done", "cleared + reset id", this));
    return steps;
  };

  singlyll.prototype.isEmpty = function () {
    return this.size === 0;
  };

  singlyll.prototype.toArray = function () {
    var arr = [];
    var cur = this.head;
    var guard = 0;
    while (cur && guard < 100000) {
      arr.push(cur.value);
      cur = cur.next;
      guard++;
    }
    return arr;
  };

  singlyll.prototype.fromArray = function (arr) {
    var steps = [];
    steps.push(step("start", "fromArray(len=" + (arr ? arr.length : 0) + ")", this));

    // reset list + id
    this.head = null;
    this.size = 0;
    this._id = 1;

    if (!arr || !arr.length) {
      steps.push(step("done", "fromArray done (empty)", this));
      return steps;
    }

    for (var i = 0; i < arr.length; i++) {
      steps = steps.concat(this.insertTail(arr[i]));
    }

    steps.push(step("done", "fromArray done", this));
    return steps;
  };

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
      guard++;
    }

    return {
      type: "singly",
      size: this.size,
      headid: this.head ? this.head.id : null,
      tailid: lastid,
      nodes: nodes
    };
  };

  // internal traversal helpers
  singlyll.prototype._getnode = function (index, steps) {
    var cur = this.head;
    var i = 0;

    while (cur && i < index) {
      steps.push(step("visit", "visit index " + i, this, [cur.id]));
      cur = cur.next;
      i++;
    }

    if (cur) steps.push(step("visit", "reach index " + index, this, [cur.id]));
    return cur;
  };

  singlyll.prototype._getlast = function (steps) {
    var cur = this.head;
    if (!cur) return null;

    while (cur.next) {
      steps.push(step("visit", "walk to tail", this, [cur.id]));
      cur = cur.next;
    }
    steps.push(step("visit", "reach tail", this, [cur.id]));
    return cur;
  };

  // required ops
  singlyll.prototype.insertHead = function (value) {
    var steps = [];
    steps.push(step("start", "insertHead(" + value + ")", this));

    var node = new snode(this._newid(), value);

    if (this.size === 0) {
      this.head = node;
      this.size = 1;
      steps.push(step("insert", "empty -> head created", this, [node.id]));
      return steps;
    }

    steps.push(step("insert", "link new node to old head", this, [this.head.id]));
    node.next = this.head;
    this.head = node;
    this.size++;
    steps.push(step("insert", "head updated", this, [node.id]));
    return steps;
  };

  singlyll.prototype.insertTail = function (value) {
    var steps = [];
    steps.push(step("start", "insertTail(" + value + ")", this));

    var node = new snode(this._newid(), value);

    if (this.size === 0) {
      this.head = node;
      this.size = 1;
      steps.push(step("insert", "empty -> head created", this, [node.id]));
      return steps;
    }

    var last = this._getlast(steps);
    steps.push(step("insert", "link tail.next to new node", this, [last.id]));
    last.next = node;
    this.size++;
    steps.push(step("insert", "tail inserted", this, [node.id]));
    return steps;
  };

  singlyll.prototype.insertAtIndex = function (index, value) {
    var steps = [];
    steps.push(step("start", "insertAtIndex(" + index + ", " + value + ")", this));

    if (index < 0 || index > this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (index === 0) return steps.concat(this.insertHead(value));
    if (index === this.size) return steps.concat(this.insertTail(value));

    var node = new snode(this._newid(), value);
    var prev = this._getnode(index - 1, steps);

    steps.push(step("insert", "link new node between prev and next", this, [prev.id]));
    node.next = prev.next;
    prev.next = node;
    this.size++;
    steps.push(step("insert", "inserted", this, [node.id]));
    return steps;
  };

  singlyll.prototype.deleteHead = function () {
    var steps = [];
    steps.push(step("start", "deleteHead()", this));

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    var removed = this.head;
    steps.push(step("remove", "remove head", this, [removed.id]));
    this.head = removed.next;
    this.size--;
    steps.push(step("remove", "removed value " + removed.value, this));
    return steps;
  };

  singlyll.prototype.deleteTail = function () {
    var steps = [];
    steps.push(step("start", "deleteTail()", this));

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    if (this.size === 1) {
      steps.push(step("remove", "remove only node", this, [this.head.id]));
      var v = this.head.value;
      this.head = null;
      this.size = 0;
      steps.push(step("remove", "removed value " + v, this));
      return steps;
    }

    var prev = this._getnode(this.size - 2, steps);
    var removed = prev.next;
    steps.push(step("remove", "unlink tail", this, [removed.id, prev.id]));
    prev.next = null;
    this.size--;
    steps.push(step("remove", "removed value " + removed.value, this));
    return steps;
  };

  singlyll.prototype.deleteAtIndex = function (index) {
    var steps = [];
    steps.push(step("start", "deleteAtIndex(" + index + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (index === 0) return steps.concat(this.deleteHead());
    if (index === this.size - 1) return steps.concat(this.deleteTail());

    var prev = this._getnode(index - 1, steps);
    var removed = prev.next;

    steps.push(step("remove", "unlink node at index " + index, this, [removed.id, prev.id]));
    prev.next = removed.next;
    this.size--;
    steps.push(step("remove", "removed value " + removed.value, this));
    return steps;
  };

  // aliases
  singlyll.prototype.insertAt = singlyll.prototype.insertAtIndex;
  singlyll.prototype.removeAt = singlyll.prototype.deleteAtIndex;
  singlyll.prototype.insertat = singlyll.prototype.insertAtIndex;
  singlyll.prototype.removeat = singlyll.prototype.deleteAtIndex;


  // ===== DOUBLY LINKED LIST =====
  function dnode(id, value) {
    this.id = id;
    this.value = value;
    this.prev = null;
    this.next = null;
  }

  function doublyll() {
    this.head = null;
    this.tail = null;
    this.size = 0;

    // ID riêng cho doubly
    this._id = 1;
  }

  doublyll.prototype._newid = function () {
    var id = this._id;
    this._id = this._id + 1;
    return id;
  };

  // render / check helpers
  doublyll.prototype.clear = function () {
    var steps = [];
    steps.push(step("start", "clear()", this));
    this.head = null;
    this.tail = null;
    this.size = 0;

    // reset id riêng
    this._id = 1;

    steps.push(step("done", "cleared + reset id", this));
    return steps;
  };

  doublyll.prototype.isEmpty = function () {
    return this.size === 0;
  };

  doublyll.prototype.toArray = function () {
    var arr = [];
    var cur = this.head;
    var guard = 0;
    while (cur && guard < 100000) {
      arr.push(cur.value);
      cur = cur.next;
      guard++;
    }
    return arr;
  };

  doublyll.prototype.fromArray = function (arr) {
    var steps = [];
    steps.push(step("start", "fromArray(len=" + (arr ? arr.length : 0) + ")", this));

    this.head = null;
    this.tail = null;
    this.size = 0;
    this._id = 1;

    if (!arr || !arr.length) {
      steps.push(step("done", "fromArray done (empty)", this));
      return steps;
    }

    for (var i = 0; i < arr.length; i++) {
      steps = steps.concat(this.insertTail(arr[i]));
    }

    steps.push(step("done", "fromArray done", this));
    return steps;
  };

  doublyll.prototype.snapshot = function () {
    var nodes = [];
    var cur = this.head;
    var guard = 0;

    while (cur && guard < 100000) {
      nodes.push({
        id: cur.id,
        value: cur.value,
        previd: cur.prev ? cur.prev.id : null,
        nextid: cur.next ? cur.next.id : null,
        cells: [
          { role: "prev", link: cur.prev ? cur.prev.id : null },
          { role: "data", text: cur.value },
          { role: "next", link: cur.next ? cur.next.id : null }
        ]
      });
      cur = cur.next;
      guard++;
    }

    return {
      type: "doubly",
      size: this.size,
      headid: this.head ? this.head.id : null,
      tailid: this.tail ? this.tail.id : null,
      layout: { cellCount: 3, order: ["prev", "data", "next"] },
      nodes: nodes
    };
  };

  doublyll.prototype._getnode = function (index, steps) {
    if (index <= this.size / 2) {
      var cur = this.head;
      var i = 0;
      while (cur && i < index) {
        steps.push(step("visit", "visit index " + i, this, [cur.id]));
        cur = cur.next;
        i++;
      }
      if (cur) steps.push(step("visit", "reach index " + index, this, [cur.id]));
      return cur;
    } else {
      var cur2 = this.tail;
      var j = this.size - 1;
      while (cur2 && j > index) {
        steps.push(step("visit", "visit index " + j, this, [cur2.id]));
        cur2 = cur2.prev;
        j--;
      }
      if (cur2) steps.push(step("visit", "reach index " + index, this, [cur2.id]));
      return cur2;
    }
  };

  // required ops
  doublyll.prototype.insertHead = function (value) {
    var steps = [];
    steps.push(step("start", "insertHead(" + value + ")", this));

    var node = new dnode(this._newid(), value);

    if (this.size === 0) {
      this.head = node;
      this.tail = node;
      this.size = 1;
      steps.push(step("insert", "empty -> head/tail created", this, [node.id]));
      return steps;
    }

    steps.push(step("insert", "link new node before old head", this, [this.head.id]));
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
    this.size++;
    steps.push(step("insert", "head updated", this, [node.id]));
    return steps;
  };

  doublyll.prototype.insertTail = function (value) {
    var steps = [];
    steps.push(step("start", "insertTail(" + value + ")", this));

    var node = new dnode(this._newid(), value);

    if (this.size === 0) {
      this.head = node;
      this.tail = node;
      this.size = 1;
      steps.push(step("insert", "empty -> head/tail created", this, [node.id]));
      return steps;
    }

    steps.push(step("insert", "link new node after old tail", this, [this.tail.id]));
    node.prev = this.tail;
    this.tail.next = node;
    this.tail = node;
    this.size++;
    steps.push(step("insert", "tail updated", this, [node.id]));
    return steps;
  };

  doublyll.prototype.insertAtIndex = function (index, value) {
    var steps = [];
    steps.push(step("start", "insertAtIndex(" + index + ", " + value + ")", this));

    if (index < 0 || index > this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (index === 0) return steps.concat(this.insertHead(value));
    if (index === this.size) return steps.concat(this.insertTail(value));

    var cur = this._getnode(index, steps);
    var prev = cur.prev;
    var node = new dnode(this._newid(), value);

    steps.push(step("insert", "link new node between prev and cur", this, [prev.id, cur.id]));
    node.prev = prev;
    node.next = cur;
    prev.next = node;
    cur.prev = node;

    this.size++;
    steps.push(step("insert", "inserted", this, [node.id]));
    return steps;
  };

  doublyll.prototype.deleteHead = function () {
    var steps = [];
    steps.push(step("start", "deleteHead()", this));

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    var removed = this.head;
    steps.push(step("remove", "remove head", this, [removed.id]));

    if (this.size === 1) {
      this.head = null;
      this.tail = null;
      this.size = 0;
      steps.push(step("remove", "removed value " + removed.value, this));
      return steps;
    }

    this.head = removed.next;
    this.head.prev = null;
    this.size--;
    steps.push(step("remove", "head updated", this, [this.head.id]));
    return steps;
  };

  doublyll.prototype.deleteTail = function () {
    var steps = [];
    steps.push(step("start", "deleteTail()", this));

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    var removed = this.tail;
    steps.push(step("remove", "remove tail", this, [removed.id]));

    if (this.size === 1) {
      this.head = null;
      this.tail = null;
      this.size = 0;
      steps.push(step("remove", "removed value " + removed.value, this));
      return steps;
    }

    this.tail = removed.prev;
    this.tail.next = null;
    this.size--;
    steps.push(step("remove", "tail updated", this, [this.tail.id]));
    return steps;
  };

  doublyll.prototype.deleteAtIndex = function (index) {
    var steps = [];
    steps.push(step("start", "deleteAtIndex(" + index + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (index === 0) return steps.concat(this.deleteHead());
    if (index === this.size - 1) return steps.concat(this.deleteTail());

    var cur = this._getnode(index, steps);
    var prev = cur.prev;
    var next = cur.next;

    steps.push(step("remove", "unlink node at index " + index, this, [prev.id, cur.id, next.id]));
    prev.next = next;
    next.prev = prev;

    this.size--;
    steps.push(step("remove", "removed value " + cur.value, this));
    return steps;
  };

  // aliases
  doublyll.prototype.insertAt = doublyll.prototype.insertAtIndex;
  doublyll.prototype.removeAt = doublyll.prototype.deleteAtIndex;
  doublyll.prototype.insertat = doublyll.prototype.insertAtIndex;
  doublyll.prototype.removeat = doublyll.prototype.deleteAtIndex;

  // ===== CIRCULAR LINKED LIST =====

  function cnode(id, value) {
    this.id = id;
    this.value = value;
    this.next = null;
  }

  function circularll() {
    this.head = null;
    this.tail = null;
    this.size = 0;

    // ID riêng cho circular
    this._id = 1;
  }

  circularll.prototype._newid = function () {
    var id = this._id;
    this._id = this._id + 1;
    return id;
  };

  // render / check helpers
  circularll.prototype.clear = function () {
    var steps = [];
    steps.push(step("start", "clear()", this));
    this.head = null;
    this.tail = null;
    this.size = 0;

    // reset id riêng
    this._id = 1;

    steps.push(step("done", "cleared + reset id", this));
    return steps;
  };

  circularll.prototype.isEmpty = function () {
    return this.size === 0;
  };

  circularll.prototype.toArray = function () {
    var arr = [];
    if (this.size === 0) return arr;

    var cur = this.head;
    for (var i = 0; i < this.size; i++) {
      arr.push(cur.value);
      cur = cur.next;
    }
    return arr;
  };

  circularll.prototype.fromArray = function (arr) {
    var steps = [];
    steps.push(step("start", "fromArray(len=" + (arr ? arr.length : 0) + ")", this));

    this.head = null;
    this.tail = null;
    this.size = 0;
    this._id = 1;

    if (!arr || !arr.length) {
      steps.push(step("done", "fromArray done (empty)", this));
      return steps;
    }

    for (var i = 0; i < arr.length; i++) {
      steps = steps.concat(this.insertTail(arr[i]));
    }

    steps.push(step("done", "fromArray done", this));
    return steps;
  };

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
      count++;
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

  // invariant check - để tránh đóng băng chương trình
  circularll.prototype.validateInvariant = function () {
    if (this.size === 0) return this.head === null && this.tail === null;
    if (!this.head || !this.tail) return false;
    if (this.tail.next !== this.head) return false;

    var cur = this.head;
    for (var i = 0; i < this.size; i++) {
      if (!cur) return false;
      cur = cur.next;
    }
    return cur === this.head;
  };

  circularll.prototype._getnode = function (index, steps) {
    var cur = this.head;
    for (var i = 0; i < index; i++) {
      steps.push(step("visit", "visit index " + i, this, [cur.id]));
      cur = cur.next;
    }
    steps.push(step("visit", "reach index " + index, this, [cur.id]));
    return cur;
  };

  // required ops
  circularll.prototype.insertHead = function (value) {
    var steps = [];
    steps.push(step("start", "insertHead(" + value + ")", this));

    var node = new cnode(this._newid(), value);

    if (this.size === 0) {
      this.head = node;
      this.tail = node;
      node.next = node;
      this.size = 1;
      steps.push(step("insert", "empty -> self loop", this, [node.id]));
      return steps;
    }

    if (!this.validateInvariant()) {
      steps.push(step("invariant", "broken invariant before insertHead", this));
      return steps;
    }

    steps.push(step("insert", "link new head and fix tail.next", this, [this.head.id, this.tail.id]));
    node.next = this.head;
    this.head = node;
    this.tail.next = this.head;
    this.size++;
    steps.push(step("insert", "head updated", this, [node.id]));
    return steps;
  };

  circularll.prototype.insertTail = function (value) {
    var steps = [];
    steps.push(step("start", "insertTail(" + value + ")", this));

    var node = new cnode(this._newid(), value);

    if (this.size === 0) {
      this.head = node;
      this.tail = node;
      node.next = node;
      this.size = 1;
      steps.push(step("insert", "empty -> self loop", this, [node.id]));
      return steps;
    }

    if (!this.validateInvariant()) {
      steps.push(step("invariant", "broken invariant before insertTail", this));
      return steps;
    }

    steps.push(step("insert", "link new tail and fix tail.next", this, [this.tail.id, this.head.id]));
    node.next = this.head;
    this.tail.next = node;
    this.tail = node;
    this.size++;
    steps.push(step("insert", "tail updated", this, [node.id]));
    return steps;
  };

  circularll.prototype.insertAtIndex = function (index, value) {
    var steps = [];
    steps.push(step("start", "insertAtIndex(" + index + ", " + value + ")", this));

    if (index < 0 || index > this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (index === 0) return steps.concat(this.insertHead(value));
    if (index === this.size) return steps.concat(this.insertTail(value));

    if (!this.validateInvariant()) {
      steps.push(step("invariant", "broken invariant before insertAtIndex", this));
      return steps;
    }

    var node = new cnode(this._newid(), value);
    var prev = this._getnode(index - 1, steps);

    steps.push(step("insert", "link new node between prev and next", this, [prev.id]));
    node.next = prev.next;
    prev.next = node;
    this.size++;
    steps.push(step("insert", "inserted", this, [node.id]));
    return steps;
  };

  circularll.prototype.deleteHead = function () {
    var steps = [];
    steps.push(step("start", "deleteHead()", this));

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    if (!this.validateInvariant()) {
      steps.push(step("invariant", "broken invariant before deleteHead", this));
      return steps;
    }

    if (this.size === 1) {
      steps.push(step("remove", "remove only node", this, [this.head.id]));
      var v = this.head.value;
      this.head = null;
      this.tail = null;
      this.size = 0;
      steps.push(step("remove", "removed value " + v, this));
      return steps;
    }

    var removed = this.head;
    steps.push(step("remove", "remove head and fix tail.next", this, [removed.id, this.tail.id]));
    this.head = removed.next;
    this.tail.next = this.head;
    this.size--;
    steps.push(step("remove", "head updated", this, [this.head.id]));
    return steps;
  };

  circularll.prototype.deleteTail = function () {
    var steps = [];
    steps.push(step("start", "deleteTail()", this));

    if (this.size === 0) {
      steps.push(step("error", "empty list", this));
      return steps;
    }

    if (!this.validateInvariant()) {
      steps.push(step("invariant", "broken invariant before deleteTail", this));
      return steps;
    }

    if (this.size === 1) {
      steps.push(step("remove", "remove only node", this, [this.head.id]));
      var v = this.head.value;
      this.head = null;
      this.tail = null;
      this.size = 0;
      steps.push(step("remove", "removed value " + v, this));
      return steps;
    }

    var prev = this._getnode(this.size - 2, steps);
    var removed = this.tail;

    steps.push(step("remove", "unlink tail and fix tail.next", this, [prev.id, removed.id, this.head.id]));
    prev.next = this.head;
    this.tail = prev;
    this.size--;
    steps.push(step("remove", "tail updated", this, [this.tail.id]));
    return steps;
  };

  circularll.prototype.deleteAtIndex = function (index) {
    var steps = [];
    steps.push(step("start", "deleteAtIndex(" + index + ")", this));

    if (index < 0 || index >= this.size) {
      steps.push(step("error", "index out of range", this));
      return steps;
    }

    if (index === 0) return steps.concat(this.deleteHead());
    if (index === this.size - 1) return steps.concat(this.deleteTail());

    if (!this.validateInvariant()) {
      steps.push(step("invariant", "broken invariant before deleteAtIndex", this));
      return steps;
    }

    var prev = this._getnode(index - 1, steps);
    var removed = prev.next;

    steps.push(step("remove", "unlink node at index " + index, this, [prev.id, removed.id]));
    prev.next = removed.next;
    this.size--;
    steps.push(step("remove", "removed value " + removed.value, this));
    return steps;
  };

  // aliases (backward-compatible)
  circularll.prototype.insertAt = circularll.prototype.insertAtIndex;
  circularll.prototype.removeAt = circularll.prototype.deleteAtIndex;
  circularll.prototype.insertat = circularll.prototype.insertAtIndex;
  circularll.prototype.removeat = circularll.prototype.deleteAtIndex;

  // expose
  window.llbrain = {
    singlyll: singlyll,
    doublyll: doublyll,
    circularll: circularll
  };
})();
