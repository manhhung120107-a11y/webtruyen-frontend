const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api";

document.getElementById("btn-submit").addEventListener("click", async () => {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    if (!user || !pass) {
        errorMsg.innerText = "Vui lòng nhập đủ thông tin!";
        errorMsg.style.display = "block";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const result = await response.json();

        if (response.ok) {
            // Lưu token vào LocalStorage để dùng cho các trang sau
            localStorage.setItem("access_token", result.access_token);
            localStorage.setItem("username", result.username);
            
            // Chuyển hướng về trang chủ
            window.location.href = "index.html";
        } else {
            errorMsg.innerText = result.detail;
            errorMsg.style.display = "block";
        }
    } catch (error) {
        console.error(error);
        errorMsg.innerText = "Lỗi kết nối đến server!";
        errorMsg.style.display = "block";
    }
});