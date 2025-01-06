import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { useNotification } from "../../context/NotificationContext";

// Async thunks
export const fetchUsers = createAsyncThunk("users/fetchAll", async () => {
  const response = await api.get("/users");
  return response.data;
});

export const createUser = createAsyncThunk("users/create", async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
});

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, ...userData }) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  }
);

export const deleteUser = createAsyncThunk("users/delete", async (id) => {
  await api.delete(`/users/${id}`);
  return id;
});

export const changePassword = createAsyncThunk(
  "users/changePassword",
  async ({ id, currentPassword, newPassword }) => {
    const response = await api.post(`/users/${id}/change-password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    loading: false,
    error: null,
    currentUser: null,
    selectedUser: null,
  },
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUserLoading = (state) => state.users.loading;
export const selectUserError = (state) => state.users.error;
export const selectSelectedUser = (state) => state.users.selectedUser;

// Actions
export const { setSelectedUser, clearError } = userSlice.actions;

// Custom hook for user operations with notifications
export const useUserOperations = () => {
  const { showNotification } = useNotification();

  const handleUserOperation = async (operation, ...args) => {
    try {
      await operation(...args);
      showNotification("success", "Operation completed successfully");
    } catch (error) {
      showNotification("error", error.message || "Operation failed");
      throw error;
    }
  };

  return {
    handleCreateUser: (...args) => handleUserOperation(createUser, ...args),
    handleUpdateUser: (...args) => handleUserOperation(updateUser, ...args),
    handleDeleteUser: (...args) => handleUserOperation(deleteUser, ...args),
    handleChangePassword: (...args) =>
      handleUserOperation(changePassword, ...args),
  };
};

export default userSlice.reducer;
