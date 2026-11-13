import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeveloperTables1794567555884 implements MigrationInterface {
    name = 'CreateDeveloperTables1794567555884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "developers" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c3b619f396a081afc995c856bdc" UNIQUE ("email"), CONSTRAINT "PK_247719240b950bd26dec14bdd21" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "api_keys" ("id" SERIAL NOT NULL, "key_hash" character varying NOT NULL, "tariff" character varying NOT NULL DEFAULT 'free', "permissions" text, "is_revoked" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "developer_id" integer, CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "api_keys" ADD CONSTRAINT "FK_413f7fb7148d2c157032db70f31" FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT "FK_413f7fb7148d2c157032db70f31"`);
        await queryRunner.query(`DROP TABLE "api_keys"`);
        await queryRunner.query(`DROP TABLE "developers"`);
    }
}