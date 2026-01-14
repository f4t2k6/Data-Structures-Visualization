(function () {
  var nodeId = 1;
  function newId() {
    return nodeId++;2
  }

  function makeStep(action, message, stack, highlightIds) {
    return {
      action: action,
      message: message,
      state: stack.snapshot(),
      highlight: highlightIds ? highlightIds.slice() : []
    };
  }

  function stackNode(value) {
    this.id = newId();
    this.value = value;
    this.next = null;
  }

  function stack() {
    this.top = null;
    this.count = 0;
  }

  /* ===== isEmpty ===== */
  stack.prototype.isEmpty = function () {
    return this.count === 0;
  };

  /* ===== snapshot ===== */
  stack.prototype.snapshot = function () {
    var nodes = [];
    var current = this.top;
    var guard = 0;

    while (current && guard < 100000) {
      nodes.push({
        id: current.id,
        value: current.value,
        nextId: current.next ? current.next.id : null
      });
      current = current.next;
      guard++;
    }

    return {
      type: "stack",
      count: this.count,
      topId: this.top ? this.top.id : null,
      nodes: nodes
    };
  };

  /* ===== push ===== */
  stack.prototype.push = function (value) {
    var steps = [];

    // START
    steps.push(makeStep("start", "push(" + value + ")", this));

    // CREATE
    steps.push(makeStep("create", "create new node with value " + value, this));

    // LINK (mô tả đúng thuật toán)
    steps.push(makeStep(
      "link",
      "newNode.next = top",
      this,
      this.top ? [this.top.id] : []
    ));

    // Thực hiện logic thật
    var node = new stackNode(value);
    node.next = this.top;

    // UPDATE POINTER
    steps.push(makeStep(
      "update_ptr",
      "top = newNode",
      this,
      this.top ? [this.top.id] : []
    ));

    this.top = node;
    this.count++;

    // INSERT (để controller biết đây là lúc animate pop-in + FLIP)
    steps.push(makeStep("insert", "node inserted at top", this, [node.id]));

    // DONE
    steps.push(makeStep("done", "push finished", this, [node.id]));
    return steps;
  };

  /* ===== pop ===== */
  stack.prototype.pop = function () {
    var steps = [];

    // START
    steps.push(makeStep("start", "pop()", this, this.top ? [this.top.id] : []));

    // CHECK EMPTY
    if (this.isEmpty()) {
      steps.push(makeStep("error", "stack is empty", this));
      steps.push(makeStep("done", "pop finished", this));
      return steps;
    }

    // SELECT TOP
    var removedNode = this.top;
    steps.push(makeStep(
      "select",
      "select top node",
      this,
      [removedNode.id]
    ));

    // UPDATE POINTER (mô tả)
    steps.push(makeStep(
      "update_ptr",
      "top = top.next",
      this,
      [removedNode.id]
    ));

    // Thực hiện logic thật
    this.top = removedNode.next;
    this.count--;

    // REMOVE (state sau khi đã pop) để controller animate pop-out + shift
    steps.push(makeStep(
      "remove",
      "removed top node (value = " + removedNode.value + ")",
      this,
      this.top ? [this.top.id] : []
    ));

    // DONE
    steps.push(makeStep("done", "pop finished", this));
    return steps;
  };

  /* ===== clear ===== */
  stack.prototype.clear = function () {
    var steps = [];

    // START
    steps.push(makeStep("start", "clear()", this, this.top ? [this.top.id] : []));

    // Nếu rỗng thì vẫn cho 1 step mô tả
    if (this.isEmpty()) {
      steps.push(makeStep("check", "stack is already empty", this));
      steps.push(makeStep("done", "clear finished", this));
      return steps;
    }

    // Highlight tất cả node hiện có (để controller pop-out hết)
    var before = this.snapshot();
    var allIds = (before.nodes || []).map(n => n.id);

    // STEP: CLEAR (chưa đổi state ở đây vì mình muốn controller pop-out theo before)
    steps.push(makeStep("clear", "remove all nodes", this, allIds));

    // Thực hiện clear thật
    this.top = null;
    this.count = 0;

    // DONE
    steps.push(makeStep("done", "clear finished", this));
    return steps;
  };


  window.dsbrain = window.dsbrain || {};
  window.dsbrain.stack = stack;

})();
