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

## Konvencije
- Rute zaštićene JWT guardom globalno; javne označiti s @Auth(AuthType.None)
- user_id uvijek iz request.user, nikad iz tijela/query-ja
- Poslovna logika u providerima, ne u controllerima
- Svi endpointi imaju Swagger dekoratore (@ApiTags, @ApiOperation, @ApiResponse)
- DTO-ovi s class-validator dekoratorima, odvojeni create/update/query
- TypeORM: koristiti synchronize: true, isto kako je u referentnom projektu. (Migracije kasnije)

## Što NE raditi
- Ne vraćati password_hash u responseima (koristiti class-transformer @Exclude ili ručni mapping)
- Ne stavljati Google OAuth iz reference projekta (za sada, kasnije ćemo staviti google OAuth možda i github OAuth)
- Ne kopirati entitete poput Restaurant, Comment, Favorite — to je iz starog projekta