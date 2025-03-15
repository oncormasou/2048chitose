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

document.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
});

document.addEventListener("touchend", (e) => {
  if (e.changedTouches.length > 0) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    // スワイプの閾値(距離)を適度に決める (例: 30px)
    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      // 横方向の移動が大きい
      if (dx > threshold) {
        slide("right"); // 右スワイプ
      } else if (dx < -threshold) {
        slide("left"); // 左スワイプ
      }
    } else {
      // 縦方向の移動が大きい
      if (dy > threshold) {
        slide("down"); // 下スワイプ
      } else if (dy < -threshold) {
        slide("up"); // 上スワイプ
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

  // タイルのDOM生成
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    const imgEl = document.createElement("img");
    const span = document.createElement("span");
    tile.appendChild(imgEl);
    tile.appendChild(span);
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
    grid[row][col] = Math.random() < 0.8 ? 2 : 4; // 4の出現確率20%
  }
}

/***** タイルのUI更新 *****/
function updateGridUI() {
  const tiles = document.querySelectorAll(".tile");
  tiles.forEach((tile, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const value = grid[row][col];

    const imgEl = tile.querySelector("img");
    const span = tile.querySelector("span");

    // タイル配置 (100px + 5px隙間 = 105px単位)
    tile.style.transform = `translate(${col * 105}px, ${row * 105}px)`;

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
}

function updateTilePreview(tileValue) {
  const customImage = tileImages[tileValue];
  // 数値をテキストとして表示
  tilePreview.textContent = tileValue;

  if (customImage) {
    // カスタム画像を使う
    tilePreview.style.backgroundImage = `url(${customImage})`;
    tilePreview.style.backgroundSize = "cover";
    tilePreview.style.backgroundColor = "transparent";
  } else {
    // デフォルト色で塗りつぶす
    tilePreview.style.backgroundImage = "";
    tilePreview.style.backgroundColor = defaultTileColors[tileValue] || "#CCC";
  }
}


function getTileColor(value) {
  return defaultTileColors[value] || "#CCC";
}

/***** スコア更新 *****/
function updateScore(newPoints) {
  score += newPoints;
  scoreElement.textContent = score;

  if (score > highScore) {
    highScore = score;
    highScoreElement.textContent = highScore;
    saveHighScore();
  }
}

/***** スライド (上下左右) *****/
function slide(direction) {
  let moved = false;

  if (direction === "left" || direction === "right") {
    for (let r = 0; r < gridSize; r++) {
      const currentRow = grid[r].slice();
      const newRow =
        direction === "left"
          ? slideRowLeft(currentRow)
          : slideRowLeft(currentRow.reverse()).reverse();
      if (!arraysEqual(currentRow, newRow)) moved = true;
      grid[r] = newRow;
    }
  } else if (direction === "up" || direction === "down") {
    for (let c = 0; c < gridSize; c++) {
      const currentCol = grid.map((row) => row[c]);
      const newCol =
        direction === "up"
          ? slideRowLeft(currentCol)
          : slideRowLeft(currentCol.reverse()).reverse();
      newCol.forEach((val, r) => {
        if (grid[r][c] !== val) moved = true;
        grid[r][c] = val;
      });
    }
  }

  if (moved) {
    addRandomTile();
    updateGridUI();
  }

  // 移動の有無に関わらずゲームオーバー判定
  if (checkGameOver()) {
    gameOverElement.classList.remove("hidden");
  }
}

function slideRowLeft(row) {
  const nonZeroTiles = row.filter((v) => v !== 0);
  const newRow = [];
  let skip = false;

  for (let i = 0; i < nonZeroTiles.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (nonZeroTiles[i] === nonZeroTiles[i + 1]) {
      const mergedValue = nonZeroTiles[i] * 2;
      newRow.push(mergedValue);
      updateScore(mergedValue);
      skip = true;
    } else {
      newRow.push(nonZeroTiles[i]);
    }
  }
  while (newRow.length < gridSize) {
    newRow.push(0);
  }
  return newRow;
}

/***** ゲームオーバー判定 *****/
function checkGameOver() {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) return false;
      // 隣接タイル同士で合体可能ならまだ
      if (c < gridSize - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < gridSize - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

/***** イベント設定 *****/

/** Customizeボタン: モーダルを開く */
customizeButton.addEventListener("click", () => {
  // セレクターをデフォルト(2)に戻すなど必要に応じて
  tileSelector.value = "2";
  updateTilePreview(tileSelector.value);

  // Cropperの初期化・リセット
  resetCropper();

  customizeModal.classList.remove("hidden");
});

/** Tileセレクターが切り替わったらプレビュー更新 */
tileSelector.addEventListener("change", () => {
  updateTilePreview(tileSelector.value);
  resetCropper();
});

/** Closeボタン: モーダルを閉じる */
closeModalButton.addEventListener("click", () => {
  customizeModal.classList.add("hidden");
});

/** 画像アップロード: Cropperを初期化 */
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

/** Applyボタン: トリミング結果を保存 */
applyButton.addEventListener("click", () => {
  if (cropper) {
    // 100x100にトリミングした画像を取得
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

    // プレビュー更新
    updateTilePreview(tileValue);
  }
});




/** Reset This Tileボタン: 選択中のタイル画像を削除 */
resetSelectedTileButton.addEventListener("click", () => {
  const tileValue = tileSelector.value;
  if (tileImages[tileValue]) {
    delete tileImages[tileValue];
    saveTileImages();
    updateGridUI();
    updateTilePreview(tileValue);
  }
});

/** Reset All Tilesボタン: すべてのタイル画像を削除 */
resetAllTileButton.addEventListener("click", () => {
  // tileImagesを空オブジェクトにして保存
  tileImages = {};
  saveTileImages();

  // UI更新
  updateGridUI();
  // 今の選択タイルプレビューもクリア
  updateTilePreview(tileSelector.value);
});

/** Resetボタン: ゲームそのものを再初期化 (スコアや盤面リセット) */
resetButton.addEventListener("click", initializeGrid);

/** キー入力: 2048操作 (上下左右) */
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
    // カスタム画像が無い場合は空にする(またはデフォルト画像でもOK)
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
