import express from "express";
import { projectController } from "../controllers/projectController";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../utils/fileUpload";

const router = express.Router();

router.get("/", (req, res) => projectController.getAllProjects(req, res));
router.get("/:projectId", protect, (req, res) =>
  projectController.getProjectById(req, res)
);

router.post("/", protect, upload.single("thumbnail"), (req, res) =>
  projectController.createProject(req, res)
);
router.get("/user/projects", protect, (req, res) =>
  projectController.getUserProjects(req, res)
);
router.put("/:projectId", protect, (req, res) =>
  projectController.updateProject(req, res)
);
router.delete("/:projectId", protect, (req, res) =>
  projectController.deleteProject(req, res)
);

router.post(
  "/:projectId/thumbnail",
  protect,
  upload.single("thumbnail"),
  (req, res) => projectController.uploadProjectThumbnail(req, res)
);
router.post("/upload/presigned-url", protect, (req, res) =>
  projectController.getPresignedUploadUrl(req, res)
);

router.post("/:projectId/like", protect, (req, res) =>
  projectController.likeProject(req, res)
);
router.delete("/:projectId/like", protect, (req, res) =>
  projectController.unlikeProject(req, res)
);

export default router;
