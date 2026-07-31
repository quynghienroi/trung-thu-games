const urlParams = new URLSearchParams(window.location.search);
const challenge = urlParams.get('challenge');

window.MODIFIER_CHALLENGE = challenge;

// 1. INVERTED
if (challenge === 'inverted') {
  document.body.style.transition = 'transform 2s ease';
  setTimeout(() => {
    document.body.style.transform = 'rotate(180deg)';
  }, 1000);
}

// 2. FLASHBANG
if (challenge === 'flashbang') {
  const fb = document.createElement('div');
  fb.style.position = 'fixed';
  fb.style.inset = '0';
  fb.style.backgroundColor = 'white';
  fb.style.opacity = '0';
  fb.style.pointerEvents = 'none';
  fb.style.transition = 'opacity 0.2s ease-out';
  fb.style.zIndex = '99999';
  document.body.appendChild(fb);

  function triggerFlashbang() {
    // Chớp trắng toàn màn hình
    fb.style.transition = 'opacity 0.05s ease-in';
    fb.style.opacity = '1';
    setTimeout(() => {
      fb.style.transition = 'opacity 1s ease-out';
      fb.style.opacity = '0';
    }, 100);
    
    // Ngẫu nhiên giật bồi thêm 1 phát nữa
    if (Math.random() > 0.6) {
        setTimeout(() => {
            fb.style.transition = 'opacity 0.05s ease-in';
            fb.style.opacity = '0.9';
            setTimeout(() => {
                fb.style.transition = 'opacity 0.5s ease-out';
                fb.style.opacity = '0';
            }, 100);
        }, 300);
    }
    
    // Lên lịch chớp tiếp theo ngẫu nhiên từ 0.5s đến 3.5s
    setTimeout(triggerFlashbang, 500 + Math.random() * 3000);
  }
  
  // Bắt đầu chớp sau 2s
  setTimeout(triggerFlashbang, 2000);
}

// 3. CAMERA (Quà Người)
if (challenge === 'camera') {
  window.playerSnapshot = null; // Will store the base64 image
  
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Take snapshot after 5-15 seconds (when they are playing)
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // 1. Vẽ ảnh gốc
        ctx.drawImage(video, 0, 0);
        
        // 2. Phủ lớp làm mờ và sáng để che mụn (Soft focus effect)
        // Chế độ 'lighten' giữ lại các chi tiết tối rõ nét (mắt, tóc) nhưng làm mờ và sáng vùng da
        ctx.globalCompositeOperation = 'lighten';
        ctx.globalAlpha = 0.5;
        ctx.filter = 'blur(6px) brightness(1.1)';
        ctx.drawImage(video, 0, 0);
        
        // 3. Phủ lớp làm trắng hồng da (Skin whitening)
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.15;
        ctx.filter = 'none';
        ctx.fillStyle = '#ffebf0'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset trạng thái
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        window.playerSnapshot = canvas.toDataURL('image/png');
        
        // Stop camera
        stream.getTracks().forEach(track => track.stop());
        console.log("Gotcha! Snapshot taken with beauty filter.");
      }, 5000 + Math.random() * 10000);
    })
    .catch(err => {
      console.warn("Camera access denied or unavailable", err);
    });
}

// 4. QUIZ
if (challenge === 'quiz') {
  const quizData = [
    { q: "Tết Trung Thu tiếng Anh là gì?", options: ["Mid-Autumn Festival", "Full Moon Festival", "Children Festival"], a: 0 },
    { q: "Đố mẹo: Bánh gì ăn không được?", options: ["Bánh nướng", "Bánh xe", "Bánh dẻo"], a: 1 },
    { q: "Từ lái: 'Bánh trung thu' lái lại thành gì?", options: ["Thu trung bánh", "Búng trăng thu", "Tránh bung thu"], a: 1 },
    { q: "Múa lân tiếng Anh là gì?", options: ["Tiger Dance", "Dragon Dance", "Lion Dance"], a: 2 },
    { q: "Lồng đèn tiếng Anh là gì?", options: ["Light box", "Lantern", "Lamp"], a: 1 }
  ];
  
  let currentQ = 0;
  
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.backgroundColor = 'rgba(10, 10, 42, 0.95)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.color = 'white';
  overlay.style.fontFamily = 'Nunito, sans-serif';
  overlay.style.padding = '20px';
  overlay.style.backdropFilter = 'blur(10px)';
  
  const container = document.createElement('div');
  container.style.background = 'rgba(255, 255, 255, 0.1)';
  container.style.padding = '30px';
  container.style.borderRadius = '15px';
  container.style.textAlign = 'center';
  container.style.maxWidth = '500px';
  
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
  function renderQuiz() {
    if (currentQ >= quizData.length) {
      overlay.innerHTML = `<h2 style="color: #4ade80; font-size: 2em;">Thử thách thành công!</h2><p>Đang vào game...</p>`;
      setTimeout(() => overlay.remove(), 1500);
      return;
    }
    
    const q = quizData[currentQ];
    let html = `<h2 style="color: #FFD700; margin-bottom: 20px;">Câu ${currentQ + 1}/${quizData.length}</h2>`;
    html += `<p style="font-size: 1.5em; margin-bottom: 30px;">${q.q}</p>`;
    html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
    
    q.options.forEach((opt, idx) => {
      html += `<button class="quiz-opt" data-idx="${idx}" style="padding: 15px; font-size: 1.2em; border-radius: 8px; border: none; background: #3B82F6; color: white; cursor: pointer; transition: background 0.2s;">${opt}</button>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.onclick = (e) => {
        const selected = parseInt(e.target.getAttribute('data-idx'));
        if (selected === q.a) {
          e.target.style.background = '#10B981'; // Green
          setTimeout(() => {
            currentQ++;
            renderQuiz();
          }, 500);
        } else {
          e.target.style.background = '#EF4444'; // Red
          e.target.style.animation = 'shake 0.5s';
          setTimeout(() => {
            e.target.style.background = '#3B82F6';
          }, 800);
        }
      };
    });
  }
  
  // Add shake animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;
  document.head.appendChild(style);
  
  renderQuiz();
}
