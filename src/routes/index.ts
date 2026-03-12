import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();
const auth = new AuthController();

router.post("/auth/login", auth.loginUser.bind(auth));
router.post("/auth/login/professional", auth.loginProfessional.bind(auth));
router.post("/auth/login/admin", auth.loginGymAdmin.bind(auth));
router.post("/auth/change-password", authenticate, auth.changePassword.bind(auth));
router.get("/auth/me", authenticate, auth.me.bind(auth));

export default router;