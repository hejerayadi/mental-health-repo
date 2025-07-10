document.getElementById("chat-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (text === "") return;

  addMessage(text, "user");
  input.value = "";

  // Show typing indicator
  showTypingIndicator();

  // Send message to backend and get AI response
  try {
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Hide typing indicator
    hideTypingIndicator();
    
    if (result.response) {
      addMessage(result.response, "ai");
    } else {
      addMessage("I'm sorry, I couldn't process your request. Please try again.", "ai");
    }
  } catch (error) {
    console.error('Error sending message to backend:', error);
    hideTypingIndicator();
    addMessage("I'm sorry, there was an error connecting to the server. Please try again.", "ai");
  }
});

function getBotAvatar() {
  return `<span class="profile-avatar bot">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="10" fill="#fff" fill-opacity="0.15"/>
      <rect x="6.5" y="8.5" width="9" height="6" rx="3" fill="#fff" fill-opacity="0.7"/>
      <rect x="8.5" y="5.5" width="5" height="5" rx="2.5" fill="#fff"/>
      <rect x="9.5" y="14.5" width="3" height="1.5" rx="0.75" fill="#fff"/>
    </svg>
  </span>`;
}
function getUserAvatar() {
  return `<span class="profile-avatar user">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="8.5" r="4.5" fill="#fff" fill-opacity="0.7"/>
      <ellipse cx="11" cy="16.5" rx="6.5" ry="3.5" fill="#fff" fill-opacity="0.3"/>
    </svg>
  </span>`;
}
function getTypingIndicator() {
  return `<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
}

function addMessage(text, sender, isTyping = false) {
  const messages = document.getElementById("messages");

  const msg = document.createElement("div");
  msg.className = `message ${sender}`;

  let avatar = sender === "ai" ? getBotAvatar() : getUserAvatar();
  let content = isTyping
    ? getTypingIndicator()
    : `<p>${text}</p><span class="timestamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;

  msg.innerHTML =
    avatar +
    `<div class="message-content">${content}</div>`;

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// Conversation box logic
let conversationCount = 0;
const newChatBtn = document.querySelector('.new-chat');
const recentDiv = document.querySelector('.recent');
let currentConversationBox = null;
let currentConversationData = null;

function truncateTitle(text, maxLength = 28) {
  return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
}

function createConversationBox(title) {
  const box = document.createElement('div');
  box.className = 'conversation-box';

  // Conversation data
  const convoData = {
    messageCount: 0,
    lastTime: new Date(),
    box: box
  };
  currentConversationData = convoData;

  const left = document.createElement('div');
  left.className = 'conversation-box-left';

  const span = document.createElement('span');
  span.className = 'conversation-title';
  span.textContent = truncateTitle(title);
  left.appendChild(span);

  const meta = document.createElement('div');
  meta.className = 'conversation-meta';
  meta.innerHTML = `<span class="meta-time">${formatTime(convoData.lastTime)}</span> · <span class="meta-count">1 msg</span>`;
  left.appendChild(meta);

  const delBtn = document.createElement('button');
  delBtn.className = 'delete-convo';
  delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M7.5 8.75V14.25" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/><path d="M12.5 8.75V14.25" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/><path d="M3.75 5.75H16.25" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/><path d="M15.4167 5.75V15.0833C15.4167 16.0208 14.6875 16.75 13.75 16.75H6.25C5.3125 16.75 4.58333 16.0208 4.58333 15.0833V5.75M8.33333 5.75V4.91667C8.33333 3.97917 9.0625 3.25 10 3.25C10.9375 3.25 11.6667 3.97917 11.6667 4.91667V5.75" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  delBtn.title = 'Delete conversation';
  delBtn.onclick = function(e) {
    e.stopPropagation();
    box.remove();
    checkNoConvo();
    if (currentConversationBox === box) currentConversationBox = null;
    if (currentConversationData && currentConversationData.box === box) currentConversationData = null;
  };

  box.appendChild(left);
  box.appendChild(delBtn);

  // Insert before .no-convo or at end
  const noConvo = recentDiv.querySelector('.no-convo');
  if (noConvo) noConvo.style.display = 'none';
  recentDiv.appendChild(box);
  currentConversationBox = box;
}

function formatTime(date) {
  return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function checkNoConvo() {
  const boxes = recentDiv.querySelectorAll('.conversation-box');
  const noConvo = recentDiv.querySelector('.no-convo');
  if (boxes.length === 0 && noConvo) noConvo.style.display = '';
}

newChatBtn.addEventListener('click', function() {
  conversationCount++;
  // Use the initial bot message as the title
  const lastBotMsg = document.querySelector('.message.ai:last-child p');
  const title = lastBotMsg ? lastBotMsg.textContent : 'Sports Chat';
  createConversationBox(title);
});

function updateConversationTitle(newTitle) {
  if (currentConversationBox) {
    const span = currentConversationBox.querySelector('.conversation-title');
    if (span) span.textContent = truncateTitle(newTitle);
  }
}

function updateConversationMeta() {
  if (currentConversationData && currentConversationBox) {
    currentConversationData.messageCount++;
    currentConversationData.lastTime = new Date();
    const meta = currentConversationBox.querySelector('.conversation-meta');
    if (meta) {
      meta.innerHTML = `<span class="meta-time">${formatTime(currentConversationData.lastTime)}</span> · <span class="meta-count">${currentConversationData.messageCount} msg${currentConversationData.messageCount > 1 ? 's' : ''}</span>`;
    }
  }
}

const origAddMessage = addMessage;
addMessage = function(text, sender) {
  origAddMessage(text, sender);
  if (sender === 'ai') {
    updateConversationTitle(text);
  }
  updateConversationMeta();
};

// Typing indicator functionality
function showTypingIndicator() {
  const messages = document.getElementById("messages");
  const typingMsg = document.createElement("div");
  typingMsg.className = "message ai typing-message";
  typingMsg.id = "typing-indicator";
  
  let avatar = getBotAvatar();
  let content = getTypingIndicator();
  
  typingMsg.innerHTML = avatar + `<div class="message-content">${content}</div>`;
  messages.appendChild(typingMsg);
  messages.scrollTop = messages.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Sidebar toggle logic
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('.main-header .sidebar-toggle');
const chatMain = document.querySelector('.chat');

sidebarToggle.addEventListener('click', function() {
  const isHidden = sidebar.classList.toggle('hidden');
  const container = document.querySelector('.container');
  if (isHidden) {
    container.classList.add('sidebar-hidden');
  } else {
    container.classList.remove('sidebar-hidden');
  }
});

// Voice popup logic
const voiceBtn = document.getElementById('voice-btn');
const voicePopup = document.getElementById('voice-popup');
const voicePopupClose = document.getElementById('voice-popup-close');
const startRecordingBtn = document.getElementById('start-recording');
const stopRecordingBtn = document.getElementById('stop-recording');

function setMicIcon(recording) {
  const micIdle = document.querySelector('#start-recording .mic-idle');
  const micRecording = document.querySelector('#start-recording .mic-recording');
  const micStop = document.querySelector('#start-recording .mic-stop');
  const micSquare = document.querySelector('#start-recording .mic-square');
  if (recording) {
    if (micIdle) micIdle.style.display = 'none';
    if (micSquare) micSquare.style.display = 'none';
    if (micRecording) micRecording.style.display = 'inline';
    if (micStop) micStop.style.display = 'inline';
  } else {
    if (micIdle) micIdle.style.display = 'inline';
    if (micSquare) micSquare.style.display = 'inline';
    if (micRecording) micRecording.style.display = 'none';
    if (micStop) micStop.style.display = 'none';
  }
}

voiceBtn.addEventListener('click', function(e) {
  e.preventDefault();
  voicePopup.style.display = 'flex';
  startRecordingBtn.classList.remove('recording');
  startRecordingBtn.textContent = 'Start Recording';
  setMicIcon(false);
});
voicePopupClose.addEventListener('click', function() {
  voicePopup.style.display = 'none';
  startRecordingBtn.classList.remove('recording');
  startRecordingBtn.textContent = 'Start Recording';
  setMicIcon(false);
});

// Audio recording functionality
let mediaRecorder = null;
let audioChunks = [];

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      await sendAudioToBackend(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    console.log('Recording started...');
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Error accessing microphone. Please allow microphone access.');
  }
}

async function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('Recording stopped...');
  }
}

async function sendAudioToBackend(audioBlob) {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    const response = await fetch('http://localhost:5000/transcribe', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Transcription:', result.text);
    console.log('Language:', result.language);
    console.log('Emotion:', result.emotion);
    
    // Add the transcribed message to the chat
    if (result.text) {
      addMessage(result.text, 'user');
      
      // Show typing indicator
      showTypingIndicator();
      
      // Send the transcribed text to the chat endpoint for AI response
      try {
        const chatResponse = await fetch('http://localhost:5000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: result.text })
        });

        if (!chatResponse.ok) {
          throw new Error(`HTTP error! status: ${chatResponse.status}`);
        }

        const chatResult = await chatResponse.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (chatResult.response) {
          addMessage(chatResult.response, 'ai');
        } else {
          addMessage("I'm sorry, I couldn't process your request. Please try again.", 'ai');
        }
      } catch (chatError) {
        console.error('Error getting AI response:', chatError);
        hideTypingIndicator();
        addMessage("I'm sorry, there was an error getting the AI response. Please try again.", 'ai');
      }
    }
    
  } catch (error) {
    console.error('Error sending audio to backend:', error);
    alert('Error processing audio. Please try again.');
  }
}

startRecordingBtn.addEventListener('click', function() {
  if (startRecordingBtn.classList.contains('recording')) {
    // If currently recording, stop and close
    stopRecording();
    voicePopup.style.display = 'none';
    startRecordingBtn.classList.remove('recording');
    startRecordingBtn.textContent = 'Start Recording';
    setMicIcon(false);
  } else {
    // If not recording, start recording
    startRecording();
    startRecordingBtn.classList.add('recording');
    startRecordingBtn.textContent = 'Stop Recording';
    setMicIcon(true);
  }
});

// Transparent header/input on scroll
const messagesEl = document.getElementById('messages');
const mainHeader = document.querySelector('.main-header');
const inputArea = document.querySelector('.input-area');

function updateOverlayBars() {
  if (!messagesEl) return;
  const atTop = messagesEl.scrollTop === 0;
  const atBottom = messagesEl.scrollHeight - messagesEl.scrollTop === messagesEl.clientHeight;
  if (!atTop && !atBottom) {
    mainHeader.classList.add('scrolled');
    inputArea.classList.add('scrolled');
  } else {
    mainHeader.classList.remove('scrolled');
    inputArea.classList.remove('scrolled');
  }
}
if (messagesEl) {
  messagesEl.addEventListener('scroll', updateOverlayBars);
}
