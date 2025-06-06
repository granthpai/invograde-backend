import express, { RequestHandler } from "express";
import {profileController} from "../controllers/profileController";
import { protect } from "../middlewares/authMiddleware";
import {
  validateProfileUpdate,
  validateSkill,
} from "../middlewares/validation";
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
  profileController.uploadResume as RequestHandler
);
router.post(
  "/upload/profile-picture",
  upload.single("profilePicture"),
  profileController.uploadProfilePicture as RequestHandler
);
router.delete("/resume", profileController.deleteResume as RequestHandler);

router.post(
  "/skills",
  validateSkill,
  profileController.addSkill as RequestHandler
);
router.put(
  "/skills/:skillId",
  validateSkill,
  profileController.updateSkill as RequestHandler
);
router.delete(
  "/skills/:skillId",
  profileController.deleteSkill as RequestHandler
);

router.post("/education", profileController.addEducation as RequestHandler);
router.post(
  "/work-experience",
  profileController.addWorkExperience as RequestHandler
);
router.post(
  "/certifications",
  profileController.addCertification as RequestHandler
);

router.put(
  "/education/:educationId",
  profileController.updateEducation as RequestHandler
);
router.delete(
  "/education/:educationId",
  profileController.deleteEducation as RequestHandler
);

router.put(
  "/work-experience/:workExperienceId",
  profileController.updateWorkExperience as RequestHandler
);
router.delete(
  "/work-experience/:workExperienceId",
  profileController.deleteWorkExperience as RequestHandler
);

router.put(
  "/certifications/:certificationId",
  profileController.updateCertification as RequestHandler
);
router.delete(
  "/certifications/:certificationId",
  profileController.deleteCertification as RequestHandler
);

export default router;
