# The whole system

## The four pieces

JWT Pizza is two programs you run, one database, and one outside service.

```mermaid
flowchart LR
  subgraph browser["Your browser"]
    FE["jwt-pizza<br/>React app<br/>localhost:5173"]:::fe
  end
  subgraph dev["Your development environment"]
    BE["jwt-pizza-service<br/>Express API<br/>localhost:3000"]:::be
    DB[("MySQL<br/>database: pizza")]:::db
  end
  subgraph hq["JWT Headquarters"]
    FX["JWT Pizza Factory<br/>pizza-factory.cs329.click"]:::fx
  end
  FE -- "JSON over HTTP<br/>+ Bearer login token" --> BE
  BE -- "SQL queries<br/>(mysql2)" --> DB
  BE -- "new order<br/>+ factory API key" --> FX
  FE -- "verify a pizza JWT" --> FX
  classDef fe fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef be fill:#ccfbf1,stroke:#0f766e,color:#134e4a
  classDef db fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef fx fill:#fef3c7,stroke:#b45309,color:#78350f
```

| Arrow | What travels across it | Where in the code |
| --- | --- | --- |
| Frontend → Backend | JSON requests. After login, every request also carries `Authorization: Bearer <token>`. | `callEndpoint` in `src/service/httpPizzaService.ts` |
| Backend → MySQL | SQL, one new connection per database method | `jwt-pizza-service/src/database/database.js` |
| Backend → Factory | The diner and order, authenticated with the **service's** factory API key, not the user's token | `POST /api/order` in `jwt-pizza-service/src/routes/orderRouter.js` |
| Frontend → Factory | The pizza JWT, to check it's genuine. The backend is not involved. | `verifyOrder` in `httpPizzaService.ts` |

### The course's version of this diagram

From [instruction/jwtPizza](https://github.com/devops329/devops/blob/main/instruction/jwtPizza/jwtPizza.md).
It leaves out the browser → Factory arrow, which is only used when you press **Verify**.

```mermaid
graph TB;
    classDef default fill:#ffffff,stroke:#000000,color:#000000,stroke-width:1px;

    subgraph Your JWT Pizza
    jwtPizza-->jwtPizzaService
    jwtPizzaService-->database
    end
    subgraph JWT Headquarters
    jwtPizzaService-->jwtPizzaFactory
    end
```

## What each folder is for

Two repositories, shown side by side. Only the folders that hold code or matter to you are listed. Every file
gets its own line in [frontend.md](frontend.md) and in `docs/README.md` of jwt-pizza-service.

```text
jwt-pizza/                      FRONTEND: the website people click on
├── index.html                  the one HTML page; loads index.tsx
├── index.tsx                   starts React
├── public/                     files served as-is: pizza images, version.json
├── src/
│   ├── app/                    the shell: routing table (app.tsx), header, footer
│   ├── views/                  one file per page (menu, login, admin dashboard...)
│   ├── components/             small reusable pieces pages are built from (button, card...)
│   ├── hooks/                  reusable React logic (breadcrumb navigation)
│   ├── service/                the ONLY code that talks to the backend
│   └── icons.tsx               SVG icons
├── docs/                       these docs
└── notes.md                    deliverable 1 table: activity → page → endpoint → SQL

jwt-pizza-service/              BACKEND: the API the website calls
├── src/
│   ├── index.js                starts the server on port 3000
│   ├── service.js              builds the Express app and plugs in the routers
│   ├── endpointHelper.js       error type + async wrapper every router uses
│   ├── routes/                 one file per URL group: /api/auth, /api/user, /api/order, /api/franchise
│   ├── database/               ALL the SQL: database.js (queries) and dbModel.js (tables)
│   ├── model/                  the Role names (diner, franchisee, admin)
│   └── config.js               secrets: JWT secret, DB password, factory key (not committed)
├── scripts/                    local helpers: run both apps, seed test data
└── docs/                       backend docs
```

## Who calls whom

Arrows point from the caller to the code it calls. Each layer only talks to the layer next to it: pages never
write SQL, and routers never touch the browser.

```mermaid
flowchart LR
  subgraph FE["jwt-pizza"]
    idx["index.tsx"]:::fe --> app["app/<br/>app.tsx, header, footer"]:::fe
    app --> views["views/<br/>18 pages"]:::fe
    app --> comps["components/"]:::fe
    views --> comps
    views --> hooks["hooks/<br/>useBreadcrumb"]:::fe
    views --> svc["service/<br/>pizzaService"]:::fe
    app --> svc
  end
  subgraph BE["jwt-pizza-service"]
    index["index.js"]:::be --> service["service.js"]:::be
    service --> routes["routes/<br/>4 routers"]:::be
    routes --> helper["endpointHelper.js"]:::be
    routes --> database["database/<br/>database.js"]:::be
    database --> model["model/<br/>Role"]:::be
  end
  svc -- "HTTP fetch" --> service
  database -- "SQL" --> mysql[("MySQL")]:::db
  routes -- "HTTP fetch" --> fx["Factory"]:::fx
  svc -- "HTTP fetch<br/>verify only" --> fx
  classDef fe fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef be fill:#ccfbf1,stroke:#0f766e,color:#134e4a
  classDef db fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef fx fill:#fef3c7,stroke:#b45309,color:#78350f
```

**The three rules this picture shows:**

1. **`src/service/` is the frontend's only door to the network.** To find every backend call the app can make, read
   `httpPizzaService.ts`.
2. **`routes/` decide who is allowed; `database/` does the work.** Permission checks and HTTP status codes live in
   the routers; SQL lives only in `database.js`.
3. **The Factory is called from two places.** The backend calls it to create a pizza, and the browser calls it to
   verify one.
