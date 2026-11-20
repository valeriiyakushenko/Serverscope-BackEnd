import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDeveloperDto, RegisterDeveloperDto } from './dto/auth.dto';

@ApiTags('v1/auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new developer account' })
  @ApiCreatedResponse({ description: 'Developer successfully registered' })
  @ApiConflictResponse({ description: 'Email is already in use' })
  register(@Body() dto: RegisterDeveloperDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate developer and receive JWT token' })
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDeveloperDto) {
    return this.authService.login(dto);
  }
}