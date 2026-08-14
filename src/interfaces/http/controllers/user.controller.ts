import { Router, Request, Response } from 'express';
import { IController } from './IController';
import { UserService } from '../../../domain/user/service/user.service';
import { authMiddleware } from '../middlewary/auth.middleware';
import { EPrincipalType } from '../../../domain/auth/interfaces/auth.interface';

export class UserController implements IController {
  router: Router;
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/users/me', authMiddleware, this.getCurrentUser);
    this.router.get('/users', authMiddleware, this.getUsers);
    this.router.get('/users/:id', this.getUserById);
    this.router.post('/users', this.createUser);
    this.router.put('/users/:id', authMiddleware, this.updateUser);
    this.router.post(
      '/users/:id/image',
      authMiddleware,
      this.uploadUserImage,
    );
    this.router.delete('/users/:id', authMiddleware, this.deleteUser);
  }

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.listUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getUserById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    try {
      const newUser = await this.userService.createUser({
        name,
        email,
        password,
      });
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateUser = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const updatedUser = await this.userService.updateUserById(id, updateData);
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  uploadUserImage = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { imageBase64, fileName, mimeType } = req.body;

    try {
      const updatedUser = await this.userService.uploadUserImage(id, {
        imageBase64,
        fileName,
        mimeType,
      });

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message, status: 400 });
    }
  };

  deleteUser = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedUser = await this.userService.deleteUserById(id);
      if (!deletedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const dbUser =
        user.principalType === EPrincipalType.USER
          ? await this.userService.getUserById(user.sub)
          : null;
      res.status(200).json({
        _id: user.sub,
        email: dbUser?.email ?? user.email,
        name: dbUser?.name ?? user.name,
        avatar: dbUser?.avatar ?? null,
        principalType: user.principalType,
        role: dbUser?.role ?? user.role,
        healthProfessionalType: user.healthProfessionalType,
        healthUnitId: user.healthUnitId,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: (error as Error).message,
      });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
