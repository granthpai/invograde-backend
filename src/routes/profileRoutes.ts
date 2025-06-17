import express, { RequestHandler } from "express";
import { profileController } from "../controllers/profileController";
import { protect } from "../middlewares/authMiddleware";
import { validateProfileUpdate } from "../middlewares/validation";
import { upload } from "../utils/resumeUpload";

const router = express.Router();

router.use(protect);

router.get("/", profileController.getProfile as RequestHandler);
router.put(
  "/",
  validateProfileUpdate,
  profileController.updateProfile as RequestHandler
);
router.post(
  "/upload/resume",
  upload.single("resume"),
  profileController.uploadResume.bind(profileController) as RequestHandler
);
router.post(
  "/upload/profile-picture",
  upload.single("profilePicture"),
  profileController.uploadProfilePicture as RequestHandler
);
router.post(
  "/resume/update-sections",
  profileController.updateResumeSections as RequestHandler
);
router.get(
  "/resume/get-sections",
  profileController.getResumeData as RequestHandler
);
router.delete("/resume", profileController.deleteResume as RequestHandler);

export default router;
