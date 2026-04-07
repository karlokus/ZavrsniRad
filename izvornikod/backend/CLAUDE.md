# Repertoar Backend

Backend za personalizirani sustav za organizaciju repertoara i učenje sviranja.

## Stack
- NestJS, TypeORM, PostgreSQL
- JWT auth, Swagger, class-validator
- Node 20+, TypeScript (strictNullChecks: true, noImplicitAny: false)

## Referentni projekt
Stari projekt (RestoraniZEGE) se nalazi u `../../_reference/old_project_backend/backend`.
Koristi ga kao uzor za arhitektonske obrasce — NE kopiraj domensku logiku
(restorani, verifikacije, favoriti... nemaju veze s ovim projektom).

Što kopirati iz reference:
- Strukturu modula (controller + providers/ + entities/ + dto/ + enums/)
- Auth modul u cijelosti (guards, strategije, @Auth dekorator, AuthType enum)
- Config pattern (src/config/ s appConfig, databaseConfig, environment.validation s Joi)
- main.ts setup (ValidationPipe, Swagger DocumentBuilder, CORS)
- Obrazac višestrukih providera po modulu (CreateXProvider, FindXProvider...)
  umjesto jednog velikog servicea

## Specifikacija
- Tekst zadatka: `../../dokumentacija/hr_0036561324_73.pdf`
- Funkcionalni zahtjevi i model podataka: `../../dokumentacija/funkcionalni_zahtjevi_i_model_podataka.docx`
- Sekcija 1 = Tehnologije
- Sekcija 2 = FZ-ovi (funkcionalni zahtjevi)
- Sekcija 3 = entiteti s atributima
- Sekcija 4 = relacije između entiteta

## Struktura modula
Svaki feature modul slijedi istu strukturu direktorija:
```
module-name/
├── dtos/          (create-xxx.dto.ts, update-xxx.dto.ts, query-xxx.dto.ts)
├── entities/      (xxx.entity.ts)
├── enums/         (xxx.enum.ts)
├── providers/     (xxx.service.ts, find-xxx.provider.ts, create-xxx.provider.ts)
├── xxx.controller.ts
└── xxx.module.ts
```

## Auth obrazac
Nema uloga ni vlasništva — samo: authenticated ili nije.
- AuthenticationGuard (globalni, APP_GUARD) — čita @Auth() dekorator, default = Bearer
- Sve rute zahtijevaju login; javne se označavaju s @Auth(AuthType.None)
- Nema RolesGuard, nema OwnershipGuard, nema @Roles() dekoratora
- user_id uvijek iz JWT payloada (request.user.sub), nikad iz tijela/query-ja
- JWT payload: { sub, email, isBlocked }
- AccessTokenGuard provjerava isBlocked → ForbiddenException

## Config obrazac
- Svaki config u src/config/ koristi registerAs pattern (jwt.config.ts, database.config.ts)
- environment.validation.ts — Joi schema za validaciju env varijabli
- ConfigModule.forRoot({ isGlobal: true, validationSchema })

## DTO obrasci
- UpdateDto = PartialType(CreateDto) — automatski optional
- @Exclude() na osjetljivim poljima (password_hash)
- Query DTO-ovi: @Type(() => Number) za query parametre, @Transform za boolean
- Swagger: @ApiProperty({ description, example }) na svakom polju

## TypeORM obrasci
- @PrimaryGeneratedColumn() default (int), UUID samo kad treba
- @CreateDateColumn() / @UpdateDateColumn() za timestampove
- CASCADE delete na child entitetima (onDelete: 'CASCADE')
- @Check constraint za range validaciju na DB razini
- synchronize: true (migracije kasnije)

## Swagger obrazac
- DocumentBuilder s addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
- Na kontrolerima: @ApiTags, @ApiBearerAuth('access-token'), @ApiOperation, @ApiResponse
- Na DTO-ovima: @ApiProperty / @ApiPropertyOptional s description i example
- Swagger UI serviran na /api ruti

## Konvencije
- Rute zaštićene JWT guardom globalno; javne označiti s @Auth(AuthType.None)
- Poslovna logika u providerima, ne u controllerima
- Svi endpointi imaju Swagger dekoratore (@ApiTags, @ApiOperation, @ApiResponse)
- DTO-ovi s class-validator dekoratorima, odvojeni create/update/query
- ValidationPipe globalni: whitelist, forbidNonWhitelisted, transform, enableImplicitConversion

## Što NE raditi
- Ne vraćati password_hash u responseima (koristiti class-transformer @Exclude ili ručni mapping)
- Ne stavljati Google OAuth iz reference projekta (za sada, kasnije ćemo staviti google OAuth možda i github OAuth)
- Ne kopirati entitete poput Restaurant, Comment, Favorite — to je iz starog projekta