import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserController } from "../controllers/user.controller";

const router = Router();
const auth = new AuthController();
const user = new UserController();

router.post("/auth/login", auth.loginUser.bind(auth));
router.post("/auth/login/professional", auth.loginProfessional.bind(auth));
router.post("/auth/login/admin", auth.loginGymAdmin.bind(auth));
router.post("/auth/change-password", authenticate, auth.changePassword.bind(auth));
router.get("/auth/me", authenticate, auth.me.bind(auth));

router.post('/gyms/:gymId/register', user.register.bind(user));
router.post('/users', authenticate, authorize('GYM_ADMIN'), user.create.bind(user));
router.get('/users', authenticate, authorize('GYM_ADMIN', 'PROFESSIONAL'), user.list.bind(user));
router.get('/users/me', authenticate, authorize('USER'), user.getMe.bind(user));
router.get('/users/:id', authenticate, authorize('GYM_ADMIN', 'PROFESSIONAL'), user.getById.bind(user));
router.put('/users/me', authenticate, authorize('USER'), user.updateProfile.bind(user));
router.put('/users/:id', authenticate, authorize('GYM_ADMIN'), user.updateProfile.bind(user));
router.delete('/users/:id', authenticate, authorize('GYM_ADMIN'), user.deactivate.bind(user));

export default router;