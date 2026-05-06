import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSetlistTables1778102701506 implements MigrationInterface {
    name = 'CreateSetlistTables1778102701506'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "setlist_composition" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "setlistId" uuid NOT NULL, "compositionId" uuid NOT NULL, CONSTRAINT "UQ_setlist_composition_pair" UNIQUE ("setlistId", "compositionId"), CONSTRAINT "PK_c584a9d5c9436822e8aca5e5727" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "setlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_cc1a344cc660992c152cf3ebf13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "setlist_composition" ADD CONSTRAINT "FK_560e8310d63edcbb4008e171353" FOREIGN KEY ("setlistId") REFERENCES "setlist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "setlist_composition" ADD CONSTRAINT "FK_72b70b92d5859e77c0aec32b1d7" FOREIGN KEY ("compositionId") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "setlist" ADD CONSTRAINT "FK_7f2dbb9270b119d552f1ec8d6dc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "setlist" DROP CONSTRAINT "FK_7f2dbb9270b119d552f1ec8d6dc"`);
        await queryRunner.query(`ALTER TABLE "setlist_composition" DROP CONSTRAINT "FK_72b70b92d5859e77c0aec32b1d7"`);
        await queryRunner.query(`ALTER TABLE "setlist_composition" DROP CONSTRAINT "FK_560e8310d63edcbb4008e171353"`);
        await queryRunner.query(`DROP TABLE "setlist"`);
        await queryRunner.query(`DROP TABLE "setlist_composition"`);
    }

}
