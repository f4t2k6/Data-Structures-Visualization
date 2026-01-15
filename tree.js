(function () {
  if (!window.dsbrain) window.dsbrain = {};

  // ===== utils =====
  var __tid = 1;

  function TreeNode(value) {
    this.id = __tid++;
    this.value = value;
    this.left = null;
    this.right = null;
  }

  function makeStep(action, message, t, highlightIds) {
    return {
      action: action,
      message: message,
      highlight: highlightIds || [],
      state: t.snapshot()
    };
  }

  // ===== BST =====
  function bst() {
    this.root = null;
    this.count = 0;
  }

  bst.prototype.snapshot = function () {
    var nodes = [];
    function dfs(n) {
      if (!n) return;
      nodes.push({
        id: n.id,
        value: n.value,
        leftId: n.left ? n.left.id : null,
        rightId: n.right ? n.right.id : null
      });
      dfs(n.left);
      dfs(n.right);
    }
    dfs(this.root);

    return {
      count: this.count,
      rootId: this.root ? this.root.id : null,
      nodes: nodes
    };
  };

  // INSERT (BST)
  bst.prototype.insert = function (value) {
    var steps = [];
    steps.push(makeStep("start", "insert(" + value + ")", this));

    if (!this.root) {
      steps.push(makeStep("create", "create root node", this));
      this.root = new TreeNode(value);
      this.count++;
      steps.push(makeStep("insert", "root inserted", this, [this.root.id]));
      steps.push(makeStep("done", "insert finished", this, [this.root.id]));
      return steps;
    }

    var cur = this.root;
    while (cur) {
      steps.push(makeStep("visit", "compare with node " + cur.value, this, [cur.id]));

      if (value === cur.value) {
        steps.push(makeStep("error", "value already exists (no duplicates)", this, [cur.id]));
        steps.push(makeStep("done", "insert finished", this, [cur.id]));
        return steps;
      }

      if (value < cur.value) {
        steps.push(makeStep("go_left", "value < current → go left", this, [cur.id]));
        if (!cur.left) {
          steps.push(makeStep("create", "create new node", this, [cur.id]));
          var nnL = new TreeNode(value);
          steps.push(makeStep("link", "link as LEFT child", this, [cur.id]));
          cur.left = nnL;
          this.count++;
          steps.push(makeStep("insert", "node inserted at LEFT", this, [nnL.id]));
          steps.push(makeStep("done", "insert finished", this, [nnL.id]));
          return steps;
        }
        cur = cur.left;
      } else {
        steps.push(makeStep("go_right", "value > current → go right", this, [cur.id]));
        if (!cur.right) {
          steps.push(makeStep("create", "create new node", this, [cur.id]));
          var nnR = new TreeNode(value);
          steps.push(makeStep("link", "link as RIGHT child", this, [cur.id]));
          cur.right = nnR;
          this.count++;
          steps.push(makeStep("insert", "node inserted at RIGHT", this, [nnR.id]));
          steps.push(makeStep("done", "insert finished", this, [nnR.id]));
          return steps;
        }
        cur = cur.right;
      }
    }

    steps.push(makeStep("done", "insert finished", this));
    return steps;
  };

  // DELETE (BST) with steps
  bst.prototype.delete = function (value) {
    var steps = [];
    steps.push(makeStep("start", "delete(" + value + ")", this));

    // tìm node + parent để dễ step
    var parent = null;
    var cur = this.root;

    while (cur) {
      steps.push(makeStep("visit", "compare with node " + cur.value, this, [cur.id]));

      if (value === cur.value) break;

      parent = cur;
      if (value < cur.value) {
        steps.push(makeStep("go_left", "value < current → go left", this, [cur.id]));
        cur = cur.left;
      } else {
        steps.push(makeStep("go_right", "value > current → go right", this, [cur.id]));
        cur = cur.right;
      }
    }

    if (!cur) {
      steps.push(makeStep("error", "value not found", this));
      steps.push(makeStep("done", "delete finished", this));
      return steps;
    }

    steps.push(makeStep("found", "found target node", this, [cur.id]));

    // helper replace child pointer of parent
    var replaceChild = (function (_this) {
      return function (par, oldNode, newNode) {
        if (!par) {
          _this.root = newNode;
          return;
        }
        if (par.left === oldNode) par.left = newNode;
        else if (par.right === oldNode) par.right = newNode;
      };
    })(this);

    // Case A: leaf
    if (!cur.left && !cur.right) {
      steps.push(makeStep("check", "case: leaf node", this, [cur.id]));
      steps.push(makeStep("unlink", "unlink from parent", this, parent ? [parent.id, cur.id] : [cur.id]));
      replaceChild(parent, cur, null);
      this.count--;
      steps.push(makeStep("remove", "node removed", this, parent ? [parent.id] : []));
      steps.push(makeStep("done", "delete finished", this));
      return steps;
    }

    // Case B: one child
    if (!cur.left || !cur.right) {
      steps.push(makeStep("check", "case: one child", this, [cur.id]));
      var child = cur.left ? cur.left : cur.right;
      steps.push(makeStep("link", "parent points to child", this, parent ? [parent.id, child.id] : [child.id]));
      replaceChild(parent, cur, child);
      this.count--;
      steps.push(makeStep("remove", "node removed", this, [child.id]));
      steps.push(makeStep("done", "delete finished", this, [child.id]));
      return steps;
    }

    // Case C: two children -> inorder successor
    steps.push(makeStep("check", "case: two children", this, [cur.id]));
    steps.push(makeStep("find_succ", "find inorder successor (min in right subtree)", this, [cur.id]));

    // successor is min(cur.right)
    var succParent = cur;
    var succ = cur.right;

    steps.push(makeStep("go_right", "go to right subtree", this, [succ.id]));

    while (succ.left) {
      succParent = succ;
      steps.push(makeStep("go_left", "go left to find min", this, [succ.id]));
      succ = succ.left;
    }

    steps.push(makeStep("select", "successor selected", this, [succ.id]));

    // copy value
    steps.push(makeStep("copy", "copy successor value into target", this, [cur.id, succ.id]));
    cur.value = succ.value;

    // delete successor (successor has at most one right child)
    var succChild = succ.right ? succ.right : null;
    steps.push(makeStep("unlink", "remove successor node", this, [succParent.id, succ.id]));

    if (succParent.left === succ) succParent.left = succChild;
    else succParent.right = succChild;

    this.count--;
    steps.push(makeStep("remove", "successor removed, tree updated", this, [cur.id]));
    steps.push(makeStep("done", "delete finished", this, [cur.id]));
    return steps;
  };

  /* ===== CLEAR (BST) ===== */
  bst.prototype.clear = function () {
    var steps = [];

    steps.push(makeStep(
      "start",
      "clear()",
      this,
      this.root ? [this.root.id] : []
    ));

    if (!this.root) {
      steps.push(makeStep("check", "tree is already empty", this));
      steps.push(makeStep("done", "clear finished", this));
      return steps;
    }

    // highlight toàn bộ node
    var before = this.snapshot();
    var allIds = (before.nodes || []).map(n => n.id);

    steps.push(makeStep("clear", "remove all nodes", this, allIds));

    // clear thật
    this.root = null;
    this.count = 0;

    steps.push(makeStep("done", "clear finished", this));
    return steps;
  };

  // ===== TRAVERSALS =====
  bst.prototype.preorder = function () {
    var steps = [];
    steps.push(makeStep("start", "preorder (NLR)", this));
    var _this = this;

    function dfs(n) {
      if (!n) return;
      steps.push(makeStep("visit", "visit node " + n.value, _this, [n.id]));
      dfs(n.left);
      dfs(n.right);
    }
    dfs(this.root);

    steps.push(makeStep("done", "preorder finished", this));
    return steps;
  };

  bst.prototype.inorder = function () {
    var steps = [];
    steps.push(makeStep("start", "inorder (LNR)", this));
    var _this = this;

    function dfs(n) {
      if (!n) return;
      dfs(n.left);
      steps.push(makeStep("visit", "visit node " + n.value, _this, [n.id]));
      dfs(n.right);
    }
    dfs(this.root);

    steps.push(makeStep("done", "inorder finished", this));
    return steps;
  };

  bst.prototype.postorder = function () {
    var steps = [];
    steps.push(makeStep("start", "postorder (LRN)", this));
    var _this = this;

    function dfs(n) {
      if (!n) return;
      dfs(n.left);
      dfs(n.right);
      steps.push(makeStep("visit", "visit node " + n.value, _this, [n.id]));
    }
    dfs(this.root);

    steps.push(makeStep("done", "postorder finished", this));
    return steps;
  };

  // export
  window.dsbrain.bst = bst;
})();
