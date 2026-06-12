// =========================================================================
// 1. CẤU HÌNH BAN ĐẦU & KIỂM TRA ĐĂNG NHẬP
// =========================================================================
const token = localStorage.getItem("access_token");
const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

// Nếu chưa có token, lập tức đuổi về trang đăng nhập
if (!token) {
    window.location.href = "login.html";
}

const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api";

// =========================================================================
// 2. LẤY CÁC THÀNH PHẦN GIAO DIỆN (DOM ELEMENTS)
// =========================================================================
const storyListEl = document.getElementById("story-list");
const btnTheme = document.getElementById("btn-theme");

// Form thêm truyện
const btnAddStory = document.getElementById("btn-add-story");
const addTitle = document.getElementById("add-title");
const addAuthor = document.getElementById("add-author");
const addGenre = document.getElementById("add-genre");
const addDocId = document.getElementById("add-doc-id");
const addDescription = document.getElementById("add-description");

// Menu người dùng
const btnAvatar = document.getElementById("btn-user-avatar");
const userDropdown = document.getElementById("user-dropdown");
const btnLogout = document.getElementById("menu-logout");
const userInfoName = document.getElementById("user-info-name");
const btnHistory = document.getElementById("menu-history");

// =========================================================================
// 3. LOGIC GIAO DIỆN & MENU NGƯỜI DÙNG
// =========================================================================
// --- Giao diện Sáng/Tối ---
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (btnTheme) btnTheme.innerText = "☀️ Giao diện Sáng";
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

// --- Hiển thị User Menu ---
const savedUsername = localStorage.getItem("username");
if (savedUsername && userInfoName) {
    userInfoName.innerText = `Hi, ${savedUsername}!`;
}

if (btnAvatar && userDropdown) {
    btnAvatar.addEventListener("click", (event) => {
        event.stopPropagation();
        userDropdown.classList.toggle("hidden");
    });
}

document.addEventListener("click", (event) => {
    if (userDropdown && !userDropdown.classList.contains("hidden")) {
        if (!userDropdown.contains(event.target) && btnAvatar && !btnAvatar.contains(event.target)) {
            userDropdown.classList.add("hidden");
        }
    }
});

// --- Logic Đăng Xuất ---
if (btnLogout) {
    btnLogout.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        alert("Đăng xuất thành công! 👋");
        window.location.href = "login.html";
    });
}

if (btnHistory) {
    btnHistory.addEventListener("click", (event) => {
        event.preventDefault();
        alert("Tính năng Lịch sử đọc tổng hợp đang được phát triển!");
    });
}

// =========================================================================
// 4. LOGIC LẤY DANH SÁCH TRUYỆN HIỂN THỊ RA TRANG CHỦ
// =========================================================================
async function loadStories() {
    if (!storyListEl) return;
    storyListEl.innerHTML = "<p>⏳ Đang tải danh sách truyện...</p>";
    
    try {
        const response = await fetch(`${API_BASE_URL}/stories`, {
            method: 'GET',
            headers: authHeaders // Gửi kèm token để xác thực Admin
        });
        
        const stories = await response.json();
        
        if (response.ok) {
            storyListEl.innerHTML = "";
            if (stories.length === 0) {
                storyListEl.innerHTML = "<p>Chưa có truyện nào trong tủ.</p>";
                return;
            }
            
            stories.forEach(story => {
                const div = document.createElement("div");
                div.className = "story-card";
                // Render thẻ truyện (bạn có thể chỉnh sửa HTML thẻ này theo CSS hiện tại của bạn)
                div.innerHTML = `
                    <h3><a href="detail.html?id=${story.id}" style="color: inherit; text-decoration: none;">${story.title}</a></h3>
                    <p style="font-size: 14px; margin-top: 5px;">Tác giả: ${story.author || "Đang cập nhật"}</p>
                `;
                storyListEl.appendChild(div);
            });
        } else {
            storyListEl.innerHTML = `<p style="color:red">Lỗi: ${stories.detail || "Không thể tải truyện"}</p>`;
        }
    } catch (error) {
        console.error("Lỗi tải truyện:", error);
        storyListEl.innerHTML = "<p style='color:red'>Lỗi kết nối đến server!</p>";
    }
}

// =========================================================================
// 5. LOGIC THÊM TRUYỆN MỚI
// =========================================================================
if (btnAddStory) {
    btnAddStory.addEventListener("click", async () => {
        const title = addTitle.value.trim();
        const author = addAuthor.value.trim();
        const genre = addGenre.value.trim();
        const docId = addDocId.value.trim();
        const description = addDescription ? addDescription.value.trim() : "";

        if (!title || !docId) {
            alert("⚠️ Vui lòng nhập Tên truyện và Google Doc ID!");
            return;
        }

        // Đổi trạng thái nút bấm
        const originalText = btnAddStory.innerText;
        btnAddStory.innerText = "⏳ Đang thêm...";
        btnAddStory.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/stories`, {
                method: 'POST',
                headers: authHeaders, // BẮT BUỘC có để không bị lỗi 401
                body: JSON.stringify({
                    title: title,
                    author: author,
                    genre: genre,
                    url: docId, // Hoặc 'source_url' tùy thuộc vào Backend của bạn
                    description: description
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert("✅ Thêm truyện thành công!");
                
                // Xóa rỗng các ô nhập liệu
                addTitle.value = "";
                addAuthor.value = "";
                addGenre.value = "";
                addDocId.value = "";
                if(addDescription) addDescription.value = "";
                
                // Load lại danh sách truyện mới nhất
                loadStories();
            } else {
                alert("❌ Lỗi thêm truyện: " + (result.detail || "Không rõ nguyên nhân"));
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không thể kết nối đến máy chủ!");
        } finally {
            btnAddStory.innerText = originalText;
            btnAddStory.disabled = false;
        }
    });
}

// =========================================================================
// 6. KHỞI CHẠY HỆ THỐNG KHI MỞ WEB
// =========================================================================
loadStories();