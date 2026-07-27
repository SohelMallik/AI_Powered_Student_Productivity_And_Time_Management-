document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector("form");
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const issue = document.getElementById("issue");
    const message = document.getElementById("message");
    const resetBtn = document.querySelector('button[type="reset"]');

    // Email validation
    function validateEmail(emailAddress) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(emailAddress);
    }

    // Form validation
    form.addEventListener("submit", function (e) {

        if (name.value.trim() === "") {
            alert("Please enter your full name.");
            name.focus();
            e.preventDefault();
            return;
        }

        if (!validateEmail(email.value.trim())) {
            alert("Please enter a valid email address.");
            email.focus();
            e.preventDefault();
            return;
        }

        if (issue.value === "") {
            alert("Please select an issue.");
            issue.focus();
            e.preventDefault();
            return;
        }

        if (message.value.trim() === "") {
            alert("Please describe your issue.");
            message.focus();
            e.preventDefault();
            return;
        }

        // No maximum character limit
        if (!confirm("Are you sure you want to submit this form?")) {
            e.preventDefault();
        }
    });

    // Reset confirmation
    resetBtn.addEventListener("click", function () {
        setTimeout(function () {
            alert("Form has been reset.");
        }, 100);
    });

    // Auto-hide success alert after 5 seconds
    const alerts = document.querySelectorAll(".alert");

    alerts.forEach(function (alert) {
        setTimeout(function () {
            alert.classList.remove("show");
            alert.classList.add("fade");
            alert.style.display = "none";
        }, 5000);
    });

});