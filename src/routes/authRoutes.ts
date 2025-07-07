import express from "express";
import { body } from "express-validator";
import authController from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validation";

const router = express.Router();

router.post(
  "/check-exists",
  body("emailOrPhone").notEmpty().withMessage("Email or phone is required"),
  validateRequest,
  authController.checkExists
);

router.post(
  "/register",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  authController.register
);

router.post(
  "/verify",
  body("user").notEmpty(),
  body("code").notEmpty(),
  validateRequest,
  authController.verifyContact
);

// router.post(
//   "/resend-verification",
//   body("userId").notEmpty(),
//   body("type").isIn(["email", "phone"]),
//   validateRequest,
//   authController.resendVerificationCode
// );

router.post(
  "/complete-profile",
  body("userId").notEmpty(),
  body("username").notEmpty(),
  body("careerType").notEmpty(),
  validateRequest,
  authController.completeProfile
);

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  authController.login
);
router.post(
  "/google-login",
  body("name").notEmpty(),
  body("email").notEmpty(),
  body("photoURL").notEmpty(),
  validateRequest,
  authController.googleLogin
);

router.get("/me", protect, authController.getMe);

router.post(
  "/forgot-password",
  body("email").isEmail(),
  validateRequest,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  body("token").notEmpty(),
  body("newPassword").isLength({ min: 6 }),
  validateRequest,
  authController.resetPassword
);

router.post("/logout", protect, authController.logout);

export default router;
