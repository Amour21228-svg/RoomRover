// script.js - Utility Functions & Global Initialization

// Initialize Auth Client on page load
const auth = new AuthClient();

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        });
    }

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }

    // Initialize animations
    const animateElements = document.querySelectorAll('.fade-in');
    animateElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });

    // Replace feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});

// Utility: Show Toast/Alert messages
function showAlert(title, message, type = 'info') {
    const alertDiv = document.createElement('div');
    const bgColor = {
        'success': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'error': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        'warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'info': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${bgColor[type] || bgColor['info']}`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <div>
                <h4 class="font-bold">${title}</h4>
                <p class="text-sm">${message}</p>
            </div>
        </div>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('✅ ServiceWorker registered');
        }).catch(err => {
            console.warn('⚠️ ServiceWorker registration failed:', err);
        });
    });
}

// Check if app is running in standalone mode (PWA)
function isRunningStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator.standalone) || 
           (document.referrer.includes('android-app://'));
}

if (isRunningStandalone()) {
    document.documentElement.classList.add('standalone-mode');
}

// Payment Gateway Integration
const paymentProviders = {
    moov_money: {
        name: "Moov Money",
        apiKey: "MOOV_API_KEY",
        endpoint: "https://api.moov-africa.com/payments"
    },
    mtn_money: {
        name: "MTN Mobile Money",
        apiKey: "MTN_API_KEY",
        endpoint: "https://api.mtn.com/v1/payments"
    },
    celtis_cash: {
        name: "Celtis Cash",
        apiKey: "CELTIS_API_KEY",
        endpoint: "https://api.celtis.com/payments"
    },
    wave: {
        name: "Wave",
        apiKey: "WAVE_API_KEY",
        endpoint: "https://api.wave.com/payments"
    },
    flooz: {
        name: "Flooz",
        apiKey: "FLOOZ_API_KEY",
        endpoint: "https://api.flooz.com/v1/transactions"
    }
};

async function processPayment(paymentData) {
    try {
        const provider = paymentProviders[paymentData.method];
        if (!provider) throw new Error('Payment method not supported');
        
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                amount: paymentData.amount,
                currency: 'XOF',
                reference: `RR-${Date.now()}`,
                customer: {
                    phone: paymentData.phone,
                    email: paymentData.email
                },
                metadata: {
                    rental_id: paymentData.rentalId,
                    user_id: paymentData.userId
                }
            })
        });

        if (!response.ok) throw new Error('Payment failed');
        
        const result = await response.json();
        await savePaymentRecord(paymentData, result.transactionId);
        return result;
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
}

async function savePaymentRecord(paymentData, transactionId) {
    await db.collection('payments').add({
        userId: paymentData.userId,
        rentalId: paymentData.rentalId,
        amount: paymentData.amount,
        method: paymentData.method,
        transactionId,
        status: 'completed',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    analytics.logEvent('payment_completed', {
        method: paymentData.method,
        amount: paymentData.amount
    });
}
// Enhanced real-time updates with error handling
function setupRealTimeUpdates() {
// Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            updateUIForUser(user);
            setupUserDataListener(user.uid);
        } else {
            // User is signed out
            updateUIForGuest();
        }
    });
}
// Enhanced UI update with role-based navigation
function updateUIForUser(user) {
// Get user data from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                const role = userData.role;
                
                // Update navbar based on role
                const navbar = document.querySelector('custom-navbar');
                if (navbar) {
                    navbar.shadowRoot.querySelectorAll('.role-specific').forEach(el => el.remove());
                    
                    const navLinks = navbar.shadowRoot.querySelector('.nav-links');
                    if (role === 'owner') {
                        navLinks.innerHTML += `
                            <a href="owner-dashboard.html" class="nav-link role-specific">Tableau de bord</a>
                            <a href="owner-properties.html" class="nav-link role-specific">Mes propriétés</a>
                        `;
                    } else if (role === 'tenant') {
                        navLinks.innerHTML += `
                            <a href="tenant-dashboard.html" class="nav-link role-specific">Tableau de bord</a>
                            <a href="tenant-rental.html" class="nav-link role-specific">Ma location</a>
                        `;
                    }
                    
                    // Update profile section
                    const profileSection = navbar.shadowRoot.querySelector('.profile-section');
                    profileSection.innerHTML = `
                        <img src="${userData.profilePicture || 'http://static.photos/people/200x200/1'}" 
                             class="w-8 h-8 rounded-full" alt="Profile">
                        <span>${userData.firstName || 'Utilisateur'}</span>
                    `;
                }
            }
        });
}

// Setup real-time listener for user data
function setupUserDataListener(userId) {
    return db.collection('users').doc(userId)
        .onSnapshot(doc => {
            if (doc.exists) {
                updateUIForUser({...doc.data(), uid: userId});
            }
        });
}
// Enhanced app initialization with payment handlers
document.addEventListener('DOMContentLoaded', () => {
    // Payment form submission
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'paymentForm') {
            e.preventDefault();
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Traitement en cours...';
                
                const paymentData = {
                    method: form.paymentMethod.value,
                    amount: parseFloat(form.amount.value),
                    phone: form.phone.value,
                    email: form.email.value,
                    userId: auth.currentUser.uid,
                    rentalId: form.rentalId.value
                };
                
                const result = await processPayment(paymentData);
                
                // Show success message
                showAlert('Paiement réussi!', 'Votre paiement a été traité avec succès.', 'success');
                
                // Update UI
                const paymentRow = document.querySelector(`tr[data-rental-id="${paymentData.rentalId}"]`);
                if (paymentRow) {
                    paymentRow.querySelector('.payment-status').innerHTML = `
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Payé
                        </span>
                    `;
                    paymentRow.querySelector('.payment-action').innerHTML = `
                        <a href="pages/receipt.html" class="text-blue-600 hover:text-blue-900 dark:text-blue-400">
                            <i data-feather="download" class="w-4 h-4"></i> Reçu
                        </a>
                    `;
                }
                
                // Close modal if exists
                const modal = document.getElementById('paymentModal');
                if (modal) modal.classList.add('hidden');
                
            } catch (error) {
                showAlert('Erreur de paiement', error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Confirmer le paiement';
                feather.replace();
            }
        }
    });
    
    function showAlert(title, message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <i data-feather="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-6 h-6 mr-2"></i>
                <div>
                    <h4 class="font-bold">${title}</h4>
                    <p>${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(alertDiv);
        feather.replace();
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
// Initialize animations
    const animateElements = document.querySelectorAll('.fade-in');
    animateElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });

    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.payment-method').forEach(method => {
                method.classList.remove('selected');
                if (method.querySelector('input').checked) {
                    method.classList.add('selected');
                }
            });
        });
    });

    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        });
    }

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }

    // Initialize Firebase and real-time updates
    setupRealTimeUpdates();
});

// Performance optimizations
window.addEventListener('load', () => {
    // Lazy load images
    const lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach((lazyImage) => {
            lazyImageObserver.observe(lazyImage);
        });
    }
});
// Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
            
            // Check if the app is launched from homescreen
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                const installButton = document.getElementById('installButton');
                if (installButton) {
                    installButton.style.display = 'block';
                    installButton.addEventListener('click', () => {
                        e.prompt();
                        e.userChoice.then((choiceResult) => {
                            if (choiceResult.outcome === 'accepted') {
                                console.log('User accepted install prompt');
                            } else {
                                console.log('User dismissed install prompt');
                            }
                        });
                    });
                }
            });
            
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Check if app is running in standalone mode
function isRunningStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator.standalone) || 
           (document.referrer.includes('android-app://'));
}

if (isRunningStandalone()) {
    document.documentElement.classList.add('standalone-mode');
}
