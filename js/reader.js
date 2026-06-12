// =========================================================================
// 1. CẤU HÌNH BAN ĐẦU & KIỂM TRA ĐĂNG NHẬP
// =========================================================================
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
let maxChapter = 1;

// =========================================================================
// 2. DOM ELEMENTS
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
// 3. GIAO DIỆN TỐI / SÁNG
// =========================================================================
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if(btnTheme) btnTheme.innerText = "☀️ Giao diện Sáng";
}

if (btnTheme) {
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
}

// =========================================================================
// 4. LỊCH SỬ ĐỌC
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
        console.error("Lỗi lấy lịch sử:", error);
    }
    return 1;
}

async function saveReadingHistory(chapterNumber) {
    try {
        await fetch(`${API_BASE_URL}/stories/${STORY_ID}/history?chapter_number=${chapterNumber}`, {
            method: "POST",
            headers: authHeaders
        });
    } catch (error) {
        console.error("Lỗi lưu lịch sử:", error);
    }
}

// =========================================================================
// 5. XỬ LÝ TEXT VÀ TẢI NỘI DUNG (NHUỘM MÀU LỜI THOẠI)
// =========================================================================

// Hàm tự động phát hiện và bọc lời thoại bằng thẻ <span> để CSS nhuộm vàng
function formatTuTienText(text) {
    if (!text) return "";
    let formatted = text;

    // Quét lời thoại nằm trong ngoặc kép kép (hỗ trợ cả dấu " và dấu “ ”)
    formatted = formatted.replace(/(“[^”]+”|"[^"]+")/g, '<span class="dialogue">$1</span>');

    // Quét thông báo hệ thống nằm trong dấu 【 】
    formatted = formatted.replace(/(【[^】]+】)/g, '<span class="system-notice">$1</span>');

    return formatted;
}

async function loadTableOfContents() {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`);
        if (!response.ok) return;
        const data = await response.json();
        
        if (!chapterSelect) return;
        chapterSelect.innerHTML = ""; 
        
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
    if (!titleEl || !contentEl) return;

    titleEl.innerText = "⏳ Đang tải nội dung...";
    contentEl.innerHTML = "";
    if (navTitleEl) navTitleEl.innerText = ""; 

    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}/chapters/${chapterNumber}`);
        if (!response.ok) throw new Error("Không tìm thấy chương");

        const data = await response.json();
        const chapterTitle = data.title || `Chương ${data.chapter_number}`;
        
        titleEl.innerText = chapterTitle;
        if (navTitleEl) navTitleEl.innerText = chapterTitle; 
        
        // Tách dòng và áp dụng bộ lọc hội thoại
        const paragraphs = data.content.split('\n').filter(p => p.trim() !== "");
        contentEl.innerHTML = paragraphs.map(p => `<p>${formatTuTienText(p)}</p>`).join('');

        window.scrollTo(0, 0);
        if (chapterSelect) chapterSelect.value = chapterNumber;
        
        saveReadingHistory(chapterNumber);
        
    } catch (error) {
        titleEl.innerText = "Đã hết chương!";
        contentEl.innerHTML = `<p style="color: #ef4444; text-align: center; font-weight: bold; margin-top: 40px;">Truyện đang được cập nhật thêm, vui lòng quay lại sau.</p>`;
    }
}

// =========================================================================
// 6. SỰ KIỆN NÚT BẤM (CHUYỂN CHƯƠNG & ĐỒNG BỘ)
// =========================================================================
if (btnNext) {
    btnNext.addEventListener("click", () => {
        if (currentChapter >= maxChapter) {
            alert("Bạn đang ở chương mới nhất!");
            return;
        }
        currentChapter++;
        loadChapter(currentChapter);
    });
}

if (btnPrev) {
    btnPrev.addEventListener("click", () => {
        if (currentChapter > 1) {
            currentChapter--;
            loadChapter(currentChapter);
        }
    });
}

if (chapterSelect) {
    chapterSelect.addEventListener("change", (e) => {
        currentChapter = parseInt(e.target.value);
        loadChapter(currentChapter);
    });
}

if (btnHome) {
    btnHome.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

if (btnSync) {
    btnSync.addEventListener("click", async () => {
        const originalText = btnSync.innerText;
        btnSync.innerText = "⏳ Đang đồng bộ...";
        btnSync.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/sync/${STORY_ID}`, {
                method: 'POST',
                headers: authHeaders 
            });
            const result = await response.json();

            if (response.ok) {
                alert("Đồng bộ thành công! " + (result.message || ""));
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
}

if (navTitleEl) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
            navTitleEl.classList.add("show");
        } else {
            navTitleEl.classList.remove("show"); 
        }
    });
}

// =========================================================================
// 7. KHỞI CHẠY TRANG ĐỌC
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