import { db } from "./db";
import { users, teams, teamMembers, projects, workItems, comments, activityLog, projectMembers } from "../shared/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database with comprehensive sample data...");

  try {
    console.log("Clearing existing data...");
    await db.execute(sql`TRUNCATE activity_log, comments, work_items, project_members, team_members, projects, teams, users RESTART IDENTITY CASCADE`);

    const salt = await bcrypt.genSalt(10);
    const passwords = {
      admin: await bcrypt.hash("Admin@123", salt),
      scrum: await bcrypt.hash("Scrum@123", salt),
      user: await bcrypt.hash("User@123", salt),
    };

    console.log("Creating 10 users...");
    const usersList = await db.insert(users).values([
      { username: "admin", email: "admin@company.com", fullName: "Sarah Johnson", password: passwords.admin, role: "ADMIN" as const },
      { username: "scrum", email: "scrum@company.com", fullName: "Michael Chen", password: passwords.scrum, role: "SCRUM_MASTER" as const },
      { username: "dev1", email: "dev1@company.com", fullName: "Alex Rivera", password: passwords.user, role: "USER" as const },
      { username: "dev2", email: "dev2@company.com", fullName: "Priya Patel", password: passwords.user, role: "USER" as const },
      { username: "dev3", email: "dev3@company.com", fullName: "James Wilson", password: passwords.user, role: "USER" as const },
      { username: "dev4", email: "dev4@company.com", fullName: "Emma Zhang", password: passwords.user, role: "USER" as const },
      { username: "dev5", email: "dev5@company.com", fullName: "Carlos Garcia", password: passwords.user, role: "USER" as const },
      { username: "qa1", email: "qa1@company.com", fullName: "Lisa Kim", password: passwords.user, role: "USER" as const },
      { username: "design1", email: "design1@company.com", fullName: "David Okafor", password: passwords.user, role: "USER" as const },
      { username: "pm1", email: "pm1@company.com", fullName: "Rachel Foster", password: passwords.scrum, role: "SCRUM_MASTER" as const },
    ]).returning();

    const u = Object.fromEntries(usersList.map(u => [u.username, u]));

    console.log("Creating 4 teams...");
    const teamsList = await db.insert(teams).values([
      { name: "Alpha Squad", description: "Core platform development team focused on backend services and APIs", createdBy: u.admin.id },
      { name: "Beta Builders", description: "Frontend engineering team building the user experience", createdBy: u.admin.id },
      { name: "QA Tigers", description: "Quality assurance and testing specialists", createdBy: u.scrum.id },
      { name: "Design Crew", description: "UX/UI design and product design team", createdBy: u.pm1.id },
    ]).returning();

    const t = Object.fromEntries(teamsList.map(t => [t.name, t]));

    console.log("Adding team members...");
    await db.insert(teamMembers).values([
      { teamId: t["Alpha Squad"].id, userId: u.admin.id, role: "ADMIN" as const },
      { teamId: t["Alpha Squad"].id, userId: u.scrum.id, role: "MEMBER" as const },
      { teamId: t["Alpha Squad"].id, userId: u.dev1.id, role: "MEMBER" as const },
      { teamId: t["Alpha Squad"].id, userId: u.dev2.id, role: "MEMBER" as const },
      { teamId: t["Alpha Squad"].id, userId: u.dev3.id, role: "MEMBER" as const },
      { teamId: t["Beta Builders"].id, userId: u.pm1.id, role: "ADMIN" as const },
      { teamId: t["Beta Builders"].id, userId: u.dev4.id, role: "MEMBER" as const },
      { teamId: t["Beta Builders"].id, userId: u.dev5.id, role: "MEMBER" as const },
      { teamId: t["Beta Builders"].id, userId: u.design1.id, role: "MEMBER" as const },
      { teamId: t["QA Tigers"].id, userId: u.qa1.id, role: "ADMIN" as const },
      { teamId: t["QA Tigers"].id, userId: u.dev3.id, role: "MEMBER" as const },
      { teamId: t["Design Crew"].id, userId: u.design1.id, role: "ADMIN" as const },
      { teamId: t["Design Crew"].id, userId: u.pm1.id, role: "MEMBER" as const },
    ]);

    console.log("Creating 5 projects...");
    const d = (offset: number) => new Date(Date.now() + offset * 86400000);

    const projectsList = await db.insert(projects).values([
      { key: "ECOMM", name: "E-Commerce Platform", description: "Next-generation online shopping experience with AI-powered recommendations, real-time inventory, and seamless checkout", category: "IN_HOUSE" as const, status: "ACTIVE" as const, createdBy: u.admin.id, teamId: t["Alpha Squad"].id, startDate: d(-90), targetDate: d(60) },
      { key: "MOBIL", name: "Mobile Banking App", description: "Cross-platform mobile banking application with biometric auth, P2P transfers, and investment tracking", category: "CLIENT" as const, status: "ACTIVE" as const, createdBy: u.pm1.id, teamId: t["Beta Builders"].id, startDate: d(-60), targetDate: d(90) },
      { key: "ANALY", name: "Analytics Dashboard", description: "Real-time business intelligence dashboard with customizable widgets, data visualization, and automated reporting", category: "IN_HOUSE" as const, status: "ACTIVE" as const, createdBy: u.admin.id, teamId: t["Alpha Squad"].id, startDate: d(-45), targetDate: d(45) },
      { key: "HRMGT", name: "HR Management System", description: "Comprehensive HR platform for employee onboarding, performance reviews, leave management, and payroll integration", category: "IN_HOUSE" as const, status: "PLANNING" as const, createdBy: u.scrum.id, teamId: t["Design Crew"].id, startDate: d(-10), targetDate: d(120) },
      { key: "SECUR", name: "Security Audit Tool", description: "Automated security scanning and compliance reporting tool for enterprise applications", category: "CLIENT" as const, status: "ACTIVE" as const, createdBy: u.admin.id, teamId: t["QA Tigers"].id, startDate: d(-30), targetDate: d(30) },
    ]).returning();

    const p = Object.fromEntries(projectsList.map(p => [p.key, p]));

    console.log("Adding project members...");
    await db.insert(projectMembers).values([
      { projectId: p.ECOMM.id, userId: u.dev1.id, role: "MEMBER" as const },
      { projectId: p.ECOMM.id, userId: u.dev2.id, role: "MEMBER" as const },
      { projectId: p.MOBIL.id, userId: u.dev4.id, role: "MEMBER" as const },
      { projectId: p.MOBIL.id, userId: u.dev5.id, role: "MEMBER" as const },
      { projectId: p.ANALY.id, userId: u.dev3.id, role: "MEMBER" as const },
      { projectId: p.SECUR.id, userId: u.qa1.id, role: "ADMIN" as const },
    ]);

    console.log("Creating 50 work items...");
    const workItemsData = [
      { externalId: "ECOMM-001", title: "User Authentication System", description: "Implement secure login, registration, and session management with OAuth2 and MFA support", type: "EPIC" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, projectId: p.ECOMM.id, reporterId: u.scrum.id, estimate: "40", actualHours: "25", startDate: d(-80), endDate: d(-20) },
      { externalId: "ECOMM-002", title: "OTP Email Verification", description: "Add email-based one-time password verification for two-factor authentication", type: "STORY" as const, status: "DONE" as const, priority: "HIGH" as const, projectId: p.ECOMM.id, assigneeId: u.dev1.id, reporterId: u.scrum.id, estimate: "8", actualHours: "10", startDate: d(-75), endDate: d(-60), completedAt: d(-58) },
      { externalId: "ECOMM-003", title: "Social Login Integration", description: "Implement Google, Facebook, and Apple sign-in buttons with OAuth2 flow", type: "STORY" as const, status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, projectId: p.ECOMM.id, assigneeId: u.dev2.id, reporterId: u.scrum.id, estimate: "13", actualHours: "6", startDate: d(-40), endDate: d(5) },
      { externalId: "ECOMM-004", title: "Product Catalog API", description: "RESTful API for product CRUD operations with filtering, sorting, and pagination", type: "EPIC" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.ECOMM.id, reporterId: u.admin.id, estimate: "55", actualHours: "30", startDate: d(-70), endDate: d(-10) },
      { externalId: "ECOMM-005", title: "Product Search with Elasticsearch", description: "Implement full-text search with fuzzy matching, faceted filters, and relevance scoring", type: "FEATURE" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.ECOMM.id, assigneeId: u.dev1.id, reporterId: u.admin.id, estimate: "21", startDate: d(5), endDate: d(25) },
      { externalId: "ECOMM-006", title: "Shopping Cart Service", description: "Persistent shopping cart with real-time price updates, stock validation, and guest cart merging", type: "FEATURE" as const, status: "DONE" as const, priority: "CRITICAL" as const, projectId: p.ECOMM.id, assigneeId: u.dev2.id, reporterId: u.scrum.id, estimate: "15", actualHours: "18", startDate: d(-55), endDate: d(-30), completedAt: d(-28) },
      { externalId: "ECOMM-007", title: "Payment Gateway Integration", description: "Integrate Stripe and PayPal for payment processing with webhook handlers", type: "STORY" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.ECOMM.id, assigneeId: u.dev1.id, reporterId: u.admin.id, estimate: "20", actualHours: "12", startDate: d(-25), endDate: d(10) },
      { externalId: "ECOMM-008", title: "Order Management System", description: "Order lifecycle management: placement, processing, shipping, delivery, and returns", type: "EPIC" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.ECOMM.id, reporterId: u.scrum.id, estimate: "50", startDate: d(10), endDate: d(50) },
      { externalId: "ECOMM-009", title: "Inventory Tracking Module", description: "Real-time inventory tracking with low-stock alerts and automated reorder triggers", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.ECOMM.id, assigneeId: u.dev3.id, reporterId: u.admin.id, estimate: "18", startDate: d(15), endDate: d(35) },
      { externalId: "ECOMM-010", title: "Login page CSS breaks on mobile", description: "The login form overflows on screens smaller than 375px, password field is partially hidden", type: "BUG" as const, status: "DONE" as const, priority: "MEDIUM" as const, projectId: p.ECOMM.id, assigneeId: u.dev4.id, reporterId: u.qa1.id, estimate: "3", actualHours: "2", bugType: "UI", severity: "Medium", currentBehavior: "Form overflows viewport on small mobile screens", expectedBehavior: "Form should be responsive and fit within viewport", completedAt: d(-15) },
      { externalId: "ECOMM-011", title: "Cart total miscalculates with discounts", description: "When applying percentage discount codes, the total shows wrong amount for items with existing sale prices", type: "BUG" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, projectId: p.ECOMM.id, assigneeId: u.dev2.id, reporterId: u.qa1.id, estimate: "5", actualHours: "3", bugType: "Logic", severity: "High", currentBehavior: "Discount applied on top of sale price incorrectly", expectedBehavior: "Discount should apply to original price only" },
      { externalId: "ECOMM-012", title: "Email notification templates", description: "Design and implement transactional email templates for order confirmation, shipping, and password reset", type: "TASK" as const, status: "TODO" as const, priority: "LOW" as const, projectId: p.ECOMM.id, assigneeId: u.design1.id, reporterId: u.pm1.id, estimate: "8", startDate: d(20), endDate: d(30) },

      { externalId: "MOBIL-001", title: "Biometric Authentication", description: "Implement fingerprint and Face ID authentication for secure app access", type: "EPIC" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.MOBIL.id, reporterId: u.pm1.id, estimate: "35", actualHours: "20", startDate: d(-55), endDate: d(-5) },
      { externalId: "MOBIL-002", title: "Fingerprint login flow", description: "Integrate device fingerprint sensor for quick login after initial authentication", type: "STORY" as const, status: "DONE" as const, priority: "HIGH" as const, projectId: p.MOBIL.id, assigneeId: u.dev4.id, reporterId: u.pm1.id, estimate: "13", actualHours: "11", startDate: d(-50), endDate: d(-30), completedAt: d(-28) },
      { externalId: "MOBIL-003", title: "Face ID integration", description: "Add Apple Face ID and Android face recognition support for biometric auth", type: "STORY" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, projectId: p.MOBIL.id, assigneeId: u.dev5.id, reporterId: u.pm1.id, estimate: "13", actualHours: "8", startDate: d(-30), endDate: d(0) },
      { externalId: "MOBIL-004", title: "Account Dashboard", description: "Main dashboard showing account balances, recent transactions, and quick action buttons", type: "FEATURE" as const, status: "DONE" as const, priority: "HIGH" as const, projectId: p.MOBIL.id, assigneeId: u.dev4.id, reporterId: u.pm1.id, estimate: "20", actualHours: "22", startDate: d(-45), endDate: d(-15), completedAt: d(-13) },
      { externalId: "MOBIL-005", title: "P2P Money Transfer", description: "Peer-to-peer instant money transfers with contact picker and transaction confirmation", type: "FEATURE" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.MOBIL.id, assigneeId: u.dev5.id, reporterId: u.scrum.id, estimate: "25", actualHours: "15", startDate: d(-20), endDate: d(15) },
      { externalId: "MOBIL-006", title: "Transaction History", description: "Searchable and filterable transaction history with export to PDF/CSV", type: "STORY" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.MOBIL.id, assigneeId: u.dev4.id, reporterId: u.pm1.id, estimate: "10", startDate: d(5), endDate: d(20) },
      { externalId: "MOBIL-007", title: "Push Notification System", description: "Real-time push notifications for transactions, security alerts, and promotional offers", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.MOBIL.id, reporterId: u.pm1.id, estimate: "15", startDate: d(10), endDate: d(30) },
      { externalId: "MOBIL-008", title: "Bill Payment Module", description: "Pay utility bills, credit cards, and subscriptions directly from the app", type: "EPIC" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.MOBIL.id, reporterId: u.pm1.id, estimate: "30", startDate: d(20), endDate: d(60) },
      { externalId: "MOBIL-009", title: "App crashes on Android 12 during transfer", description: "Crash occurs when user tries to confirm P2P transfer on certain Android 12 devices", type: "BUG" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.MOBIL.id, assigneeId: u.dev5.id, reporterId: u.qa1.id, estimate: "5", actualHours: "3", bugType: "Crash", severity: "Critical", currentBehavior: "App crashes with NullPointerException", expectedBehavior: "Transfer should complete successfully" },
      { externalId: "MOBIL-010", title: "Balance display lag after transfer", description: "Account balance takes 10-15 seconds to update after completing a transfer", type: "BUG" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.MOBIL.id, assigneeId: u.dev4.id, reporterId: u.qa1.id, estimate: "3", bugType: "Performance", severity: "Medium", currentBehavior: "Balance updates with 10-15s delay", expectedBehavior: "Balance should update within 2 seconds" },

      { externalId: "ANALY-001", title: "Dashboard Widget Framework", description: "Pluggable widget system allowing users to create custom dashboard layouts with drag-and-drop", type: "EPIC" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.ANALY.id, reporterId: u.admin.id, estimate: "45", actualHours: "28", startDate: d(-40), endDate: d(5) },
      { externalId: "ANALY-002", title: "Chart Component Library", description: "Reusable chart components: bar, line, pie, scatter, heatmap, and treemap using D3.js", type: "FEATURE" as const, status: "DONE" as const, priority: "HIGH" as const, projectId: p.ANALY.id, assigneeId: u.dev3.id, reporterId: u.admin.id, estimate: "20", actualHours: "24", startDate: d(-38), endDate: d(-15), completedAt: d(-12) },
      { externalId: "ANALY-003", title: "Data Source Connectors", description: "Connectors for PostgreSQL, MySQL, MongoDB, REST APIs, and CSV/Excel file imports", type: "FEATURE" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, projectId: p.ANALY.id, assigneeId: u.dev3.id, reporterId: u.admin.id, estimate: "25", actualHours: "14", startDate: d(-20), endDate: d(10) },
      { externalId: "ANALY-004", title: "Real-time Data Streaming", description: "WebSocket-based real-time data updates for live dashboards with configurable refresh intervals", type: "STORY" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.ANALY.id, assigneeId: u.dev1.id, reporterId: u.scrum.id, estimate: "15", startDate: d(5), endDate: d(20) },
      { externalId: "ANALY-005", title: "Report Builder", description: "Drag-and-drop report builder with scheduling, PDF export, and email distribution", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.ANALY.id, reporterId: u.admin.id, estimate: "30", startDate: d(15), endDate: d(40) },
      { externalId: "ANALY-006", title: "User Permissions & Sharing", description: "Role-based access control for dashboards and reports with sharing and embed options", type: "STORY" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.ANALY.id, assigneeId: u.dev2.id, reporterId: u.admin.id, estimate: "12", startDate: d(20), endDate: d(35) },
      { externalId: "ANALY-007", title: "Pie chart renders blank with zero values", description: "When all data values are zero, pie chart shows empty white circle instead of 'No data' message", type: "BUG" as const, status: "DONE" as const, priority: "LOW" as const, projectId: p.ANALY.id, assigneeId: u.dev3.id, reporterId: u.qa1.id, estimate: "2", actualHours: "1", bugType: "UI", severity: "Low", currentBehavior: "Blank white circle displayed", expectedBehavior: "Show 'No data available' placeholder", completedAt: d(-5) },
      { externalId: "ANALY-008", title: "Export CSV breaks with special characters", description: "CSV export corrupts data when cells contain commas, quotes, or Unicode characters", type: "BUG" as const, status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, projectId: p.ANALY.id, assigneeId: u.dev3.id, reporterId: u.qa1.id, estimate: "4", actualHours: "2", bugType: "Data", severity: "Medium", currentBehavior: "Special characters corrupt CSV output", expectedBehavior: "Properly escape all special characters in CSV" },

      { externalId: "HRMGT-001", title: "Employee Onboarding Workflow", description: "Automated onboarding workflow with document collection, IT provisioning, and training assignment", type: "EPIC" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.HRMGT.id, reporterId: u.scrum.id, estimate: "60", startDate: d(0), endDate: d(60) },
      { externalId: "HRMGT-002", title: "Employee Profile Management", description: "CRUD operations for employee profiles with photo upload, contact info, and emergency contacts", type: "FEATURE" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, projectId: p.HRMGT.id, assigneeId: u.dev4.id, reporterId: u.scrum.id, estimate: "15", actualHours: "5", startDate: d(-8), endDate: d(10) },
      { externalId: "HRMGT-003", title: "Leave Management System", description: "Leave request, approval workflow, balance tracking, and calendar integration", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.HRMGT.id, reporterId: u.pm1.id, estimate: "20", startDate: d(10), endDate: d(35) },
      { externalId: "HRMGT-004", title: "Performance Review Module", description: "360-degree performance reviews with goal tracking, self-assessment, and manager feedback", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.HRMGT.id, reporterId: u.pm1.id, estimate: "25", startDate: d(30), endDate: d(60) },
      { externalId: "HRMGT-005", title: "Organization Chart", description: "Interactive org chart with department hierarchy, reporting lines, and search functionality", type: "STORY" as const, status: "TODO" as const, priority: "LOW" as const, projectId: p.HRMGT.id, assigneeId: u.design1.id, reporterId: u.scrum.id, estimate: "10", startDate: d(15), endDate: d(25) },
      { externalId: "HRMGT-006", title: "Attendance Tracking", description: "Clock-in/clock-out system with GPS verification and overtime calculation", type: "FEATURE" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.HRMGT.id, reporterId: u.scrum.id, estimate: "18", startDate: d(20), endDate: d(40) },
      { externalId: "HRMGT-007", title: "Payroll Integration API", description: "API integration with major payroll providers for automated salary processing", type: "STORY" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.HRMGT.id, reporterId: u.pm1.id, estimate: "22", startDate: d(40), endDate: d(65) },

      { externalId: "SECUR-001", title: "Vulnerability Scanner Engine", description: "Automated vulnerability scanning for OWASP Top 10 with severity classification", type: "EPIC" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, projectId: p.SECUR.id, reporterId: u.admin.id, estimate: "50", actualHours: "22", startDate: d(-28), endDate: d(10) },
      { externalId: "SECUR-002", title: "SQL Injection Detection", description: "Detect SQL injection vulnerabilities in web application endpoints with proof-of-concept generation", type: "FEATURE" as const, status: "DONE" as const, priority: "CRITICAL" as const, projectId: p.SECUR.id, assigneeId: u.qa1.id, reporterId: u.admin.id, estimate: "15", actualHours: "14", startDate: d(-25), endDate: d(-10), completedAt: d(-8) },
      { externalId: "SECUR-003", title: "XSS Scanner", description: "Cross-site scripting vulnerability scanner with DOM-based, reflected, and stored XSS detection", type: "FEATURE" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, projectId: p.SECUR.id, assigneeId: u.qa1.id, reporterId: u.admin.id, estimate: "15", actualHours: "8", startDate: d(-12), endDate: d(5) },
      { externalId: "SECUR-004", title: "Compliance Report Generator", description: "Generate compliance reports for SOC 2, PCI DSS, HIPAA, and GDPR requirements", type: "FEATURE" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.SECUR.id, reporterId: u.admin.id, estimate: "20", startDate: d(5), endDate: d(25) },
      { externalId: "SECUR-005", title: "API Security Testing", description: "Automated testing for API authentication, authorization, rate limiting, and input validation", type: "STORY" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.SECUR.id, assigneeId: u.dev3.id, reporterId: u.qa1.id, estimate: "12", startDate: d(10), endDate: d(25) },
      { externalId: "SECUR-006", title: "Scan results page load timeout", description: "Pages with more than 500 scan results take over 30 seconds to load and sometimes timeout", type: "BUG" as const, status: "TODO" as const, priority: "HIGH" as const, projectId: p.SECUR.id, assigneeId: u.qa1.id, reporterId: u.dev3.id, estimate: "5", bugType: "Performance", severity: "High", currentBehavior: "Page timeout with 500+ results", expectedBehavior: "Results should paginate and load within 3 seconds" },
      { externalId: "SECUR-007", title: "False positive on parameterized queries", description: "Scanner incorrectly flags properly parameterized SQL queries as SQL injection vulnerabilities", type: "BUG" as const, status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, projectId: p.SECUR.id, assigneeId: u.qa1.id, reporterId: u.dev3.id, estimate: "4", actualHours: "2", bugType: "Logic", severity: "Medium", currentBehavior: "False positive alerts on safe parameterized queries", expectedBehavior: "Should correctly identify parameterized queries as safe" },

      { externalId: "ECOMM-013", title: "Product image optimization pipeline", description: "Automated image resizing, compression, and WebP conversion for product images", type: "TASK" as const, status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, projectId: p.ECOMM.id, assigneeId: u.dev1.id, reporterId: u.scrum.id, estimate: "8", actualHours: "4", startDate: d(-10), endDate: d(5) },
      { externalId: "ECOMM-014", title: "Customer Reviews & Ratings", description: "Product review system with star ratings, verified purchase badges, and helpful votes", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.ECOMM.id, reporterId: u.pm1.id, estimate: "15", startDate: d(25), endDate: d(45) },
      { externalId: "ECOMM-015", title: "Wishlist Feature", description: "Save products to wishlist with price drop notifications and share functionality", type: "STORY" as const, status: "ON_HOLD" as const, priority: "LOW" as const, projectId: p.ECOMM.id, assigneeId: u.dev2.id, reporterId: u.scrum.id, estimate: "8", startDate: d(30), endDate: d(40) },
      { externalId: "MOBIL-011", title: "Investment Portfolio Tracker", description: "Track stocks, mutual funds, and crypto investments with real-time market data", type: "FEATURE" as const, status: "TODO" as const, priority: "MEDIUM" as const, projectId: p.MOBIL.id, reporterId: u.pm1.id, estimate: "25", startDate: d(30), endDate: d(60) },
      { externalId: "ANALY-009", title: "Dashboard template marketplace", description: "Pre-built dashboard templates that users can import and customize for common use cases", type: "STORY" as const, status: "TODO" as const, priority: "LOW" as const, projectId: p.ANALY.id, reporterId: u.admin.id, estimate: "12", startDate: d(25), endDate: d(40) },
    ];

    const createdItems = await db.insert(workItems).values(workItemsData).returning();

    console.log("Adding comments...");
    const commentData = [
      { workItemId: createdItems[0].id, userId: u.admin.id, content: "This is our top priority for Q1. Make sure we have full test coverage." },
      { workItemId: createdItems[0].id, userId: u.scrum.id, content: "I've broken this down into stories. We should be able to complete the core auth by sprint 4." },
      { workItemId: createdItems[1].id, userId: u.dev1.id, content: "OTP implementation is done. Using 6-digit codes with 5-minute expiry. Ready for QA review." },
      { workItemId: createdItems[1].id, userId: u.qa1.id, content: "Tested all edge cases - expired OTP, wrong OTP, multiple attempts. All passing. Approved." },
      { workItemId: createdItems[3].id, userId: u.admin.id, content: "Let's use REST for now but design the API to be easily migrated to GraphQL later." },
      { workItemId: createdItems[5].id, userId: u.dev2.id, content: "Cart service is deployed. Using Redis for session storage to handle concurrent updates." },
      { workItemId: createdItems[6].id, userId: u.dev1.id, content: "Stripe integration is 80% done. Working on webhook handlers for failed payments now." },
      { workItemId: createdItems[10].id, userId: u.qa1.id, content: "Reproduced this with a 20% discount on an item already marked 30% off. The discount stacks incorrectly." },
      { workItemId: createdItems[12].id, userId: u.pm1.id, content: "Biometric auth is critical for our banking compliance requirements. Cannot ship without it." },
      { workItemId: createdItems[13].id, userId: u.dev4.id, content: "Fingerprint SDK integrated successfully. Works on both iOS and Android." },
      { workItemId: createdItems[16].id, userId: u.dev5.id, content: "P2P transfer API is complete. Working on the confirmation UI with amount validation." },
      { workItemId: createdItems[20].id, userId: u.qa1.id, content: "This crash affects approximately 15% of our Android user base. Needs immediate attention." },
      { workItemId: createdItems[22].id, userId: u.admin.id, content: "Widget framework is the foundation for everything else. Let's make sure the plugin API is extensible." },
      { workItemId: createdItems[23].id, userId: u.dev3.id, content: "All chart types are implemented with responsive layouts. Added dark mode support too." },
      { workItemId: createdItems[37].id, userId: u.admin.id, content: "Scanner engine needs to handle at least 1000 endpoints per scan without performance degradation." },
      { workItemId: createdItems[38].id, userId: u.qa1.id, content: "SQL injection detection module passed all OWASP benchmark tests with 97% detection rate." },
    ];
    await db.insert(comments).values(commentData);

    console.log("Adding activity log entries...");
    const activities = [
      { userId: u.admin.id, entityType: "project", entityId: p.ECOMM.id, action: "created", description: "Created project E-Commerce Platform" },
      { userId: u.pm1.id, entityType: "project", entityId: p.MOBIL.id, action: "created", description: "Created project Mobile Banking App" },
      { userId: u.admin.id, entityType: "project", entityId: p.ANALY.id, action: "created", description: "Created project Analytics Dashboard" },
      { userId: u.dev1.id, entityType: "work_item", entityId: createdItems[1].id, action: "status_changed", description: "Moved OTP Email Verification to Done" },
      { userId: u.dev2.id, entityType: "work_item", entityId: createdItems[5].id, action: "status_changed", description: "Completed Shopping Cart Service" },
      { userId: u.dev4.id, entityType: "work_item", entityId: createdItems[13].id, action: "status_changed", description: "Completed Fingerprint login flow" },
      { userId: u.dev3.id, entityType: "work_item", entityId: createdItems[23].id, action: "status_changed", description: "Completed Chart Component Library" },
      { userId: u.qa1.id, entityType: "work_item", entityId: createdItems[38].id, action: "status_changed", description: "Completed SQL Injection Detection module" },
      { userId: u.scrum.id, entityType: "team", entityId: t["Alpha Squad"].id, action: "member_added", description: "Added Alex Rivera to Alpha Squad" },
      { userId: u.pm1.id, entityType: "team", entityId: t["Beta Builders"].id, action: "member_added", description: "Added Emma Zhang to Beta Builders" },
    ];
    await db.insert(activityLog).values(activities);

    console.log("✅ Seeding completed! Created:");
    console.log(`   - ${usersList.length} users`);
    console.log(`   - ${teamsList.length} teams`);
    console.log(`   - ${projectsList.length} projects`);
    console.log(`   - ${createdItems.length} work items`);
    console.log(`   - ${commentData.length} comments`);
    console.log(`   - ${activities.length} activity log entries`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
