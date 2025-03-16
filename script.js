/***** 定数や変数の宣言 *****/
const gridSize = 4;
let grid = [];
let score = 0;
let highScore = 0;

/** タイルごとのカスタム画像を格納するオブジェクト */
let tileImages = {};

/** タイルのデフォルト色 */
let defaultTileColors = {
  2: "#EEE4DA",
  4: "#EDE0C8",
  8: "#F2B179",
  16: "#F59563",
  32: "#F67C5F",
  64: "#F65E3B",
  128: "#EDCF72",
  256: "#EDCC61",
  512: "#EDC850",
  1024: "#EDC53F",
  2048: "#EDC22E",
  4096: "#3C3A32",
};

let touchStartX = 0;
let touchStartY = 0;

/** 合体したタイルの位置を記録する配列 */
let mergedPositions = [];

/***** HTML要素の取得 *****/
const gridElement = document.getElementById("grid");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const resetButton = document.getElementById("reset-button");
const gameOverElement = document.getElementById("game-over");

/** カスタマイズ関連 */
const customizeButton = document.getElementById("customize-button");
const customizeModal = document.getElementById("customize-modal");
const tileSelector = document.getElementById("tile-selector");
const uploadImage = document.getElementById("upload-image");
const cropContainer = document.getElementById("crop-container");
const applyButton = document.getElementById("apply-button");

/** 新規追加/改名したボタン */
const resetSelectedTileButton = document.getElementById("reset-selected-tile-button");
const resetAllTileButton = document.getElementById("reset-all-tile-button");

const closeModalButton = document.getElementById("close-modal");
const tilePreview = document.getElementById("tile-preview");

let cropper; // Cropperインスタンスを格納

/***** タッチイベント *****/
gridElement.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: false });

gridElement.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });

gridElement.addEventListener("touchend", (e) => {
  if (e.changedTouches.length > 0) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) {
        slide("right");
      } else if (dx < -threshold) {
        slide("left");
      }
    } else {
      if (dy > threshold) {
        slide("down");
      } else if (dy < -threshold) {
        slide("up");
      }
    }
  }
});

/***** ゲーム初期化 *****/
function initializeGame() {
  loadHighScore();
  loadTileImages();
  initializeGrid();
  highScoreElement.textContent = highScore;
}

function initializeGrid() {
  grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  score = 0;
  scoreElement.textContent = score;
  gridElement.innerHTML = "";
  gameOverElement.classList.add("hidden");

  // タイルのDOM生成（.tile-contentでラップ）
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    const content = document.createElement("div");
    content.classList.add("tile-content");

    const imgEl = document.createElement("img");
    const span = document.createElement("span");

    content.appendChild(imgEl);
    content.appendChild(span);
    tile.appendChild(content);

    gridElement.appendChild(tile);
  }

  addRandomTile();
  addRandomTile();
  updateGridUI();
}

/***** スコアの保存・読込 *****/
function loadHighScore() {
  const savedHighScore = localStorage.getItem("highScore");
  if (savedHighScore) {
    highScore = parseInt(savedHighScore, 10);
  }
}
function saveHighScore() {
  localStorage.setItem("highScore", highScore);
}

/***** タイル画像の保存・読込 *****/
function loadTileImages() {
  const savedImages = localStorage.getItem("tileImages");
  if (savedImages) {
    tileImages = JSON.parse(savedImages);
  }
}
function saveTileImages() {
  localStorage.setItem("tileImages", JSON.stringify(tileImages));
}

/***** ランダムタイル追加 *****/
function addRandomTile() {
  const emptyCells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
  if (emptyCells.length > 0) {
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[row][col] = Math.random() < 0.82 ? 2 : 4;
  }
}

/***** タイルのUI更新 *****/
function updateGridUI() {
  const tiles = document.querySelectorAll(".tile");
  const gridWidth = gridElement.offsetWidth;
  const gap = 5;
  const totalGap = gap * (gridSize - 1);
  const tileWidth = (gridWidth - totalGap) / gridSize;
  
  // ① まず各タイルのサイズ・内容・初期位置を更新（transition は無効）
  tiles.forEach((tile, index) => {
    
    tile.style.width = tileWidth + "px";
    tile.style.height = tileWidth + "px";
    
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x = col * (tileWidth + gap);
    const y = row * (tileWidth + gap);
    const transformValue = `translate(${x}px, ${y}px)`;
    tile.style.transform = `translate(${x}px, ${y}px)`;
    tile.style.transform = transformValue;
     console.log(`Tile ${index} -> ${transformValue}`);
    // タイルの内容更新
    const value = grid[row][col];
    const imgEl = tile.querySelector("img");
    const span = tile.querySelector("span");
    
    if (value > 0) {
      span.textContent = value;
      if (tileImages[value]) {
        imgEl.style.display = "block";
        imgEl.src = tileImages[value];
        tile.style.backgroundColor = "transparent";
      } else {
        imgEl.style.display = "none";
        tile.style.backgroundColor = getTileColor(value);
      }
    } else {
      span.textContent = "";
      imgEl.style.display = "none";
      tile.style.backgroundColor = "lightgray";
    }
  });
  
  // ② 次のフレームで transition を有効にして再度 transform をセット
  requestAnimationFrame(() => {
    tiles.forEach((tile, index) => {
      
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = col * (tileWidth + gap);
      const y = row * (tileWidth + gap);
      tile.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
}





/***** 合体アニメーションの実行 *****/
function animateMergedTiles() {
  mergedPositions.forEach(({ row, col }) => {
    const index = row * gridSize + col;
    const tile = gridElement.children[index];
    const content = tile.querySelector(".tile-content");
    if (content) {
      content.classList.add("pop");
      setTimeout(() => {
        content.classList.remove("pop");
      }, 300);
    }
  });
  mergedPositions = [];
}

/***** 補助関数 *****/
function getTileColor(value) {
  return defaultTileColors[value] || "#CCC";
}

function updateScore(newPoints) {
  score += newPoints;
  scoreElement.textContent = score;
  if (score > highScore) {
    highScore = score;
    highScoreElement.textContent = highScore;
    saveHighScore();
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

/***** 合体を記録可能なスライド処理（左方向） *****/
function slideRowLeftWithMerges(row) {
  const nonZeroTiles = row.filter((v) => v !== 0);
  const newRow = [];
  const merges = [];
  let skip = false;
  let currentIndex = 0;
  for (let i = 0; i < nonZeroTiles.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (nonZeroTiles[i] === nonZeroTiles[i + 1]) {
      const mergedValue = nonZeroTiles[i] * 2;
      newRow.push(mergedValue);
      merges.push(currentIndex);
      updateScore(mergedValue);
      skip = true;
      currentIndex++;
    } else {
      newRow.push(nonZeroTiles[i]);
      currentIndex++;
    }
  }
  while (newRow.length < gridSize) {
    newRow.push(0);
  }
  return { newRow, merges };
}

/***** スライド (上下左右) *****/
function slide(direction) {
  let moved = false;
  console.log("beforegrid:", JSON.stringify(grid));
  if (direction === "left" || direction === "right") {
    for (let r = 0; r < gridSize; r++) {
      const currentRow = grid[r].slice();
      let { newRow, merges } = slideRowLeftWithMerges(currentRow);
      if (direction === "right") {
        newRow = newRow.reverse();
        merges = merges.map((idx) => gridSize - 1 - idx);
      }
      // 記録: この行のどの列で合体が発生したか
      merges.forEach((col) => {
        mergedPositions.push({ row: r, col: col });
      });
      if (!arraysEqual(currentRow, newRow)) moved = true;
      grid[r] = newRow;
    }
  } else if (direction === "up" || direction === "down") {
    for (let c = 0; c < gridSize; c++) {
      const currentCol = grid.map((row) => row[c]);
      let { newRow: newCol, merges } = slideRowLeftWithMerges(currentCol);
      if (direction === "down") {
        newCol = newCol.reverse();
        merges = merges.map((idx) => gridSize - 1 - idx);
      }
      merges.forEach((rowIndex) => {
        mergedPositions.push({ row: rowIndex, col: c });
      });
      newCol.forEach((val, r) => {
        if (grid[r][c] !== val) moved = true;
        grid[r][c] = val;
      });
    }
  }

  if (moved) {
    addRandomTile();
    updateGridUI();
     console.log("aftergrid:", JSON.stringify(grid));
    animateMergedTiles();
  }

  if (checkGameOver()) {
    gameOverElement.classList.remove("hidden");
  }
}

/***** ゲームオーバー判定 *****/
function checkGameOver() {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) return false;
      if (c < gridSize - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < gridSize - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

/***** イベント設定 *****/
customizeButton.addEventListener("click", () => {
  tileSelector.value = "2";
  updateTilePreview(tileSelector.value);
  resetCropper();
  customizeModal.classList.remove("hidden");
});

tileSelector.addEventListener("change", () => {
  updateTilePreview(tileSelector.value);
  resetCropper();
});

closeModalButton.addEventListener("click", () => {
  customizeModal.classList.add("hidden");
});

uploadImage.addEventListener("change", (event) => {
  if (!event.target.files || !event.target.files.length) return;
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    cropContainer.innerHTML = "";
    const img = document.createElement("img");
    img.src = reader.result;
    cropContainer.appendChild(img);
    if (cropper) {
      cropper.destroy();
    }
    cropper = new Cropper(img, {
      aspectRatio: 1,
      viewMode: 1,
    });
  };
  reader.readAsDataURL(file);
});

applyButton.addEventListener("click", () => {
  if (cropper) {
    const dpr = window.devicePixelRatio || 1;
    const canvas = cropper.getCroppedCanvas({
      width: 100 * dpr,
      height: 100 * dpr
    });
    const croppedImage = canvas.toDataURL("image/png");
    const tileValue = tileSelector.value;
    tileImages[tileValue] = croppedImage;
    saveTileImages();
    updateGridUI();
    updateTilePreview(tileValue);
  }
});

resetSelectedTileButton.addEventListener("click", () => {
  const tileValue = tileSelector.value;
  if (tileImages[tileValue]) {
    delete tileImages[tileValue];
    saveTileImages();
    updateGridUI();
    updateTilePreview(tileValue);
  }
});

resetAllTileButton.addEventListener("click", () => {
  tileImages = {};
  saveTileImages();
  updateGridUI();
  updateTilePreview(tileSelector.value);
});

resetButton.addEventListener("click", initializeGrid);

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
      slide("up");
      break;
    case "ArrowDown":
      slide("down");
      break;
    case "ArrowLeft":
      slide("left");
      break;
    case "ArrowRight":
      slide("right");
      break;
  }
});

/***** 補助関数 *****/
function updateTilePreview(tileValue) {
  if (tileImages[tileValue]) {
    tilePreview.src = tileImages[tileValue];
  } else {
    tilePreview.src = "";
  }
}

function resetCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  cropContainer.innerHTML = "";
}

/***** 実行 *****/
initializeGame();
