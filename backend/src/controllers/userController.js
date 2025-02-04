const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database/pool");

const userController = {
  async register(req, res) {
    try {
      const { username, password, role } = req.body;

      console.log(username, password, role);
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
        [username, hashedPassword, role]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;

      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error during login", error: error.message });
    }
  },

  async getCurrentUser(req, res) {
    try {
      // req.user is set by the auth middleware
      const result = await pool.query(
        "SELECT id, username, role FROM users WHERE id = $1",
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching user", error: error.message });
    }
  },

  async getAllUsers(req, res) {
    try {
      const result = await pool.query(
        "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
      );

      res.json(result.rows);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching users", error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if trying to delete the last admin
      if (userCheck.rows[0].role === "admin") {
        const adminCount = await pool.query(
          "SELECT COUNT(*) FROM users WHERE role = 'admin'"
        );

        if (adminCount.rows[0].count <= 1) {
          return res.status(400).json({
            message: "Cannot delete the last admin user",
          });
        }
      }

      // Delete user
      await pool.query("DELETE FROM users WHERE id = $1", [id]);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting user", error: error.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current password and new password are required",
        });
      }

      // Get user
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];

      // Verify current password
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        id,
      ]);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error changing password", error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, role } = req.body;

      // Check if user exists
      const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if trying to demote the last admin
      if (userCheck.rows[0].role === "admin" && role === "cashier") {
        const adminCount = await pool.query(
          "SELECT COUNT(*) FROM users WHERE role = 'admin'"
        );

        if (adminCount.rows[0].count <= 1) {
          return res.status(400).json({
            message: "Cannot demote the last admin user",
          });
        }
      }

      // Update user
      const result = await pool.query(
        `UPDATE users 
         SET username = COALESCE($1, username),
             role = COALESCE($2, role),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, username, role, created_at`,
        [username, role, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        res.status(400).json({
          message: "Username already exists",
          error: error.message,
        });
      } else {
        res.status(500).json({
          message: "Error updating user",
          error: error.message,
        });
      }
    }
  },
};

module.exports = userController;
