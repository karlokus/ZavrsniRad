import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompositionTargetAreaTable1778053274116 implements MigrationInterface {
    name = 'CreateCompositionTargetAreaTable1778053274116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."composition_target_area_targetarea_enum" AS ENUM('NOTE_ACCURACY', 'RHYTHM', 'TEMPO', 'FINGER_DEXTERITY', 'SCALE', 'CHORD')`);
        await queryRunner.query(`CREATE TABLE "composition_target_area" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetArea" "public"."composition_target_area_targetarea_enum" NOT NULL, "difficultyLevel" smallint NOT NULL, "weightPercentage" numeric(5,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "compositionId" uuid NOT NULL, CONSTRAINT "CHK_82636af8c3083606797b166e73" CHECK ("weightPercentage" >= 0 AND "weightPercentage" <= 100), CONSTRAINT "CHK_318edaea75174bc92a2c5ca154" CHECK ("difficultyLevel" >= 1 AND "difficultyLevel" <= 10), CONSTRAINT "PK_5c044da652a08fb6d68f7f6632d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "composition_target_area" ADD CONSTRAINT "FK_1ca54c89d480b22f7811d1ff978" FOREIGN KEY ("compositionId") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "composition_target_area" DROP CONSTRAINT "FK_1ca54c89d480b22f7811d1ff978"`);
        await queryRunner.query(`DROP TABLE "composition_target_area"`);
        await queryRunner.query(`DROP TYPE "public"."composition_target_area_targetarea_enum"`);
    }

}
