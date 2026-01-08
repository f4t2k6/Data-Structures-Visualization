
class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        // Tọa độ để vẽ (sẽ được tính toán sau)
        this.x = 0;
        this.y = 0;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    // Thêm node (Insert)
    insert(value) {
        const newNode = new TreeNode(value);
        if (!this.root) {
            this.root = newNode;
            return;
        }
        let current = this.root;
        while (true) {
            if (value === current.value) return; // Không thêm trùng
            if (value < current.value) {
                if (!current.left) {
                    current.left = newNode;
                    return;
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = newNode;
                    return;
                }
                current = current.right;
            }
        }
    }

    search(value) {
        let current = this.root;
        while (current) {
            if (value === current.value) return current;
            if (value < current.value) current = current.left;
            else current = current.right;
        }
        return null;
    }

    delete(value) {
        this.root = this._deleteNode(this.root, value);
    }

    _deleteNode(node, value) {
        if (!node) return null;
        if (value < node.value) {
            node.left = this._deleteNode(node.left, value);
            return node;
        } else if (value > node.value) {
            node.right = this._deleteNode(node.right, value);
            return node;
        } else {
            // Trường hợp 1: Không có con hoặc 1 con
            if (!node.left) return node.right;
            if (!node.right) return node.left;
            let minNode = this._findMin(node.right);
            node.value = minNode.value;
            node.right = this._deleteNode(node.right, minNode.value);
            return node;
        }
    }

    _findMin(node) {
        while (node.left) node = node.left;
        return node;
    }
}
const myTree = new BinarySearchTree();
const canvas = document.getElementById('visualization-canvas');
const NODE_RADIUS = 30; 
const LEVEL_HEIGHT = 80; 
function renderTree() {
    if (!canvas.classList.contains('view-tree')) return; 
    canvas.innerHTML = ''; 
    const svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgLayer.id = "tree-svg-layer";
    canvas.appendChild(svgLayer);
    if (!myTree.root) return;
    const width = canvas.clientWidth;
    calculatePosition(myTree.root, width / 2, 40, width / 4);
    drawLines(svgLayer, myTree.root);
    drawNodes(myTree.root);
}

function calculatePosition(node, x, y, offset) {
    if (!node) return;
    node.x = x;
    node.y = y;
    calculatePosition(node.left, x - offset, y + LEVEL_HEIGHT, offset / 2);
    calculatePosition(node.right, x + offset, y + LEVEL_HEIGHT, offset / 2);
}

function drawNodes(node) {
    if (!node) return;
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.innerText = node.value;
    nodeDiv.style.left = (node.x - NODE_RADIUS) + 'px';
    nodeDiv.style.top = (node.y - NODE_RADIUS) + 'px';
    nodeDiv.id = `node-${node.value}`;
    canvas.appendChild(nodeDiv);
    drawNodes(node.left);
    drawNodes(node.right);
}

function drawLines(svgContainer, node) {
    if (!node) return;

    if (node.left) {
        createLine(svgContainer, node.x, node.y, node.left.x, node.left.y);
        drawLines(svgContainer, node.left);
    }
    if (node.right) {
        createLine(svgContainer, node.x, node.y, node.right.x, node.right.y);
        drawLines(svgContainer, node.right);
    }
}

function createLine(svgContainer, x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "tree-line");
    svgContainer.appendChild(line);
}

document.querySelector('#controls-tree .btn-primary').onclick = function() {
    const input = document.getElementById('value-input');
    const val = parseInt(input.value);
    
    if (isNaN(val)) {
        alert("Vui lòng nhập số!");
        return;
    }

    myTree.insert(val);
    renderTree(); // Vẽ lại
    
    // Log
    const logBox = document.getElementById('log-box');
    logBox.innerHTML = `<p class="log-entry">[Tree] Đã thêm node ${val}</p>` + logBox.innerHTML;
    input.value = '';
    input.focus();
};

document.querySelector('#controls-tree .btn-outline').onclick = function() {
    const val = parseInt(document.getElementById('value-input').value);
    const foundNode = myTree.search(val);
    document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('node-highlight'));

    if (foundNode) {
        const uiNode = document.getElementById(`node-${val}`);
        if(uiNode) uiNode.classList.add('node-highlight');
        alert(`Tìm thấy giá trị ${val}!`);
    } else {
        alert(`Không tìm thấy ${val}`);
    }
};

document.querySelector('#controls-tree .btn-danger').onclick = function() {
    const val = parseInt(document.getElementById('value-input').value);
    if (isNaN(val)) return;
    
    myTree.delete(val);
    renderTree();
    
    const logBox = document.getElementById('log-box');
    logBox.innerHTML = `<p class="log-entry">[Tree] Đã xóa node ${val}</p>` + logBox.innerHTML;
};