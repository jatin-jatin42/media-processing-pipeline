import { Router } from "express";
import {
    register,
    login,
    logout,
    refreshAccessToken,
    changeCurrentPassword,
    updateUserDetail,
    getCurrentUser,
    getAllTenantUsers,
    changeUserRole,
    deleteUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-access-token").post(refreshAccessToken);

// Protected routes (require valid JWT)
router.route("/logout").post(verifyJWT, logout);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-details").patch(verifyJWT, updateUserDetail);

// Admin/Editor routes
router.route("/tenant-users").get(
    verifyJWT,
    authorizeRoles("Admin", "Editor"),
    getAllTenantUsers
);

// Admin Only User Management
router.route("/:userId/role").patch(
    verifyJWT,
    authorizeRoles("Admin"),
    changeUserRole
);

router.route("/:userId").delete(
    verifyJWT,
    authorizeRoles("Admin"),
    deleteUser
);

export default router;