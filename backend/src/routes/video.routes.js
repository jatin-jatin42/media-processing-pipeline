import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    deleteVideo, 
    getAllVideos, 
    getVideoById, 
    uploadVideo, 
    updateVideo,
    streamVideo,
    assignVideo,
    unassignVideo
} from "../controllers/video.controller.js";
import { Video } from "../models/video.model.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles, authorizeOwnerOrAdmin } from "../middlewares/role.middleware.js";

const router = Router();

// All video routes require authentication
router.use(verifyJWT);

router.route("/")
    .get(getAllVideos)
    .post(
        authorizeRoles("Editor", "Admin"),
        upload.fields([
            { name: "thumbnail", maxCount: 1 },
            { name: "videoFile", maxCount: 1 }
        ]),
        uploadVideo
    );

// Streaming route
router.route("/stream/:videoId").get(streamVideo);

router.route("/:videoId")
    .get(getVideoById)
    .patch(
        authorizeRoles("Editor", "Admin"),
        authorizeOwnerOrAdmin(Video),
        upload.single("thumbnail"),
        updateVideo
    )
    .delete(
        authorizeRoles("Editor", "Admin"),
        authorizeOwnerOrAdmin(Video),
        deleteVideo
    );

router.route("/:videoId/assign").post(
    authorizeRoles("Editor", "Admin"),
    assignVideo
);

router.route("/:videoId/unassign").post(
    authorizeRoles("Editor", "Admin"),
    unassignVideo
);

export default router;