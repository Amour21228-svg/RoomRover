class CustomNavbar extends HTMLElement {
    connectedCallback() {
        // Détecter le contexte (depuis racine ou pages/)
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '../pages' : './pages';
        const homeLink = isInPages ? '../pages/index.html' : './pages/index.html';
        
        // Rendu dans le light DOM pour que les styles globaux (Tailwind) s'appliquent
        this.innerHTML = `
            <nav class="bg-white shadow-sm dark:bg-gray-800">
                <div class="container mx-auto px-4 py-3">
                    <div class="flex justify-between items-center">
                        <a href="${homeLink}" class="flex items-center space-x-2">
                            <i data-feather="home" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                            <span class="text-xl font-bold text-gray-800 dark:text-white">RoomRover</span>
                        </a>
                        <div class="hidden md:flex items-center space-x-8">
                            <div class="nav-links flex items-center space-x-8">
                                <a href="${homeLink}" class="nav-link text-gray-600 dark:text-gray-300">Accueil</a>
                                <a href="${basePath}/properties.html" class="nav-link text-gray-600 dark:text-gray-300">Propriétés</a>
                                <a href="${basePath}/about.html" class="nav-link text-gray-600 dark:text-gray-300">À propos</a>
                                <a href="${basePath}/contact.html" class="nav-link text-gray-600 dark:text-gray-300">Contact</a>
                            </div>
                            <div class="flex items-center space-x-4">
                                <button id="darkModeToggle" class="text-gray-600 dark:text-gray-300" aria-label="Basculer le thème">
                                    <i data-feather="moon" class="w-5 h-5"></i>
                                </button>
                                <div id="authButtons">
                                    <a href="${basePath}/login.html" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300">
                                        Connexion
                                    </a>
                                </div>
                                <button id="installButton" class="hidden bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition duration-300">
                                    Installer
                                </button>
                            </div>
                        </div>
                        <button id="mobileMenuButton" class="md:hidden text-gray-600 dark:text-gray-300" aria-label="Menu mobile">
                            <i data-feather="menu" class="w-6 h-6"></i>
                        </button>
                    </div>
                    <div id="mobileMenu" class="mobile-menu md:hidden hidden">
                        <div class="pt-2 pb-4 space-y-2">
                            <a href="${homeLink}" class="block px-3 py-2 text-gray-600 dark:text-gray-300">Accueil</a>
                            <a href="${basePath}/properties.html" class="block px-3 py-2 text-gray-600 dark:text-gray-300">Propriétés</a>
                            <a href="${basePath}/about.html" class="block px-3 py-2 text-gray-600 dark:text-gray-300">À propos</a>
                            <a href="${basePath}/contact.html" class="block px-3 py-2 text-gray-600 dark:text-gray-300">Contact</a>
                            <div class="flex items-center space-x-4 px-3 py-2">
                                <button id="mobileDarkModeToggle" class="text-gray-600 dark:text-gray-300">
                                    <i data-feather="moon" class="w-5 h-5"></i>
                                </button>
                                <a href="${basePath}/login.html" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-300">
                                    Connexion
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        feather.replace();

        // Mobile menu toggle
        const mobileMenuButton = this.querySelector('#mobileMenuButton');
        const mobileMenu = this.querySelector('#mobileMenu');
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Dark mode toggle for mobile and desktop
        const mobileDarkModeToggle = this.querySelector('#mobileDarkModeToggle');
        const darkModeToggle = this.querySelector('#darkModeToggle');
        [mobileDarkModeToggle, darkModeToggle].forEach(btn => {
            if (btn) btn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
            });
        });
    }
}

customElements.define('custom-navbar', CustomNavbar);