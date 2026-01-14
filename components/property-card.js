class PropertyCard extends HTMLElement {
  connectedCallback() {
    // Render in light DOM so global styles and site typography apply consistently
    this.innerHTML = `
      <style>
        .property-card {
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: white;
        }
        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        }
        .property-image {
          height: 180px;
          width: 100%;
          object-fit: cover;
        }
        .property-content {
          padding: 1.25rem;
        }
        .property-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .property-location {
          display: flex;
          align-items: center;
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
        .property-price {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
        }
        .property-features {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .feature {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
      </style>
      
      <div class="property-card">
        <img src="http://static.photos/house/320x240/1" alt="Property" class="property-image">
        <div class="property-content">
          <h3 class="property-title">Résidence du Parc</h3>
          <div class="property-location">
            <i data-feather="map-pin" class="w-4 h-4"></i>
            <span>12 Rue du Parc, Paris</span>
          </div>
          <div class="property-price">450€/mois</div>
          <div class="property-features">
            <div class="feature">
              <i data-feather="home" class="w-4 h-4"></i>
              <span>18m²</span>
            </div>
            <div class="feature">
              <i data-feather="user" class="w-4 h-4"></i>
              <span>1 pers.</span>
            </div>
          </div>
        </div>
      </div>
      <script>
        feather.replace();
      </script>
    `;
  }
}
customElements.define('property-card', PropertyCard);