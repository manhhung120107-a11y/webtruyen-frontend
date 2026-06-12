// =========================================================================
// 1. KIỂM TRA ĐĂNG NHẬP
// =========================================================================
const token = localStorage.getItem("access_token");
const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

if (!token) {
    window.location.href = "login.html";
}

const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api";

// =========================================================================
// 2. KHỞI TẠO DOM ELEMENTS
// =========================================================================
const storyListEl = document.getElementById("story-list");
const btnTheme = document.getElementById("btn-theme");

// Các nút menu
const btnArrow = document.getElementById("btn-dropdown-arrow");
const userDropdown = document.getElementById("user-dropdown");
const btnLogout = document.getElementById("menu-logout");
const userInfoName = document.getElementById("user-info-name");

// Form thêm truyện
const btnAddStory = document.getElementById("btn-add-story");

// =========================================================================
// 3. LOGIC GIAO DIỆN & DROPDOWN MŨI TÊN
// =========================================================================
// Dark Mode
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

// Hiển thị User name
const savedUsername = localStorage.getItem("username");
if (savedUsername && userInfoName) {
    userInfoName.innerText = `Hi, ${savedUsername}!`;
}

// CLICK MŨI TÊN ĐỂ MỞ MENU
if (btnArrow && userDropdown) {
    btnArrow.addEventListener("click", (event) => {
        event.stopPropagation();
        userDropdown.classList.toggle("hidden");
    });
}

// Click ra ngoài để đóng menu
document.addEventListener("click", (event) => {
    if (userDropdown && !userDropdown.classList.contains("hidden")) {
        if (!userDropdown.contains(event.target) && btnArrow && !btnArrow.contains(event.target)) {
            userDropdown.classList.add("hidden");
        }
    }
});

// Logic Đăng xuất
if (btnLogout) {
    btnLogout.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        alert("Đăng xuất thành công!");
        window.location.href = "login.html";
    });
}

// =========================================================================
// 4. LẤY DANH SÁCH TRUYỆN (CÓ KIỂM TRA LỖI HTML)
// =========================================================================
async function loadStories() {
    if (!storyListEl) return; // Nếu HTML mất id="story-list", dừng lại ngay, không báo lỗi sập web
    
    storyListEl.innerHTML = "<p>⏳ Đang tải danh sách truyện...</p>";

    try {
        const response = await fetch(`${API_BASE_URL}/stories/`, {
            method: 'GET',
            headers: authHeaders
        });
        
        if (response.status === 401) {
            storyListEl.innerHTML = `<p style="color:red">Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại!</p>`;
            return;
        }

        const stories = await response.json();

        if (response.ok) {
            storyListEl.innerHTML = "";
            if (!Array.isArray(stories) || stories.length === 0) {
                storyListEl.innerHTML = "<p>Chưa có bộ truyện nào trong tủ.</p>";
                return;
            }

            stories.forEach(story => {
                const card = document.createElement("div");
                card.className = "story-card";
                card.innerHTML = `
                    <div class="story-title">${story.title}</div>
                    <div class="story-author">Tác giả: ${story.author || 'Đang cập nhật'}</div>
                `;
                card.addEventListener("click", () => {
                    window.location.href = `detail.html?id=${story.id}`;
                });
                storyListEl.appendChild(card);
            });
        } else {
            storyListEl.innerHTML = `<p style="color:red">Lỗi tải truyện: ${stories.detail || 'Không rõ nguyên nhân'}</p>`;
        }
    } catch (error) {
        console.error(error);
        storyListEl.innerHTML = `<p style="color:red">Không thể kết nối đến máy chủ!</p>`;
    }
}

// =========================================================================
// 5. GỬI FORM THÊM TRUYỆN
// =========================================================================
if (btnAddStory) {
    btnAddStory.addEventListener("click", async () => {
        const title = document.getElementById("add-title").value.trim();
        const googleDocId = document.getElementById("add-doc-id").value.trim();

        if (!title || !googleDocId) {
            alert("Vui lòng điền đầy đủ Tên truyện và Google Doc ID!");
            return;
        }

        const payload = {
            title: title,
            author: document.getElementById("add-author").value.trim(),
            genre: document.getElementById("add-genre").value.trim(),
            google_doc_id: googleDocId,
            description: document.getElementById("add-description").value.trim()
        };

        const originalText = btnAddStory.innerText;
        btnAddStory.innerText = "⏳ Đang thêm...";
        btnAddStory.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/stories/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || "Thêm truyện thành công!");
                document.getElementById("add-title").value = "";
                document.getElementById("add-author").value = "";
                document.getElementById("add-genre").value = "";
                document.getElementById("add-doc-id").value = "";
                document.getElementById("add-description").value = "";
                loadStories();
            } else {
                alert("Lỗi khi thêm: " + (result.detail || "Không rõ nguyên nhân"));
            }
        } catch (error) {
            console.error(error);
            alert("Không thể kết nối đến server để thêm truyện.");
        } finally {
            btnAddStory.innerText = originalText;
            btnAddStory.disabled = false;
        }
    });
}

// Khởi chạy
loadStories();