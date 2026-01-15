//  APP.JS: UI CONTROLLER
//  - Điều hướng các cửa sổ của các cấu trúc dữ liệu
//  - Khởi tạo UI và chạy / quản lý các bước UI cho LinkedList, Stack, Queue, BinaryTree
//  - Chạy từng bước + animation của node + log text trạng thái từng bước của operation.


document.addEventListener("DOMContentLoaded", () => {


  // PHẦN ĐIỀU HƯỚNG
  // - Điều hướng menu chính
  // - Quản lý ẩn / hiện các cửa sổ
  // - Giữ trạng thái cửa sổ đang active
  
  const btns = document.querySelectorAll(".ds-btn");
  const panels = document.querySelectorAll(".panel");

  let activePanelKey = "placeholder";

  // Bật / tắt trạng thái active của menu button
  function setActiveButton(keyOrNull) {
    btns.forEach(b => b.classList.toggle("active", b.dataset.ds === keyOrNull));
  }

  // Hiện đúng panel theo key, ẩn các panel còn lại
  function showPanel(key) {
    activePanelKey = key;
    panels.forEach(p => p.classList.toggle("is-active", p.dataset.panel === key));
    afterPanelShown(key);
  }

  // Quay về màn hình menu
  function showWorkspace() {
    setActiveButton(null);
    showPanel("placeholder");
  }


  // LINKED LIST SUB-MENU
  // - Chọn loại Linked List: Singly, Doubly, Circular
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

  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-ll]");
    if (!pick) return;

    const type = pick.dataset.ll;
    showPanel("linked-list-" + type);
  });

  // Nút đóng cửa sổ
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


  // LƯU LẠI UI ĐỂ CHỈ INIT 1 LẦN
  const llUIs = new Map();  // Linked List
  let stackController = null;  // Stack
  let queueController = null;  // Queue
  let treeController = null;  // Binary Tree


  // STACK UI
  // - Init UI Stack 1 lần
  // - Render kết quả operation + animation
  // - Các nút chức năng: push - pop - clear
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

      // Animation & trạng thái UI
      animating: false,
      STEP_DELAY: 900,
      sleep(ms){ return new Promise(r => setTimeout(r, ms)); },
      setBusy(isBusy){
        this.animating = !!isBusy;
        if (this.uiRoot) this.uiRoot.classList.toggle("is-busy", !!isBusy);
      },

      // Render
      renderFromSnapshot(snap, highlightIds = []){
        if (!this.canvasEl) return;

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

        const hlSet = new Set((highlightIds || []).map(String));

        for (let i = 0; i < snap.nodes.length; i++) {
          const n = snap.nodes[i];

          const item = document.createElement("div");
          item.className = "stack-item";
          item.dataset.sid = String(n.id);

          if (hlSet.has(String(n.id))) item.classList.add("is-hl", "is-pulse");

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
      },

      // Animation hỗ trợ
      captureItemRects(){
        const map = new Map();
        if (!this.canvasEl) return map;
        const items = this.canvasEl.querySelectorAll(".stack-item[data-sid]");
        items.forEach(el => map.set(el.dataset.sid, el.getBoundingClientRect()));
        return map;
      },

      playFLIP(oldRects, durationMs){
        if (!this.canvasEl) return;
        const items = this.canvasEl.querySelectorAll(".stack-item[data-sid]");
        items.forEach(el => {
          const id = el.dataset.sid;
          const oldRect = oldRects.get(id);
          if (!oldRect) return;

          const newRect = el.getBoundingClientRect();
          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;

          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          void el.offsetWidth;
          el.style.transition = `transform ${durationMs}ms ease`;
          el.style.transform = "translate(0px, 0px)";
        });
      },

      diffIds(prevSnap, nextSnap){
        const a = new Set((prevSnap?.nodes || []).map(n => String(n.id)));
        const b = new Set((nextSnap?.nodes || []).map(n => String(n.id)));
        let insertedId = null, removedId = null;
        b.forEach(id => { if (!a.has(id)) insertedId = id; });
        a.forEach(id => { if (!b.has(id)) removedId = id; });
        return { insertedId, removedId };
      },

      formatStepMessage(stepObj){
        const a = String(stepObj?.action || "").toLowerCase();
        const m = String(stepObj?.message || "").toUpperCase();
        const hl = (stepObj?.highlight || []).map(x => String(x));
        const hlText = hl.length ? ` [NODE ${hl.join(", ")}]` : "";

        if (a === "start") return `START: ${m}${hlText}`;
        if (a === "create") return `CREATE: ${m}${hlText}`;
        if (a === "link") return `LINK: ${m}${hlText}`;
        if (a === "select") return `SELECT: ${m}${hlText}`;
        if (a === "update_ptr") return `UPDATE POINTER: ${m}${hlText}`;
        if (a === "insert") return `INSERT: ${m}${hlText}`;
        if (a === "remove") return `REMOVE: ${m}${hlText}`;
        if (a === "error") return `ERROR: ${m}${hlText}`;
        if (a === "done") return `DONE${hlText}`;
        return `STEP: ${m}${hlText}`;
      },

      // Text thông báo trạng thái
      setStatus(msg, mode = "append") {
        if (!this.statusEl) return;

        if (mode === "clear") {
          this.statusEl.textContent = "";
          return;
        }

        if (mode === "replace") {
          this.statusEl.textContent = msg || "";
          return;
        }

        const line = msg || "";
        if (this.statusEl.textContent.trim() === "") {
          this.statusEl.textContent = line;
        } else {
          this.statusEl.textContent += "\n" + line;
        }

        this.statusEl.scrollTop = this.statusEl.scrollHeight;
      },

      // Input
      getValue() {
        const raw = (this.valueInput && this.valueInput.value != null)
          ? String(this.valueInput.value).trim()
          : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (Number.isNaN(v)) return null;
        return v;
      },

      // Điều khiển thao tác
      async run(op){
        if (this.animating) return;

        this.setBusy(true);
        this.setStatus("", "clear");
        try{
          let steps = null;

          if (op === "push") {
            const v = this.getValue();
            if (v == null) { this.setStatus("Please enter an integer!", "replace"); return; }
            steps = this.st.push(v);
          } else if (op === "pop") {
            steps = this.st.pop();
          } else if (op === "clear") {
            steps = this.st.clear();
          } else {
            this.setStatus("Unknown operation: " + op, "replace");
            return;
          }

          if (!Array.isArray(steps) || steps.length === 0){
            this.setStatus("Done.");
            this.render();
            return;
          }

          let prevSnap = steps[0].state;
          this.setStatus(this.formatStepMessage(steps[0]), "append");
          this.renderFromSnapshot(prevSnap, steps[0].highlight || []);
          await this.sleep(this.STEP_DELAY);

          for (let i = 1; i < steps.length; i++){
            const s = steps[i];
            const nextSnap = s.state;
            const hl = (s.highlight || []).map(x => String(x));

            this.setStatus(this.formatStepMessage(s), "append");
            // REMOVE
            if (s.action === "remove") {
              const d = this.diffIds(prevSnap, nextSnap);
              if (d.removedId && this.canvasEl) {
                const el = this.canvasEl.querySelector(`.stack-item[data-sid="${d.removedId}"]`);
                if (el) {
                  el.classList.add("is-leave");
                  await this.sleep(260);
                }
              }
            }

            // CLEAR
            if (s.action === "clear") {
              if (this.canvasEl) {
                const all = this.canvasEl.querySelectorAll(".stack-item[data-sid]");
                all.forEach(el => el.classList.add("is-leave"));
                await this.sleep(260);
              }
            }

            // FLIP
            const oldRects = this.captureItemRects();
            this.renderFromSnapshot(nextSnap, hl);
            this.playFLIP(oldRects, 500);

            // INSERT
            if (s.action === "insert") {
              const d = this.diffIds(prevSnap, nextSnap);
              if (d.insertedId && this.canvasEl) {
                const el = this.canvasEl.querySelector(`.stack-item[data-sid="${d.insertedId}"]`);
                if (el) el.classList.add("is-enter");
              }
            }

            await this.sleep(this.STEP_DELAY);
            prevSnap = nextSnap;
          }
        } catch(err){
          this.setStatus("❌ Error: " + (err?.message || String(err)), "replace");
        } finally{
          this.setBusy(false);
        }
      },  


      // Vẽ stack ra canvas
      render() {
        if (!this.canvasEl) return;

        const snap = this.st.snapshot();

        this.canvasEl.innerHTML = "";

        // Thông tin
        const info = document.createElement("div");
        info.className = "stack-info";
        info.textContent = `count=${snap.count}` + (snap.topId != null ? `, top=${snap.topId}` : "");
        this.canvasEl.appendChild(info);

        // Cột hiển thị các phần tử stack
        const col = document.createElement("div");
        col.className = "stack-col";
        this.canvasEl.appendChild(col);

        // Không có node thì stack rỗng
        if (!snap.nodes || snap.nodes.length === 0) {
          const empty = document.createElement("div");
          empty.className = "ll-empty";
          empty.textContent = "Empty stack";
          col.appendChild(empty);
          return;
        }

        // TOP ở trên cùng
        const topBadge = document.createElement("div");
        topBadge.className = "stack-top-badge";
        topBadge.textContent = "TOP";
        col.appendChild(topBadge);

        // Nodes được sắp theo top -> bottom
        for (let i = 0; i < snap.nodes.length; i++) {
          const n = snap.nodes[i];

          const item = document.createElement("div");
          item.className = "stack-item";

          // ID
          const idTag = document.createElement("div");
          idTag.className = "stack-item__id";
          idTag.textContent = "#" + n.id;

          // Value
          const valTag = document.createElement("div");
          valTag.className = "stack-item__val";
          valTag.textContent = String(n.value);

          item.appendChild(idTag);
          item.appendChild(valTag);
          col.appendChild(item);
        }
      }
    };


    // QUEUE UI 
    // - Tương tự Stack nhưng hiển thị dạng hàng ngang
    // - Button làm việc với enqueue / dequeue

    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".stack-btn-op");
      if (!b) return;
      const op = b.dataset.op;
      stackController.run(op);
    });

    if (valueInput) {
      valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") stackController.run("push");
      });
    }

    // Clear
    stackController.setStatus("Ready.");
    stackController.render();
  }

  // Khởi tạo queue UI
  function initQueueOnce() {
    if (queueController) return;

    // Kiểm tra import queue.js
    if (!window.dsbrain || !window.dsbrain.queue) {
      throw new Error("dsbrain.queue not found. Did you include queue.js before app.js?");
    }

    const panelEl = document.querySelector(`.panel[data-panel="queue"]`);
    if (!panelEl) return;

    const uiRoot = panelEl.querySelector(".queue-ui");
    if (!uiRoot) return;

    const valueInput = uiRoot.querySelector(".queue-value");
    const statusEl = uiRoot.querySelector(".queue-status");
    const canvasEl = uiRoot.querySelector(".queue-canvas");

    const q = new window.dsbrain.queue();

    queueController = {
      q,
      uiRoot,
      valueInput,
      statusEl,
      canvasEl,

      // Animation & UI
      animating: false,
      STEP_DELAY: 900,
      sleep(ms){ return new Promise(r => setTimeout(r, ms)); },
      setBusy(isBusy){
        this.animating = !!isBusy;
        if (this.uiRoot) this.uiRoot.classList.toggle("is-busy", !!isBusy);
      },

      // Text trạng thái
      setStatus(msg, mode = "append"){
        if (!this.statusEl) return;

        if (mode === "clear") { this.statusEl.textContent = ""; return; }
        if (mode === "replace") { this.statusEl.textContent = msg || ""; return; }

        const line = msg || "";
        if (this.statusEl.textContent.trim() === "") this.statusEl.textContent = line;
        else this.statusEl.textContent += "\n" + line;

        this.statusEl.scrollTop = this.statusEl.scrollHeight;
      },

      getValue(){
        const raw = (this.valueInput && this.valueInput.value != null)
          ? String(this.valueInput.value).trim()
          : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (Number.isNaN(v)) return null;
        return v;
      },

      formatStepMessage(stepObj){
        const a = String(stepObj?.action || "").toLowerCase();
        const m = String(stepObj?.message || "").toUpperCase();
        const hl = (stepObj?.highlight || []).map(x => String(x));
        const hlText = hl.length ? ` [NODE ${hl.join(", ")}]` : "";

        if (a === "start") return `START: ${m}${hlText}`;
        if (a === "check") return `CHECK: ${m}${hlText}`;
        if (a === "create") return `CREATE: ${m}${hlText}`;
        if (a === "link") return `LINK: ${m}${hlText}`;
        if (a === "select") return `SELECT: ${m}${hlText}`;
        if (a === "update_ptr") return `UPDATE POINTER: ${m}${hlText}`;
        if (a === "insert") return `ENQUEUE: ${m}${hlText}`;
        if (a === "remove") return `DEQUEUE: ${m}${hlText}`;
        if (a === "error") return `ERROR: ${m}${hlText}`;
        if (a === "done") return `DONE${hlText}`;
        return `STEP: ${m}${hlText}`;
      },

      // Render
      renderFromSnapshot(snap, highlightIds = []){
        if (!this.canvasEl) return;
        this.canvasEl.innerHTML = "";

        const info = document.createElement("div");
        info.className = "queue-info";
        info.textContent =
          `count=${snap.count}` +
          (snap.headId != null ? `, head=${snap.headId}` : "") +
          (snap.tailId != null ? `, tail=${snap.tailId}` : "");
        this.canvasEl.appendChild(info);

        const row = document.createElement("div");
        row.className = "queue-row";
        this.canvasEl.appendChild(row);

        if (!snap.nodes || snap.nodes.length === 0){
          const empty = document.createElement("div");
          empty.className = "ll-empty";
          empty.textContent = "Empty queue";
          row.appendChild(empty);
          return;
        }

        const badges = document.createElement("div");
        badges.className = "queue-badges";
        badges.innerHTML = `<span class="queue-badge">FRONT (HEAD)</span><span class="queue-badge">REAR (TAIL)</span>`;
        this.canvasEl.insertBefore(badges, row);

        const hlSet = new Set((highlightIds || []).map(String));

        for (let i = 0; i < snap.nodes.length; i++){
          const n = snap.nodes[i];

          const nodeEl = document.createElement("div");
          nodeEl.className = "queue-node";
          nodeEl.dataset.qid = String(n.id);

          if (hlSet.has(String(n.id))) nodeEl.classList.add("is-hl", "is-pulse");

          const idTag = document.createElement("div");
          idTag.className = "queue-node__id";
          idTag.textContent = "#" + n.id;

          const valTag = document.createElement("div");
          valTag.className = "queue-node__val";
          valTag.textContent = String(n.value);

          nodeEl.appendChild(idTag);
          nodeEl.appendChild(valTag);
          row.appendChild(nodeEl);

          if (i < snap.nodes.length - 1){
            const arrow = document.createElement("div");
            arrow.className = "queue-arrow";
            arrow.textContent = "→";
            row.appendChild(arrow);
          }
        }
      },

      // Animation hỗ trợ
      captureNodeRects(){
        const map = new Map();
        if (!this.canvasEl) return map;
        const nodes = this.canvasEl.querySelectorAll(".queue-node[data-qid]");
        nodes.forEach(el => map.set(el.dataset.qid, el.getBoundingClientRect()));
        return map;
      },

      playFLIP(oldRects, durationMs){
        if (!this.canvasEl) return;
        const nodes = this.canvasEl.querySelectorAll(".queue-node[data-qid]");
        nodes.forEach(el => {
          const id = el.dataset.qid;
          const oldRect = oldRects.get(id);
          if (!oldRect) return;

          const newRect = el.getBoundingClientRect();
          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;

          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          void el.offsetWidth;
          el.style.transition = `transform ${durationMs}ms ease`;
          el.style.transform = "translate(0px,0px)";
        });
      },

      diffIds(prevSnap, nextSnap){
        const a = new Set((prevSnap?.nodes || []).map(n => String(n.id)));
        const b = new Set((nextSnap?.nodes || []).map(n => String(n.id)));
        let insertedId = null, removedId = null;
        b.forEach(id => { if (!a.has(id)) insertedId = id; });
        a.forEach(id => { if (!b.has(id)) removedId = id; });
        return { insertedId, removedId };
      },

      // Điều khiển thao tác
      async run(op){
        if (this.animating) return;

        this.setBusy(true);
        this.setStatus("", "clear");

        try{
          let steps = null;

          if (op === "enqueue"){
            const v = this.getValue();
            if (v == null) { this.setStatus("⚠️ Please enter Element.", "replace"); return; }
            steps = this.q.enqueue(v);
          } else if (op === "dequeue"){
            steps = this.q.dequeue();
          } else if (op === "clear") {
            steps = this.q.clear();
          }
          else {
            this.setStatus("Unknown op: " + op, "replace");
            return;
          }

          if (!Array.isArray(steps) || steps.length === 0){
            this.setStatus("Done.", "replace");
            return;
          }

          let prevSnap = steps[0].state;
          this.setStatus(this.formatStepMessage(steps[0]), "append");
          this.renderFromSnapshot(prevSnap, steps[0].highlight || []);
          await this.sleep(this.STEP_DELAY);

          for (let i = 1; i < steps.length; i++){
            const s = steps[i];
            const nextSnap = s.state;
            const hl = (s.highlight || []).map(x => String(x));

            this.setStatus(this.formatStepMessage(s), "append");

            // Dequeue: pop-out
            if (s.action === "remove"){
              const d = this.diffIds(prevSnap, nextSnap);
              if (d.removedId && this.canvasEl){
                const el = this.canvasEl.querySelector(`.queue-node[data-qid="${d.removedId}"]`);
                if (el){
                  el.classList.add("is-leave");
                  await this.sleep(260);
                }
              }
            }

            const oldRects = this.captureNodeRects();

            this.renderFromSnapshot(nextSnap, hl);

            this.playFLIP(oldRects, 500);

            // pop-in khi enqueue (node mới thêm ở tail)
            if (s.action === "insert"){
              const d = this.diffIds(prevSnap, nextSnap);
              if (d.insertedId && this.canvasEl){
                const el = this.canvasEl.querySelector(`.queue-node[data-qid="${d.insertedId}"]`);
                if (el) el.classList.add("is-enter");
              }
            }

            await this.sleep(this.STEP_DELAY);
            prevSnap = nextSnap;
          }
        } catch(err){
          this.setStatus("❌ Error: " + (err?.message || String(err)), "replace");
        } finally{
          this.setBusy(false);
        }
      },

      render(){
        this.renderFromSnapshot(this.q.snapshot(), []);
      }
    };

    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".queue-btn-op");
      if (!b) return;
      
      queueController.run(b.dataset.op);
    });

    if (valueInput){
      valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") queueController.run("enqueue");
      }
      
    );
    }

    queueController.setStatus("Ready.", "replace");
    queueController.render();
  }


  // BINARY SEARCH TREE UI CONTROLLER
  // - Render cây dạng phân tầng
  // - Vẽ line bằng SVG
  // - Button thao tác insert, delete, traversal

  //Khởi tạo cây khi mở cửa sổ
  function initTreeOnce() {
    if (treeController) return;

    if (!window.dsbrain || !window.dsbrain.bst) {
      throw new Error("dsbrain.bst not found. Did you include tree.js before app.js?");
    }

    const panelEl = document.querySelector(`.panel[data-panel="binary-tree"]`);
    if (!panelEl) return;

    const uiRoot = panelEl.querySelector(".tree-ui");
    if (!uiRoot) return;

    const valueInput = uiRoot.querySelector(".tree-value");
    const statusEl = uiRoot.querySelector(".tree-status");
    const canvasEl = uiRoot.querySelector(".tree-canvas");

    const t = new window.dsbrain.bst();

    treeController = {
      t,
      uiRoot,
      valueInput,
      statusEl,
      canvasEl,

      // Animation
      animating: false,
      STEP_DELAY: 900,
      sleep(ms){ return new Promise(r => setTimeout(r, ms)); },

      setBusy(isBusy){
        this.animating = !!isBusy;
        if (this.uiRoot) this.uiRoot.classList.toggle("is-busy", !!isBusy);
      },

      // Text trạng thái
      setStatus(msg, mode="append"){
        if (!this.statusEl) return;
        if (mode === "clear") { this.statusEl.textContent = ""; return; }
        if (mode === "replace") { this.statusEl.textContent = msg || ""; return; }
        const line = msg || "";
        if (this.statusEl.textContent.trim() === "") this.statusEl.textContent = line;
        else this.statusEl.textContent += "\n" + line;
        this.statusEl.scrollTop = this.statusEl.scrollHeight;
      },

      getValue(){
        const raw = (this.valueInput && this.valueInput.value != null)
          ? String(this.valueInput.value).trim()
          : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (Number.isNaN(v)) return null;
        return v;
      },

      formatStepMessage(stepObj){
        const a = String(stepObj?.action || "").toLowerCase();
        const m = String(stepObj?.message || "").toUpperCase();
        const hl = (stepObj?.highlight || []).map(x => String(x));
        const hlText = hl.length ? ` [NODE ${hl.join(", ")}]` : "";

        if (a === "start") return `START: ${m}${hlText}`;
        if (a === "visit") return `VISIT: ${m}${hlText}`;
        if (a === "go_left") return `GO LEFT: ${m}${hlText}`;
        if (a === "go_right") return `GO RIGHT: ${m}${hlText}`;
        if (a === "create") return `CREATE: ${m}${hlText}`;
        if (a === "link") return `LINK: ${m}${hlText}`;
        if (a === "found") return `FOUND: ${m}${hlText}`;
        if (a === "check") return `CHECK: ${m}${hlText}`;
        if (a === "find_succ") return `SUCCESSOR: ${m}${hlText}`;
        if (a === "copy") return `COPY: ${m}${hlText}`;
        if (a === "unlink") return `UNLINK: ${m}${hlText}`;
        if (a === "insert") return `INSERT: ${m}${hlText}`;
        if (a === "remove") return `REMOVE: ${m}${hlText}`;
        if (a === "error") return `ERROR: ${m}${hlText}`;
        if (a === "done") return `DONE${hlText}`;
        return `STEP: ${m}${hlText}`;
      },

      // Render cây
      renderFromSnapshot(snap, highlightIds = []){
        if (!this.canvasEl) return;
        this.canvasEl.innerHTML = "";

        const info = document.createElement("div");
        info.className = "tree-info";
        info.textContent = `count=${snap.count}` + (snap.rootId != null ? `, root=${snap.rootId}` : "");
        this.canvasEl.appendChild(info);

        // Vẽ line nối Nodes
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("tree-svg");
        this.canvasEl.appendChild(svg);

        // Node ID và Node data
        const map = new Map((snap.nodes || []).map(n => [String(n.id), n]));
        if (!snap.nodes || snap.nodes.length === 0) {
          const empty = document.createElement("div");
          empty.className = "ll-empty";
          empty.textContent = "Empty tree";
          this.canvasEl.appendChild(empty);
          return;
        }

        const W = this.canvasEl.clientWidth || 800;
        const LEVEL_H = 80;
        const nodesPos = new Map();

        function buildChildren(id){
          const n = map.get(String(id));
          return {
            id: String(n.id),
            left: n.leftId != null ? String(n.leftId) : null,
            right: n.rightId != null ? String(n.rightId) : null
          };
        }

        function layout(nodeId, x, y, offset){
          if (!nodeId) return;
          nodesPos.set(String(nodeId), {x, y});
          const n = buildChildren(nodeId);
          if (n.left) layout(n.left, x - offset, y + LEVEL_H, offset / 2);
          if (n.right) layout(n.right, x + offset, y + LEVEL_H, offset / 2);
        }

        layout(String(snap.rootId), W/2, 50, W/4);

        // Vẽ đường
        nodesPos.forEach((pos, id) => {
          const n = map.get(String(id));
          if (!n) return;

          function lineTo(childId){
            const c = nodesPos.get(String(childId));
            if (!c) return;
            const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ln.setAttribute("x1", pos.x);
            ln.setAttribute("y1", pos.y);
            ln.setAttribute("x2", c.x);
            ln.setAttribute("y2", c.y);
            ln.setAttribute("class", "tree-line");
            svg.appendChild(ln);
          }

          if (n.leftId != null) lineTo(n.leftId);
          if (n.rightId != null) lineTo(n.rightId);
        });

        // Vẽ Node
        const hlSet = new Set((highlightIds || []).map(String));
        nodesPos.forEach((pos, id) => {
          const n = map.get(String(id));
          if (!n) return;

          const el = document.createElement("div");
          el.className = "tree-node";
          el.dataset.tid = String(n.id);
          el.style.left = (pos.x) + "px";
          el.style.top = (pos.y) + "px";
          el.innerHTML = `<div class="tree-node__val">${n.value}</div><div class="tree-node__id">#${n.id}</div>`;

          if (hlSet.has(String(n.id))) el.classList.add("is-hl", "is-pulse");
          this.canvasEl.appendChild(el);
        });
      },

      diffIds(prevSnap, nextSnap){
        const a = new Set((prevSnap?.nodes || []).map(n => String(n.id)));
        const b = new Set((nextSnap?.nodes || []).map(n => String(n.id)));
        let insertedId = null, removedId = null;
        b.forEach(id => { if (!a.has(id)) insertedId = id; });
        a.forEach(id => { if (!b.has(id)) removedId = id; });
        return { insertedId, removedId };
      },

      // Điều khiển thao tác
      async run(op){
        if (this.animating) return;

        this.setBusy(true);
        this.setStatus("", "clear");

        try{
          let steps = null;

          if (op === "insert"){
            const v = this.getValue();
            if (v == null) { this.setStatus("⚠️ Please enter Element.", "replace"); return; }
            steps = this.t.insert(v);
          } else if (op === "delete"){
            const v = this.getValue();
            if (v == null) { this.setStatus("⚠️ Please enter Element.", "replace"); return; }
            steps = this.t.delete(v);
          } else if (op === "preorder"){
            steps = this.t.preorder();
          } else if (op === "inorder"){
            steps = this.t.inorder();
          } else if (op === "postorder"){
            steps = this.t.postorder();
          } else if (op === "clear") {
            steps = this.t.clear();
          } else {
            this.setStatus("Unknown op: " + op, "replace");
            return;
          }

          if (!Array.isArray(steps) || steps.length === 0){
            this.setStatus("Done.", "replace");
            return;
          }

          let prevSnap = steps[0].state;
          this.setStatus(this.formatStepMessage(steps[0]), "append");
          this.renderFromSnapshot(prevSnap, steps[0].highlight || []);
          await this.sleep(this.STEP_DELAY);

          for (let i = 1; i < steps.length; i++){
            const s = steps[i];
            const nextSnap = s.state;
            const hl = (s.highlight || []).map(x => String(x));

            this.setStatus(this.formatStepMessage(s), "append");

            // Remove: pop-out node
            if (s.action === "remove"){
              const d = this.diffIds(prevSnap, nextSnap);
              if (d.removedId && this.canvasEl){
                const el = this.canvasEl.querySelector(`.tree-node[data-tid="${d.removedId}"]`);
                if (el){
                  el.classList.add("is-leave");
                  await this.sleep(260);
                }
              }
            }

            this.renderFromSnapshot(nextSnap, hl);

            // Insert: pop-in node
            if (s.action === "insert"){
              const d = this.diffIds(prevSnap, nextSnap);
              if (d.insertedId && this.canvasEl){
                const el = this.canvasEl.querySelector(`.tree-node[data-tid="${d.insertedId}"]`);
                if (el) el.classList.add("is-enter");
              }
            }

            await this.sleep(this.STEP_DELAY);
            prevSnap = nextSnap;
          }
        } catch(err){
          this.setStatus("❌ Error: " + (err?.message || String(err)), "replace");
        } finally{
          this.setBusy(false);
        }
      },

      render(){
        this.renderFromSnapshot(this.t.snapshot(), []);
      }
    };

    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".tree-btn-op");
      if (!b) return;
      treeController.run(b.dataset.op);
    });

    if (valueInput){
      valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") treeController.run("insert");
      });
    }

    treeController.setStatus("Ready.", "replace");
    treeController.render();
  }


  // CHẠY CHƯƠNG TRÌNH SAU KHI CỬA SỔ ĐƯỢC MỞ
  // - Chạy sau khi 1 panel được mở
  // - Init UI tương ứng nếu chưa tồn tại
  function afterPanelShown(panelKey) {
    //Cửa sổ Stack
    if (panelKey === "stack") {
      initStackOnce();
      if (stackController) stackController.render();
      return;
    }
    //Cửa sổ Queue
    if (panelKey === "queue") {
      initQueueOnce();
      if (queueController) queueController.render();
      return;
    }
    //Cửa sổ Binary Tree
    if (panelKey === "binary-tree") {
      initTreeOnce();
      if (treeController) treeController.render();
      return;
    }

    //Cửa sổ Linked List
    // Chỉ xử lý khi mở đúng 1 trong 3 cửa sổ Linked List
    if (
      panelKey !== "linked-list-singly" &&
      panelKey !== "linked-list-doubly" &&
      panelKey !== "linked-list-circular"
    ) return;

    if (llUIs.has(panelKey)) {
      llUIs.get(panelKey).render();
      return;
    }

    const panelEl = document.querySelector(`.panel[data-panel="${panelKey}"]`);
    if (!panelEl) return;

    // UI của Linked List
    const uiRoot = panelEl.querySelector(".ll-ui");
    if (!uiRoot) return;

    // Đọc loại linked list
    const type = uiRoot.dataset.lltype;

    // Lấy các element input / status / canvas
    const valueInput = uiRoot.querySelector(".ll-value");
    const indexInput = uiRoot.querySelector(".ll-index");
    const statusEl = uiRoot.querySelector(".ll-status");
    const canvasEl = uiRoot.querySelector(".ll-canvas");

    // Khởi tạo đối tượng Linked List theo loại
    const list = createListByType(type);

    // List + UI
    const controller = {
      type,
      list,
      uiRoot,
      valueInput,
      indexInput,
      statusEl,
      canvasEl,

      // Text trạng thái
      setStatus(msg, mode = "append") {
        if (!statusEl) return;

        // "append" - "replace" - "clear"
        if (mode === "clear") {
          statusEl.textContent = "";
          return;
        }
        if (mode === "replace") {
          statusEl.textContent = msg || "";
          return;
        }

        const line = msg || "";
        if (statusEl.textContent.trim() === "") statusEl.textContent = line;
        else statusEl.textContent += "\n" + line;

        statusEl.scrollTop = statusEl.scrollHeight;
      },

      // Input
      getValue() {
        const raw = (valueInput && valueInput.value != null) ? String(valueInput.value).trim() : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (Number.isNaN(v)) return null;
        return v;
      },

      // Lấy index từ input
      getIndex() {
        const raw = (indexInput && indexInput.value != null) ? String(indexInput.value).trim() : "";
        if (raw === "") return null;
        const v = Number(raw);
        if (!Number.isInteger(v)) return null;
        return v;
      },

      // Animation - FLIP
      animating: false,

      sleep(ms){
        return new Promise(r => setTimeout(r, ms));
      },
      STEP_DELAY: 1000, // mỗi bước chạy 1s

      setBusy(isBusy){
        // khóa click trong lúc animate để tránh đè animation
        this.animating = isBusy;
        if (this.uiRoot) this.uiRoot.classList.toggle("is-busy", !!isBusy);
      },

      formatStepMessage(stepObj){
        const a = String(stepObj?.action || "").toLowerCase();
        const m = String(stepObj?.message || "");
        const hl = (stepObj?.highlight || []).map(x => String(x));
        const hlText = hl.length ? ` [NODE ${hl.join(", ")}]` : "";

        //Lấy thông tin vị trí của Node
        const getIndexNumber = () => {
          let t = m.match(/(?:visit|reach)\s+index\s+(-?\d+)/i);
          if (t) return t[1];

          t = m.match(/(?:insertAtIndex|deleteAtIndex)\s*\(\s*(-?\d+)/i);
          if (t) return t[1];

          return null;
        };

        const getValueNumber = () => {
          const t = m.match(/\(([^)]+)\)/);
          if (!t) return null;
          const nums = t[1].match(/-?\d+(\.\d+)?/g);
          return (nums && nums.length) ? nums[nums.length - 1] : null;
        };

        //Các text trạng thái chạy của từng bước
        // START
        if (a === "start"){
          if (/inserthead/i.test(m)) return `START: INSERT AT HEAD${hlText}`;
          if (/inserttail/i.test(m)) return `START: INSERT AT TAIL${hlText}`;
          if (/insertatindex/i.test(m)) {
            const idx = getIndexNumber();
            return `START: INSERT AT INDEX ${idx ?? "?"}${hlText}`;
          }
          if (/deletehead/i.test(m)) return `START: DELETE HEAD${hlText}`;
          if (/deletetail/i.test(m)) return `START: DELETE TAIL${hlText}`;
          if (/deleteatindex/i.test(m)) {
            const idx = getIndexNumber();
            return `START: DELETE AT INDEX ${idx ?? "?"}${hlText}`;
          }
          if (/clear/i.test(m)) return `START: CLEAR LIST${hlText}`;

          return `START OPERATION${hlText}`;
        }

        // VISIT (TRAVERSE)
        if (a === "visit"){
          const idx = getIndexNumber();
          if (/walk to tail/i.test(m)) return `TRAVERSING TO FIND TAIL${hlText}`;
          if (/reach tail/i.test(m)) return `TAIL FOUND${hlText}`;
          if (idx != null && /reach index/i.test(m)) return `REACHED TARGET POSITION (INDEX ${idx})${hlText}`;
          if (idx != null && /visit index/i.test(m)) return `VISITING NODE AT INDEX ${idx}${hlText}`;
          return `VISITING NEXT NODE${hlText}`;
        }

        // INSERT
        if (a === "insert"){
          const val = getValueNumber();
          if (/empty/i.test(m) && /head/i.test(m)) return `LIST IS EMPTY → CREATE FIRST NODE${hlText}`;
          if (/link new node to old head/i.test(m)) return `LINK NEW NODE BEFORE OLD HEAD${hlText}`;
          if (/head updated/i.test(m)) return `UPDATE HEAD POINTER${hlText}`;
          if (/link tail\.next/i.test(m) || /after old tail/i.test(m)) return `LINK NEW NODE AFTER TAIL${hlText}`;
          if (/tail updated/i.test(m)) return `UPDATE TAIL POINTER${hlText}`;
          if (/between/i.test(m)) return `LINK NEW NODE BETWEEN NODES${hlText}`;
          if (/inserted/i.test(m)) return `NODE INSERTED${hlText}`;
          return `INSERT STEP${hlText}`;
        }

        // REMOVE
        if (a === "remove"){
          if (/remove only node/i.test(m)) return `REMOVE THE ONLY NODE${hlText}`;
          if (/remove head/i.test(m)) return `REMOVE HEAD NODE${hlText}`;
          if (/unlink tail/i.test(m)) return `UNLINK TAIL NODE${hlText}`;
          if (/unlink node/i.test(m)) return `UNLINK TARGET NODE${hlText}`;
          if (/head updated/i.test(m)) return `UPDATE HEAD POINTER${hlText}`;
          if (/tail updated/i.test(m)) return `UPDATE TAIL POINTER${hlText}`;
          if (/removed value/i.test(m)) return `REMOVAL COMPLETE${hlText}`;
          return `REMOVE STEP${hlText}`;
        }

        // ERROR / DONE
        if (a === "error") return (`ERROR: ${m || "INVALID OPERATION"}${hlText}`).toUpperCase();
        if (a === "done") return (`DONE${hlText}`).toUpperCase();

        // FALLBACK
        return (`STEP${hlText}`).toUpperCase();
      },


      // Lấy vị trí của từng node hiện đang hiển thị
      captureNodeRects(){
        const map = new Map();
        if (!this.canvasEl) return map;

        const nodes = this.canvasEl.querySelectorAll(".ll-node[data-nodeid]");
        nodes.forEach(el => {
          const id = el.dataset.nodeid;
          map.set(id, el.getBoundingClientRect());
        });
        return map;
      },

      // Tìm node element theo id
      getNodeElById(id){
        if (!this.canvasEl) return null;
        return this.canvasEl.querySelector(`.ll-node[data-nodeid="${id}"]`);
      },

      // So sánh snapshot để biết id nào mới thêm hoặc bị xóa
      diffSnapshots(beforeSnap, afterSnap){
        const a = new Set((beforeSnap?.nodes || []).map(n => String(n.id)));
        const b = new Set((afterSnap?.nodes || []).map(n => String(n.id)));

        let insertedId = null;
        let removedId = null;

        b.forEach(id => { if (!a.has(id)) insertedId = id; });
        a.forEach(id => { if (!b.has(id)) removedId = id; });

        return { insertedId, removedId };
      },

      // Chạy FLIP cho các node tồn tại trước & sau để làm animation di chuyển linear
      playFLIP(oldRects, durationMs){
        if (!this.canvasEl) return;

        const nodes = this.canvasEl.querySelectorAll(".ll-node[data-nodeid]");
        nodes.forEach(el => {
          const id = el.dataset.nodeid;
          const oldRect = oldRects.get(id);
          if (!oldRect) return; // node mới thì bỏ (pop riêng)

          const newRect = el.getBoundingClientRect();
          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;

          // Invert: đặt node về vị trí cũ bằng transform
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          void el.offsetWidth;

          // Play: trả về transform=0 để node chạy về vị trí mới
          el.style.transition = `transform ${durationMs}ms ease`;
          el.style.transform = "translate(0px, 0px)";
        });
      },

      // Pop-in cho node mới
      popInNode(id, durationMs){
        const el = this.getNodeElById(id);
        if (!el) return;

        el.classList.add("is-enter");
        el.style.transition = "none";
        void el.offsetWidth;

        // Chạy vào
        el.style.transition = `transform ${durationMs}ms ease, opacity ${durationMs}ms ease`;
        el.classList.remove("is-enter");
      },

      // Pop-out cho node bị xóa
      popOutNode(id, durationMs){
        const el = this.getNodeElById(id);
        if (!el) return;

        el.style.transition = `transform ${durationMs}ms ease, opacity ${durationMs}ms ease`;
        el.classList.add("is-leave");
      },

      // Chạy thao tác LL + animation
      async run(op){
        if (this.animating) return;

        this.setBusy(true);
        this.setStatus("", "clear");
        try{
          // Input nhanh
          const idx = this.getIndex();
          const v = this.getValue();

          if (op === "insertHead" || op === "insertTail" || op === "insertAtIndex") {
            if (v == null) { this.setStatus("⚠️ Nhập Element trước nha.", "replace"); }
            if (op === "insertAtIndex" && idx == null) { this.setStatus("⚠️ Nhập Index (số nguyên).", "replace"); }
          }
          if (op === "deleteAtIndex" && idx == null) { this.setStatus("⚠️ Nhập Index (số nguyên).", "replace"); }

          // Lấy steps
          let steps = null;
          if (op === "insertHead") steps = this.list.insertHead(v);
          else if (op === "insertTail") steps = this.list.insertTail(v);
          else if (op === "insertAtIndex") steps = this.list.insertAtIndex(idx, v);
          else if (op === "deleteHead") steps = this.list.deleteHead();
          else if (op === "deleteTail") steps = this.list.deleteTail();
          else if (op === "deleteAtIndex") steps = this.list.deleteAtIndex(idx);
          else if (op === "clear") steps = this.list.clear();
          else { this.setStatus("⚠️ Unknown op: " + op); return; }

          if (!Array.isArray(steps) || steps.length === 0){
            this.setStatus("Done.");
            this.render();
            return;
          }

          // Step đầu
          let prevSnap = steps[0].state;
          this.setStatus(this.formatStepMessage(steps[0]), "append");
          this.renderFromSnapshot(prevSnap, steps[0].highlight || []);
          await this.sleep(this.STEP_DELAY);

          // Chạy từng step
          for (let i = 1; i < steps.length; i++){
            const s = steps[i];
            const nextSnap = s.state;

            await this.sleep(150);
            this.setStatus(this.formatStepMessage(s), "append");
            const hl = (s.highlight || []).map(x => String(x));

            if (s.action === "visit"){
              this.renderFromSnapshot(nextSnap, hl);
              await this.sleep(this.STEP_DELAY);
              prevSnap = nextSnap;
              continue;
            }

            if (op === "clear"){
              this.renderFromSnapshot(nextSnap, hl);
              await this.sleep(this.STEP_DELAY);
              prevSnap = nextSnap;
              continue;
            }

            if (s.action === "insert" || s.action === "remove"){
              await this.transitionSnapshot(prevSnap, nextSnap, hl);
              prevSnap = nextSnap;
              continue;
            }

            this.renderFromSnapshot(nextSnap, hl);
            await this.sleep(this.STEP_DELAY);
            prevSnap = nextSnap;
          }
        } catch(err){
          // Có lỗi thì báo ra, không treo UI
          this.setStatus("Error: " + (err?.message || String(err)), "replace");
        } finally{
          this.setBusy(false);
        }
      },



      // Vẽ mũi tên circular: tail -> mép trái -> head
      drawCircularArrow(snap) {
        if (!this.canvasEl) return;

        // Chỉ vẽ khi circular và có ít nhất 2 node
        if (snap.type !== "circular" || !snap.nodes || snap.nodes.length < 2) {
          this.removeCircularArrow();
          return;
        }

        const headId = String(snap.headid);
        const tailId = String(snap.tailid);

        const headEl = this.getNodeElById(headId);
        const tailEl = this.getNodeElById(tailId);

        if (!headEl || !tailEl) {
          this.removeCircularArrow();
          return;
        }

        // Đảm bảo canvas có position:relative để svg bám đúng
        this.canvasEl.classList.add("ll-canvas--rel");

        // Tạo hoặc lấy svg overlay
        let svg = this.canvasEl.querySelector(".ll-circular-svg");
        if (!svg) {
          svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.classList.add("ll-circular-svg");
          svg.setAttribute("aria-hidden", "true");

          // marker mũi tên
          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
          marker.setAttribute("id", "llArrowHead");
          marker.setAttribute("markerWidth", "10");
          marker.setAttribute("markerHeight", "10");
          marker.setAttribute("refX", "8");
          marker.setAttribute("refY", "5");
          marker.setAttribute("orient", "auto");

          const tip = document.createElementNS("http://www.w3.org/2000/svg", "path");
          tip.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
          tip.setAttribute("class", "ll-circular-svg__head");

          marker.appendChild(tip);
          defs.appendChild(marker);
          svg.appendChild(defs);

          // Đường đi chính
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.classList.add("ll-circular-svg__path");
          path.setAttribute("marker-end", "url(#llArrowHead)");
          svg.appendChild(path);

          this.canvasEl.appendChild(svg);
        }

        // Kích thước svg theo vùng scroll của canvas
        const cw = this.canvasEl.scrollWidth;
        const ch = this.canvasEl.scrollHeight;
        svg.setAttribute("width", String(cw));
        svg.setAttribute("height", String(ch));
        svg.setAttribute("viewBox", `0 0 ${cw} ${ch}`);

        // Tính tọa độ theo hệ canvas (có scroll)
        const canvasRect = this.canvasEl.getBoundingClientRect();
        const headRect = headEl.getBoundingClientRect();
        const tailRect = tailEl.getBoundingClientRect();

        const toCanvasXY = (r) => ({
          x: (r.left - canvasRect.left) + this.canvasEl.scrollLeft,
          y: (r.top - canvasRect.top) + this.canvasEl.scrollTop,
          w: r.width,
          h: r.height
        });

        const H = toCanvasXY(headRect);
        const T = toCanvasXY(tailRect);

        // Điểm start: đáy của tail
        const startX = T.x + T.w / 2;
        const startY = T.y + T.h;

        // Điểm end: cạnh trái của head
        const endX = H.x;
        const endY = H.y + H.h / 2;

        // Mép trái để chạy vòng ra ngoài tránh va chạm node
        const leftEdgeX = 8; // sát trái canvas
        const padY = 0;
        const bottomY = Math.max(startY, endY) + 40;

        // Path: tail (dưới) -> đi xuống -> chạy ngang sang mép trái -> đi lên -> chạm head
        const d = [
          `M ${startX} ${startY}`,
          `L ${startX} ${bottomY}`,
          `L ${leftEdgeX} ${bottomY}`,
          `L ${leftEdgeX} ${endY}`,
          `L ${endX} ${endY}`
        ].join(" ");

        const pathEl = svg.querySelector(".ll-circular-svg__path");
        if (pathEl) pathEl.setAttribute("d", d);
      },

      removeCircularArrow() {
        if (!this.canvasEl) return;
        const svg = this.canvasEl.querySelector(".ll-circular-svg");
        if (svg) svg.remove();
      },

      // Render theo snapshot (dùng cho step-by-step)
      renderFromSnapshot(snap, highlightIds = []) {
        if (!this.canvasEl) return;

        // Clear trước khi vẽ
        this.canvasEl.innerHTML = "";

        // Info: size/head/tail
        const info = document.createElement("div");
        info.className = "ll-info";
        info.textContent =
          `size=${snap.size}` +
          (snap.headid != null ? `, head=${snap.headid}` : "") +
          (snap.tailid != null ? `, tail=${snap.tailid}` : "");
        this.canvasEl.appendChild(info);

        // Row chứa các node
        const row = document.createElement("div");
        row.className = "ll-row";
        this.canvasEl.appendChild(row);

        // Rỗng
        if (!snap.nodes || !snap.nodes.length) {
          const empty = document.createElement("div");
          empty.className = "ll-empty";
          empty.textContent = "Empty list";
          row.appendChild(empty);
          this.removeCircularArrow();
          return;
        }

        // Vẽ từng node
        for (let i = 0; i < snap.nodes.length; i++) {
          const n = snap.nodes[i];

          const nodeEl = document.createElement("div");
          nodeEl.className = "ll-node";
          nodeEl.dataset.nodeid = String(n.id);

          // highlight node đang được duyệt
          if (highlightIds && highlightIds.includes(String(n.id))) {
            nodeEl.classList.add("is-hl", "is-pulse");
          }

          const idTag = document.createElement("div");
          idTag.className = "ll-id";
          idTag.textContent = "#" + n.id;
          nodeEl.appendChild(idTag);

          const cellsEl = document.createElement("div");
          cellsEl.className = "ll-cells";

          if (snap.type === "doubly") {
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

          if (i < snap.nodes.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "ll-arrow";
            arrow.textContent = "→";
            row.appendChild(arrow);
          }
        }

        // Chừa khoảng trống dưới circular để vẽ vòng ngoài
        if (snap.type === "circular" && snap.nodes && snap.nodes.length >= 2) {
          const spacer = document.createElement("div");
          spacer.className = "ll-circular-spacer";
          this.canvasEl.appendChild(spacer);
        }

        // Vẽ mũi tên circular (nếu có)
        this.drawCircularArrow(snap);
      },

      // Tìm id mới thêm / bị xóa giữa 2 snapshot
      diffIds(prevSnap, nextSnap){
        const a = new Set((prevSnap?.nodes || []).map(n => String(n.id)));
        const b = new Set((nextSnap?.nodes || []).map(n => String(n.id)));
        let insertedId = null;
        let removedId = null;
        b.forEach(id => { if (!a.has(id)) insertedId = id; });
        a.forEach(id => { if (!b.has(id)) removedId = id; });
        return { insertedId, removedId };
      },

      // Chạy chuyển trạng thái giữa prevSnap -> nextSnap (giữ animation 0.8s)
      async transitionSnapshot(prevSnap, nextSnap, highlightIds = []) {
        // remove: pop-out trước rồi mới render state mới + shift
        const { insertedId, removedId } = this.diffIds(prevSnap, nextSnap);

        // Nếu có node bị xóa, pop-out nó trong DOM hiện tại
        if (removedId) {
          this.popOutNode(removedId, 300);
          await this.sleep(this.STEP_DELAY);
        }

        // capture rect để FLIP
        const oldRects = this.captureNodeRects();

        // render DOM theo state mới
        this.renderFromSnapshot(nextSnap, highlightIds);

        // insert: nếu chèn giữa => shift trước rồi pop-in sau
        if (insertedId) {
          // xác định inserted nằm head/tail hay giữa
          const idx = (nextSnap.nodes || []).findIndex(n => String(n.id) === String(insertedId));
          const isHead = idx === 0;
          const isTail = idx === (nextSnap.nodes.length - 1);
          const isMiddle = !isHead && !isTail;

          const newEl = this.getNodeElById(String(insertedId));
          if (isMiddle && newEl) newEl.classList.add("is-enter");

          if (isMiddle) {
            this.playFLIP(oldRects, 500);
            await this.sleep(500);

            if (newEl) {
              this.popInNode(String(insertedId), 300);
              await this.sleep(300);
            }
            return;
          }

          // head/tail: shift + pop-in cùng lúc
          this.playFLIP(oldRects, 800);
          this.popInNode(String(insertedId), 800);
          await this.sleep(800);
          return;
        }

        // chỉ shift (thường là delete hoặc move nhẹ)
        this.playFLIP(oldRects, 500);
        await this.sleep(500);
      },

      // Hàm render: vẽ linked list ra canvas
      render() {
        const snap = this.list.snapshot();
        this.renderFromSnapshot(snap, []);
      },
    };

    // Click các nút thao tác LL trong đúng UI hiện tại
    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".ll-btn-op");
      if (!b) return;
      const op = b.dataset.op;
      controller.run(op);
    });

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

    // Trạng thái ban đầu
    controller.setStatus("Ready.");
    controller.render();

    llUIs.set(panelKey, controller);
  }

  // Tạo đúng loại linked list theo lựa chọn
  function createListByType(type) {
    // Kiểm tra import linked-list.js
    if (!window.llbrain) {
      throw new Error("llbrain not found. Did you include linked-list.js before app.js?");
    }

    // Tạo list theo lựa chọn
    if (type === "singly") return new window.llbrain.singlyll();
    if (type === "doubly") return new window.llbrain.doublyll();
    if (type === "circular") return new window.llbrain.circularll();

    // Type lạ báo lỗi
    throw new Error("Unknown ll type: " + type);
  }

  // Default: khi vừa load trang thì hiện workspace
  showWorkspace();  
});
