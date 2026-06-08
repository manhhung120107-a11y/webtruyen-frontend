// Kiểm tra xem đã đăng nhập chưa
const token = localStorage.getItem("access_token");
const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` // Thẻ thông hành Admin
};
if (!token) {
    window.location.href = "login.html"; // Chưa đăng nhập thì đuổi về trang login
}

// Thêm tính năng Đăng xuất (Gắn vào thẻ h2 ở index.html hoặc tạo một nút mới)
// Nếu muốn nhanh, bạn có thể tạo 1 nút Đăng xuất trong index.html và gọi hàm này:
function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}

const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api";
const storyListEl = document.getElementById("story-list");
const btnTheme = document.getElementById("btn-theme");

// Tính năng Dark Mode cho trang chủ
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

// Kiểm tra phân quyền hiển thị Admin ở trang chủ
const loggedInUser = localStorage.getItem("username");
if (loggedInUser !== "admin") {
    const adminSection = document.getElementById("admin-add-section");
    if (adminSection) {
        adminSection.style.display = "none"; // Nếu không phải admin thì ẩn cụm thêm truyện đi
    }
}

// Lấy danh sách truyện từ Backend
async function loadStories() {
    try {
        const response = await fetch(`${API_BASE_URL}/stories/`);
        const stories = await response.json();

        storyListEl.innerHTML = ""; // Xóa chữ "Đang tải..."

        if (stories.length === 0) {
            storyListEl.innerHTML = "<p>Chưa có bộ truyện nào trong tủ.</p>";
            return;
        }

        stories.forEach(story => {
            const card = document.createElement("div");
            card.className = "story-card";
            card.innerHTML = `
                <div class="story-title">${story.title}</div>
                <div class="story-author">Tác giả: ${story.author}</div>
            `;
            
            // Khi click vào truyện, chuyển hướng sang trang chi tiết kèm theo ID truyện
            card.addEventListener("click", () => {
                window.location.href = `detail.html?id=${story.id}`;
            });

            storyListEl.appendChild(card);
        });

    } catch (error) {
        storyListEl.innerHTML = `<p style="color:red">Lỗi tải danh sách truyện!</p>`;
        console.error(error);
    }
}

loadStories();

// --- TÍNH NĂNG GỬI DỮ LIỆU TẠO TRUYỆN MỚI ---
document.getElementById("btn-add-story").addEventListener("click", async () => {
    const title = document.getElementById("add-title").value.trim();
    const author = document.getElementById("add-author").value.trim();
    const genre = document.getElementById("add-genre").value.trim();
    const googleDocId = document.getElementById("add-doc-id").value.trim();
    const description = document.getElementById("add-description").value.trim();

    // Kiểm tra dữ liệu bắt buộc đầu vào
    if (!title || !googleDocId) {
        alert("Vui lòng điền đầy đủ Tên truyện và Google Doc ID!");
        return;
    }

    const payload = {
        title: title,
        author: author,
        genre: genre,
        google_doc_id: googleDocId,
        description: description
    };

    try {
        const response = await fetch(`${API_BASE_URL}/stories/`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            
            // Xóa sạch dữ liệu đã nhập trong form
            document.getElementById("add-title").value = "";
            document.getElementById("add-author").value = "";
            document.getElementById("add-genre").value = "";
            document.getElementById("add-doc-id").value = "";
            document.getElementById("add-description").value = "";

            // Tải lại danh sách tủ truyện để cập nhật bộ truyện mới lên màn hình
            loadStories();
        } else {
            alert("Lỗi khi thêm: " + result.detail);
        }
    } catch (error) {
        console.error(error);
        alert("Không thể kết nối đến server để thêm truyện.");
    }
});