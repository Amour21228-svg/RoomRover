class PaymentForm extends HTMLElement {
    connectedCallback() {
        // Render into light DOM so validation and styles apply consistently
        this.innerHTML = `
            <style>
                .form-input {
                    margin-bottom: 1rem;
                }
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #1f2937;
                }
                input, select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                }
                .error {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
            </style>
            
            <form id="paymentForm">
                <input type="hidden" name="rentalId" value="">
                <input type="hidden" name="amount" value="">
                <input type="hidden" name="email" value="">
                
                <div class="form-input">
                    <label for="phone">Numéro de téléphone</label>
                    <input type="tel" id="phone" name="phone" required placeholder="Ex: 0701234567">
                    <div id="phoneError" class="error"></div>
                </div>
                
                <payment-methods></payment-methods>
                
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-300 mt-4">
                    Confirmer le paiement
                </button>
            </form>
            
            <script>
                feather.replace();

                // Form validation
                document.querySelector('#paymentForm').addEventListener('submit', function(e) {
                    const phone = this.phone.value.trim();
                    const phoneError = document.getElementById('phoneError');

                    if (!phone.match(/^[0-9]{10}$/)) {
                        phoneError.textContent = 'Veuillez entrer un numéro valide (10 chiffres)';
                        e.preventDefault();
                    } else {
                        phoneError.textContent = '';
                    }
                });
            </script>
        `;
    }
}

customElements.define('payment-form', PaymentForm);