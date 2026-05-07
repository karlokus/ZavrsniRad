import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePracticeSessionTable1778103466439 implements MigrationInterface {
    name = 'CreatePracticeSessionTable1778103466439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "practice_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "noteAccuracy" numeric(5,2) NOT NULL, "rhythmAccuracy" numeric(5,2) NOT NULL, "tempoStability" numeric(5,2) NOT NULL, "tempoBpm" integer NOT NULL, "durationSeconds" integer NOT NULL, "startedAt" TIMESTAMP NOT NULL, "completedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "compositionId" uuid NOT NULL, CONSTRAINT "CHK_9b91379c38c0089de17e522897" CHECK ("tempoBpm" >= 20 AND "tempoBpm" <= 300), CONSTRAINT "CHK_2e6d30d582780f32c015e355fa" CHECK ("durationSeconds" >= 0), CONSTRAINT "CHK_996c65f5162f64babb50b1b847" CHECK ("tempoStability" >= 0 AND "tempoStability" <= 100), CONSTRAINT "CHK_98b95acf6588c9d65a8030990b" CHECK ("rhythmAccuracy" >= 0 AND "rhythmAccuracy" <= 100), CONSTRAINT "CHK_b27eaa115cc0bc290a3eb440b1" CHECK ("noteAccuracy" >= 0 AND "noteAccuracy" <= 100), CONSTRAINT "PK_93fd9aa06e035e43c413a713ba4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_practice_session_user_started" ON "practice_session" ("userId", "startedAt") `);
        await queryRunner.query(`ALTER TABLE "practice_session" ADD CONSTRAINT "FK_5567ce29b8b2998e284f833bfeb" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practice_session" ADD CONSTRAINT "FK_efd1066a02f7f45f680e652163d" FOREIGN KEY ("compositionId") REFERENCES "composition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "practice_session" DROP CONSTRAINT "FK_efd1066a02f7f45f680e652163d"`);
        await queryRunner.query(`ALTER TABLE "practice_session" DROP CONSTRAINT "FK_5567ce29b8b2998e284f833bfeb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_practice_session_user_started"`);
        await queryRunner.query(`DROP TABLE "practice_session"`);
    }

}
