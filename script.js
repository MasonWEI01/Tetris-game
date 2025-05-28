const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartButton = document.getElementById('restartButton');
const pausePlayButton = document.getElementById('pausePlayButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const downButton = document.getElementById('downButton');
const rotateButton = document.getElementById('rotateButton');

const ROW_COUNT = 20;
const COL_COUNT = 10;
const BLOCK_SIZE = 20;

let board = [];
let score = 0;
let gameOver = false;
let isPaused = false;
let currentPiece;
let nextPiece;
let gameInterval;

const TETROMINOES = {
    'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    'J': [[1,0,0], [1,1,1], [0,0,0]],
    'L': [[0,0,1], [1,1,1], [0,0,0]],
    'O': [[1,1], [1,1]],
    'S': [[0,1,1], [1,1,0], [0,0,0]],
    'T': [[0,1,0], [1,1,1], [0,0,0]],
    'Z': [[1,1,0], [0,1,1], [0,0,0]]
};

const COLORS = {
    'I': 'cyan',
    'J': 'blue',
    'L': 'orange',
    'O': 'yellow',
    'S': 'green',
    'T': 'purple',
    'Z': 'red'
};

function init() {
    board = Array.from({ length: ROW_COUNT }, () => Array(COL_COUNT).fill(0));
    score = 0;
    gameOver = false;
    scoreDisplay.textContent = score;
    clearInterval(gameInterval);
    isPaused = false;
    pausePlayButton.textContent = '暂停';
    newGame();
}

function drawBoard() {
    for (let r = 0; r < ROW_COUNT; r++) {
        for (let c = 0; c < COL_COUNT; c++) {
            drawBlock(c, r, board[r][c]);
        }
    }
}

function drawBlock(x, y, color) {
    if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
}

class Piece {
    constructor(tetromino, color) {
        this.tetromino = tetromino;
        this.color = color;
        this.x = Math.floor(COL_COUNT / 2) - Math.floor(tetromino[0].length / 2);
        this.y = 0;
    }

    draw() {
        for (let r = 0; r < this.tetromino.length; r++) {
            for (let c = 0; c < this.tetromino[r].length; c++) {
                if (this.tetromino[r][c]) {
                    drawBlock(this.x + c, this.y + r, this.color);
                }
            }
        }
    }

    clear() {
        for (let r = 0; r < this.tetromino.length; r++) {
            for (let c = 0; c < this.tetromino[r].length; c++) {
                if (this.tetromino[r][c]) {
                    drawBlock(this.x + c, this.y + r, 0);
                }
            }
        }
    }

    move(dx, dy) {
        if (!this.collision(dx, dy, this.tetromino)) {
            this.clear();
            this.x += dx;
            this.y += dy;
            this.draw();
            return true;
        }
        return false;
    }

    rotate() {
        const newTetromino = this.getRotatedTetromino();
        if (!this.collision(0, 0, newTetromino)) {
            this.clear();
            this.tetromino = newTetromino;
            this.draw();
        }
    }

    getRotatedTetromino() {
        const numRows = this.tetromino.length;
        const numCols = this.tetromino[0].length;
        const newTetromino = Array.from({ length: numCols }, () => Array(numRows).fill(0));

        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                newTetromino[c][numRows - 1 - r] = this.tetromino[r][c];
            }
        }
        return newTetromino;
    }

    collision(dx, dy, newTetromino) {
        for (let r = 0; r < newTetromino.length; r++) {
            for (let c = 0; c < newTetromino[r].length; c++) {
                if (newTetromino[r][c]) {
                    let newX = this.x + c + dx;
                    let newY = this.y + r + dy;

                    if (newX < 0 || newX >= COL_COUNT || newY >= ROW_COUNT) {
                        return true; // 壁或底部碰撞
                    }
                    if (newY < 0) continue; // 忽略超出顶部的部分
                    if (board[newY][newX] !== 0) {
                        return true; // 碰到其他方块
                    }
                }
            }
        }
        return false;
    }

    lock() {
        for (let r = 0; r < this.tetromino.length; r++) {
            for (let c = 0; c < this.tetromino[r].length; c++) {
                if (this.tetromino[r][c]) {
                    if (this.y + r < 0) {
                        gameOver = true;
                        clearInterval(gameInterval);
                        alert('游戏结束! 你的分数是: ' + score);
                        return;
                    }
                    board[this.y + r][this.x + c] = this.color;
                }
            }
        }
        clearLines();
        generateNewPiece();
    }
}

function generateNewPiece() {
    const tetrominoNames = Object.keys(TETROMINOES);
    const randomTetrominoName = tetrominoNames[Math.floor(Math.random() * tetrominoNames.length)];
    const tetromino = TETROMINOES[randomTetrominoName];
    const color = COLORS[randomTetrominoName];
    currentPiece = new Piece(tetromino, color);

    if (currentPiece.collision(0, 0, currentPiece.tetromino)) {
        gameOver = true;
        clearInterval(gameInterval);
        alert('游戏结束! 你的分数是: ' + score);
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let r = ROW_COUNT - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            linesCleared++;
            for (let rowToMove = r; rowToMove > 0; rowToMove--) {
                board[rowToMove] = [...board[rowToMove - 1]];
            }
            board[0].fill(0);
            r++; // 重新检查当前行，因为上面的行已经下移
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100; // 简单计分
        scoreDisplay.textContent = score;
    }
}

function gameLoop() {
    if (gameOver || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    if (!currentPiece.move(0, 1)) {
        currentPiece.lock();
    }
}

function togglePausePlay() {
    if (gameOver) return;

    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
        pausePlayButton.textContent = '开始';
    } else {
        gameInterval = setInterval(gameLoop, 500);
        pausePlayButton.textContent = '暂停';
    }
}

function newGame() {
    generateNewPiece();
    gameInterval = setInterval(gameLoop, 500);
}

// Event Listeners
document.addEventListener('keydown', e => {
    if (gameOver || isPaused) return;
    switch (e.key) {
        case 'ArrowLeft':
            currentPiece.move(-1, 0);
            break;
        case 'ArrowRight':
            currentPiece.move(1, 0);
            break;
        case 'ArrowDown':
            currentPiece.move(0, 1);
            break;
        case 'ArrowUp':
            currentPiece.rotate();
            break;
        case ' ': // Spacebar for pause/play
            togglePausePlay();
            break;
    }
});

restartButton.addEventListener('click', init);
pausePlayButton.addEventListener('click', togglePausePlay);
leftButton.addEventListener('click', () => { if (!gameOver && !isPaused) currentPiece.move(-1, 0); });
rightButton.addEventListener('click', () => { if (!gameOver && !isPaused) currentPiece.move(1, 0); });
downButton.addEventListener('click', () => { if (!gameOver && !isPaused) currentPiece.move(0, 1); });
rotateButton.addEventListener('click', () => { if (!gameOver && !isPaused) currentPiece.rotate(); });

init();