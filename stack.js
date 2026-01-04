(function () {
  var nodeId = 1;
  function newId() {
    return nodeId++;
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
    steps.push(makeStep("start", "push " + value, this));

    var node = new stackNode(value);

    node.next = this.top;
    this.top = node;
    this.count++;

    steps.push(
      makeStep(
        "insert",
        "node pushed to top",
        this,
        [node.id]
      )
    );

    steps.push(makeStep("done", "push finished", this, [node.id]));
    return steps;
  };

  /* ===== pop ===== */
  stack.prototype.pop = function () {
    var steps = [];
    steps.push(makeStep("start", "pop", this));

    if (this.isEmpty()) {
      steps.push(makeStep("error", "stack is empty", this));
      return steps;
    }

    var removedNode = this.top;

    steps.push(
      makeStep(
        "remove",
        "remove top node with value " + removedNode.value,
        this,
        [removedNode.id]
      )
    );

    this.top = removedNode.next;
    this.count--;

    steps.push(makeStep("done", "pop finished", this));
    return steps;
  };

  window.dsbrain = window.dsbrain || {};
  window.dsbrain.stack = stack;

})();
