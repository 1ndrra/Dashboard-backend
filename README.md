A robust, high-performance backend solution for real-time financial analytics.
This system is engineered using a Multi-Tenant Architecture, enabling seamless data isolation and scalability within a unified infrastructure.
Used mongoDB for data persistence, Express.js for http server, and node.js as the run-time.

What is Multi-Tenancy?
-

In modern software engineering, Multi-Tenancy is an architecture where a single instance of a software application serves multiple customers. 
In a financial context, a user in "Organization A" must never be able to see or interact with the sensitive financial data of "Organization B."
Every record in the database from users to transactions is tagged with a unique organizationId.
A custom protectRoute middleware extracts the x-org-id from incoming request headers.
It validates that the authenticated user actually has membership permissions for that specific tenant before a single line of business logic is executed.

Layered Security & Rate Limiting
implement a two-tier defense strategy against automated threats:
- Standard API Limiter: Managed via express-rate-limit to prevent general infrastructure abuse.
- Strict Mutation Limiter: A high-sensitivity limiter applied to POST, PUT, and DELETE routes to mitigate brute-force transaction injection and account takeover attempts.

Database Integrity
- Atomic Signup Flow: utilized a coordinated creation pattern where a User, their Organization, and their Admin permissions are created in a single lifecycle to prevent "ghost" data.
- Soft Deletion: Transactions are never permanently purged on the first call; an isDeleted flag allows for audit trails and accidental data recovery.

API endpoints:
-
Authentication:

- Signup:  /api/auth/signup
- Login:   /api/auth/signin
- Logut:   /api/auth/logout

As we follow a multi tenet architecture, the signup method generates a unique organizationid to map the user to a dashboard workspace. User gains access to a personal dashboard
and can join other workspaces through an invite. A unique username is necessary to keep seperate authentication records.
A random "salt" is generated and combined with the password. This ensures that even if two users have the same password, their stored hashes will be completely different.
Once a user is authenticated, authentication transitions to a stateless session model using JWT. 
This allows the user to access their dashboard without re-entering their password for every request.
Used an Embedded Membership Array within the User model, this MongoDB pattern avoids expensive JOIN operations.

Record Management:

- Create:  /api/record/create
- Search record:  /api/record/fetch
- Update record:  /api/record/update/:id
- Soft Delete: /api/record/delete/:id
- Restore:  /api/record/restore/:id


All financial records are strictly partitioned by organizationId.
This ensures that even though all transactions live in the same MongoDB collection, data leakage between workspaces is architecturally impossible.
Primary Key: organizationId + transactionDate
When updating financial records in a multi-tenant environment, the URL parameters serve as the primary "pointer" to the specific document,
while the request body contains the new data.
Fetch records come paginated so that the historic data no matter how long feel snappy.
To avoid the common floating-point errors in JavaScript (e.g., 0.1+0.2 != 0.3), this records utilize Decimal128 via MongoDB virtuals.
- Security Logic: When a record is created, the backend ignores any organizationId passed in the body.
Instead, it pulls the organizationId from the verified request header. This prevents a user from "injecting" a record into a workspace they don't own.

User Management:

- Add user:  /api/usermanagement/add-member
- Promote user:  /api/usermanagement/promote


User management allows Workspace Owners to invite new members, and adjust permissions for existing users.
Roles are scoped specifically to an organizationId. A user may be an Admin in their personal workspace but only a Viewer in a workspace they were added in
The system verifies the requester has Admin or Owner permissions for the current organizationId and pushes the organizationId and assigned role into the target user's memberships array.
Promotion allows a workspace Owner or Admin to grant higher-level permissions to an existing member.
This is an immediate change that takes effect the next time the target user performs an action or refreshes their dashboard.

- Summary api for dashboard:  /api/user/summary

Fetches a comprehensive financial overview for the active workspace, including total balances, category spending, and monthly trends.
The API uses the activeOrgId from the authenticated user's session, Only records where isDeleted: false are included.
All financial calculations are performed at the database level using MongoDB Aggregation Pipelines to ensure accuracy and speed.

The backend manages bad inputs, and error conditions gracefully, with the help of rate limiting server manages to fend off attacks on expensive operations.
It also acts as a defensive shield, ensuring that one "noisy neighbor" (a user making thousands of requests) doesn't crash the server for everyone else.
Structured the project for maintainability and ease of understanding, using routers and controllers

a test environment for apis:
https://www.postman.com/aviation-pilot-59172093/workspace/dashboard-backend/collection/38385318-2b1a5346-dbb3-4f61-95db-60eeea01c1f6?action=share&creator=38385318

future improvements
-
- implementing a redis cache to decrease load on the server
- Enhanced data integrity and export
- Real time updates







