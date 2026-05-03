import { ApiError } from "../utils/ApiError.js";

/**
 * authorizeRoles(...roles)
 * Usage: router.get("/admin", verifyJWT, authorizeRoles("Admin"), handler)
 * Must be placed AFTER verifyJWT (which sets req.user).
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied — requires one of: [${allowedRoles.join(", ")}]`
            );
        }
        next();
    };
};

export { authorizeRoles };
