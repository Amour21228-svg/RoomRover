class CustomFooter extends HTMLElement {
    connectedCallback() {
        // Détecter le contexte (depuis racine ou pages/)
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '../pages' : './pages';
        
        // Render into light DOM so global styles apply
        this.innerHTML = `
            <style>
                .footer-link {
                    transition: color 0.3s ease;
                }
                .footer-link:hover {
                    color: #3b82f6;
                }
            </style>
            <footer class="bg-gray-800 text-white py-12 dark:bg-gray-900">
                <div class="container mx-auto px-4">
                    <div class="grid md:grid-cols-4 gap-8">
                        <div>
                            <h3 class="text-xl font-bold mb-4">RoomRover</h3>
                            <p class="text-gray-400">
                                La solution intelligente pour la location de chambres entre particuliers et professionnels.
                            </p>
                        </div>
                        
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Liens rapides</h4>
                            <ul class="space-y-2">
                                <li><a href="${isInPages ? '../' : './'}pages/index.html" class="footer-link text-gray-400">Accueil</a></li>
                                <li><a href="${basePath}/properties.html" class="footer-link text-gray-400">Propriétés</a></li>
                                <li><a href="${basePath}/about.html" class="footer-link text-gray-400">À propos</a></li>
                                <li><a href="${basePath}/contact.html" class="footer-link text-gray-400">Contact</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Legal</h4>
                            <ul class="space-y-2">
                                <li><a href="${basePath}/terms.html" class="footer-link text-gray-400">Conditions générales</a></li>
                                <li><a href="${basePath}/privacy.html" class="footer-link text-gray-400">Politique de confidentialité</a></li>
                                <li><a href="${basePath}/cookies.html" class="footer-link text-gray-400">Cookies</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 class="text-lg font-semibold mb-4">Contact</h4>
                            <ul class="space-y-2">
                                <li class="flex items-center">
                                    <i data-feather="mail" class="w-4 h-4 mr-2 text-gray-400"></i>
                                    <span class="text-gray-400">contact@roomrover.com</span>
                                </li>
                                <li class="flex items-center">
                                    <i data-feather="phone" class="w-4 h-4 mr-2 text-gray-400"></i>
                                    <span class="text-gray-400">+33 1 23 45 67 89</span>
                                </li>
                                <li class="flex items-center">
                                    <i data-feather="map-pin" class="w-4 h-4 mr-2 text-gray-400"></i>
                                    <span class="text-gray-400">Paris, France</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2023 RoomRover. Tous droits réservés.</p>
                    </div>
                </div>
                <script>
                    feather.replace();
                </script>
            </footer>
        `;
    }
}

customElements.define('custom-footer', CustomFooter);