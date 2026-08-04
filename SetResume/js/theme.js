class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupListeners();
    }

    getStoredTheme() {
        const session = localStorage.getItem('setresume_session');
        if (session) {
            const sessionData = JSON.parse(session);
            const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
            const user = users.find(u => u.id === sessionData.id);

            if (user && user.settings && user.settings.theme) {
                return user.settings.theme;
            }
        }

        const storedTheme = localStorage.getItem('setresume_theme');
        if (storedTheme) {
            return storedTheme;
        }

        return 'dark';
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('setresume_theme', theme);

        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.checked = theme === 'dark';
        }

        this.updateUserTheme(theme);

        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    updateUserTheme(theme) {
        const session = localStorage.getItem('setresume_session');
        if (!session) return;

        const sessionData = JSON.parse(session);
        const users = JSON.parse(localStorage.getItem('setresume_users')) || [];
        const userIndex = users.findIndex(u => u.id === sessionData.id);

        if (userIndex !== -1) {
            if (!users[userIndex].settings) {
                users[userIndex].settings = {};
            }
            users[userIndex].settings.theme = theme;
            localStorage.setItem('setresume_users', JSON.stringify(users));
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    setupListeners() {
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                this.applyTheme(newTheme);
            });
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'setresume_theme') {
                this.applyTheme(e.newValue);
            }
        });
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

window.themeManager = themeManager;