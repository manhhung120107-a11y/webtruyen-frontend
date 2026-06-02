const API_BASE_URL = "https://webtruyen-fzba.onrender.com/api"; // Bạn nhớ sửa đúng link Render của bạn nhé

document.getElementById("btn-register").addEventListener("click", async () => {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("error-msg");
    const successMsg = document.getElementById("success-msg");

    errorMsg.style.display = "none";
    successMsg.style.display = "none";

    if (!user || !pass) {
        errorMsg.innerText = "Vui lòng nhập đủ thông tin!";
        errorMsg.style.display = "block";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const result = await response.json();

        if (response.ok) {
            successMsg.innerText = result.message;
            successMsg.style.display = "block";
            // Đăng ký xong tự chuyển về login sau 2 giây
            setTimeout(() => { window.location.href = "login.html"; }, 2000);
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