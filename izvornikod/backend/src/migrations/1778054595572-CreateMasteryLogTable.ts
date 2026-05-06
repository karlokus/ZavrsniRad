import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMasteryLogTable1778054595572 implements MigrationInterface {
    name = 'CreateMasteryLogTable1778054595572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."mastery_log_aspect_enum" AS ENUM('NOTES', 'LYRICS', 'PLAYING')`);
        await queryRunner.query(`CREATE TABLE "mastery_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "aspect" "public"."mastery_log_aspect_enum" NOT NULL, "oldValue" smallint NOT NULL, "newValue" smallint NOT NULL, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), "compositionId" uuid NOT NULL, CONSTRAINT "PK_e783263c6ca03ecd02f459dcc9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_mastery_log_composition_changed_at" ON "mastery_log" ("compositionId", "changedAt") `);
        await queryRunner.query(`ALTER TABLE "mastery_log" ADD CONSTRAINT "FK_6f467955f9039228fc38976442b" FOREIGN KEY ("compositionId") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mastery_log" DROP CONSTRAINT "FK_6f467955f9039228fc38976442b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_mastery_log_composition_changed_at"`);
        await queryRunner.query(`DROP TABLE "mastery_log"`);
        await queryRunner.query(`DROP TYPE "public"."mastery_log_aspect_enum"`);
    }

}
