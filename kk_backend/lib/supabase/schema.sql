create table farmers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  preferred_language text default 'en',
  farming_preference text default 'conventional',
  created_at timestamptz default now()
);

create table farms (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  farm_size_acres numeric,
  irrigation_method text,
  crop text not null,
  variety text,
  sowing_date date,
  crop_stage text default 'sowing'
);

create table soil_tests (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  ph numeric,
  nitrogen text,
  phosphorus text,
  potassium text,
  organic_carbon numeric,
  ec_salinity numeric,
  report_url text,
  tested_on date default now()
);

create table mandi_prices (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  market text not null,
  price_per_quintal numeric not null,
  trend text default 'stable',
  recorded_on date default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  type text not null,
  message text not null,
  urgency text default 'low',
  is_read boolean default false,
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  role text not null,
  type text default 'text',
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table farmers enable row level security;
alter table farms enable row level security;
alter table soil_tests enable row level security;
alter table chat_messages enable row level security;
alter table alerts enable row level security;

create policy "Farmers see own data" on farmers
  for all using (auth.uid() = id);
create policy "Farmers see own farms" on farms
  for all using (auth.uid() = farmer_id);
create policy "Farmers see own chats" on chat_messages
  for all using (auth.uid() = farmer_id);
create policy "Farmers see own alerts" on alerts
  for all using (auth.uid() = farmer_id);
