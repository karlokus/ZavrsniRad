import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameCompositionCategoryColumns1776066635751 implements MigrationInterface {
    name = 'RenameCompositionCategoryColumns1776066635751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "FK_2641d88a5a2c82b36aca9f588fa"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "FK_1e036f42f6c37055d283f2948f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2641d88a5a2c82b36aca9f588f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e036f42f6c37055d283f2948f"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "PK_18b04f35630710a4e311f838372"`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "PK_1e036f42f6c37055d283f2948f8" PRIMARY KEY ("category_id")`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP COLUMN "composition_id"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "PK_1e036f42f6c37055d283f2948f8"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP COLUMN "category_id"`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD "compositionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "PK_89a9c395e6b87bbc429a75b5563" PRIMARY KEY ("compositionId")`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD "categoryId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "PK_89a9c395e6b87bbc429a75b5563"`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "PK_44d1ea6ac5626af850f4dcb7666" PRIMARY KEY ("compositionId", "categoryId")`);
        await queryRunner.query(`CREATE INDEX "IDX_89a9c395e6b87bbc429a75b556" ON "composition_category" ("compositionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dc5aa8e262e8b638d2f0a8e1a8" ON "composition_category" ("categoryId") `);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "FK_89a9c395e6b87bbc429a75b5563" FOREIGN KEY ("compositionId") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "FK_dc5aa8e262e8b638d2f0a8e1a81" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "FK_dc5aa8e262e8b638d2f0a8e1a81"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "FK_89a9c395e6b87bbc429a75b5563"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc5aa8e262e8b638d2f0a8e1a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89a9c395e6b87bbc429a75b556"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "PK_44d1ea6ac5626af850f4dcb7666"`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "PK_89a9c395e6b87bbc429a75b5563" PRIMARY KEY ("compositionId")`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "PK_89a9c395e6b87bbc429a75b5563"`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP COLUMN "compositionId"`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD "category_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "PK_1e036f42f6c37055d283f2948f8" PRIMARY KEY ("category_id")`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD "composition_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "composition_category" DROP CONSTRAINT "PK_1e036f42f6c37055d283f2948f8"`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "PK_18b04f35630710a4e311f838372" PRIMARY KEY ("composition_id", "category_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_1e036f42f6c37055d283f2948f" ON "composition_category" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2641d88a5a2c82b36aca9f588f" ON "composition_category" ("composition_id") `);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "FK_1e036f42f6c37055d283f2948f8" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "composition_category" ADD CONSTRAINT "FK_2641d88a5a2c82b36aca9f588fa" FOREIGN KEY ("composition_id") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
