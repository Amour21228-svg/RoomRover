class PaymentMethods extends HTMLElement {
  connectedCallback() {
    // Render into light DOM so styles and interactions are consistent
    this.innerHTML = `
      <style>
        .payment-method {
          display: flex;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .payment-method:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }
        .payment-method.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }
        .payment-method-icon {
          width: 2.5rem;
          height: 2.5rem;
          margin-right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }
        .payment-method-info {
          flex-grow: 1;
        }
        .payment-method-name {
          font-weight: 500;
          color: #1f2937;
        }
        .payment-method-description {
          font-size: 0.875rem;
          color: #6b7280;
        }
        input[type="radio"] {
          display: none;
        }
      </style>
      
      <div class="space-y-3">
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="moov_money" checked>
          <div class="payment-method-icon bg-orange-100 text-orange-600">
            <i data-feather="smartphone"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Moov Money</div>
            <div class="payment-method-description">Paiement via votre compte Moov Money</div>
          </div>
        </label>
        
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="mtn_money">
          <div class="payment-method-icon bg-yellow-100 text-yellow-600">
            <i data-feather="smartphone"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">MTN Money</div>
            <div class="payment-method-description">Paiement via votre compte MTN Mobile Money</div>
          </div>
        </label>
        
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="celtis_cash">
          <div class="payment-method-icon bg-green-100 text-green-600">
            <i data-feather="smartphone"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Celtis Cash</div>
            <div class="payment-method-description">Paiement via votre compte Celtis Cash</div>
          </div>
        </label>
        
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="wave">
          <div class="payment-method-icon bg-blue-100 text-blue-600">
            <i data-feather="smartphone"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Wave</div>
            <div class="payment-method-description">Paiement via l'application Wave</div>
          </div>
        </label>
        
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="flooz">
          <div class="payment-method-icon bg-purple-100 text-purple-600">
            <i data-feather="smartphone"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Flooz</div>
            <div class="payment-method-description">Paiement via votre compte Flooz</div>
          </div>
        </label>
        
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="bank_transfer">
          <div class="payment-method-icon bg-gray-100 text-gray-600">
            <i data-feather="credit-card"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Virement bancaire</div>
            <div class="payment-method-description">Transfert bancaire direct</div>
          </div>
        </label>
        
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="cash">
          <div class="payment-method-icon bg-gray-100 text-gray-600">
            <i data-feather="dollar-sign"></i>
          </div>
          <div class="payment-method-info">
            <div class="payment-method-name">Espèces</div>
            <div class="payment-method-description">Paiement en espèces</div>
          </div>
        </label>
      </div>
      
      <script>
        feather.replace();
        
        // Highlight selected payment method
        this.querySelectorAll('.payment-method').forEach(item => {
          const radio = item.querySelector('input[type="radio"]');
          item.addEventListener('click', () => {
            this.querySelectorAll('.payment-method').forEach(i => {
              i.classList.remove('selected');
            });
            item.classList.add('selected');
            radio.checked = true;
          });

          if (radio.checked) {
            item.classList.add('selected');
          }
        });
      </script>
    `;
  }
}

customElements.define('payment-methods', PaymentMethods);