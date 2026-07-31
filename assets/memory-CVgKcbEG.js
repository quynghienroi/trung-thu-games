import"./components-DDEPC5fd.js";import"./modifier-ISi4y68K.js";const y=["mooncake","lantern","bunny","moon","bamboo","dragon","mouse","star"],D={mooncake:"🥮",lantern:"🏮",bunny:"🐰",moon:"🌕",bamboo:"🎋",dragon:"🐉",mouse:"🐭",star:"⭐"},T=90,C="04-memory";function H(){return JSON.parse(localStorage.getItem("leaderboard_"+C)||"[]")}function K(e,t){let o=H();o.push({name:e||"Ẩn danh",score:t,date:new Date().toLocaleDateString()}),o.sort((n,i)=>i.score-n.score),localStorage.setItem("leaderboard_"+C,JSON.stringify(o))}function _(){const e=H();let t='<div style="max-height: 200px; overflow-y: auto; margin: 15px 0; text-align: left; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px;">';return e.length===0?t+='<p style="text-align:center; color: #fff;">Chưa có dữ liệu</p>':e.forEach((o,n)=>{t+=`<div style="display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: #fff;">
                <span><b>#${n+1}</b> ${o.name}</span>
                <span style="color:#fef08a; font-weight:bold;">${o.score}</span>
            </div>`}),t+="</div>",t}let r=[],c=[],x=0,m=0,g=0,u=0,l=T,w,b=!1;localStorage.getItem("memory_best_score");const h=document.getElementById("game-canvas"),a=h.getContext("2d"),E=document.getElementById("ui-overlay");function F(){h.width=window.innerWidth,h.height=window.innerHeight}window.addEventListener("resize",F);F();let A=Array.from({length:100},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*2,alpha:Math.random()}));function j(){a&&(a.fillStyle="#0f172a",a.fillRect(0,0,h.width,h.height),a.fillStyle="#fef08a",a.beginPath(),a.arc(h.width-100,100,50,0,Math.PI*2),a.fill(),a.shadowBlur=20,a.shadowColor="#fef08a",a.fill(),a.shadowBlur=0,A.forEach(e=>{e.alpha+=(Math.random()-.5)*.1,e.alpha=Math.max(0,Math.min(1,e.alpha)),a.fillStyle=`rgba(255, 255, 255, ${e.alpha})`,a.beginPath(),a.arc(e.x,e.y,e.r,0,Math.PI*2),a.fill()}),requestAnimationFrame(j))}function P(){m=0,g=0,u=0,x=0,l=T,c=[],b=!0,E.innerHTML=`
    <div class="game-hud" style="font-family: 'Nunito', sans-serif;">
      <div class="hud-left">
        <button id="back-btn" style="padding: 10px 15px; border-radius: 8px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); cursor: pointer; backdrop-filter: blur(5px); font-size: 1rem; font-weight: bold;">← Trở về</button>
      </div>
      <div class="hud-right" style="color: white; font-size: 1.5rem; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); text-align: right;">
        <div id="time-display" style="color: #fca5a5;">⏰ ${l}s</div>
        <div id="score-display" style="color: #fef08a;">⭐ ${m}</div>
        <div id="wrong-display" style="color: #f87171;">💔 0/7</div>
        <div id="streak-display" style="color: #fb923c; font-size: 1.2rem; height: 1.5rem;"></div>
      </div>
    </div>
    <div class="memory-board" id="board"></div>
  `,document.getElementById("back-btn").addEventListener("click",()=>{window.location.href="/trung-thu-games/"});const e=document.getElementById("board");r=[...y,...y].sort(()=>Math.random()-.5).map((t,o)=>({id:o,spriteKey:t,isFlipped:!1,isMatched:!1})),r.forEach((t,o)=>{const n=document.createElement("div");n.className="memory-card",n.dataset.index=o;let i="";window.gameSprites&&window.gameSprites[t.spriteKey]?i='<img src="'+window.gameSprites[t.spriteKey].toDataURL()+'" style="width:70%;height:70%;object-fit:contain;margin-top:15%;">':i=D[t.spriteKey],n.innerHTML=`
      <div class="memory-card-face memory-card-front">${i}</div>
      <div class="memory-card-face memory-card-back"></div>
    `,n.addEventListener("click",()=>G(o,n)),e.appendChild(n)}),clearInterval(w),w=setInterval(()=>{l--,document.getElementById("time-display").textContent=`⏰ ${l}s`,l<=0&&v(!1)},window.MODIFIER_CHALLENGE==="speed2x"?500:1e3)}function G(e,t){!b||r[e].isFlipped||r[e].isMatched||c.length>=2||(r[e].isFlipped=!0,t.classList.add("flipped"),c.push({index:e,el:t,spriteKey:r[e].spriteKey}),c.length===2&&(b=!1,O()))}function O(){const[e,t]=c;if(e.spriteKey===t.spriteKey){r[e.index].isMatched=!0,r[t.index].isMatched=!0,e.el.classList.add("matched"),t.el.classList.add("matched"),g++;const o=100+l*2+g*10;m+=o,x++,z(),c=[],b=!0,x===y.length&&setTimeout(()=>v(!0),800)}else{if(g=0,u++,z(),u>=7){setTimeout(()=>v(!1,"Sai quá nhiều!"),800);return}setTimeout(()=>{r[e.index].isFlipped=!1,r[t.index].isFlipped=!1,e.el.classList.remove("flipped"),t.el.classList.remove("flipped"),c=[],b=!0},800)}}function z(){const e=document.getElementById("score-display"),t=document.getElementById("streak-display"),o=document.getElementById("wrong-display");e&&(e.textContent=`⭐ ${m}`),t&&(t.textContent=g>1?`🔥 x${g}`:""),o&&(o.textContent=`💔 ${u}/7`)}function R(){E.innerHTML=`
    <div style="background: rgba(15, 23, 42, 0.9); padding: 40px; border-radius: 24px; text-align: center; color: white; border: 2px solid #fef08a; box-shadow: 0 0 30px rgba(254, 240, 138, 0.3); max-width: 90%; font-family: 'Nunito', sans-serif;">
      <div style="font-size: 4rem; margin-bottom: 10px;">🎴</div>
      <h1 style="font-size: 2.5rem; margin-bottom: 15px; color: #fef08a; text-shadow: 0 2px 10px rgba(254, 240, 138, 0.5);">Trí Nhớ Đêm Trăng</h1>
      <p style="font-size: 1.2rem; margin-bottom: 30px; line-height: 1.5;">Tìm các cặp hình giống nhau trước khi hết giờ!<br>Ghép liên tiếp để nhận thêm điểm thưởng.</p>
      <button id="start-btn" style="padding: 15px 50px; font-size: 1.5rem; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border: none; border-radius: 50px; cursor: pointer; font-weight: 900; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5); font-family: 'Nunito', sans-serif; transition: transform 0.2s;">Bắt Đầu</button>
      <div style="margin-top: 20px;">
        <a href="/" style="color: #9ca3af; text-decoration: none; font-size: 1rem; border-bottom: 1px solid #9ca3af; padding-bottom: 2px;">← Trở về sảnh</a>
      </div>
    </div>
  `,document.getElementById("start-btn").addEventListener("click",P),document.getElementById("start-btn").addEventListener("mouseover",e=>e.target.style.transform="scale(1.05)"),document.getElementById("start-btn").addEventListener("mouseout",e=>e.target.style.transform="scale(1)")}function v(e,t=""){var i;clearInterval(w),e&&(m+=l*10);const o=window.playerSnapshot?`<br/><p style="margin: 5px 0; font-size: 0.9em; color: #ffeb3b;">Phần quà bất ngờ!</p><img src="${window.playerSnapshot}" style="max-width: 200px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ffeb3b;" />`:"",n=e?"Chiến Thắng!":t||"Hết Giờ!";E.innerHTML=`
    <div style="background: rgba(15, 23, 42, 0.95); padding: 40px; border-radius: 24px; text-align: center; color: white; border: 2px solid ${e?"#4ade80":"#f87171"}; min-width: 320px; box-shadow: 0 0 30px ${e?"rgba(74, 222, 128, 0.3)":"rgba(248, 113, 113, 0.3)"}; font-family: 'Nunito', sans-serif;">
      <div style="font-size: 4rem; margin-bottom: 10px;">${e?"🏆":"💔"}</div>
      <h2 style="font-size: 2.5rem; margin-bottom: 20px; color: ${e?"#4ade80":"#f87171"}; text-shadow: 0 2px 10px ${e?"rgba(74, 222, 128, 0.5)":"rgba(248, 113, 113, 0.5)"};">${n}</h2>
      <div style="font-size: 1.5rem; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; gap: 5px;">
        <span style="color: #e5e7eb;">Điểm số:</span>
        <span style="color: #fef08a; font-size: 3rem; font-weight: 900; line-height: 1;">${m}</span>
      </div>
      ${o}
      
      <div id="leaderboard-input-section" style="margin-top: 20px;">
          <input type="text" id="player-name" placeholder="Nhập tên của bạn" style="padding: 10px; font-size: 1.2rem; border-radius: 8px; border: 1px solid #ccc; width: 80%; margin-bottom: 15px; text-align: center; color: #333;">
          <button id="save-score-btn" style="padding: 10px 25px; font-size: 1.2rem; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 900; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); width: 100%;">Lưu Điểm</button>
      </div>
      
      <div id="leaderboard-view-section" style="display:none; margin-top: 20px;">
          <h3 style="margin-bottom: 5px; color: #fef08a;">Bảng Xếp Hạng</h3>
          <div id="leaderboard-list"></div>
          <button id="home-btn" style="padding: 10px 25px; font-size: 1.2rem; background: #374151; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px;">Về Sảnh</button>
      </div>
    </div>
  `,document.getElementById("save-score-btn").addEventListener("click",()=>{const f=document.getElementById("player-name").value.trim();K(f,m),document.getElementById("leaderboard-input-section").style.display="none",document.getElementById("leaderboard-list").innerHTML=_(),document.getElementById("leaderboard-view-section").style.display="block"}),(i=document.getElementById("home-btn"))==null||i.addEventListener("click",()=>{window.location.href="/trung-thu-games/"})}function d(e){return new Promise((t,o)=>{const n=new Image;n.crossOrigin="Anonymous",n.onload=()=>{const i=document.createElement("canvas");i.width=n.width,i.height=n.height;const f=i.getContext("2d");f.drawImage(n,0,0);const I=f.getImageData(0,0,n.width,n.height),s=I.data,S=s[0],L=s[1],k=s[2],N=70;for(let p=0;p<s.length;p+=4){const M=s[p],B=s[p+1],$=s[p+2];Math.sqrt((M-S)*(M-S)+(B-L)*(B-L)+($-k)*($-k))<N&&(s[p+3]=0)}f.putImageData(I,0,0),t(i)},n.onerror=o,n.src=e})}window.gameSprites={};async function q(){try{window.gameSprites.mooncake=await d("../../assets/mooncake.jpg"),window.gameSprites.lantern=await d("../../assets/lantern.jpg"),window.gameSprites.bunny=await d("../../assets/bunny.jpg"),window.gameSprites.moon=await d("../../assets/moon.jpg"),window.gameSprites.bamboo=await d("../../assets/bamboo.jpg"),window.gameSprites.dragon=await d("../../assets/dragon.jpg"),window.gameSprites.mouse=await d("../../assets/mouse.jpg"),window.gameSprites.star=await d("../../assets/star.jpg")}catch(e){console.error("Lỗi tải ảnh:",e)}requestAnimationFrame(j),R()}q();
