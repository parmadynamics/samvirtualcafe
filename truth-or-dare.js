class TruthOrDare {
  constructor() {
    this.truths = [
      "What's the most embarrassing thing you've ever done?",
      "Tell us about your first crush.",
      "What's a secret you've never told anyone?",
      "What's the biggest lie you've ever told?",
      "What's your most irrational fear?",
      "Have you ever cheated in a game or exam?",
      "What's the most awkward date you've been on?",
      "What's something you would never admit in person?"
    ];

    this.dares = [
      "Do your best impression of a famous celebrity.",
      "Send a silly selfie to the last person in your contacts.",
      "Dance without music for 30 seconds.",
      "Try to lick your elbow.",
      "Sing a song out loud.",
      "Call a random contact and say a movie quote.",
      "Do 10 pushups right now.",
      "Make up a short poem on the spot."
    ];

    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.truthBtn = document.getElementById('truthBtn');
    this.dareBtn = document.getElementById('dareBtn');
    this.gamePrompt = document.getElementById('gamePrompt');
    this.gameStatus = document.getElementById('truthDareStatus');
  }

  setupEventListeners() {
    this.truthBtn.addEventListener('click', () => this.selectTruth());
    this.dareBtn.addEventListener('click', () => this.selectDare());
  }

  selectTruth() {
    const truth = this.getRandomItem(this.truths);
    this.sendPrompt('truth', truth);
  }

  selectDare() {
    const dare = this.getRandomItem(this.dares);
    this.sendPrompt('dare', dare);
  }

  getRandomItem(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  sendPrompt(type, prompt) {
    this.gamePrompt.textContent = prompt;
    this.gameStatus.textContent = `Selected: ${type.charAt(0).toUpperCase() + type.slice(1)}`;

    if (window.peacefulConnect && window.peacefulConnect.dataConnection) {
      window.peacefulConnect.dataConnection.send({
        type: 'truth-or-dare',
        gameType: type,
        prompt: prompt
      });
    }
  }

  receivePrompt(data) {
    this.gamePrompt.textContent = data.prompt;
    this.gameStatus.textContent = `Opponent selected: ${data.gameType.charAt(0).toUpperCase() + data.gameType.slice(1)}`;
  }
}

// Initialize Truth or Dare game
let truthOrDareGame;

document.addEventListener('DOMContentLoaded', () => {
  truthOrDareGame = new TruthOrDare();
});