import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompositionCategoryRelation1776031690868 implements MigrationInterface {
    name = 'AddCompositionCategoryRelation1776031690868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "composition_category" ("composition_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_18b04f35630710a4e311f838372" PRIMARY KEY ("composition_id", "category_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2641d88a5a2c82b36aca9f588f" ON "composition_category" ("composition_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1e036f42f6c37055d283f2948f" ON "composition_category" ("category_id") `);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "FK_2641d88a5a2c82b36aca9f588fa" FOREIGN KEY ("composition_id") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "FK_1e036f42f6c37055d283f2948f8" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "FK_1e036f42f6c37055d283f2948f8"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "FK_2641d88a5a2c82b36aca9f588fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e036f42f6c37055d283f2948f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2641d88a5a2c82b36aca9f588f"`);
        await queryRunner.query(`DROP TABLE "composition_category"`);
    }

}
