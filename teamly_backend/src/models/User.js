const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async create(email) {
    const query = `
      INSERT INTO users (email, created_at, updated_at) 
      VALUES ($1, NOW(), NOW()) 
      RETURNING *
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findOrCreate(email) {
    let user = await this.findByEmail(email);
    if (!user) {
      user = await this.create(email);
    }
    return user;
  }

  static async updateProfile(userId, name, phone, profilePhoto) {
    const query = `
      UPDATE users 
      SET username = $1, 
          phone = $2, 
          profile_photo = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, username, phone, profile_photo, created_at, updated_at
    `;
    const result = await pool.query(query, [name, phone, profilePhoto, userId]);
    return result.rows[0];
  }

  static async getProfile(userId) {
    const query = `
      SELECT id, email, username, phone, profile_photo, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async findByEmailExcludingSelf(email, excludeUserId) {
    const query = `
      SELECT id, email, username, profile_photo 
      FROM users 
      WHERE LOWER(email) = LOWER($1) AND id != $2
    `;
    const result = await pool.query(query, [email, excludeUserId]);
    return result.rows[0];
  }
}

module.exports = User;
