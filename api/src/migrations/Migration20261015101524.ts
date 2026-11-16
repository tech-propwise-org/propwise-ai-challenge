import { Migration } from '@mikro-orm/migrations';

export class Migration20261015101524 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "agencies" ("id" uuid not null, "name" varchar(255) not null, "created_at" timestamptz not null, constraint "agencies_pkey" primary key ("id"));`);

    this.addSql(`create table "agents" ("id" uuid not null, "agency_id" uuid not null, "name" varchar(255) not null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "timezone" varchar(255) not null default 'Asia/Dubai', "created_at" timestamptz not null, constraint "agents_pkey" primary key ("id"));`);
    this.addSql(`alter table "agents" add constraint "agents_email_unique" unique ("email");`);

    this.addSql(`create table "leads" ("id" uuid not null, "agency_id" uuid not null, "assigned_agent_id" uuid null, "name" varchar(255) not null, "phone" varchar(255) null, "email" varchar(255) null, "source" text check ("source" in ('whatsapp', 'website', 'portal', 'referral', 'email')) not null, "status" text check ("status" in ('new', 'contacted', 'qualified', 'viewing', 'negotiating', 'won', 'lost')) not null default 'new', "notes" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "leads_pkey" primary key ("id"));`);
    this.addSql(`create index "leads_agency_id_updated_at_index" on "leads" ("agency_id", "updated_at");`);

    this.addSql(`create table "messages" ("id" uuid not null, "lead_id" uuid not null, "direction" text check ("direction" in ('inbound', 'outbound')) not null, "channel" text check ("channel" in ('whatsapp', 'email', 'sms')) not null, "body" text not null, "sent_at" timestamptz not null, constraint "messages_pkey" primary key ("id"));`);
    this.addSql(`create index "messages_lead_id_sent_at_index" on "messages" ("lead_id", "sent_at");`);

    this.addSql(`create table "properties" ("id" uuid not null, "agency_id" uuid not null, "reference" varchar(255) not null, "title" varchar(255) not null, "area" varchar(255) not null, "building" varchar(255) null, "type" text check ("type" in ('apartment', 'villa', 'townhouse', 'penthouse')) not null, "bedrooms" int not null, "bathrooms" int not null, "size_sqft" int not null, "price_aed" int not null, "annual_rent_aed" int null, "service_charge_aed_per_sqft" double precision null, "status" text check ("status" in ('available', 'reserved', 'sold')) not null default 'available', "description" text not null, "listed_at" timestamptz not null, constraint "properties_pkey" primary key ("id"));`);
    this.addSql(`create index "properties_agency_id_status_price_aed_index" on "properties" ("agency_id", "status", "price_aed");`);
    this.addSql(`create index "properties_agency_id_area_index" on "properties" ("agency_id", "area");`);
    this.addSql(`alter table "properties" add constraint "properties_agency_id_reference_unique" unique ("agency_id", "reference");`);

    this.addSql(`create table "tasks" ("id" uuid not null, "agency_id" uuid not null, "lead_id" uuid not null, "title" varchar(255) not null, "notes" text null, "due_at" timestamptz null, "status" text check ("status" in ('open', 'done')) not null default 'open', "created_by_id" uuid not null, "created_at" timestamptz not null, constraint "tasks_pkey" primary key ("id"));`);
    this.addSql(`create index "tasks_lead_id_due_at_index" on "tasks" ("lead_id", "due_at");`);

    this.addSql(`alter table "agents" add constraint "agents_agency_id_foreign" foreign key ("agency_id") references "agencies" ("id") on update cascade;`);

    this.addSql(`alter table "leads" add constraint "leads_agency_id_foreign" foreign key ("agency_id") references "agencies" ("id") on update cascade;`);
    this.addSql(`alter table "leads" add constraint "leads_assigned_agent_id_foreign" foreign key ("assigned_agent_id") references "agents" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "messages" add constraint "messages_lead_id_foreign" foreign key ("lead_id") references "leads" ("id") on update cascade;`);

    this.addSql(`alter table "properties" add constraint "properties_agency_id_foreign" foreign key ("agency_id") references "agencies" ("id") on update cascade;`);

    this.addSql(`alter table "tasks" add constraint "tasks_agency_id_foreign" foreign key ("agency_id") references "agencies" ("id") on update cascade;`);
    this.addSql(`alter table "tasks" add constraint "tasks_lead_id_foreign" foreign key ("lead_id") references "leads" ("id") on update cascade;`);
    this.addSql(`alter table "tasks" add constraint "tasks_created_by_id_foreign" foreign key ("created_by_id") references "agents" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "agents" drop constraint "agents_agency_id_foreign";`);

    this.addSql(`alter table "leads" drop constraint "leads_agency_id_foreign";`);

    this.addSql(`alter table "properties" drop constraint "properties_agency_id_foreign";`);

    this.addSql(`alter table "tasks" drop constraint "tasks_agency_id_foreign";`);

    this.addSql(`alter table "leads" drop constraint "leads_assigned_agent_id_foreign";`);

    this.addSql(`alter table "tasks" drop constraint "tasks_created_by_id_foreign";`);

    this.addSql(`alter table "messages" drop constraint "messages_lead_id_foreign";`);

    this.addSql(`alter table "tasks" drop constraint "tasks_lead_id_foreign";`);

    this.addSql(`drop table if exists "agencies" cascade;`);

    this.addSql(`drop table if exists "agents" cascade;`);

    this.addSql(`drop table if exists "leads" cascade;`);

    this.addSql(`drop table if exists "messages" cascade;`);

    this.addSql(`drop table if exists "properties" cascade;`);

    this.addSql(`drop table if exists "tasks" cascade;`);
  }

}
