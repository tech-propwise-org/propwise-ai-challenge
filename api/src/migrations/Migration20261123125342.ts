import { Migration } from '@mikro-orm/migrations';

export class Migration20261123125342 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "sales" ("id" uuid not null, "area" varchar(255) not null, "building" varchar(255) null, "type" text check ("type" in ('apartment', 'villa', 'townhouse', 'penthouse')) not null, "bedrooms" int not null, "size_sqft" int not null, "price_aed" int not null, "sold_at" timestamptz not null, constraint "sales_pkey" primary key ("id"));`);
    this.addSql(`create index "sales_area_type_bedrooms_sold_at_index" on "sales" ("area", "type", "bedrooms", "sold_at");`);

    this.addSql(`alter table "agencies" add column "whatsapp_number" varchar(255) null, add column "ai_monthly_budget_usd" numeric(12,4) not null default '0', add column "ai_spent_usd" numeric(12,4) not null default '0';`);
    this.addSql(`alter table "agencies" add constraint "agencies_whatsapp_number_unique" unique ("whatsapp_number");`);

    this.addSql(`alter table "agents" add column "areas" jsonb not null default '[]', add column "languages" jsonb not null default '["en"]', add column "on_leave" boolean not null default false;`);

    this.addSql(`alter table "messages" add column "external_id" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "sales" cascade;`);

    this.addSql(`alter table "agencies" drop constraint "agencies_whatsapp_number_unique";`);
    this.addSql(`alter table "agencies" drop column "whatsapp_number", drop column "ai_monthly_budget_usd", drop column "ai_spent_usd";`);

    this.addSql(`alter table "agents" drop column "areas", drop column "languages", drop column "on_leave";`);

    this.addSql(`alter table "messages" drop column "external_id";`);
  }

}
