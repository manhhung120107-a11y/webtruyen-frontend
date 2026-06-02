const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api";

const token = localStorage.getItem("access_token");
if (!token) window.location.href = "login.html";

const authHeaders = { "Authorization": `Bearer ${token}` };
const urlParams = new URLSearchParams(window.location.search);
const STORY_ID = urlParams.get('id') || 1;

let lastReadChapter = 1; // Mặc định nếu chưa đọc là chương 1

// Xử lý Dark Mode
const btnTheme = document.getElementById("btn-theme");
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    btnTheme.innerText = "☀️ Giao diện Sáng";
}
btnTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    btnTheme.innerText = document.body.classList.contains("dark-mode") ? "☀️ Giao diện Sáng" : "🌙 Giao diện Tối";
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});

// Nút quay lại trang chủ
document.getElementById("btn-back").addEventListener("click", () => { window.location.href = "index.html"; });

async function loadStoryDetails() {
    try {
        // 1. Lấy lịch sử đọc để chuẩn bị cho nút "Đọc tiếp"
        const historyRes = await fetch(`${API_BASE_URL}/stories/${STORY_ID}/history`, { headers: authHeaders });
        if (historyRes.ok) {
            const historyData = await historyRes.json();
            lastReadChapter = historyData.current_chapter_number;
            document.getElementById("btn-read-continue").innerText = `Đọc Tiếp (Chương ${lastReadChapter})`;
        }

        // 2. Lấy thông tin chi tiết truyện và danh sách chương
        const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`);
        if (!response.ok) return;
        const story = await response.json();

        // Đổ dữ liệu text
        document.getElementById("nav-story-title").innerText = story.title;
        document.getElementById("story-title").innerText = story.title;
        document.getElementById("story-author").innerText = `Tác giả: ${story.author || 'Chưa cập nhật'}`;
        document.getElementById("story-summary").innerText = story.description || 'Chưa có tóm tắt cho bộ truyện này.';

        // Xử lý hiển thị Thể loại (Tách bằng dấu phẩy nếu backend lưu dạng chuỗi)
        const genreContainer = document.getElementById("genres");
        genreContainer.innerHTML = "";
        if (story.genre) {
            story.genre.split(',').forEach(g => {
                const tag = document.createElement("span");
                tag.className = "genre-tag";
                tag.innerText = g.trim();
                genreContainer.appendChild(tag);
            });
        }

        // Đổ danh sách chương công khai xuống lưới
        const listContainer = document.getElementById("chapter-list-container");
        listContainer.innerHTML = "";

        if (!story.chapters || story.chapters.length === 0) {
            listContainer.innerHTML = `<li class="detail-chapter-item" style="cursor:default;">Truyện chưa được cập nhật chương nào.</li>`;
            return;
        }

        story.chapters.forEach(chap => {
            const li = document.createElement("li");
            li.className = "detail-chapter-item";
            li.innerText = chap.title || `Chương ${chap.chapter_number}`;
            
            // Click trực tiếp vào chương nào thì bay thẳng vào chương đó để đọc
            li.addEventListener("click", () => {
                window.location.href = `reader.html?id=${STORY_ID}&chap=${chap.chapter_number}`;
            });
            listContainer.appendChild(li);
        });

    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// Cài đặt sự kiện cho 2 nút đọc truyện lớn ở trên đầu
document.getElementById("btn-read-first").addEventListener("click", () => {
    window.location.href = `reader.html?id=${STORY_ID}&chap=1`;
});
document.getElementById("btn-read-continue").addEventListener("click", () => {
    window.location.href = `reader.html?id=${STORY_ID}&chap=${lastReadChapter}`;
});

loadStoryDetails();

// --- THÊM TÍNH NĂNG ĐỒNG BỘ NGAY TẠI TRANG GIỮ ---
const btnSync = document.getElementById("btn-sync");
btnSync.addEventListener("click", async () => {
    const originalText = btnSync.innerText;
    btnSync.innerText = "⏳ Đang đồng bộ...";
    btnSync.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/sync/${STORY_ID}`, { method: 'POST' });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            // Tải lại toàn bộ thông tin chi tiết và danh sách chương mới vừa kéo về
            loadStoryDetails(); 
        } else {
            alert("Lỗi đồng bộ: " + result.detail);
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối đến server!");
    } finally {
        btnSync.innerText = originalText;
        btnSync.disabled = false;
    }
});

// --- THÊM TÍNH NĂNG XÓA TRUYỆN ---
document.getElementById("btn-delete-story").addEventListener("click", async () => {
    const storyTitle = document.getElementById("story-title").innerText;
    
    // Hiện hộp thoại xác nhận để tránh bấm nhầm
    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa hoàn toàn bộ truyện "${storyTitle}" không?\nHành động này sẽ xóa sạch các chương và lịch sử đọc hiện tại.`);
    
    if (confirmDelete) {
        try {
            const response = await fetch(`${API_BASE_URL}/stories/${STORY_ID}`, {
                method: "DELETE"
            });
            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                window.location.href = "index.html"; // Xóa xong đá về Trang chủ
            } else {
                alert("Lỗi khi xóa: " + result.detail);
            }
        } catch (error) {
            console.error(error);
            alert("Không thể kết nối đến server để xóa truyện.");
        }
    }
});