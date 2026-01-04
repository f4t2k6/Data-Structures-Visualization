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

  // ============ NAV (bottom buttons) ============
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

  // pick LL type in menu
  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-ll]");
    if (!pick) return;
    const type = pick.dataset.ll; // singly | doubly | circular
    showPanel("linked-list-" + type);
  });

  // close buttons
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

  // ============ LINKED LIST UI ============
  const llUIs = new Map(); // key(panelKey) -> controller

  function afterPanelShown(panelKey) {
    // only init when panel is LL type panel
    if (
      panelKey !== "linked-list-singly" &&
      panelKey !== "linked-list-doubly" &&
      panelKey !== "linked-list-circular"
    ) return;

    // init once per panel
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

    // create list instance
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
        // No animation for now: just run op and render final state
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

        // status from last step if exists
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
        const snap = this.list.snapshot();

        // clear
        this.canvasEl.innerHTML = "";

        // header small info
        const info = document.createElement("div");
        info.className = "ll-info";
        info.textContent =
          `size=${snap.size}` +
          (snap.headid != null ? `, head=${snap.headid}` : "") +
          (snap.tailid != null ? `, tail=${snap.tailid}` : "");
        this.canvasEl.appendChild(info);

        // row
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

          // node box
          const nodeEl = document.createElement("div");
          nodeEl.className = "ll-node";

          // label id (small)
          const idTag = document.createElement("div");
          idTag.className = "ll-id";
          idTag.textContent = "#" + n.id;
          nodeEl.appendChild(idTag);

          // cells
          const cellsEl = document.createElement("div");
          cellsEl.className = "ll-cells";

          if (snap.type === "doubly") {
            // 3 cells prev|data|next (use snapshot.cells if available)
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
            // 2 cells data|next
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

          // arrow between nodes
          if (i < snap.nodes.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "ll-arrow";
            arrow.textContent = "→";
            row.appendChild(arrow);
          }
        }

        // circular hint
        if (snap.type === "circular" && snap.size > 0) {
          const hint = document.createElement("div");
          hint.className = "ll-circular-hint";
          hint.textContent = snap.tailnextishead ? "tail.next → head ✅" : "tail.next → head ❌ (broken)";
          this.canvasEl.appendChild(hint);
        }
      }
    };

    // bind toolbar buttons inside this panel only
    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".ll-btn-op");
      if (!b) return;
      const op = b.dataset.op;
      controller.run(op);
    });

    // quick enter: press Enter in value -> insertTail
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

  // default
  showWorkspace();
});
