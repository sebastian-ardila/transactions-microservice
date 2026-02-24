import { MigrationInterface, QueryRunner } from 'typeorm';

/** Creates users and transactions tables with FK and index. */
export class CreateUsersAndTransactions1740400000000 implements MigrationInterface {
  name = 'CreateUsersAndTransactions1740400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM('deposit', 'withdraw')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "balance" numeric(15,2) NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "transaction_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "amount" numeric(15,2) NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_transactions" PRIMARY KEY ("transaction_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_user_id" ON "transactions" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD CONSTRAINT "FK_transactions_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("user_id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_user_id"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
  }
}
