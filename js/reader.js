// =========================================================================
// 1. CẤU HÌNH BAN ĐẦU & KIỂM TRA ĐĂNG NHẬP
// =========================================================================
// !!! BẠN NHỚ KIỂM TRA VÀ SỬA ĐÚNG LINK RENDER CỦA BẠN Ở ĐÂY !!!
const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api"; 

const token = localStorage.getItem("access_token");
if (!token) {
    window.location.href = "login.html";
}

const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

const urlParams = new URLSearchParams(window.location.search);
const STORY_ID = urlParams.get('id') || 1; 

let currentChapter = 1; 
let maxChapter = 1;     // Biến lưu số chương lớn nhất để chặn pop-up

// =========================================================================
// 2. LẤY CÁC THÀNH PHẦN GIAO DIỆN (DOM ELEMENTS)
// =========================================================================
const titleEl = document.getElementById("title");
const contentEl = document.getElementById("content");
const navTitleEl = document.getElementById("nav-chapter-title");
const chapterSelect = document.getElementById("chapter-select");

const btnTheme = document.getElementById("btn-theme");
const btnNext = document.getElementById("btn-next");
const btnPrev = document.getElementById("btn-prev");
const btnHome = document.getElementById("btn-home");
const btnSync = document.getElementById("btn-sync");

// =========================================================================
// 3. XỬ LÝ GIAO DIỆN TỐI / SÁNG (DARK MODE)
// =========================================================================
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    btnTheme.innerText = "☀️ Giao diện Sáng";
}

btnTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        btnTheme.innerText = "☀️ Giao diện Sáng";
    } else {
        localStorage.setItem("theme", "light");
        btnTheme.innerText = "🌙 Giao diện Tối";
    }
});

// =========================================================================
// 4. CÁC HÀM XỬ LÝ LỊCH SỬ ĐỌC (READING HISTORY)
// =========================================================================
async function fetchReadingHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}/history`, {
            headers: authHeaders
        });
        if (response.ok) {
            const data = await response.json();
            return data.current_chapter_number;
        }
    } catch (error) {
        console.error("Lỗi lấy lịch sử đọc:", error);
    }
    return 1;
}

async function saveReadingHistory(chapterNumber) {
    try {
        await fetch(`${API_BASE_URL}/stories/${STORY_ID}/history?chapter_number=${chapterNumber}`, {
            method: "POST",
            headers: authHeaders
        });
        console.log("Đã lưu lịch sử đọc ngầm: Chương", chapterNumber);
    } catch (error) {
        console.error("Lỗi lưu lịch sử đọc:", error);
    }
}

// =========================================================================
// 5. CÁC HÀM TẢI DỮ LIỆU (LOAD CONTENT & TOC)
// =========================================================================

// --- HÀM TỰ ĐỘNG TÔ MÀU LỜI THOẠI NHÂN VẬT ---
function formatTuTienText(text) {
    if (!text) return "";
    
    // Tìm và bọc màu Lời thoại (những chữ nằm trong dấu ngoặc kép " ")
    // Hoàn toàn không can thiệp hay tô màu bất kỳ tên riêng nào khác
    return text.replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>');
}

async function loadTableOfContents() {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`);
        if (!response.ok) return;
        const data = await response.json();
        
        chapterSelect.innerHTML = ""; 
        
        // Tìm số chương lớn nhất trong danh sách mục lục
        if (data.chapters && data.chapters.length > 0) {
            maxChapter = Math.max(...data.chapters.map(c => parseInt(c.chapter_number)));
        }
        
        data.chapters.forEach(chapter => {
            const option = document.createElement("option");
            option.value = chapter.chapter_number;
            option.textContent = `Chương ${chapter.chapter_number}`;
            chapterSelect.appendChild(option);
        });

        chapterSelect.value = currentChapter;
    } catch (error) {
        console.error("Lỗi tải mục lục:", error);
    }
}

async function loadChapter(chapterNumber) {
    titleEl.innerText = "Đang tải...";
    contentEl.innerHTML = "";
    navTitleEl.innerText = ""; 

    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}/chapters/${chapterNumber}`);
        if (!response.ok) throw new Error("Không tìm thấy chương này!");

        const data = await response.json();
        const chapterTitle = data.title || `Chương ${data.chapter_number}`;
        
        titleEl.innerText = chapterTitle;
        navTitleEl.innerText = chapterTitle; 
        
        const paragraphs = data.content.split('\n').filter(p => p.trim() !== "");
        contentEl.innerHTML = paragraphs.map(p => `<p>${formatTuTienText(p)}</p>`).join('');

        window.scrollTo(0, 0);
        chapterSelect.value = chapterNumber;
        
        saveReadingHistory(chapterNumber);
        
    } catch (error) {
        titleEl.innerText = "Hết truyện!";
        contentEl.innerHTML = `<p style="color: #c0392b; text-align: center; font-weight: bold;">Bạn đã đọc hết các chương hiện có của bộ truyện này.</p>`;
    }
}

// =========================================================================
// 6. SỰ KIỆN CỦA CÁC NÚT BẤM & CUỘN CHUỘT (EVENT LISTENERS)
// =========================================================================

// Nút chuyển chương tiếp theo (Có pop-up chặn)
btnNext.addEventListener("click", () => {
    if (currentChapter >= maxChapter) {
        alert("Bạn đang ở chương mới nhất của bộ truyện này rồi! 🎉");
        return;
    }
    currentChapter++;
    loadChapter(currentChapter);
});

btnPrev.addEventListener("click", () => {
    if (currentChapter > 1) {
        currentChapter--;
        loadChapter(currentChapter);
    }
});

chapterSelect.addEventListener("change", (e) => {
    currentChapter = parseInt(e.target.value);
    loadChapter(currentChapter);
});

btnHome.addEventListener("click", () => {
    window.location.href = "index.html";
});

btnSync.addEventListener("click", async () => {
    const originalText = btnSync.innerText;
    btnSync.innerText = "⏳ Đang kéo dữ liệu...";
    btnSync.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/sync/${STORY_ID}`, {
            method: 'POST'
        });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            await loadTableOfContents();
            await loadChapter(currentChapter);
        } else {
            alert("Lỗi đồng bộ: " + result.detail);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể kết nối đến server để đồng bộ.");
    } finally {
        btnSync.innerText = originalText;
        btnSync.disabled = false;
    }
});

window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
        navTitleEl.classList.add("show");
    } else {
        navTitleEl.classList.remove("show"); 
    }
});

// =========================================================================
// 7. HÀM KHỞI CHẠY HỆ THỐNG KHI TRANG SẴN SÀNG
// =========================================================================
async function initReader() {
    await loadTableOfContents(); 
    
    const chapParam = urlParams.get('chap');
    if (chapParam) {
        currentChapter = parseInt(chapParam);
    } else {
        currentChapter = await fetchReadingHistory(); 
    }
    
    loadChapter(currentChapter); 
}

initReader();