// PHẦN ĐÓNG MỞ CÁC CỬA SỔ DATA-STRUCTURES
document.addEventListener("DOMContentLoaded", () => {
  const btns = document.querySelectorAll(".ds-btn");
  const panels = document.querySelectorAll(".panel");
  const closeBtns = document.querySelectorAll(".panel-close");

  function setActiveButton(keyOrNull) {
    btns.forEach(b => b.classList.toggle("active", b.dataset.ds === keyOrNull));
  }

  function showPanel(key) {
    panels.forEach(p => p.classList.toggle("is-active", p.dataset.panel === key));
  }

  function showWorkspace() {
    setActiveButton(null);        // reset trạng thái nút
    showPanel("placeholder");     // về cửa sổ gốc
  }

  // Click button -> mở panel tương ứng
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.ds;
      setActiveButton(key);
      showPanel(key);
    });
  });

  // Click X -> đóng panel + reset button + về workspace
  closeBtns.forEach(x => {
    x.addEventListener("click", showWorkspace);
  });

  // Default: workspace
  showWorkspace();
});

