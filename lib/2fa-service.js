/**
 * ✅ 2FA Service (Google Authenticator / TOTP)
 * Authentification double facteur pour admins
 */

class TwoFactorService {
  constructor() {
    this.userSecrets = new Map(); // userId -> { secret, enabled, backupCodes }
  }

  /**
   * Générer secret TOTP et QR code
   */
  generateSecret(email, appName = 'RoomRover') {
    // Générer secret aléatoire de 32 caractères
    const secret = this._generateRandomSecret(32);

    // Créer URL otpauth pour QR code
    const otpauthUrl = this._generateOtpauthUrl(email, secret, appName);

    // Générer codes de secours
    const backupCodes = this._generateBackupCodes(10);

    return {
      secret,
      otpauth_url: otpauthUrl,
      qr_code_url: this._generateQRCodeDataUrl(otpauthUrl),
      backup_codes: backupCodes,
      message: 'Scannez ce QR code avec Google Authenticator ou une app TOTP',
    };
  }

  /**
   * Vérifier un token TOTP
   */
  verifyToken(token, secret) {
    if (!/^\d{6}$/.test(token)) {
      return false;
    }

    // Vérifier le token actuel et les deux précédents (fenêtre de 30 secondes)
    const timeCounter = Math.floor(Date.now() / 1000 / 30);
    
    for (let i = -1; i <= 1; i++) {
      const counter = timeCounter + i;
      const expectedToken = this._generateTOTPToken(secret, counter);
      
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  /**
   * Activer 2FA pour un utilisateur
   */
  enableTwoFactor(userId, secret, backupCodes) {
    this.userSecrets.set(userId, {
      secret,
      enabled: true,
      backup_codes: backupCodes,
      enabled_at: new Date(),
    });

    console.log(`✅ 2FA enabled for user ${userId}`);
    return { success: true };
  }

  /**
   * Désactiver 2FA
   */
  disableTwoFactor(userId) {
    this.userSecrets.delete(userId);
    console.log(`✅ 2FA disabled for user ${userId}`);
    return { success: true };
  }

  /**
   * Vérifier si 2FA est activé
   */
  isTwoFactorEnabled(userId) {
    const data = this.userSecrets.get(userId);
    return data ? data.enabled : false;
  }

  /**
   * Obtenir secret (admin seulement)
   */
  getSecret(userId) {
    const data = this.userSecrets.get(userId);
    return data ? data.secret : null;
  }

  /**
   * Utiliser un code de secours
   */
  useBackupCode(userId, code) {
    const data = this.userSecrets.get(userId);

    if (!data) {
      return { valid: false, message: '2FA not enabled' };
    }

    const index = data.backup_codes.indexOf(code);

    if (index === -1) {
      return { valid: false, message: 'Invalid backup code' };
    }

    // Supprimer le code utilisé
    data.backup_codes.splice(index, 1);
    this.userSecrets.set(userId, data);

    const remaining = data.backup_codes.length;
    return {
      valid: true,
      message: `Backup code valide. ${remaining} codes restants`,
      remaining_codes: remaining,
    };
  }

  /**
   * Générer de nouveaux codes de secours
   */
  regenerateBackupCodes(userId) {
    const data = this.userSecrets.get(userId);

    if (!data) {
      throw new Error('2FA not enabled for this user');
    }

    const newCodes = this._generateBackupCodes(10);
    data.backup_codes = newCodes;
    this.userSecrets.set(userId, data);

    return {
      backup_codes: newCodes,
      message: 'New backup codes generated',
    };
  }

  /**
   * Obtenir statut 2FA utilisateur
   */
  getUserTwoFactorStatus(userId) {
    const data = this.userSecrets.get(userId);

    if (!data) {
      return {
        enabled: false,
        message: '2FA not enabled',
      };
    }

    return {
      enabled: data.enabled,
      enabled_at: data.enabled_at,
      backup_codes_remaining: data.backup_codes.length,
    };
  }

  /**
   * ========== MÉTHODES PRIVÉES ==========
   */

  /**
   * Générer secret aléatoire
   */
  _generateRandomSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Générer URL otpauth
   */
  _generateOtpauthUrl(email, secret, appName = 'RoomRover') {
    return `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`;
  }

  /**
   * Générer URL QR code (version texte simulée)
   */
  _generateQRCodeDataUrl(otpauthUrl) {
    // En production: utiliser qrcode package
    // Pour démo: simplement retourner l'URL otpauth
    return `data:text/plain;base64,${Buffer.from(otpauthUrl).toString('base64')}`;
  }

  /**
   * Générer codes de secours
   */
  _generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Format: XXXX-XXXX (8 caractères)
      const code = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Générer token TOTP (simplifié)
   */
  _generateTOTPToken(secret, counter) {
    // Ceci est une implémentation simplifiée
    // En production: utiliser 'speakeasy' ou 'otplib'
    
    // Pour démo: utiliser un hash simple basé sur secret + counter
    const hash = require('crypto')
      .createHmac('sha1', Buffer.from(this._base32Decode(secret)))
      .update(this._int32ToBuffer(counter))
      .digest();

    const offset = hash[hash.length - 1] & 0xf;
    let otp = (hash[offset] & 0x7f) << 24
      | (hash[offset + 1] & 0xff) << 16
      | (hash[offset + 2] & 0xff) << 8
      | (hash[offset + 3] & 0xff);

    otp = otp % 1000000;

    return String(otp).padStart(6, '0');
  }

  /**
   * Décoder Base32
   */
  _base32Decode(encoded) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let value = 0;

    for (let i = 0; i < encoded.length; i++) {
      const index = alphabet.indexOf(encoded[i]);
      if (index < 0) throw new Error('Invalid base32 character');
      bits += index.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substring(i, i + 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Convertir entier 32-bit en buffer
   */
  _int32ToBuffer(num) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(num), 0);
    return buffer;
  }

  /**
   * Obtenir tous les utilisateurs avec 2FA activé (admin)
   */
  getAllTwoFactorUsers() {
    const users = [];
    for (const [userId, data] of this.userSecrets.entries()) {
      if (data.enabled) {
        users.push({
          userId,
          enabled_at: data.enabled_at,
          backup_codes_remaining: data.backup_codes.length,
        });
      }
    }
    return users;
  }

  /**
   * Réinitialiser 2FA pour un utilisateur (par admin)
   */
  resetUserTwoFactor(userId) {
    this.userSecrets.delete(userId);
    console.log(`✅ 2FA reset for user ${userId}`);
    return { success: true };
  }
}

// Créer instance singleton
const twoFactorService = new TwoFactorService();

module.exports = twoFactorService;
