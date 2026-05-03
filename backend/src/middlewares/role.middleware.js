import { ApiError } from "../utils/ApiError.js";

/**
 * authorizeRoles(...roles)
 * Checks if the user has the required platform-level role.
 * Usage: router.get("/", verifyJWT, authorizeRoles("Admin", "Editor"), handler)
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Forbidden: Requires one of the following roles: [${allowedRoles.join(", ")}]`
            );
        }
        next();
    };
};

/**
 * authorizeOwnerOrAdmin(model)
 * Enforces User Isolation (Multi-Tenancy Requirement #1).
 * Ensures that a user can only access/modify a resource they own, 
 * UNLESS they are a platform Admin.
 */
const authorizeOwnerOrAdmin = (model) => {
    return async (req, res, next) => {
        const resourceId = req.params.videoId || req.params.id;
        const user = req.user;

        if (!resourceId) {
            return next();
        }

        try {
            const resource = await model.findById(resourceId);

            if (!resource) {
                throw new ApiError(404, "Resource not found");
            }

            // 1. Admin bypass: Admins can access anything within the system
            if (user.role === "Admin") {
                return next();
            }

            // 2. Multi-Tenant / User Isolation: Check ownership
            if (resource.owner.toString() !== user._id.toString()) {
                throw new ApiError(
                    403,
                    "Access Denied: You do not own this resource and are not an Admin."
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * authorizeTenant(requiredTenantId)
 * Ensures data segregation between different organisations/groups (Multi-Tenancy Requirement #3).
 */
const authorizeTenant = () => {
    return (req, res, next) => {
        // In a real multi-tenant app, the tenantId might be in a header or subdomain.
        // For this implementation, we use the tenantId attached to the user profile.
        if (!req.user.tenantId) {
            throw new ApiError(403, "Access Denied: No tenant association found for user.");
        }
        
        // This middleware ensures subsequent queries are filtered by this tenantId
        req.tenantId = req.user.tenantId;
        next();
    };
};

export { 
    authorizeRoles, 
    authorizeOwnerOrAdmin,
    authorizeTenant
};
