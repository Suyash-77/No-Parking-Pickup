import pool from '../config/mysql.js';
import { USER_ROLE, USER_STATUS, VIOLATION_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { getVehicleByPlate } from '../controller/vehiclecontroller.js';

const userModal = {
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password, phone, role, status, is_active, is_verified, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, is_active, is_verified, created_at, role, status
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async createUser(name, email, hashedPassword, phone) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, phone]
    );
    return result.insertId;
  },

  async updatePassword(id, hashedPassword) {
    await pool.query(
      `UPDATE users
       SET password = ?
       WHERE id = ?`,
      [hashedPassword, id]
    );
  },

  async markVerified(id) {
    await pool.query(
      'UPDATE users SET is_verified = TRUE WHERE id = ?',
      [id]
    );
  },

  async updateOtp(userId, otpCode, expiresAt) {
    try {

      const query = `INSERT INTO otps (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'email_verify', ?)`;
      const [result] = await pool.query(query, [userId, otpCode, expiresAt]);
      return result;
    } catch (error) {
      throw new Error("Failed to save OTP to database: " + error.message);
    }
  },

  async findLatestOtp(userId) {
    const query =
      `SELECT id, user_id, otp_code, purpose, expires_at, used, created_at FROM otps 
      WHERE user_id = ? AND purpose = 'email_verify' AND used = FALSE 
      ORDER BY created_at DESC LIMIT 1`;
    const [rows] = await pool.query(query, [userId]);
    return rows[0] || null;
  },

  async markOtpAsUsed(otpId) {
    await pool.query('UPDATE otps SET used = TRUE WHERE id = ?', [otpId]);
  },

  async getallusers(search = '', sort = 'id', order = 'DESC', page = 1, limit = 10) {
    const allowedSorts = ['id', 'name', 'email', 'role', 'status']
    const allowedOrders = ['ASC', 'DESC']
    const safeSort = allowedSorts.includes(sort) ? sort : 'id'
    const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC'
    const offset = (page - 1) * limit
    const searchTerm = `%${search}%`

    const [rows] = await pool.query(
      `SELECT id, name, email, role, status FROM users
        WHERE role = ?
        AND (name LIKE ? OR email LIKE ? )
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?`,
      [USER_ROLE.USER, searchTerm, searchTerm, limit, offset])
    return rows
  },

  async getUsersCount(search = '') {
    const searchTerm = `%${search}%`
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users
        WHERE role = ?
        AND (name LIKE ? OR email LIKE ?)`,
      [USER_ROLE.USER, searchTerm, searchTerm]
    )
    return rows[0].total
  },

  async approveusers(userId) {
    const [result] = await pool.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [USER_STATUS.APPROVED, userId]
    );
    return result;
  },

  async rejectusers(userId) {
    const [result] = await pool.query(
      `UPDATE users SET status = ? where id = ?`,
      [USER_STATUS.REJECTED, userId]
    );
    return result;
  },

  async getFieldViolations(fieldAdminId) {
    const [rows] = await pool.query(
      `SELECT id, plate_number, owner_email, owner_name, location, image_url, fine_amount, status, captured_by, captured_at, paid_at, released_by, released_at FROM violations WHERE captured_by = ? ORDER BY captured_at DESC`,
      [fieldAdminId]
    );
    return rows;
  },

  async createViolation(plate_number, owner_email, owner_name, location, image_url, fine_amount, captured_by) {
    const [result] = await pool.query(
      `INSERT INTO violations (plate_number, owner_email, owner_name, location, image_url, fine_amount, captured_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [plate_number, owner_email, owner_name, location, image_url, fine_amount, captured_by, VIOLATION_STATUS.CAPTURED]
    );
    return result.insertId;
  },

  async getAllViolations(search = '', sort = 'captured_at', order = 'DESC', page = 1, limit = 10) {
    const allowedSorts = ['captured_at', 'plate_number', 'owner_name', 'fine_amount', 'status']
    const allowedOrders = ['ASC', 'DESC']
    const safeSort = allowedSorts.includes(sort) ? sort : 'captured_at'
    const safeOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC'
    const offset = (page - 1) * limit
    const searchTerm = `%${search}%`

    const [rows] = await pool.query(
      `SELECT v.id, v.plate_number, v.owner_email, v.owner_name, v.location, v.image_url,
              v.fine_amount, v.status, v.captured_by, v.captured_at, v.paid_at,
              v.released_by, v.released_at, u.name AS field_admin_name
        FROM violations v
        LEFT JOIN users u ON v.captured_by = u.id
        WHERE v.plate_number LIKE ? OR v.owner_name LIKE ? OR v.location LIKE ? 
        ORDER BY v.${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    )
    return rows
  },

  async getViolationsCount(search = '') {
    const searchTerm = `%${search}%`
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM violations v
        WHERE v.plate_number LIKE ? OR v.owner_name LIKE ? OR v.location LIKE ?`,
      [searchTerm, searchTerm, searchTerm]
    )
    return rows[0].total
  },

  async releaseVehicle(violationId, dashboardAdminId) {
    const [result] = await pool.query(
      `UPDATE violations SET status = ?, paid_at = NOW(), released_by = ?, released_at = NOW()
      WHERE id = ? AND status = ?`,
      [VIOLATION_STATUS.RELEASED, dashboardAdminId, violationId, VIOLATION_STATUS.PAID]
    );
    return result;
  },

  async getViolationStats() {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        SUM(status = ?) AS captured,
        SUM(status = ?) AS notified,
        SUM(status = ?) AS paid,
        SUM(status = ?) AS released
        FROM violations`,
      [VIOLATION_STATUS.CAPTURED, VIOLATION_STATUS.NOTIFIED, VIOLATION_STATUS.PAID, VIOLATION_STATUS.RELEASED]
    )
    const r = rows[0]
    return {
      total: parseInt(r.total) || 0,
      captured: parseInt(r.captured) || 0,
      notified: parseInt(r.notified) || 0,
      paid: parseInt(r.paid) || 0,
      released: parseInt(r.released) || 0
    }
  },

  async updateViolationStatus(violationId, status) {
    const [result] = await pool.query(
      `UPDATE violations SET status = ? WHERE id = ?`,
      [status, violationId]
    )
    return result
  },

  async hasActiveViolation(plate_number) {
    const [rows] = await pool.query(
        `SELECT id, status FROM violations
         WHERE plate_number = ?
         AND status != ?
         ORDER BY captured_at DESC
         LIMIT 1`,
        [plate_number, VIOLATION_STATUS.RELEASED]
    )
    return rows[0] || null
},

  async findVehicleByPlate(plate_number) {
    const [rows] = await pool.query(
      `SELECT id, plate_number, owner_name, owner_email, owner_phone, make, model, color FROM vehicles WHERE plate_number = ?`,
      [plate_number]
    );
    return rows[0] || null;
  },

  async addVehicle(plate_number, owner_name, owner_email, owner_phone, make, model, color) {
    const [result] = await pool.query(
      `INSERT INTO vehicles (plate_number, owner_name, owner_email, owner_phone, make, model, color)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [plate_number, owner_name, owner_email, owner_phone, make, model, color]
    );
    return result.insertId;
  },

  async createPayment(violation_id, amount) {
    const receiptNumber = `RCP${Date.now()}`
    const [result] = await pool.query(
        `INSERT INTO payments (violation_id, amount, payment_status, receipt_no)
         VALUES (?, ?, ?, ?)`,
        [violation_id, amount, PAYMENT_STATUS.PENDING, receiptNumber]
    )
    return { insertId: result.insertId, receiptNumber }
},

  async confirmPayment(violation_id, transaction_id) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE payments
       SET payment_status = ?, transaction_id = ?
       WHERE violation_id = ?`,
        [PAYMENT_STATUS.SUCCESS, transaction_id, violation_id]
      );

      const [result] = await conn.query(
        `UPDATE violations
       SET status = ?, paid_at = NOW()
       WHERE id = ?`,
        [VIOLATION_STATUS.PAID, violation_id]
      );

      await conn.commit();

      return result;

    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async getViolationById(id) {
    const [rows] = await pool.query(
      `SELECT v.id, v.plate_number, v.owner_email, v.owner_name, v.location, v.image_url,
              v.fine_amount, v.status, v.captured_by, v.captured_at, v.paid_at,
              v.released_by, v.released_at, p.payment_status, p.transaction_id, p.payment_status, p.transaction_id
        FROM violations v
        LEFT JOIN payments p ON v.id = p.violation_id
        WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async getViolationsByEmail(email) {
    const [rows] = await pool.query(
      `SELECT id, plate_number, owner_email, owner_name, location, image_url, fine_amount, status, captured_by, captured_at, paid_at, released_by, released_at FROM violations WHERE owner_email = ? ORDER BY captured_at DESC`,
      [email]
    );
    return rows;
  },

  async markAsNotified(violationId) {
    await pool.query(
      `UPDATE violations SET status = ? WHERE id = ?`,
      [VIOLATION_STATUS.NOTIFIED, violationId]
    );
  },

  async getViolationByPlate(plate) {
    const [rows] = await pool.query(
      `SELECT v.id, v.plate_number, v.owner_name, v.owner_email, v.location, v.image_url,
            v.fine_amount, v.status, v.captured_at, v.paid_at, v.released_at,
            p.payment_status, p.transaction_id
   FROM violations v
   LEFT JOIN payments p ON v.id = p.violation_id
   WHERE REPLACE(UPPER(v.plate_number), ' ', '') = ?
     AND v.status != ?
   ORDER BY v.captured_at DESC
   LIMIT 1`,
      [plate, VIOLATION_STATUS.RELEASED]
    )
    return rows[0] ?? null
  },

  async updateUserProfile(id, name, phone) {
    const [result] = await pool.query(
      `UPDATE users SET name = ?, phone = ? WHERE id = ?`, 
      [name, phone, id]
    );
    return result;
  },

  async updateVehicle(id, owner_name, owner_email, owner_phone, make, model, color){
    const [result] = await pool.query(
      `UPDATE vehicles SET owner_name = ?, owner_email = ?, owner_phone = ?, make = ?, model = ?, color = ? WHERE id = ?`,
      [owner_name, owner_email, owner_phone, make, model, color, id]
    );
    return result;
  },

  async getVehiclesByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, plate_number, owner_name, owner_email, owner_phone, make, model, color FROM vehicles WHERE owner_email = ?`,
    [email]
  );
  return rows;
},

async saveFaceDescriptor(userId, descriptor) {
    if (!Array.isArray(descriptor)) {
        throw new Error('Descriptor must be an array')
    }

    await pool.query(
        `UPDATE users SET face_descriptor = ? WHERE id = ?`,
        [JSON.stringify(descriptor), userId]
    )
},

async getFaceDescriptorById(userId) {
    const [rows] = await pool.query(
        `SELECT face_descriptor FROM users WHERE id = ?`,
        [userId]
    )

    const raw = rows[0]?.face_descriptor
    if (!raw) return null

    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!Array.isArray(parsed)) return null
        return new Float32Array(parsed)
    } catch (error) {
        console.error('Invalid face_descriptor JSON for user:', userId, raw)
        return null
    }
}

};

export default userModal;

