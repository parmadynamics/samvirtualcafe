class TicTacToe {
  constructor() {
    this.board = Array(9).fill(null);
    this.gameOver = false;
    this.playerSymbol = null;
    this.currentPlayer = 'X'; 
    this.isMyTurn = false;
    
    this.cells = document.querySelectorAll('.cell');
    this.statusElement = document.getElementById('gameStatus');
    this.playerSymbolElement = document.getElementById('playerSymbol');
    this.resetButton = document.getElementById('resetGameBtn');
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.cells.forEach(cell => {
      cell.addEventListener('click', () => this.handleCellClick(cell));
    });
    
    this.resetButton.addEventListener('click', () => this.resetGame());
  }
  
  handleCellClick(cell) {
    const index = parseInt(cell.dataset.index);
    
    if (!this.canMakeMove(index)) return;
    
    this.makeMove(index, this.playerSymbol);
    this.isMyTurn = false;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    
    if (window.peacefulConnect) {
      window.peacefulConnect.sendTicTacToeMove({
        index: index,
        symbol: this.playerSymbol
      });
    }
    
    const winner = this.checkWinner();
    if (winner) {
      this.endGame(winner);
      
      if (window.peacefulConnect) {
        window.peacefulConnect.sendTicTacToeGameEnd({
          winner: winner,
          winningCells: this.getWinningCells(winner)
        });
      }
    } else if (this.isBoardFull()) {
      this.endGame('draw');
      
      if (window.peacefulConnect) {
        window.peacefulConnect.sendTicTacToeGameEnd({
          winner: 'draw'
        });
      }
    }
    
    this.updateStatus();
  }
  
  canMakeMove(index) {
    return !this.gameOver && 
           this.board[index] === null && 
           this.isMyTurn &&
           this.currentPlayer === this.playerSymbol;
  }
  
  makeMove(index, symbol) {
    this.board[index] = symbol;
    this.cells[index].textContent = symbol;
    this.cells[index].classList.add(symbol.toLowerCase());
  }
  
  updateStatus() {
    if (this.gameOver) return;
    
    if (this.isMyTurn && this.currentPlayer === this.playerSymbol) {
      this.statusElement.textContent = 'Your Turn';
    } else {
      this.statusElement.textContent = 'Opponent\'s Turn';
    }
    
    this.playerSymbolElement.textContent = `You are: ${this.playerSymbol}`;
  }
  
  getWinningCells(symbol) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] === symbol && 
          this.board[a] === this.board[b] && 
          this.board[a] === this.board[c]) {
        return pattern;
      }
    }
    
    return null;
  }
  
  checkWinner() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] && 
          this.board[a] === this.board[b] && 
          this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    
    return null;
  }
  
  isBoardFull() {
    return this.board.every(cell => cell !== null);
  }
  
  endGame(result) {
    this.gameOver = true;
    this.isMyTurn = false;
    
    if (result === 'draw') {
      this.statusElement.textContent = 'It\'s a Draw!';
    } else {
      const isWinner = result === this.playerSymbol;
      this.statusElement.textContent = isWinner ? 'You Won!' : 'You Lost!';
      
      const winningCells = this.getWinningCells(result);
      if (winningCells) {
        winningCells.forEach(index => {
          this.cells[index].classList.add('winning-cell');
        });
      }
    }
  }
  
  resetGame() {
    this.board = Array(9).fill(null);
    this.gameOver = false;
    this.currentPlayer = 'X';
    
    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.classList.remove('x', 'o', 'winning-cell');
    });
    
    this.isMyTurn = this.playerSymbol === 'X';
    
    if (window.peacefulConnect) {
      window.peacefulConnect.sendTicTacToeReset(this.isMyTurn);
    }
    
    this.updateStatus();
  }
  
  initializeGame(symbol, isFirstMove = null) {
    this.playerSymbol = symbol;
    this.currentPlayer = 'X';
    this.gameOver = false;
    
    if (isFirstMove === null) {
      this.isMyTurn = this.playerSymbol === 'X';
    } else {
      this.isMyTurn = isFirstMove;
    }
    
    this.updateStatus();
  }
  
  receivedRemoteMove(moveData) {
    if (this.gameOver) return;
    
    const remoteSymbol = this.playerSymbol === 'X' ? 'O' : 'X';
    this.makeMove(moveData.index, remoteSymbol);
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    
    const winner = this.checkWinner();
    if (winner) {
      this.endGame(winner);
    } else if (this.isBoardFull()) {
      this.endGame('draw');
    } else {
      this.isMyTurn = true;
      this.updateStatus();
    }
  }
  
  receivedGameEnd(gameEndData) {
    this.gameOver = true;
    this.isMyTurn = false;
    
    if (gameEndData.winner === 'draw') {
      this.statusElement.textContent = 'It\'s a Draw!';
    } else {
      const isWinner = gameEndData.winner !== this.playerSymbol;
      this.statusElement.textContent = isWinner ? 'You Won!' : 'You Lost!';
      
      if (gameEndData.winningCells) {
        gameEndData.winningCells.forEach(index => {
          this.cells[index].classList.add('winning-cell');
        });
      }
    }
  }
  
  receivedGameReset(isMyTurn) {
    this.board = Array(9).fill(null);
    this.gameOver = false;
    this.currentPlayer = 'X';
    
    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.classList.remove('x', 'o', 'winning-cell');
    });
    
    this.isMyTurn = isMyTurn;
    this.updateStatus();
  }
}

let ticTacToeGame;