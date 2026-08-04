const tabButtons = document.querySelectorAll('.tab-btn');
const formContents = document.querySelectorAll('.form-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        tabButtons.forEach(btn => btn.classList.remove('active'));
        formContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(targetTab).classList.add('active');

        hideMessages();
    });
});

const passwordToggles = document.querySelectorAll('.password-toggle');

passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const targetId = toggle.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = toggle.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    });
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = message;
    successDiv.classList.add('show');

    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 3000);
}

function hideMessages() {
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');
}

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        const sessionData = {
            id: user.id,
            name: user.name,
            email: user.email,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };

        localStorage.setItem('setresume_session', JSON.stringify(sessionData));

        showSuccess('Login realizado com sucesso! Redirecionando...');

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);

    } else {
        showError('E-mail ou senha incorretos!');
    }
});

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!acceptTerms) {
        showError('Você precisa aceitar os termos de uso!');
        return;
    }

    if (password !== confirmPassword) {
        showError('As senhas não coincidem!');
        return;
    }

    if (password.length < 6) {
        showError('A senha deve ter no mínimo 6 caracteres!');
        return;
    }

    const users = JSON.parse(localStorage.getItem('setresume_users')) || [];

    if (users.find(u => u.email === email)) {
        showError('Este e-mail já está cadastrado!');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
        bio: '',
        profileImage: '',
        links: [],
        settings: {
            theme: 'dark'
        }
    };

    users.push(newUser);
    localStorage.setItem('setresume_users', JSON.stringify(users));

    showSuccess('Conta criada com sucesso! Fazendo login...');

    setTimeout(() => {
        const sessionData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            loginTime: new Date().toISOString(),
            rememberMe: false
        };

        localStorage.setItem('setresume_session', JSON.stringify(sessionData));
        window.location.href = 'home.html';
    }, 1500);
});

window.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('setresume_session');

    if (session) {
        const sessionData = JSON.parse(session);

        if (sessionData.rememberMe || isSessionValid(sessionData.loginTime)) {
            window.location.href = 'home.html';
        } else {
            localStorage.removeItem('setresume_session');
        }
    }
});

function isSessionValid(loginTime) {
    const now = new Date();
    const login = new Date(loginTime);
    const diffHours = (now - login) / (1000 * 60 * 60);

    return diffHours < 24;
}