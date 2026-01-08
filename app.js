document.addEventListener("DOMContentLoaded", () => {
  const btns = document.querySelectorAll(".ds-btn");
  const panels = document.querySelectorAll(".panel");

  let activePanelKey = "placeholder";

  function setActiveButton(keyOrNull) {
    btns.forEach(b => b.classList.toggle("active", b.dataset.ds === keyOrNull));
  }

  function showPanel(key) {
    activePanelKey = key;
    panels.forEach(p => p.classList.toggle("is-active", p.dataset.panel === key));
    afterPanelShown(key);
  }

  function showWorkspace() {
    setActiveButton(null);
    showPanel("placeholder");
  }

  // CÁC NÚT LỰA CHỌN KIỂU DỮ LIỆU
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.ds;
      setActiveButton(key);

      if (key === "linked-list") {
        showPanel("linked-list-menu");
        return;
      }
      showPanel(key);
    });
  });

  // CỬA SỔ CHỌN LOẠI LINKED LIST
  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-ll]");
    if (!pick) return;
    const type = pick.dataset.ll; // singly - doubly - circular
    showPanel("linked-list-" + type);
  });

  // NÚT ĐÓNG CỬA SỔ
  document.addEventListener("click", (e) => {
    const x = e.target.closest(".panel-close");
    if (!x) return;

    const target = x.dataset.closeTo;
    if (target) {
      setActiveButton("linked-list");
      showPanel(target);
    } else {
      showWorkspace();
    }
  });

  // GIAO DIỆN LINKED LIST
  const llUIs = new Map(); // key(panelKey) -> controller

  // =========================
  // STACK UI (single stack)
  // =========================
  let stackController = null;

  function initStackOnce() {
    if (stackController) return;

    if (!window.dsbrain || !window.dsbrain.stack) {
      throw new Error("dsbrain.stack not found. Did you include stack.js before app.js?");
    }

    const panelEl = document.querySelector(`.panel[data-panel="stack"]`);
    if (!panelEl) return;

    const uiRoot = panelEl.querySelector(".stack-ui");
    if (!uiRoot) return;

    const valueInput = uiRoot.querySelector(".stack-value");
    const statusEl = uiRoot.querySelector(".stack-status");
    const canvasEl = uiRoot.querySelector(".stack-canvas");

    const st = new window.dsbrain.stack();

    stackController = {
      st,
      uiRoot,
      valueInput,
      statusEl,
      canvasEl,

      setStatus(msg) {
        if (this.statusEl) this.statusEl.textContent = msg || "Ready.";
      },

      getValue() {
        const raw = (this.valueInput && this.valueInput.value != null)
          ? String(this.valueInput.value).trim()
          : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (Number.isNaN(v)) return null;
        return v;
      },

      run(op) {
        let steps = null;

        try {
          if (op === "push") {
            const v = this.getValue();
            if (v == null) return this.setStatus("⚠️ Please enter Element.");
            steps = this.st.push(v);
          } else if (op === "pop") {
            steps = this.st.pop();
          } else {
            return this.setStatus("⚠️ Unknown op: " + op);
          }
        } catch (err) {
          this.setStatus("❌ Error: " + (err && err.message ? err.message : String(err)));
          return;
        }

        if (Array.isArray(steps) && steps.length) {
          const last = steps[steps.length - 1];
          this.setStatus(last.message || "Done.");
        } else {
          this.setStatus("Done.");
        }

        this.render();
      },

      render() {
        if (!this.canvasEl) return;

        const snap = this.st.snapshot();

        this.canvasEl.innerHTML = "";

        const info = document.createElement("div");
        info.className = "stack-info";
        info.textContent = `count=${snap.count}` + (snap.topId != null ? `, top=${snap.topId}` : "");
        this.canvasEl.appendChild(info);

        const col = document.createElement("div");
        col.className = "stack-col";
        this.canvasEl.appendChild(col);

        if (!snap.nodes || snap.nodes.length === 0) {
          const empty = document.createElement("div");
          empty.className = "ll-empty";
          empty.textContent = "Empty stack";
          col.appendChild(empty);
          return;
        }

        const topBadge = document.createElement("div");
        topBadge.className = "stack-top-badge";
        topBadge.textContent = "TOP";
        col.appendChild(topBadge);

        // snapshot nodes: from top -> bottom
        for (let i = 0; i < snap.nodes.length; i++) {
          const n = snap.nodes[i];

          const item = document.createElement("div");
          item.className = "stack-item";

          const idTag = document.createElement("div");
          idTag.className = "stack-item__id";
          idTag.textContent = "#" + n.id;

          const valTag = document.createElement("div");
          valTag.className = "stack-item__val";
          valTag.textContent = String(n.value);

          item.appendChild(idTag);
          item.appendChild(valTag);
          col.appendChild(item);
        }
      }
    };

    // Bind buttons inside stack UI only
    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".stack-btn-op");
      if (!b) return;
      const op = b.dataset.op;
      stackController.run(op);
    });

    // Enter => push
    if (valueInput) {
      valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") stackController.run("push");
      });
    }

    stackController.setStatus("Ready.");
    stackController.render();
  }

  function afterPanelShown(panelKey) {
    // ===== STACK panel init/render =====
    if (panelKey === "stack") {
      initStackOnce();
      if (stackController) stackController.render();
      return;
    }

    // Chỉ khởi tạo khi cửa sổ được mở là của Linked List
    if (
      panelKey !== "linked-list-singly" &&
      panelKey !== "linked-list-doubly" &&
      panelKey !== "linked-list-circular"
    ) return;

    // Khởi tạo 1 lần mỗi cửa sổ
    if (llUIs.has(panelKey)) {
      llUIs.get(panelKey).render();
      return;
    }

    const panelEl = document.querySelector(`.panel[data-panel="${panelKey}"]`);
    if (!panelEl) return;

    const uiRoot = panelEl.querySelector(".ll-ui");
    if (!uiRoot) return;

    const type = uiRoot.dataset.lltype; // "singly" | "doubly" | "circular"
    const valueInput = uiRoot.querySelector(".ll-value");
    const indexInput = uiRoot.querySelector(".ll-index");
    const statusEl = uiRoot.querySelector(".ll-status");
    const canvasEl = uiRoot.querySelector(".ll-canvas");

    // Khởi tạo đối tượng Linked List
    const list = createListByType(type);

    const controller = {
      type,
      list,
      uiRoot,
      valueInput,
      indexInput,
      statusEl,
      canvasEl,

      setStatus(msg) {
        if (statusEl) statusEl.textContent = msg || "Ready.";
      },

      getValue() {
        const raw = (valueInput && valueInput.value != null) ? String(valueInput.value).trim() : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (Number.isNaN(v)) return null;
        return v;
      },

      getIndex() {
        const raw = (indexInput && indexInput.value != null) ? String(indexInput.value).trim() : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (!Number.isInteger(v)) return null;
        return v;
      },

      run(op) {
        // Chưa có animation, chỉ có toán tử và render kết quả cuối cùng
        let steps = null;

        try {
          if (op === "insertHead") {
            const v = this.getValue();
            if (v == null) return this.setStatus("⚠️ Please enter Element.");
            steps = this.list.insertHead(v);
          }
          else if (op === "insertTail") {
            const v = this.getValue();
            if (v == null) return this.setStatus("⚠️ Please enter Element.");
            steps = this.list.insertTail(v);
          }
          else if (op === "insertAtIndex") {
            const v = this.getValue();
            const idx = this.getIndex();
            if (v == null) return this.setStatus("⚠️ Please enter Element.");
            if (idx == null) return this.setStatus("⚠️ Please enter Index (integer).");
            steps = this.list.insertAtIndex(idx, v);
          }
          else if (op === "deleteHead") {
            steps = this.list.deleteHead();
          }
          else if (op === "deleteTail") {
            steps = this.list.deleteTail();
          }
          else if (op === "deleteAtIndex") {
            const idx = this.getIndex();
            if (idx == null) return this.setStatus("⚠️ Please enter Index (integer).");
            steps = this.list.deleteAtIndex(idx);
          }
          else if (op === "clear") {
            steps = this.list.clear();
          }
          else {
            return this.setStatus("⚠️ Unknown op: " + op);
          }
        } catch (err) {
          this.setStatus("❌ Error: " + (err && err.message ? err.message : String(err)));
          return;
        }

        // Lưu lại trạng thái của List ở bước trước đó (nếu có)
        if (Array.isArray(steps) && steps.length) {
          const last = steps[steps.length - 1];
          this.setStatus(last.message || "Done.");
        } else {
          this.setStatus("Done.");
        }

        this.render();
      },

      // Hàm render, vẽ ra trong cửa sổ Linked List
      render() {
        if (!this.canvasEl) return;
        const snap = this.list.snapshot();

        // Nút clear
        this.canvasEl.innerHTML = "";

        // Header nhỏ cho phần thông tin
        const info = document.createElement("div");
        info.className = "ll-info";
        info.textContent =
          `size=${snap.size}` +
          (snap.headid != null ? `, head=${snap.headid}` : "") +
          (snap.tailid != null ? `, tail=${snap.tailid}` : "");
        this.canvasEl.appendChild(info);

        // Hàng
        const row = document.createElement("div");
        row.className = "ll-row";
        this.canvasEl.appendChild(row);

        if (!snap.nodes || !snap.nodes.length) {
          const empty = document.createElement("div");
          empty.className = "ll-empty";
          empty.textContent = "Empty list";
          row.appendChild(empty);
          return;
        }

        for (let i = 0; i < snap.nodes.length; i++) {
          const n = snap.nodes[i];

          // Hộp Node cho mỗi phần tử
          const nodeEl = document.createElement("div");
          nodeEl.className = "ll-node";

          // ID cho mỗi Node
          const idTag = document.createElement("div");
          idTag.className = "ll-id";
          idTag.textContent = "#" + n.id;
          nodeEl.appendChild(idTag);

          // 1 Cell trong mỗi Node
          const cellsEl = document.createElement("div");
          cellsEl.className = "ll-cells";

          if (snap.type === "doubly") {

            // 3 cells trong Node [prev|data|next] nếu là Doubly Linked List
            const prevCell = document.createElement("div");
            prevCell.className = "ll-cell ll-cell--ptr";
            prevCell.textContent = (n.previd == null) ? "null" : String(n.previd);

            const dataCell = document.createElement("div");
            dataCell.className = "ll-cell ll-cell--data";
            dataCell.textContent = String(n.value);

            const nextCell = document.createElement("div");
            nextCell.className = "ll-cell ll-cell--ptr";
            nextCell.textContent = (n.nextid == null) ? "null" : String(n.nextid);

            cellsEl.appendChild(prevCell);
            cellsEl.appendChild(dataCell);
            cellsEl.appendChild(nextCell);
          } else {
            // 3 cells trong Node [data|next] nếu là những loại khác Linked List
            const dataCell = document.createElement("div");
            dataCell.className = "ll-cell ll-cell--data";
            dataCell.textContent = String(n.value);

            const nextCell = document.createElement("div");
            nextCell.className = "ll-cell ll-cell--ptr";
            nextCell.textContent = (n.nextid == null) ? "null" : String(n.nextid);

            cellsEl.appendChild(dataCell);
            cellsEl.appendChild(nextCell);
          }

          nodeEl.appendChild(cellsEl);
          row.appendChild(nodeEl);

          // Mũi tên giữa các Node
          if (i < snap.nodes.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "ll-arrow";
            arrow.textContent = "→";
            row.appendChild(arrow);
          }
        }

        // Kiểm tra có đúng dạng Circular Linked List (tail->next = head) hay không
        if (snap.type === "circular" && snap.size > 0) {
          const hint = document.createElement("div");
          hint.className = "ll-circular-hint";
          hint.textContent = snap.tailnextishead ? "tail.next → head ✅" : "tail.next → head ❌ (broken)";
          this.canvasEl.appendChild(hint);
        }
      }
    };

    // Liên kết tất cả các nút giới hạn trong 1 cửa sổ
    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".ll-btn-op");
      if (!b) return;
      const op = b.dataset.op;
      controller.run(op);
    });

    // Thêm nút "Enter" để Insert Tail
    if (valueInput) {
      valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") controller.run("insertTail");
      });
    }
    if (indexInput) {
      indexInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") controller.run("deleteAtIndex");
      });
    }

    controller.setStatus("Ready.");
    controller.render();

    llUIs.set(panelKey, controller);
  }

  function createListByType(type) {
    if (!window.llbrain) {
      throw new Error("llbrain not found. Did you include linked-list.js before app.js?");
    }
    if (type === "singly") return new window.llbrain.singlyll();
    if (type === "doubly") return new window.llbrain.doublyll();
    if (type === "circular") return new window.llbrain.circularll();
    throw new Error("Unknown ll type: " + type);
  }

  // Default
  showWorkspace();
});
