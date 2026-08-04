let userData = null;
let userLinks = [];
let profilePictureData = null;

function loadUserNavbar() {
    const session = localStorage.getItem('setresume_session');
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const sessionData = JSON.parse(session);

    const ddNome = document.getElementById('ddNome');
    if (ddNome) {
        ddNome.textContent = sessionData.name;
    }

    const initials = sessionData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const navAvatar = document.getElementById('navAvatar');
    const dropdownAvatar = document.getElementById('dropdownAvatar');

    if (navAvatar) navAvatar.textContent = initials;
    if (dropdownAvatar) dropdownAvatar.textContent = initials;

    const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
    const user = users.find(u => u.id === sessionData.id);

    if (user && user.profileImage) {
        if (navAvatar) {
            navAvatar.innerHTML = `<img src="${user.profileImage}" alt="Perfil">`;
        }
        if (dropdownAvatar) {
            dropdownAvatar.innerHTML = `<img src="${user.profileImage}" alt="Perfil">`;
        }
    }
}

function checkAuth() {
    const session = localStorage.getItem('setresume_session');
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(session);
}

function loadUserData() {
    const session = checkAuth();
    if (!session) return;

    const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
    const user = users.find(u => u.id === session.id);

    if (user) {
        userData = user;
        populateForm();
    }
}

function populateForm() {
    if (!userData) return;

    const userNameInput = document.getElementById('userName');
    const userBioInput = document.getElementById('userBio');
    const profileInitials = document.getElementById('profileInitials');

    if (userNameInput) userNameInput.value = userData.name || '';
    if (userBioInput) userBioInput.value = userData.bio || '';

    if (profileInitials) {
        const initials = userData.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        profileInitials.textContent = initials;
    }

    if (userData.profileImage) {
        const preview = document.getElementById('profilePicturePreview');
        if (preview) {
            preview.innerHTML = `<img src="${userData.profileImage}" alt="Profile">`;
            profilePictureData = userData.profileImage;
        }
    }

    userLinks = userData.links || [];
    renderLinks();

    const darkModeToggle = document.getElementById('darkModeToggle');
    const emailNotifications = document.getElementById('emailNotifications');

    if (darkModeToggle && window.themeManager) {
        const currentTheme = window.themeManager.getTheme();
        darkModeToggle.checked = currentTheme === 'dark';
    }

    if (emailNotifications) {
        emailNotifications.checked = userData.settings?.emailNotifications || false;
    }
}

document.getElementById('profilePictureInput')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            profilePictureData = event.target.result;
            const preview = document.getElementById('profilePicturePreview');
            if (preview) {
                preview.innerHTML = `<img src="${profilePictureData}" alt="Profile">`;
            }
        };
        reader.readAsDataURL(file);
    }
});

function removeProfilePicture() {
    profilePictureData = null;
    const preview = document.getElementById('profilePicturePreview');
    if (preview && userData) {
        const initials = userData.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        preview.innerHTML = `<span id="profileInitials">${initials}</span>`;
    }
}

function renderLinks() {
    const container = document.getElementById('linksList');
    if (!container) return;

    container.innerHTML = '';

    userLinks.forEach((link, index) => {
        const html = `
      <div class="link-item">
        <input 
          type="url" 
          class="form-input" 
          value="${link}" 
          onchange="updateLink(${index}, this.value)"
          placeholder="https://seu-site.com"
        >
        <button class="link-remove-btn" onclick="removeLink(${index})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function addLink() {
    userLinks.push('');
    renderLinks();
    const inputs = document.querySelectorAll('#linksList input');
    if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
    }
}

function updateLink(index, value) {
    userLinks[index] = value;
}

function removeLink(index) {
    userLinks.splice(index, 1);
    renderLinks();
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value.trim();
    const newPassword = document.getElementById('newPassword')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Por favor, preencha todos os campos de senha!');
        return;
    }

    if (currentPassword !== userData.password) {
        alert('Senha atual incorreta!');
        return;
    }

    if (newPassword.length < 6) {
        alert('A nova senha deve ter no mínimo 6 caracteres!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }

    userData.password = newPassword;

    const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
    const userIndex = users.findIndex(u => u.id === userData.id);

    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('setresume_users', JSON.stringify(users));
    }

    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';

    showSuccessMessage();
    alert('Senha alterada com sucesso!');
}

function saveSettings() {
    const name = document.getElementById('userName')?.value.trim();
    const bio = document.getElementById('userBio')?.value.trim();
    const darkMode = document.getElementById('darkModeToggle')?.checked;
    const emailNotifications = document.getElementById('emailNotifications')?.checked;

    if (!name) {
        alert('O nome não pode estar vazio!');
        return;
    }

    userData.name = name;
    userData.bio = bio;
    userData.profileImage = profilePictureData || '';
    userData.links = userLinks.filter(link => link.trim() !== '');
    userData.settings = {
        theme: darkMode ? 'dark' : 'light',
        emailNotifications: emailNotifications
    };

    const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
    const userIndex = users.findIndex(u => u.id === userData.id);

    if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('setresume_users', JSON.stringify(users));
    }

    const session = JSON.parse(localStorage.getItem('setresume_session'));
    session.name = name;
    localStorage.setItem('setresume_session', JSON.stringify(session));

    const newTheme = darkMode ? 'dark' : 'light';
    if (window.themeManager) {
        window.themeManager.applyTheme(newTheme);
    }

    showSuccessMessage();
}

function deleteAccount() {
    const confirmation = prompt(
        'Esta ação é irreversível! Digite "DELETAR" para confirmar a exclusão da sua conta:'
    );

    if (confirmation === 'DELETAR') {
        const session = checkAuth();
        if (!session) return;

        let users = JSON.parse(localStorage.getItem('setresume_users')) || [];
        users = users.filter(u => u.id !== session.id);
        localStorage.setItem('setresume_users', JSON.stringify(users));

        let resumes = JSON.parse(localStorage.getItem('setresume_resumes')) || [];
        resumes = resumes.filter(r => r.userId !== session.id);
        localStorage.setItem('setresume_resumes', JSON.stringify(resumes));

        localStorage.removeItem('setresume_session');

        alert('Sua conta foi deletada com sucesso. Você será redirecionado para a página inicial.');
        window.location.href = 'index.html';
    } else if (confirmation !== null) {
        alert('Texto incorreto. A conta não foi deletada.');
    }
}

function showSuccessMessage() {
    const message = document.getElementById('successMessage');
    if (message) {
        message.classList.add('show');
        setTimeout(() => {
            message.classList.remove('show');
        }, 3000);
    }
}

window.addLink = addLink;
window.updateLink = updateLink;
window.removeLink = removeLink;
window.removeProfilePicture = removeProfilePicture;
window.changePassword = changePassword;
window.saveSettings = saveSettings;
window.deleteAccount = deleteAccount;
window.addEventListener('themeChanged', (e) => {
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        toggle.checked = e.detail.theme === 'dark';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadUserNavbar();
    loadUserData();

    const toggle = document.getElementById('darkModeToggle');
    if (toggle && window.themeManager) {
        const currentTheme = window.themeManager.getTheme();
        toggle.checked = currentTheme === 'dark';
    }
});