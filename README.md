# How to Run
# Development (just the database in Docker):

docker compose up db -d              # Start PostgreSQL
npx prisma db push                   # Create tables
npm run db:seed                      # Seed demo data (demo@example.com / demo1234)
npm run dev                          # http://localhost:3000



# Copy .env.example to .env and set NEXTAUTH_SECRET to a real random string
docker compose up -d --build         # Builds app + starts Postgres