// =========================================================================
// 1. CẤU HÌNH BAN ĐẦU & KIỂM TRA ĐĂNG NHẬP
// =========================================================================
const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api";

// Kiểm tra xem người dùng đã đăng nhập chưa
const token = localStorage.getItem("access_token");
if (!token) {
    // Nếu chưa có Token, lập tức đuổi về trang đăng nhập
    window.location.href = "login.html";
}

// Cấu hình Header chứa mã Token để gửi kèm trong các API bảo mật
const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

// Lấy ID truyện từ thanh địa chỉ (Ví dụ: reader.html?id=2 -> STORY_ID = 2)
const urlParams = new URLSearchParams(window.location.search);
const STORY_ID = urlParams.get('id') || 1; 

let currentChapter = 1; // Biến lưu số chương hiện tại

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

// Lấy vị trí chương đã đọc gần đây nhất từ Backend
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
    return 1; // Mặc định trả về chương 1 nếu có lỗi hoặc chưa từng đọc
}

// Gửi ngầm vị trí chương đang đọc hiện tại lên lưu ở Backend
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

// Tải danh sách mục lục truyện đổ vào ô chọn Dropdown
async function loadTableOfContents() {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`);
        if (!response.ok) return;
        const data = await response.json();
        
        chapterSelect.innerHTML = ""; // Làm sạch ô chọn
        
        data.chapters.forEach(chapter => {
            const option = document.createElement("option");
            option.value = chapter.chapter_number;
            option.textContent = chapter.title || `Chương ${chapter.chapter_number}`;
            chapterSelect.appendChild(option);
        });

        // Đồng bộ giá trị hiển thị của ô chọn khớp với chương hiện tại
        chapterSelect.value = currentChapter;
    } catch (error) {
        console.error("Lỗi tải mục lục:", error);
    }
}

// Tải nội dung chi tiết của một chương truyện cụ thể
async function loadChapter(chapterNumber) {
    titleEl.innerText = "Đang tải...";
    contentEl.innerHTML = "";
    navTitleEl.innerText = ""; // Tạm ẩn tiêu đề trên thanh Nav

    try {
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}/chapters/${chapterNumber}`);
        if (!response.ok) throw new Error("Không tìm thấy chương này!");

        const data = await response.json();
        const chapterTitle = data.title || `Chương ${data.chapter_number}`;
        
        // Hiển thị tiêu đề truyện ra giao diện
        titleEl.innerText = chapterTitle;
        navTitleEl.innerText = chapterTitle; // Gán sẵn cho thanh Nav dính (Sticky)
        
        // Chuẩn hóa định dạng: Tách đoạn bằng dấu xuống dòng \n và bọc vào thẻ <p>
        const paragraphs = data.content.split('\n').filter(p => p.trim() !== "");
        contentEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

        // Cuộn màn hình lên đầu trang mượt mà
        window.scrollTo(0, 0);
        
        // Cập nhật lại giá trị hiển thị trên ô Dropdown mục lục
        chapterSelect.value = chapterNumber;
        
        // Gọi API lưu lịch sử đọc xuống database
        saveReadingHistory(chapterNumber);
        
    } catch (error) {
        titleEl.innerText = "Hết truyện!";
        contentEl.innerHTML = `<p style="color: #c0392b; text-align: center; font-weight: bold;">Bạn đã đọc hết các chương hiện có của bộ truyện này.</p>`;
    }
}

// =========================================================================
// 6. SỰ KIỆN CỦA CÁC NÚT BẤM & CUỘN CHUỘT (EVENT LISTENERS)
// =========================================================================

// Nút chuyển chương tiếp theo
btnNext.addEventListener("click", () => {
    currentChapter++;
    loadChapter(currentChapter);
});

// Nút quay lại chương trước
btnPrev.addEventListener("click", () => {
    if (currentChapter > 1) {
        currentChapter--;
        loadChapter(currentChapter);
    }
});

// Sự kiện khi đổi chương bằng cách chọn trực tiếp trong ô Mục lục Dropdown
chapterSelect.addEventListener("change", (e) => {
    currentChapter = parseInt(e.target.value);
    loadChapter(currentChapter);
});

// Nút quay về Trang chủ Tủ truyện
btnHome.addEventListener("click", () => {
    window.location.href = "index.html";
});

// Nút kích hoạt Đồng bộ hóa Google Docs trực tiếp từ giao diện đọc truyện
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
            // Đồng bộ thành công thì nạp lại giao diện mới nhất ngay lập tức
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

// Hiệu ứng cuộn chuột: Ẩn/Hiện tên chương ở chính giữa thanh điều hướng (Sticky Title)
window.addEventListener("scroll", () => {
    // Nếu cuộn xuống quá 100px (vượt qua tiêu đề lớn đầu trang) thì hiện tiêu đề nhỏ
    if (window.scrollY > 100) {
        navTitleEl.classList.add("show");
    } else {
        navTitleEl.classList.remove("show"); // Lên lại đầu trang thì ẩn đi
    }
});

// =========================================================================
// 7. HÀM KHỞI CHẠY HỆ THỐNG KHI TRANG SẴN SÀNG (ĐÃ CẬP NHẬT)
// =========================================================================
async function initReader() {
    // Tải danh mục chương truyện đổ vào Dropdown trước
    await loadTableOfContents(); 
    
    // Kiểm tra xem URL có yêu cầu đọc đích danh chương nào không (Ví dụ: reader.html?id=1&chap=3)
    const chapParam = urlParams.get('chap');
    
    if (chapParam) {
        currentChapter = parseInt(chapParam);
    } else {
        // Nếu không chỉ định chương trên URL, mới đi hỏi lịch sử gần nhất của Backend
        currentChapter = await fetchReadingHistory(); 
    }
    
    // Tải nội dung chương
    loadChapter(currentChapter); 
}

// Kích hoạt chạy ứng dụng
initReader();