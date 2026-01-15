(function () {
  // namespace giống stack.js của bạn (window.dsbrain.stack)
  if (!window.dsbrain) window.dsbrain = {};

  // ===== utils: step + id =====
  var __qid = 1;

  function makeStep(action, message, q, highlightIds) {
    return {
      action: action,
      message: message,
      highlight: highlightIds || [],
      state: q.snapshot()
    };
  }

  // ===== Queue Node =====
  function queueNode(value) {
    this.id = __qid++;
    this.value = value;
    this.next = null;
  }

  // ===== Queue =====
  function queue() {
    this.head = null; // FRONT
    this.tail = null; // REAR
    this.count = 0;
  }

  queue.prototype.isEmpty = function () {
    return this.count === 0;
  };

  // snapshot: nodes từ head -> tail (để render hàng ngang)
  queue.prototype.snapshot = function () {
    var nodes = [];
    var cur = this.head;
    while (cur) {
      nodes.push({
        id: cur.id,
        value: cur.value,
        nextid: cur.next ? cur.next.id : null
      });
      cur = cur.next;
    }

    return {
      count: this.count,
      headId: this.head ? this.head.id : null,
      tailId: this.tail ? this.tail.id : null,
      nodes: nodes
    };
  };

  /* ===== enqueue ===== */
  queue.prototype.enqueue = function (value) {
    var steps = [];

    steps.push(makeStep("start", "enqueue(" + value + ")", this));

    steps.push(makeStep("create", "create new node with value " + value, this));

    // Nếu rỗng, head & tail sẽ cùng trỏ node mới
    if (this.isEmpty()) {
      steps.push(makeStep("check", "queue is empty", this));

      // tạo node thật
      var n0 = new queueNode(value);

      steps.push(makeStep("update_ptr", "head = newNode", this, []));
      this.head = n0;

      steps.push(makeStep("update_ptr", "tail = newNode", this, [this.head.id]));
      this.tail = n0;

      this.count++;
      steps.push(makeStep("insert", "insert first node (head & tail)", this, [this.head.id]));
      steps.push(makeStep("done", "enqueue finished", this, [this.head.id]));
      return steps;
    }

    // Không rỗng: tail.next = newNode, tail = newNode
    steps.push(makeStep("link", "tail.next = newNode", this, this.tail ? [this.tail.id] : []));

    var node = new queueNode(value);
    this.tail.next = node;

    steps.push(makeStep("update_ptr", "tail = newNode", this, [this.tail.id]));
    this.tail = node;

    this.count++;
    steps.push(makeStep("insert", "node enqueued at rear (tail)", this, [this.tail.id]));
    steps.push(makeStep("done", "enqueue finished", this, [this.tail.id]));
    return steps;
  };

  /* ===== dequeue ===== */
  queue.prototype.dequeue = function () {
    var steps = [];

    steps.push(makeStep("start", "dequeue()", this, this.head ? [this.head.id] : []));

    if (this.isEmpty()) {
      steps.push(makeStep("error", "queue is empty", this));
      steps.push(makeStep("done", "dequeue finished", this));
      return steps;
    }

    var removed = this.head;

    steps.push(makeStep("select", "select front node (head) to remove", this, [removed.id]));

    steps.push(makeStep("update_ptr", "head = head.next", this, [removed.id]));

    // logic thật
    this.head = removed.next;
    this.count--;

    // nếu sau khi xóa mà rỗng -> tail cũng null
    if (!this.head) {
      steps.push(makeStep("update_ptr", "tail = null (queue becomes empty)", this, []));
      this.tail = null;
    }

    steps.push(makeStep("remove", "removed front node (value = " + removed.value + ")", this,
      this.head ? [this.head.id] : []
    ));

    steps.push(makeStep("done", "dequeue finished", this));
    return steps;
  };

  /* ===== clear ===== */
  queue.prototype.clear = function () {
    var steps = [];

    steps.push(makeStep(
      "start",
      "clear()",
      this,
      this.head ? [this.head.id] : []
    ));

    if (this.isEmpty()) {
      steps.push(makeStep("check", "queue is already empty", this));
      steps.push(makeStep("done", "clear finished", this));
      return steps;
    }

    // highlight toàn bộ node trước khi xóa
    var before = this.snapshot();
    var allIds = (before.nodes || []).map(n => n.id);

    steps.push(makeStep("clear", "remove all nodes", this, allIds));

    // clear thật
    this.head = null;
    this.tail = null;
    this.count = 0;

    steps.push(makeStep("done", "clear finished", this));
    return steps;
  };


  // export
  window.dsbrain.queue = queue;
})();
