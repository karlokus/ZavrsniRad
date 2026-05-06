import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompositionFileTable1778073357413 implements MigrationInterface {
    name = 'CreateCompositionFileTable1778073357413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."composition_file_filetype_enum" AS ENUM('SHEET_IMAGE', 'AUDIO_RECORDING', 'MIDI', 'LYRICS_DOC')`);
        await queryRunner.query(`CREATE TABLE "composition_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileType" "public"."composition_file_filetype_enum" NOT NULL, "fileName" character varying(255) NOT NULL, "objectKey" character varying(500) NOT NULL, "mimeType" character varying(100) NOT NULL, "sizeBytes" bigint NOT NULL, "description" text, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), "compositionId" uuid NOT NULL, "instrumentId" uuid, CONSTRAINT "PK_3d3e1bb4e9be15d4912bd3ee1ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "composition_file" ADD CONSTRAINT "FK_39eb00633c60ec110248734099f" FOREIGN KEY ("compositionId") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "composition_file" ADD CONSTRAINT "FK_7eb3b878a8aaa39fca25af23a87" FOREIGN KEY ("instrumentId") REFERENCES "instrument"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "composition_file" DROP CONSTRAINT "FK_7eb3b878a8aaa39fca25af23a87"`);
        await queryRunner.query(`ALTER TABLE "composition_file" DROP CONSTRAINT "FK_39eb00633c60ec110248734099f"`);
        await queryRunner.query(`DROP TABLE "composition_file"`);
        await queryRunner.query(`DROP TYPE "public"."composition_file_filetype_enum"`);
    }

}
