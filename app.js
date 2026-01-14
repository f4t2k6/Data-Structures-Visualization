// LOGIC CHO CÁC ELEMENTS VÀ UI TRONG CỬA SỔ

document.addEventListener("DOMContentLoaded", () => {
  // CẤU TRÚC DỮ LIỆU
  // Button
  const btns = document.querySelectorAll(".ds-btn");
  // Cửa sổ - panel
  const panels = document.querySelectorAll(".panel");

  // Lưu lại panel nào đang được mở
  let activePanelKey = "placeholder";

  // Bật tắt trạng thái Active cửa sổ
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

  // CÁC NÚT LỰA CHỌN KIỂU DỮ LIỆU
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.ds;
      setActiveButton(key);

      // Linked List có menu con chọn singly/doubly/circular
      if (key === "linked-list") {
        showPanel("linked-list-menu");
        return;
      }

      // Kiểu dữ liệu khác thì mở thẳng cửa sổ chính
      showPanel(key);
    });
  });

  // CỬA SỔ CHỌN LOẠI LINKED LIST
  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-ll]");
    if (!pick) return;

    const type = pick.dataset.ll;
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
  const llUIs = new Map();

  // UI CHO STACK
  let stackController = null;

  // Khởi tạo stack UI
  function initStackOnce() {
    if (stackController) return;

    // Kiểm tra import stack.js
    if (!window.dsbrain || !window.dsbrain.stack) {
      throw new Error("dsbrain.stack not found. Did you include stack.js before app.js?");
    }

    // Cửa sổ cho stack
    const panelEl = document.querySelector(`.panel[data-panel="stack"]`);
    if (!panelEl) return;

    // UI stack trong cửa sổ
    const uiRoot = panelEl.querySelector(".stack-ui");
    if (!uiRoot) return;

    // Lấy elements trong UI
    const valueInput = uiRoot.querySelector(".stack-value");
    const statusEl = uiRoot.querySelector(".stack-status");
    const canvasEl = uiRoot.querySelector(".stack-canvas");

    // Tạo đối tượng stack logic
    const st = new window.dsbrain.stack();

    stackController = {
      st,
      uiRoot,
      valueInput,
      statusEl,
      canvasEl,

      // Text thông báo trạng thái
      setStatus(msg) {
        if (this.statusEl) this.statusEl.textContent = msg || "Ready.";
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

      // Thao tác push / pop, sau thao tác phải render lại
      run(op) {
        let steps = null;

        try {
          if (op === "push") {
            const v = this.getValue(); // lấy value
            if (v == null) return this.setStatus("Please enter Element.");
            steps = this.st.push(v);   // push vào stack
          } else if (op === "pop") {
            steps = this.st.pop();     // pop khỏi stack
          } else {
            return this.setStatus("Unknown op: " + op); // op lạ
          }
        } catch (err) {
          // Bắt lỗi để UI không bị crash
          this.setStatus("Error: " + (err && err.message ? err.message : String(err)));
          return;
        }

        // Nếu có steps, lấy message cuối để báo status
        if (Array.isArray(steps) && steps.length) {
          const last = steps[steps.length - 1];
          this.setStatus(last.message || "Done.");
        } else {
          this.setStatus("Done.");
        }

        this.render();
      },

      // Vẽ stack ra canvas
      render() {
        if (!this.canvasEl) return;

        const snap = this.st.snapshot(); // chụp trạng thái stack hiện tại

        this.canvasEl.innerHTML = ""; // clear canvas

        // Thông tin
        const info = document.createElement("div");
        info.className = "stack-info";
        info.textContent = `count=${snap.count}` + (snap.topId != null ? `, top=${snap.topId}` : "");
        this.canvasEl.appendChild(info);

        // Cột hiển thị các phần tử stack
        const col = document.createElement("div");
        col.className = "stack-col";
        this.canvasEl.appendChild(col);

        // Không có node => stack rỗng
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

          // 1 item stack
          const item = document.createElement("div");
          item.className = "stack-item";

          // tag id
          const idTag = document.createElement("div");
          idTag.className = "stack-item__id";
          idTag.textContent = "#" + n.id;

          // tag value
          const valTag = document.createElement("div");
          valTag.className = "stack-item__val";
          valTag.textContent = String(n.value);

          // gắn vào item rồi đưa lên cột
          item.appendChild(idTag);
          item.appendChild(valTag);
          col.appendChild(item);
        }
      }
    };

    // Button UI cho cửa số Stack
    uiRoot.addEventListener("click", (e) => {
      const b = e.target.closest(".stack-btn-op");
      if (!b) return;
      const op = b.dataset.op;                     // push/pop
      stackController.run(op);                     // chạy op
    });

    // Nhấn Enter => push
    if (valueInput) {
      valueInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") stackController.run("push");
      });
    }

    // Clear về trạng thái ban đầu
    stackController.setStatus("Ready.");
    stackController.render();
  }


  // CHẠY CHƯƠNG TRÌNH SAU KHI CỬA SỔ ĐƯỢC MỞ
  function afterPanelShown(panelKey) {
    if (panelKey === "stack") {
      initStackOnce();
      if (stackController) stackController.render();
      return;
    }

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
      setStatus(msg) {
        if (statusEl) statusEl.textContent = msg || "Ready.";
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

        // helper: lấy số index trong chuỗi "visit index 3" hoặc "reach index 3"
        const getIndexNumber = () => {
          // 1) dạng "visit index 3" / "reach index 3"
          let t = m.match(/(?:visit|reach)\s+index\s+(-?\d+)/i);
          if (t) return t[1];

          // 2) dạng "insertAtIndex(3, 70)" hoặc "deleteAtIndex(3)"
          t = m.match(/(?:insertAtIndex|deleteAtIndex)\s*\(\s*(-?\d+)/i);
          if (t) return t[1];

          return null;
        };

        // helper: lấy value trong chuỗi "insertHead(10)" / "insertTail(10)" / "insertAtIndex(2, 10)"
        const getValueNumber = () => {
          const t = m.match(/\(([^)]+)\)/); // lấy phần trong ngoặc
          if (!t) return null;
          // thử tìm số cuối cùng trong ngoặc
          const nums = t[1].match(/-?\d+(\.\d+)?/g);
          return (nums && nums.length) ? nums[nums.length - 1] : null;
        };

        // START
        if (a === "start"){
          // cố gắng “đặt tiêu đề” theo operation
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


      // lấy vị trí (rect) của từng node hiện đang hiển thị
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

      // tìm node element theo id
      getNodeElById(id){
        if (!this.canvasEl) return null;
        return this.canvasEl.querySelector(`.ll-node[data-nodeid="${id}"]`);
      },

      // so sánh snapshot để biết id nào mới thêm / bị xóa
      diffSnapshots(beforeSnap, afterSnap){
        const a = new Set((beforeSnap?.nodes || []).map(n => String(n.id)));
        const b = new Set((afterSnap?.nodes || []).map(n => String(n.id)));

        let insertedId = null;
        let removedId = null;

        b.forEach(id => { if (!a.has(id)) insertedId = id; });
        a.forEach(id => { if (!b.has(id)) removedId = id; });

        return { insertedId, removedId };
      },

      // chạy FLIP cho các node tồn tại trước & sau (dịch linear)
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

          // “Invert”: đặt node về vị trí cũ bằng transform
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;

          // force reflow
          void el.offsetWidth;

          // “Play”: trả về transform=0 để node chạy về vị trí mới
          el.style.transition = `transform ${durationMs}ms ease`;
          el.style.transform = "translate(0px, 0px)";
        });
      },

      // pop-in cho node mới
      popInNode(id, durationMs){
        const el = this.getNodeElById(id);
        if (!el) return;

        el.classList.add("is-enter");
        el.style.transition = "none";
        void el.offsetWidth;

        // chạy vào
        el.style.transition = `transform ${durationMs}ms ease, opacity ${durationMs}ms ease`;
        el.classList.remove("is-enter");
      },

      // pop-out cho node bị xóa (trước khi xóa thật)
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
        try{
          // validate input nhanh
          const idx = this.getIndex();
          const v = this.getValue();

          if (op === "insertHead" || op === "insertTail" || op === "insertAtIndex") {
            if (v == null) { this.setStatus("⚠️ Nhập Element trước nha."); return; }
            if (op === "insertAtIndex" && idx == null) { this.setStatus("⚠️ Nhập Index (số nguyên)."); return; }
          }
          if (op === "deleteAtIndex" && idx == null) { this.setStatus("⚠️ Nhập Index (số nguyên)."); return; }

          // lấy steps
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

          // step đầu
          let prevSnap = steps[0].state;
          this.setStatus(this.formatStepMessage(steps[0]));
          this.renderFromSnapshot(prevSnap, steps[0].highlight || []);
          await this.sleep(this.STEP_DELAY);

          // chạy từng step
          for (let i = 1; i < steps.length; i++){
            const s = steps[i];
            const nextSnap = s.state;

            await this.sleep(150);
            this.setStatus(this.formatStepMessage(s));

            // chuẩn hóa highlight thành string để match chắc
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
          // ✅ có lỗi thì báo ra, không treo UI
          this.setStatus("❌ Error: " + (err?.message || String(err)));
        } finally{
          // ✅ dù lỗi gì cũng mở khóa
          this.setBusy(false);
        }
      },



      // Vẽ mũi tên circular: tail -> mép trái -> head (bằng SVG overlay)
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

        // Tạo / lấy svg overlay
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

          // path chính
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.classList.add("ll-circular-svg__path");
          path.setAttribute("marker-end", "url(#llArrowHead)");
          svg.appendChild(path);

          this.canvasEl.appendChild(svg);
        }

        // Kích thước svg theo vùng scroll của canvas (để tính tọa độ đúng)
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

        // Điểm start: đáy của tail (giữa theo chiều ngang)
        const startX = T.x + T.w / 2;
        const startY = T.y + T.h;

        // Điểm end: cạnh trái của head (giữa theo chiều dọc)
        const endX = H.x;
        const endY = H.y + H.h / 2;

        // “Mép trái” để chạy vòng ra ngoài tránh va chạm node
        const leftEdgeX = 8; // sát trái canvas một chút
        const padY = 0;      // bạn muốn nâng/hạ thêm thì chỉnh ở đây

        // Độ "lụi xuống" để chạy dưới đáy các node (bao ngoài)
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
