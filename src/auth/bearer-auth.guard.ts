import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  private readonly token = process.env.AUTH_TOKEN ?? '';

  canActivate(ctx: ExecutionContext): boolean {
    if (!this.token) throw new Error('AUTH_TOKEN is not set');

    const req = ctx.switchToHttp().getRequest();
    const auth: string | undefined = req.headers['authorization'];

    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();

    const token = auth.slice(7);
    if (token !== this.token) throw new UnauthorizedException();

    return true;
  }
}
