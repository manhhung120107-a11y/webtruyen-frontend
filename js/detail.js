// =========================================================================
// 1. CẤU HÌNH BAN ĐẦU & XÁC THỰC TÀI KHOẢN
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

let lastReadChapter = 1; 

// =========================================================================
// 2. QUẢN LÝ GIAO DIỆN TỐI / SÁNG (THEME TOGGLE)
// =========================================================================
const btnTheme = document.getElementById("btn-theme");
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (btnTheme) btnTheme.innerText = "☀️ Giao diện Sáng";
}

if (btnTheme) {
    btnTheme.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        btnTheme.innerText = isDark ? "☀️ Giao diện Sáng" : "🌙 Giao diện Tối";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}

// Điều hướng quay lại Trang chủ
const btnBack = document.getElementById("btn-back");
if (btnBack) {
    btnBack.addEventListener("click", () => { 
        window.location.href = "index.html"; 
    });
}

// =========================================================================
// 3. TẢI DỮ LIỆU CHI TIẾT TRUYỆN (HIỂN THỊ THỂ LOẠI & DANH SÁCH CHƯƠNG)
// =========================================================================
async function loadStoryDetails() {
    try {
        // Lấy lịch sử chương đang đọc dở của người dùng
        const historyResponse = await fetch(`${API_BASE_URL}/stories/${STORY_ID}/history`, {
            headers: authHeaders
        });
        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            lastReadChapter = historyData.current_chapter_number || 1;
        }
    } catch (err) {
        console.error("Không lấy được lịch sử đọc:", err);
    }

    try {
        // Tải thông tin chung của truyện từ server
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`, {
            headers: authHeaders
        });
        if (!response.ok) throw new Error("Lỗi tải chi tiết bộ truyện.");

        const data = await response.json();

        // Gán thông tin lên giao diện
        document.getElementById("story-title").innerText = data.title;
        document.getElementById("story-author").innerText = data.author || "Khuyết Danh";
        
        // 1. Gán dữ liệu thể loại (Yêu cầu 1)
        const genreEl = document.getElementById("story-genre");
        if (genreEl) {
            genreEl.innerText = data.genre || "Truyện Chữ";
        }

        document.getElementById("story-summary").innerText = data.description || data.summary || "Chưa có nội dung tóm tắt cho bộ truyện này.";
        
        const navTitle = document.getElementById("nav-story-title");
        if (navTitle) navTitle.innerText = data.title;

        // 2. Render đổ dữ liệu danh sách chương vào thanh cuộn (Yêu cầu 2)
        const chapterListEl = document.getElementById("chapter-list");
        chapterListEl.innerHTML = "";

        if (data.chapters && data.chapters.length > 0) {
            // Sắp xếp danh sách chương tăng dần theo số chương
            data.chapters.sort((a, b) => parseInt(a.chapter_number) - parseInt(b.chapter_number));
            
            data.chapters.forEach(ch => {
                const li = document.createElement("li");
                li.innerHTML = `<a href="reader.html?id=${STORY_ID}&chap=${ch.chapter_number}">Chương ${ch.chapter_number}: ${ch.title || 'Mở đầu'}</a>`;
                chapterListEl.appendChild(li);
            });
        } else {
            chapterListEl.innerHTML = `<li style="text-align: center; padding: 20px; color: #888;">Hệ thống chưa tìm thấy chương nào. Vui lòng bấm nút 🔄 Đồng bộ ở góc trên để cập nhật!</li>`;
        }

    } catch (error) {
        console.error(error);
        alert("Lỗi tải thông tin truyện, vui lòng thử lại sau.");
    }
}

// =========================================================================
// 4. LOGIC XỬ LÝ SỰ KIỆN ĐỌC TRUYỆN
// =========================================================================
document.getElementById("btn-read-first").addEventListener("click", () => {
    window.location.href = `reader.html?id=${STORY_ID}&chap=1`;
});

document.getElementById("btn-read-continue").addEventListener("click", () => {
    window.location.href = `reader.html?id=${STORY_ID}&chap=${lastReadChapter}`;
});

// =========================================================================
// 5. CHỨC NĂNG ADMIN (ĐỒNG BỘ & XÓA TRUYỆN)
// =========================================================================
const btnSync = document.getElementById("btn-sync");
if (btnSync) {
    btnSync.addEventListener("click", async () => {
        const originalText = btnSync.innerText;
        btnSync.innerText = "⏳ Đang xử lý...";
        btnSync.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/sync/${STORY_ID}`, {
                method: "POST",
                headers: authHeaders
            });
            const result = await response.json();

            if (response.ok) {
                alert("Đồng bộ dữ liệu chương thành công!");
                await loadStoryDetails();
            } else {
                alert("Lỗi từ hệ thống: " + result.detail);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi mất kết nối đường truyền mạng!");
        } finally {
            btnSync.innerText = originalText;
            btnSync.disabled = false;
        }
    });
}

const btnDelete = document.getElementById("btn-delete-story");
if (btnDelete) {
    btnDelete.addEventListener("click", async () => {
        const title = document.getElementById("story-title").innerText;
        const accept = confirm(`Bạn chắc chắn muốn xóa vĩnh viễn bộ truyện "${title}" khỏi hệ thống chứ?`);
        
        if (accept) {
            try {
                const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`, {
                    method: "DELETE",
                    headers: authHeaders
                });
                const result = await response.json();

                if (response.ok) {
                    alert(result.message || "Đã xóa truyện thành công.");
                    window.location.href = "index.html";
                } else {
                    alert("Lỗi xóa truyện: " + result.detail);
                }
            } catch (error) {
                console.error(error);
                alert("Không kết nối được tới máy chủ.");
            }
        }
    });
}

// Giới hạn hiển thị tính năng của Admin
const loggedInUser = localStorage.getItem("username");
if (loggedInUser !== "admin") {
    if (btnDelete) btnDelete.style.display = "none";
    if (btnSync) btnSync.style.display = "none";
}

// Khởi chạy hệ thống tải thông tin
loadStoryDetails();