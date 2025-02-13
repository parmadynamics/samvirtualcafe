class PeacefulConnect {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isAudioOnly = false;
    this.cafeInitialized = false;
    this.dataConnection = null;
    this.currentWeather = 'none';
    this.weatherVideo = null;

    this.initializeElements();
    this.initializePeer();
    this.setupEventListeners();
    this.setupVideoFullscreen();
    this.setupWeatherControls();
  }

  initializeElements() {
    // Screens
    this.welcomeScreen = document.getElementById('welcomeScreen');
    this.callScreen = document.getElementById('callScreen');
    
    // Video elements
    this.localVideo = document.getElementById('localVideo');
    this.remoteVideo = document.getElementById('remoteVideo');
    
    // Buttons
    this.connectBtn = document.getElementById('connectBtn');
    this.toggleVideoBtn = document.getElementById('toggleVideo');
    this.toggleAudioBtn = document.getElementById('toggleAudio');
    this.endCallBtn = document.getElementById('endCall');
    
    // Input
    this.peerIdInput = document.getElementById('peerIdInput');
  }

  initializePeer() {
    this.peer = new Peer(this.generateRandomId(), {
      debug: 2
    });

    this.peer.on('open', (id) => {
      document.querySelector('.id-display .code').textContent = id;
    });

    this.peer.on('call', (call) => {
      this.handleIncomingCall(call);
    });

    this.peer.on('connection', (conn) => {
      this.dataConnection = conn;
      this.setupDataConnection(conn);
    });
  }

  generateRandomId() {
    return Math.floor(Math.random() * 900 + 100).toString();
  }

  async setupMediaStream(audioOnly = false) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: !audioOnly,
        audio: true
      });
      this.isAudioOnly = audioOnly;
      
      if (!audioOnly) {
        this.localVideo.srcObject = this.localStream;
      }
      
      this.createAudioWaves('localAudioWave');
      
      // Start Tic Tac Toe game
      const randomSymbol = Math.random() < 0.5 ? 'X' : 'O';
      ticTacToeGame = new TicTacToe();
      ticTacToeGame.initializeGame(randomSymbol);
      this.sendTicTacToeInit(randomSymbol);
      
      return true;
    } catch (error) {
      if (!audioOnly && error.name === 'NotFoundError') {
        return await this.setupMediaStream(true);
      }
      console.error('Error accessing media devices:', error);
      return false;
    }
  }

  async makeCall(remotePeerId) {
    const success = await this.setupMediaStream();
    if (!success) return;

    // Create data connection for sharing cafe orders
    this.dataConnection = this.peer.connect(remotePeerId);
    this.setupDataConnection(this.dataConnection);

    const call = this.peer.call(remotePeerId, this.localStream);
    this.handleCallConnection(call);
  }

  async handleIncomingCall(call) {
    const success = await this.setupMediaStream();
    if (!success) return;

    call.answer(this.localStream);
    this.handleCallConnection(call);
  }

  handleCallConnection(call) {
    call.on('stream', (remoteStream) => {
      this.remoteStream = remoteStream;
      this.remoteVideo.srcObject = remoteStream;
      this.createAudioWaves('remoteAudioWave');
      this.showCallScreen();
    });
  }

  createAudioWaves(elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
      const span = document.createElement('span');
      span.style.animation = `wave ${Math.random() * 0.5 + 0.5}s ease-in-out infinite`;
      span.style.animationDelay = `${Math.random() * 0.5}s`;
      container.appendChild(span);
    }
  }

  setupDataConnection(connection) {
    connection.on('open', () => {
      console.log('Data connection established');
      
      // When syncing table items, send all items
      if (cafeManager && cafeManager.tableItems.length > 0) {
        connection.send({
          type: 'syncTable',
          items: cafeManager.tableItems
        });
      }
    });

    connection.on('data', (data) => {
      if (!cafeManager) return;
      
      if (data.type === 'order') {
        cafeManager.receiveOrder(data.order);
      } else if (data.type === 'syncTable') {
        cafeManager.syncTableItems(data.items);
      } else if (data.type === 'eat') {
        cafeManager.receiveEatAction(data.itemId);
      } else if (data.type === 'addToTable') {
        cafeManager.receiveTableItem(data.tableItem);
      } else if (data.type === 'food-delivery' || data.type === 'special-ring-delivery') {
        cafeManager.receiveFoodDelivery(data);
      } else if (data.type === 'tictactoe-move') {
        ticTacToeGame.receivedRemoteMove(data.move);
      } else if (data.type === 'tictactoe-init') {
        ticTacToeGame = new TicTacToe();
        ticTacToeGame.initializeGame(data.symbol === 'X' ? 'O' : 'X', data.isFirstMove);
      } else if (data.type === 'tictactoe-game-end') {
        ticTacToeGame.receivedGameEnd(data.gameEndData);
      } else if (data.type === 'tictactoe-reset') {
        ticTacToeGame.receivedGameReset(data.isMyTurn);
      } else if (data.type === 'truth-or-dare') {
        if (truthOrDareGame) {
          truthOrDareGame.receivePrompt(data);
        }
      } else if (data.type === 'sing-together-start' || data.type === 'sing-together-stop') {
        if (singTogether) {
          singTogether.receiveSyncSignal(data);
        }
      } else if (data.type === 'weather-change') {
        this.changeWeather(data.weather);
        document.getElementById('weatherSelect').value = data.weather;
      }
    });
  }

  sendOrder(order) {
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'order',
        order: order
      });
    }
  }

  sendEatAction(itemId) {
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'eat',
        itemId: itemId
      });
    }
  }

  sendTableItem(tableItem) {
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'addToTable',
        tableItem: tableItem
      });
    }
  }

  sendTicTacToeInit(symbol) {
    const isFirstMove = Math.random() < 0.5;
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'tictactoe-init',
        symbol: symbol,
        isFirstMove: !isFirstMove
      });
    }
  }

  sendTicTacToeMove(moveData) {
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'tictactoe-move',
        move: moveData
      });
    }
  }

  sendTicTacToeGameEnd(gameEndData) {
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'tictactoe-game-end',
        gameEndData: gameEndData
      });
    }
  }

  sendTicTacToeReset(isMyTurn) {
    if (this.dataConnection && this.dataConnection.open) {
      this.dataConnection.send({
        type: 'tictactoe-reset',
        isMyTurn: isMyTurn
      });
    }
  }

  showCallScreen() {
    this.welcomeScreen.classList.add('hidden');
    this.callScreen.classList.remove('hidden');
    
    // Initialize cafe features
    if (!this.cafeInitialized) {
      cafeManager.init();
      this.cafeInitialized = true;
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
    }
    
    this.callScreen.classList.add('hidden');
    this.welcomeScreen.classList.remove('hidden');
    
    window.location.reload();
  }

  setupEventListeners() {
    this.connectBtn.addEventListener('click', () => {
      const remotePeerId = this.peerIdInput.value.trim();
      if (remotePeerId.length === 3) {
        this.makeCall(remotePeerId);
      }
    });

    this.toggleVideoBtn.addEventListener('click', () => {
      if (!this.isAudioOnly) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        this.toggleVideoBtn.classList.toggle('off');
        
        // Update icon for video toggle
        const videoIcon = this.toggleVideoBtn.querySelector('svg');
        if (videoTrack.enabled) {
          videoIcon.innerHTML = '<path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 14H3V8h18v12z"/>';
        } else {
          videoIcon.innerHTML = '<path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 14H3V8h18v12z"/><line x1="3" y1="3" x2="21" y2="21" stroke="white" stroke-width="2"/>';
        }
      }
    });

    this.toggleAudioBtn.addEventListener('click', () => {
      const audioTrack = this.localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      this.toggleAudioBtn.classList.toggle('off');
      
      // Update icon for audio toggle
      const audioIcon = this.toggleAudioBtn.querySelector('svg');
      if (audioTrack.enabled) {
        audioIcon.innerHTML = '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>';
      } else {
        audioIcon.innerHTML = '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/><line x1="3" y1="3" x2="21" y2="21" stroke="white" stroke-width="2"/>';
      }
    });

    this.endCallBtn.addEventListener('click', () => {
      this.endCall();
    });

    // Update the games toggle button functionality
    const gamesToggleBtn = document.getElementById('gamesToggleBtn');
    const gamesSection = document.getElementById('gamesSection');

    gamesToggleBtn.addEventListener('click', () => {
      gamesToggleBtn.classList.toggle('active');
      gamesSection.classList.toggle('show');
    });
  }

  setupVideoFullscreen() {
    const localWrapper = document.querySelector('.video-wrapper.local');
    const remoteWrapper = document.querySelector('.video-wrapper.remote');
    
    localWrapper.addEventListener('click', () => this.toggleFullscreen(localWrapper));
    remoteWrapper.addEventListener('click', () => this.toggleFullscreen(remoteWrapper));
    
    // Handle ESC key to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.exitAllFullscreens();
      }
    });
  }

  toggleFullscreen(wrapper) {
    if (wrapper.classList.contains('fullscreen')) {
      this.exitFullscreen(wrapper);
    } else {
      this.enterFullscreen(wrapper);
    }
  }

  enterFullscreen(wrapper) {
    this.exitAllFullscreens(); // Exit any existing fullscreen first
    wrapper.classList.add('fullscreen');
    
    // Try native fullscreen API first
    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen();
    } else if (wrapper.webkitRequestFullscreen) {
      wrapper.webkitRequestFullscreen();
    } else if (wrapper.msRequestFullscreen) {
      wrapper.msRequestFullscreen();
    }
    
    // Ensure video fills the space
    const video = wrapper.querySelector('video');
    if (video) {
      video.style.width = '100%';
      video.style.height = '100%';
    }
  }

  exitFullscreen(wrapper) {
    wrapper.classList.remove('fullscreen');
    
    // Exit native fullscreen if active
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    // Reset video size
    const video = wrapper.querySelector('video');
    if (video) {
      video.style.width = '';
      video.style.height = '';
    }
  }

  exitAllFullscreens() {
    const fullscreenWrappers = document.querySelectorAll('.video-wrapper.fullscreen');
    fullscreenWrappers.forEach(wrapper => this.exitFullscreen(wrapper));
  }

  setupWeatherControls() {
    const weatherSelect = document.getElementById('weatherSelect');
    if (!weatherSelect) return;

    weatherSelect.addEventListener('change', (e) => {
      this.changeWeather(e.target.value);
      
      // Sync weather with peer
      if (this.dataConnection && this.dataConnection.open) {
        this.dataConnection.send({
          type: 'weather-change',
          weather: e.target.value
        });
      }
    });
  }

  changeWeather(weather) {
    if (this.weatherVideo) {
      this.weatherVideo.pause();
      this.weatherVideo.remove();
    }

    if (weather === 'none') {
      document.body.style.background = '';
      return;
    }

    this.currentWeather = weather;
    this.weatherVideo = document.createElement('video');
    this.weatherVideo.className = 'weather-video';
    this.weatherVideo.src = `videos/${weather}.mp4`;
    this.weatherVideo.loop = true;
    this.weatherVideo.muted = document.getElementById('weatherMute').checked;
    this.weatherVideo.volume = 0.2;
    this.weatherVideo.style.opacity = '0';

    document.body.insertBefore(this.weatherVideo, document.body.firstChild);

    this.weatherVideo.play().then(() => {
      this.weatherVideo.style.opacity = '1';
    }).catch(err => console.log('Weather video playback error:', err));
  }

}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.peacefulConnect = new PeacefulConnect();
});
