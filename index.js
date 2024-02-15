class Cell {
  static #Empty = 0;
  static #Snake = 1;
  static #Food = 2;

  static get Empty() {
    return Cell.#Empty;
  }

  static get Snake() {
    return Cell.#Snake;
  }

  static get Food() {
    return Cell.#Food;
  }

  static getId(row, col) {
    return `cell-${row}-${col}`;
  }

  /**
   * @param {HTMLElement} element
   * @param {0 | 1 | 2} type
   */
  static color(element, type) {
    element.className = "cell ";
    switch (type) {
      case Cell.Empty:
        element.className += "empty";
        break;
      case Cell.Snake:
        element.className += "snake";
        break;
      case Cell.Food:
        element.className += "food";
        break;
      default:
        throw new Error("Invalid Type (must be Empty, Snake or Food)");
    }
  }

  static createCell(row, col) {
    const cell = document.createElement("div");
    cell.id = Cell.getId(row, col);
    Cell.color(cell, Cell.Empty);
    return cell;
  }
}

class Position {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static get Up() {
    return new Position(-1, 0);
  }
  static get Down() {
    return new Position(1, 0);
  }
  static get Left() {
    return new Position(0, -1);
  }
  static get Right() {
    return new Position(0, 1);
  }

  static areEqual(position1, position2) {
    return position1.x === position2.x && position1.y === position2.y;
  }
}

class Board {
  #matrix;
  #size = 12;
  constructor() {
    this.boardEl = document.getElementById("board");
    this.#buildMatrix();
  }

  get matrixSize() {
    return this.#size;
  }

  #buildMatrix() {
    this.#matrix = new Array(this.#size)
      .fill()
      .map(() => new Array(this.#size).fill(Cell.Empty));
  }

  draw(snakePositions, foodPosition) {
    this.#drawEmptyCells();
    this.#drawSnake(snakePositions);
    this.#drawFood(foodPosition);
  }

  #drawEmptyCells() {
    for (let i = 0; i < this.#size; i++)
      for (let j = 0; j < this.#size; j++) {
        const cellElement = document.getElementById(Cell.getId(i, j));
        if (!cellElement) {
          const newCellElement = Cell.createCell(i, j);
          this.boardEl.appendChild(newCellElement);
          Cell.color(newCellElement, Cell.Empty);
        } else {
          Cell.color(cellElement, Cell.Empty);
          this.boardEl.appendChild(cellElement);
        }
        this.#matrix[i][j] = Cell.Empty;
      }
  }

  /**
   * @param {Position[]} snakePositions
   */
  #drawSnake(snakePositions) {
    snakePositions.forEach((position) => {
      const cellEl = document.getElementById(
        Cell.getId(position.x, position.y)
      );
      Cell.color(cellEl, Cell.Snake);
      this.#matrix[position.x][position.y] = Cell.Snake;
    });
  }

  /**
   * @param {Position} foodPosition
   */
  #drawFood(foodPosition) {
    const cellEl = document.getElementById(
      Cell.getId(foodPosition.x, foodPosition.y)
    );
    Cell.color(cellEl, Cell.Food);
    this.#matrix[foodPosition.x][foodPosition.y] = Cell.Snake;
  }
}

class Random {
  static randRange(start, end) {
    return Math.floor(Math.random() * (end - start + 1)) + start;
  }
}

class Snake {
  direction;
  #positions;

  get positions() {
    return this.#positions;
  }

  spawn(matrixSize) {
    // avoid instantly spawning right close to the boundaries
    const randomX = Random.randRange(2, matrixSize - 2);
    const randomY = Random.randRange(2, matrixSize - 2);
    this.#positions = [new Position(randomX, randomY)];
    this.direction = Position.Up;
  }

  move(foodPosition) {
    if (!this.head) return;
    this.positions.unshift(
      new Position(
        this.head.x + this.direction.x,
        this.head.y + this.direction.y
      )
    );
    if (!this.checkHasEatenFood(foodPosition)) this.positions.pop();
  }

  /**
   * @param {Position} foodPosition
   */
  checkHasEatenFood(foodPosition) {
    if (!this.head) return false;
    return Position.areEqual(this.head, foodPosition);
  }

  checkIfDead(matrixSize) {
    return this.#checkOutOfBound(matrixSize) || this.#hasCollidedWithTail;
  }

  get #hasCollidedWithTail() {
    if (!this.head) return false;
    return this.#positions.some(
      (position, index) => index !== 0 && Position.areEqual(this.head, position)
    );
  }

  #checkOutOfBound(matrixSize) {
    if (!this.head) return false;
    return (
      this.head.x < 0 ||
      this.head.y < 0 ||
      this.head.x >= matrixSize ||
      this.head.y >= matrixSize
    );
  }

  get head() {
    return this.#positions[0] || null;
  }
}

class Food {
  #position;

  get position() {
    return this.#position;
  }

  /**
   * @param {number} matrixSize
   * @param {Position[]} snakePositions
   */
  spawn(matrixSize, snakePositions) {
    while (!this.#position || this.#checkInSnakeCells(snakePositions)) {
      const randomX = Random.randRange(0, matrixSize - 1);
      const randomY = Random.randRange(0, matrixSize - 1);
      this.#position = new Position(randomX, randomY);
    }
  }

  /**
   * @param {Position[]} snakePositions
   */
  #checkInSnakeCells(snakePositions) {
    return snakePositions.some((position) =>
      Position.areEqual(position, this.#position)
    );
  }
}

class Game {
  #board;
  #snake;
  #food;
  #hasLost;
  #currentScore;
  #ui;

  constructor(board, snake, food, ui) {
    this.#board = board;
    this.#snake = snake;
    this.#food = food;
    this.#ui = ui;
  }

  get hasLost() {
    return this.#hasLost;
  }

  get snake() {
    return this.#snake;
  }

  #init() {
    this.#hasLost = false;
    this.#currentScore = 1;
    this.#snake.spawn(this.#board.matrixSize);
    this.#food.spawn(this.#board.matrixSize, this.#snake.positions);
    this.#board.draw(this.#snake.positions, this.#food.position);
    this.#ui.displayScoreEarned(this.#currentScore);
    this.#ui.hideLost();
  }

  start() {
    this.#init();
    this.#play();
  }

  #play() {
    const moveInterval = setInterval(() => {
      this.#snake.move(this.#food.position);
      if (this.#snake.checkHasEatenFood(this.#food.position)) {
        this.#currentScore++;
        this.#food.spawn(this.#board.matrixSize, this.#snake.positions);
        this.#ui.displayScoreEarned(this.#currentScore);
      }
      if (!this.#snake.checkIfDead(this.#board.matrixSize)) {
        this.#board.draw(this.#snake.positions, this.#food.position);
      } else {
        this.#hasLost = true;
        this.#ui.showLost();
        clearInterval(moveInterval);
      }
    }, 200);
  }
}

class UI {
  #scoreEl;
  #lostMessageEl;
  #retryButton;

  constructor() {
    this.#scoreEl = document.getElementById("score");
    this.#retryButton = document.getElementById("retry-btn");
    this.#lostMessageEl = document.getElementById("lost-message");
  }

  displayScoreEarned(currentScore) {
    this.#scoreEl.textContent = currentScore;
  }

  hideLost() {
    this.#lostMessageEl.classList.add("hidden");
    this.#retryButton.classList.add("hidden");
  }

  showLost() {
    this.#lostMessageEl.classList.remove("hidden");
    this.#retryButton.classList.remove("hidden");
  }

  /**
   * @param {Game} game
   */
  handleRetryClick(game) {
    this.#retryButton.addEventListener("click", () => {
      if (!game.hasLost) return;
      game.start();
    });
  }

  /**
   * @param {Game} game
   * @param {string} keyPressed
   */
  handleKeydown(game) {
    window.addEventListener("keydown", (event) => {
      if (game.hasLost) {
        if (event.key.toLowerCase() === "r") game.start();
      } else this.#handleChangeDirection(game.snake, event.key);
    });
  }

  /**
   * @param {Snake} snake
   * @param {string} keyPressed
   * @returns
   */
  #handleChangeDirection(snake, keyPressed) {
    let newDirection = snake.direction;
    switch (keyPressed) {
      case "ArrowUp":
        if (Position.areEqual(newDirection, Position.Down)) return;
        newDirection = Position.Up;
        break;
      case "ArrowDown":
        if (Position.areEqual(newDirection, Position.Up)) return;
        newDirection = Position.Down;
        break;
      case "ArrowLeft":
        if (Position.areEqual(newDirection, Position.Right)) return;
        newDirection = Position.Left;
        break;
      case "ArrowRight":
        if (Position.areEqual(newDirection, Position.Left)) return;
        newDirection = Position.Right;
        break;
      default:
        break;
    }
    snake.direction = newDirection;
  }
}

const snake = new Snake();
const board = new Board();
const food = new Food();
const ui = new UI();
const game = new Game(board, snake, food, ui);
ui.handleKeydown(game);
ui.handleRetryClick(game);
game.start();
