class CustomOwnerSidebar extends HTMLElement {
    connectedCallback() {
        // Get user info from auth-client
        const user = window.authClient.getUser();
        const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'Propriétaire';
        
        // Render in light DOM so global styles (Tailwind) apply
        this.innerHTML = `
            <style>
                .sidebar-link {
                    transition: all 0.3s ease;
                }
                .sidebar-link:hover {
                    background-color: #f3f4f6;
                    color: #3b82f6;
                }
                .sidebar-link.active {
                    background-color: #e0e7ff;
                    color: #3b82f6;
                }
                .dark .sidebar-link:hover {
                    background-color: #374151;
                }
                .dark .sidebar-link.active {
                    background-color: #1e3a8a;
                }
            </style>
            <aside class="w-64 bg-white dark:bg-gray-800 shadow-md h-screen fixed">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                            ${userDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-white">${userDisplayName}</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Propriétaire</p>
                        </div>
                    </div>
                </div>
                
                <nav class="p-4 space-y-1">
                    <a href="./owner.html" class="sidebar-link active flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="home" class="w-5 h-5"></i>
                        <span>Tableau de bord</span>
                    </a>
                    <a href="./pages/properties.html" class="sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="layers" class="w-5 h-5"></i>
                        <span>Mes propriétés</span>
                    </a>
                    <a href="./pages/search.html" class="sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="users" class="w-5 h-5"></i>
                        <span>Locataires</span>
                    </a>
                    <a href="./pages/receipt.html" class="sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="dollar-sign" class="w-5 h-5"></i>
                        <span>Paiements</span>
                    </a>
                    <a href="./pages/documents.html" class="sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="pie-chart" class="w-5 h-5"></i>
                        <span>Rapports</span>
                    </a>
                    <a href="./pages/properties.html" class="sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="star" class="w-5 h-5"></i>
                        <span>Options Premium</span>
                    </a>
                    <a href="./pages/logout.html" class="sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                        <i data-feather="settings" class="w-5 h-5"></i>
                        <span>Paramètres</span>
                    </a>
                </nav>
                
                <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button id="logoutBtn" class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <i data-feather="log-out" class="w-5 h-5"></i>
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>
            <script>
                feather.replace();
                
                // Logout button handler
                const logoutBtn = this.querySelector('#logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        window.authClient.logout();
                        window.location.href = 'pages/login.html';
                    });
                }

                // Highlight active link
                const currentPath = window.location.pathname.split('/').pop();
                const links = this.querySelectorAll('.sidebar-link');

                links.forEach(link => {
                    if (link.getAttribute('href') === currentPath) {
                        link.classList.add('active');
                    }
                });
            </script>
        `;
    }
}

customElements.define('custom-owner-sidebar', CustomOwnerSidebar);