import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776027871859 implements MigrationInterface {
    name = 'InitialSchema1776027871859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."composition_type_enum" AS ENUM('SONG', 'EXERCISE')`);
        await queryRunner.query(`CREATE TABLE "composition" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."composition_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "tempoBpm" integer, "description" text, "youtubeSongUrl" character varying(500), "youtubeInstrumentUrl" character varying(500), "notesMastery" smallint DEFAULT '1', "lyricsMastery" smallint DEFAULT '1', "playingMastery" smallint DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "artistId" uuid, "keySignatureId" uuid, CONSTRAINT "PK_fe1f22ddd91de262f6ef0b5f64d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "composition" ADD CONSTRAINT "FK_0ef05db522ae2c6411706f9eb12" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "composition" ADD CONSTRAINT "FK_c6875b306ee903449525cbfa069" FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "composition" ADD CONSTRAINT "FK_57f4fcf86c360d04d89560e57d0" FOREIGN KEY ("keySignatureId") REFERENCES "key_signature"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "composition" DROP CONSTRAINT "FK_57f4fcf86c360d04d89560e57d0"`);
        await queryRunner.query(`ALTER TABLE "composition" DROP CONSTRAINT "FK_c6875b306ee903449525cbfa069"`);
        await queryRunner.query(`ALTER TABLE "composition" DROP CONSTRAINT "FK_0ef05db522ae2c6411706f9eb12"`);
        await queryRunner.query(`DROP TABLE "composition"`);
        await queryRunner.query(`DROP TYPE "public"."composition_type_enum"`);
    }

}
