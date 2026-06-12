// =========================================================================
// 1. KIỂM TRA PHIÊN ĐĂNG NHẬP
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
// 2. KHỞI TẠO CÁC THÀNH PHẦN DOM
// =========================================================================
const storyListEl = document.getElementById("story-list");
const btnTheme = document.getElementById("btn-theme");

// Các thành phần Menu Mũi Tên Xổ Xuống
const btnArrow = document.getElementById("btn-dropdown-arrow");
const userDropdown = document.getElementById("user-dropdown");
const btnLogout = document.getElementById("menu-logout");
const userInfoName = document.getElementById("user-info-name");

// Các thành phần Cửa sổ Popup Thêm Truyện (Modal)
const btnOpenModal = document.getElementById("btn-open-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const storyModal = document.getElementById("story-modal");
const btnAddStory = document.getElementById("btn-add-story");

// =========================================================================
// 3. XỬ LÝ ẨN HIỆN MENU MŨI TÊN (DROPDOWN)
// =========================================================================
if (btnArrow && userDropdown) {
    btnArrow.addEventListener("click", (event) => {
        event.stopPropagation(); // Ngăn sự kiện lan ra ngoài bấm nhầm đóng menu
        userDropdown.classList.toggle("hidden");
    });
}

// Click bất kỳ vị trí nào bên ngoài thì thu gọn menu lại
document.addEventListener("click", (event) => {
    if (userDropdown && !userDropdown.classList.contains("hidden")) {
        if (!userDropdown.contains(event.target) && btnArrow && !btnArrow.contains(event.target)) {
            userDropdown.classList.add("hidden");
        }
    }
});

// Hiển thị tên tài khoản Admin
const savedUsername = localStorage.getItem("username");
if (savedUsername && userInfoName) {
    userInfoName.innerText = `Hi, ${savedUsername}!`;
}

// Logic Đăng xuất xử lý triệt để
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
// 4. XỬ LÝ ĐÓNG MỞ CỬA SỔ POPUP FORM (MODAL LOGIC)
// =========================================================================
if (btnOpenModal && storyModal) {
    btnOpenModal.addEventListener("click", () => {
        storyModal.classList.remove("hidden"); // Hiện cửa sổ nhập thông tin
    });
}

if (btnCloseModal && storyModal) {
    btnCloseModal.addEventListener("click", () => {
        storyModal.classList.add("hidden"); // Đóng cửa sổ bằng dấu X
    });
}

// Click ra ngoài khoảng không của popup cũng tự động đóng
if (storyModal) {
    storyModal.addEventListener("click", (event) => {
        if (event.target === storyModal) {
            storyModal.classList.add("hidden");
        }
    });
}

// Giao diện Dark mode
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (btnTheme) btnTheme.innerText = "☀️ Diện Sáng";
}

if (btnTheme) {
    btnTheme.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
            btnTheme.innerText = "☀️ Diện Sáng";
        } else {
            localStorage.setItem("theme", "light");
            btnTheme.innerText = "🌙 Diện Tối";
        }
    });
}

// =========================================================================
// 5. TẢI VÀ ĐỔ DỮ LIỆU DANH SÁCH TRUYỆN RA MÀN HÌNH
// =========================================================================
async function loadStories() {
    if (!storyListEl) return;
    storyListEl.innerHTML = "<p>⏳ Đang tải danh sách bộ truyện của bạn...</p>";

    try {
        const response = await fetch(`${API_BASE_URL}/stories/`, {
            method: 'GET',
            headers: authHeaders
        });
        
        if (response.status === 401 || response.status === 403) {
            storyListEl.innerHTML = `<p style="color:red">⚠️ Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại!</p>`;
            return;
        }

        const stories = await response.json();

        if (response.ok) {
            storyListEl.innerHTML = "";
            if (!Array.isArray(stories) || stories.length === 0) {
                storyListEl.innerHTML = "<p>Tủ truyện trống. Hãy bấm nút 'Thêm truyện' ở góc trên để bắt đầu!</p>";
                return;
            }

            stories.forEach(story => {
                const card = document.createElement("div");
                card.className = "story-card";
                card.style.cursor = "pointer";
                card.innerHTML = `
                    <div class="story-title" style="font-weight: bold; font-size: 18px; color: #5d4037;">📚 ${story.title}</div>
                    <div class="story-author" style="font-size: 13px; color: #666; margin-top: 5px;">Tác giả: ${story.author || 'Đang cập nhật'}</div>
                `;
                // Đóng gói chuyển hướng trang đọc chi tiết
                card.addEventListener("click", () => {
                    window.location.href = `detail.html?id=${story.id}`;
                });
                storyListEl.appendChild(card);
            });
        } else {
            storyListEl.innerHTML = `<p style="color:red">Lỗi hệ thống: ${stories.detail || 'Không thể đọc dữ liệu'}</p>`;
        }
    } catch (error) {
        console.error(error);
        storyListEl.innerHTML = `<p style="color:red">❌ Máy chủ backend Render đang khởi động lại hoặc mất kết nối mạng!</p>`;
    }
}

// =========================================================================
// 6. GỬI DỮ LIỆU FORM TỪ POPUP LÊN SERVER
// =========================================================================
if (btnAddStory) {
    btnAddStory.addEventListener("click", async () => {
        const title = document.getElementById("add-title").value.trim();
        const googleDocId = document.getElementById("add-doc-id").value.trim();

        if (!title || !googleDocId) {
            alert("Vui lòng nhập đầy đủ hai thông tin bắt buộc: Tên truyện & Google Doc ID!");
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
        btnAddStory.innerText = "⏳ Hệ thống đang xử lý...";
        btnAddStory.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/stories/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert("🎉 Thêm truyện vào tủ thành công!");
                
                // Xóa sạch dữ liệu cũ trong form để chuẩn bị cho lần sau
                document.getElementById("add-title").value = "";
                document.getElementById("add-author").value = "";
                document.getElementById("add-genre").value = "";
                document.getElementById("add-doc-id").value = "";
                document.getElementById("add-description").value = "";
                
                storyModal.classList.add("hidden"); // Tự động đóng cửa sổ popup lại sau khi lưu thành công
                loadStories(); // Tải lại danh sách truyện mới ngay lập tức
            } else {
                alert("Lỗi từ máy chủ: " + (result.detail || "Không rõ nguyên nhân"));
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi đường truyền kết nối server!");
        } finally {
            btnAddStory.innerText = originalText;
            btnAddStory.disabled = false;
        }
    });
}

// Chạy khởi động ứng dụng
loadStories();