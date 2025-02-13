class SingTogether {
  constructor() {
    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.lyrics = [
        { time: 0, text: "Ooo tere liye jhoomu deewana ban ke tere liye" },
  		{ time: 4, text: "Vaada hai mera main hoon tere liye" },
  		{ time: 8, text: "Hona kabhi tu judaa .." },
  		{ time: 12, text: "Tere liye jhoomu deewana ban ke tere liye" },
  		{ time: 16, text: "Vaada hai mera main hoon tere liye" },
  		{ time: 20, text: "Hona kabhi tu judaa .." },
  		{ time: 24, text: "Hoo bheegi bheegi raat mein le kar ke tujhko saath mein" },
  		{ time: 28, text: "Madhosh hue jaaye hum, aa faasle kar ne de kum" },
  		{ time: 32, text: "Zara paas tu aa mere, dheere se choo ja mujhe" },
  		{ time: 36, text: "Kho jaaun tere pyaar mein, baahon mein bhar le mujhe" },
  		{ time: 40, text: "Ooo tere liye jhoomu deewana ban ke tere liye" },
  		{ time: 44, text: "Vaada hai mera main hoon tere liye" },
  		{ time: 48, text: "Hona kabhi tu judaa .." },
  		{ time: 52, text: "Tere liye jhoomu deewana ban ke tere liye" },
  		{ time: 56, text: "Vaada hai mera main hoon tere liye" },
  		{ time: 60, text: "Hona kabhi tu judaa .." }
    ];
    
    this.currentLyricIndex = 0;
    this.isPlaying = false;
    this.startTime = null;
    
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.container = document.querySelector('.sing-together-section');
    this.startBtn = document.getElementById('startSingingBtn');
    this.lyricsDisplay = document.getElementById('lyricsDisplay');
    this.syncStatus = document.getElementById('syncStatus');

    // Check if elements exist
    if (!this.container || !this.startBtn || !this.lyricsDisplay || !this.syncStatus) {
      console.error('Required elements for Sing Together not found');
      return;
    }
  }

  setupEventListeners() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.toggleSong());
    }
  }

  toggleSong() {
    if (!this.isPlaying) {
      this.startSong();
    } else {
      this.stopSong();
    }
  }

  startSong() {
    this.isPlaying = true;
    this.startTime = Date.now();
    this.currentLyricIndex = 0;
    if (this.startBtn) this.startBtn.textContent = 'Stop Singing';
    if (this.syncStatus) this.syncStatus.textContent = 'Singing in sync...';
    
    // Send start signal to peer
    if (window.peacefulConnect && window.peacefulConnect.dataConnection) {
      window.peacefulConnect.dataConnection.send({
        type: 'sing-together-start',
        startTime: this.startTime
      });
    }
    
    this.updateLyrics();
  }

  stopSong() {
    this.isPlaying = false;
    if (this.startBtn) this.startBtn.textContent = 'Start Singing';
    if (this.syncStatus) this.syncStatus.textContent = 'Ready to sing';
    if (this.lyricsDisplay) this.lyricsDisplay.textContent = 'Click Start to begin singing together!';
    
    // Send stop signal to peer
    if (window.peacefulConnect && window.peacefulConnect.dataConnection) {
      window.peacefulConnect.dataConnection.send({
        type: 'sing-together-stop'
      });
    }
  }

  updateLyrics() {
    if (!this.isPlaying || !this.lyricsDisplay) return;

    const currentTime = (Date.now() - this.startTime) / 1000;
    
    while (this.currentLyricIndex < this.lyrics.length && 
           currentTime >= this.lyrics[this.currentLyricIndex].time) {
      this.displayLyric(this.lyrics[this.currentLyricIndex].text);
      this.currentLyricIndex++;
    }

    if (this.currentLyricIndex >= this.lyrics.length) {
      this.stopSong();
      return;
    }

    requestAnimationFrame(() => this.updateLyrics());
  }

  displayLyric(text) {
    if (!this.lyricsDisplay) return;
    
    this.lyricsDisplay.style.opacity = '0';
    
    setTimeout(() => {
      this.lyricsDisplay.textContent = text;
      this.lyricsDisplay.style.opacity = '1';
    }, 150);
  }

  receiveSyncSignal(data) {
    if (data.type === 'sing-together-start') {
      this.startTime = data.startTime;
      this.isPlaying = true;
      this.currentLyricIndex = 0;
      if (this.startBtn) this.startBtn.textContent = 'Stop Singing';
      if (this.syncStatus) this.syncStatus.textContent = 'Singing in sync...';
      this.updateLyrics();
    } else if (data.type === 'sing-together-stop') {
      this.stopSong();
    }
  }
}

// Initialize Sing Together feature
let singTogether = null;

// Initialize only after DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    singTogether = new SingTogether();
  });
} else {
  singTogether = new SingTogether();
}
